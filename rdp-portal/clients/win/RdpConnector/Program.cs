using System.Diagnostics;
using System.Net.Http;
using System.Text;
using System.Text.Json;

class Program
{
    static async Task<int> Main(string[] args)
    {
        try
        {
            var token = GetArg(args, "--token");
            var baseUrl = GetArg(args, "--base");
            if (string.IsNullOrWhiteSpace(token) || string.IsNullOrWhiteSpace(baseUrl))
            {
                Console.Error.WriteLine("Usage: RdpConnector --token <TOKEN> --base <BASE_URL>");
                return 2;
            }

            var startUrl = Combine(baseUrl, "/api/session/start");
            var endUrl = Combine(baseUrl, "/api/session/end");
            var heartbeatUrl = Combine(baseUrl, "/api/session/heartbeat");

            using var http = new HttpClient();
            var startPayload = JsonContent.Create(new { token });
            var startRes = await http.PostAsync(startUrl, startPayload);
            startRes.EnsureSuccessStatusCode();
            var json = await startRes.Content.ReadAsStringAsync();
            var doc = JsonDocument.Parse(json).RootElement;
            var sessionToken = doc.GetProperty("sessionToken").GetString()!;
            var rdpContent = doc.GetProperty("rdpContent").GetString()!;

            var tempRdp = Path.Combine(Path.GetTempPath(), $"rdp-{Guid.NewGuid():N}.rdp");
            await File.WriteAllTextAsync(tempRdp, rdpContent, Encoding.Unicode);

            using var mstsc = new Process();
            mstsc.StartInfo.FileName = "mstsc.exe";
            mstsc.StartInfo.Arguments = $"\"{tempRdp}\"";
            mstsc.EnableRaisingEvents = true;
            mstsc.Start();

            using var cts = new CancellationTokenSource();
            var hbTask = HeartbeatLoop(http, heartbeatUrl, sessionToken, cts.Token);

            await mstsc.WaitForExitAsync();
            cts.Cancel();

            await SendEnd(http, endUrl, sessionToken);

            try { File.Delete(tempRdp); } catch { }
            return 0;
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine(ex.Message);
            return 1;
        }
    }

    static async Task HeartbeatLoop(HttpClient http, string url, string sessionToken, CancellationToken ct)
    {
        var payload = JsonContent.Create(new { sessionToken });
        while (!ct.IsCancellationRequested)
        {
            try
            {
                await http.PostAsync(url, payload, ct);
            }
            catch { }
            await Task.Delay(TimeSpan.FromSeconds(10), ct);
        }
    }

    static async Task SendEnd(HttpClient http, string url, string sessionToken)
    {
        for (var i = 0; i < 3; i++)
        {
            try
            {
                var content = new FormUrlEncodedContent(new[] { new KeyValuePair<string, string>("sessionToken", sessionToken) });
                await http.PostAsync(url, content);
                break;
            }
            catch { await Task.Delay(500); }
        }
    }

    static string? GetArg(string[] args, string name)
    {
        for (int i = 0; i < args.Length; i++)
        {
            if (string.Equals(args[i], name, StringComparison.OrdinalIgnoreCase) && i + 1 < args.Length)
                return args[i + 1];
        }
        return null;
    }

    static string Combine(string baseUrl, string path)
    {
        return baseUrl.TrimEnd('/') + path;
    }
}
