"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function Dashboard() {
  const [udsList, setUdsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/uds", { cache: "no-store" });
        if (!res.ok) throw new Error(res.status === 401 ? "Please sign in" : "Failed to load UDS");
        const data = await res.json();
        if (!cancelled) setUdsList(data);
      } catch (e: any) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Remote Desktops</h1>
        <div className="flex gap-2">
          <Link href="/admin" className="border rounded px-3 py-2 hover:bg-gray-50">Control Panel</Link>
          <Link href="/" className="border rounded px-3 py-2 hover:bg-gray-50">Sign out</Link>
        </div>
      </div>

      {error && <div className="text-red-600">{error}</div>}
      {loading ? (
        <div>Loading…</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {udsList.map((uds: any) => (
            <div key={uds.id} className="rounded border p-4 space-y-2 bg-white">
              <div className="font-medium">{uds.displayName}</div>
              <div className="text-sm">
                Status: <span className="font-mono">{uds.status}</span>
                {uds.status === "in_use" && uds.usedBy && (
                  <span> — Used by {uds.usedBy.firstName} {uds.usedBy.lastName} ({uds.usedBy.email})</span>
                )}
              </div>
              <a
                href={`/api/connect-script?udsId=${uds.id}`}
                className={`inline-flex items-center justify-center px-3 py-2 rounded text-white ${uds.status === "available" ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-400 cursor-not-allowed pointer-events-none"}`}
              >
                Connect
              </a>
            </div>
          ))}
          {udsList.length === 0 && (
            <div className="text-gray-600">No remote desktops available.</div>
          )}
        </div>
      )}
    </div>
  );
}
