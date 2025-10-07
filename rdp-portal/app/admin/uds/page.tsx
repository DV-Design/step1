"use client";
import { useEffect, useState } from "react";

type Uds = {
  id: string;
  displayName: string;
  ipAddress: string;
  status: "available" | "in_use" | "maintenance";
  notes?: string | null;
};

export default function AdminUdsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<Uds[]>([]);

  const [displayName, setDisplayName] = useState("");
  const [ipAddress, setIpAddress] = useState("");
  const [notes, setNotes] = useState("");

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/uds", { cache: "no-store" });
      if (!res.ok) {
        if (res.status === 401) throw new Error("Unauthorized (admin only)");
        throw new Error("Failed to load UDS");
      }
      const data = await res.json();
      setItems(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function addUds(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const res = await fetch("/api/admin/uds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName, ipAddress, notes }),
      });
      if (!res.ok) throw new Error("Failed to create");
      setDisplayName("");
      setIpAddress("");
      setNotes("");
      await load();
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function updateUds(uds: Uds) {
    setError(null);
    const res = await fetch("/api/admin/uds", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(uds),
    });
    if (!res.ok) setError("Failed to update");
    await load();
  }

  async function deleteUds(id: string) {
    setError(null);
    const res = await fetch(`/api/admin/uds?id=${id}`, { method: "DELETE" });
    if (!res.ok) setError("Failed to delete");
    await load();
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Admin — UDS Management</h1>
      {error && <div className="text-red-600">{error}</div>}

      <form onSubmit={addUds} className="grid gap-2 max-w-lg border p-4 rounded">
        <div className="font-medium">Add new UDS</div>
        <input className="border rounded px-3 py-2" placeholder="Display name" value={displayName} onChange={(e)=>setDisplayName(e.target.value)} required />
        <input className="border rounded px-3 py-2" placeholder="IP address" value={ipAddress} onChange={(e)=>setIpAddress(e.target.value)} required />
        <input className="border rounded px-3 py-2" placeholder="Notes (optional)" value={notes} onChange={(e)=>setNotes(e.target.value)} />
        <button className="bg-blue-600 text-white rounded px-4 py-2 w-fit" type="submit">Save</button>
      </form>

      <div className="space-y-3">
        <div className="font-medium">Existing UDS</div>
        {loading ? (
          <div>Loading...</div>
        ) : items.length === 0 ? (
          <div>No UDS yet</div>
        ) : (
          <div className="space-y-3">
            {items.map((it) => (
              <div key={it.id} className="border rounded p-4 grid gap-2">
                <div className="grid gap-2 md:grid-cols-2">
                  <label className="text-sm">Display name
                    <input className="border rounded px-3 py-2 w-full" value={it.displayName} onChange={(e)=>setItems(prev=>prev.map(p=>p.id===it.id?{...p,displayName:e.target.value}:p))} />
                  </label>
                  <label className="text-sm">IP address
                    <input className="border rounded px-3 py-2 w-full" value={it.ipAddress} onChange={(e)=>setItems(prev=>prev.map(p=>p.id===it.id?{...p,ipAddress:e.target.value}:p))} />
                  </label>
                </div>
                <div className="grid gap-2 md:grid-cols-3 items-center">
                  <label className="text-sm">Status
                    <select className="border rounded px-3 py-2 w-full" value={it.status} onChange={(e)=>setItems(prev=>prev.map(p=>p.id===it.id?{...p,status:e.target.value as Uds["status"]}:p))}>
                      <option value="available">available</option>
                      <option value="in_use">in_use</option>
                      <option value="maintenance">maintenance</option>
                    </select>
                  </label>
                  <button className="border rounded px-3 py-2" onClick={()=>updateUds(it)}>Update</button>
                  <button className="border rounded px-3 py-2 text-red-600" onClick={()=>deleteUds(it.id)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
