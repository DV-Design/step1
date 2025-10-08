"use client";
import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import Link from "next/link";

type UdsItem = { id: string; displayName: string; status: "available"|"in_use"|"maintenance"; usedBy?: { firstName: string; lastName: string; email: string } | null };

export default function Dashboard() {
  const [udsList, setUdsList] = useState<UdsItem[]>([]);
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
        const data: UdsItem[] = await res.json();
        if (!cancelled) setUdsList(data);
      } catch (e) {
        if (!cancelled) setError((e as Error).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    const id = setInterval(load, 5000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Remote Desktops</h1>
        <div className="flex gap-2">
          <Link href="/admin" className="border rounded px-3 py-2 hover:bg-gray-50">Control Panel</Link>
          <button onClick={() => signOut({ callbackUrl: "/login" })} className="border rounded px-3 py-2 hover:bg-gray-50">Sign out</button>
        </div>
      </div>

      {error && <div className="text-red-600">{error}</div>}
      {loading ? (
        <div>Loading…</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {udsList.map((uds: UdsItem) => (
            <div key={uds.id} className="rounded border p-4 space-y-2 bg-white">
              <div className="font-medium">{uds.displayName}</div>
              <div className="text-sm">
                Status: <span className="font-mono">{uds.status}</span>
                {uds.status === "in_use" && uds.usedBy && (
                  <span> — Used by {uds.usedBy.firstName} {uds.usedBy.lastName} ({uds.usedBy.email})</span>
                )}
              </div>
              <div className="flex gap-2">
                <a
                  href={`/api/connect-script?udsId=${uds.id}`}
                  className={`inline-flex items-center justify-center px-3 py-2 rounded text-white ${uds.status === "available" ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-400 cursor-not-allowed pointer-events-none"}`}
                >
                  Connect (PS1)
                </a>
                <a
                  href={`/api/connect-bat?udsId=${uds.id}`}
                  className={`inline-flex items-center justify-center px-3 py-2 rounded text-white ${uds.status === "available" ? "bg-green-600 hover:bg-green-700" : "bg-gray-400 cursor-not-allowed pointer-events-none"}`}
                >
                  Connect (BAT)
                </a>
              </div>
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
