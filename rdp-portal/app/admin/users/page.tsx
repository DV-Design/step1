"use client";
import { useEffect, useState } from "react";

type User = { id: string; firstName: string; lastName: string; email: string; role: "user" | "admin"; createdAt: string };

export default function AdminUsersPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/users", { cache: "no-store" });
      if (!res.ok) {
        if (res.status === 401) throw new Error("Unauthorized (admin only)");
        throw new Error("Failed to load users");
      }
      setUsers(await res.json());
    } catch (e: any) { setError(e.message); } finally { setLoading(false); }
  }

  useEffect(()=>{ load(); }, []);

  async function promote(id: string) {
    const res = await fetch("/api/admin/users", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, role: "admin" }) });
    if (!res.ok) return alert("Failed");
    await load();
  }

  async function demote(id: string) {
    const res = await fetch("/api/admin/users", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, role: "user" }) });
    if (!res.ok) return alert("Failed");
    await load();
  }

  async function remove(id: string) {
    const res = await fetch(`/api/admin/users?id=${id}`, { method: "DELETE" });
    if (!res.ok) return alert("Failed");
    await load();
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Admin — Users</h1>
      {error && <div className="text-red-600">{error}</div>}
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="space-y-2">
          {users.map(u => (
            <div key={u.id} className="border rounded p-4 flex items-center justify-between">
              <div>
                <div className="font-medium">{u.firstName} {u.lastName}</div>
                <div className="text-sm text-gray-600">{u.email} — {u.role}</div>
              </div>
              <div className="flex gap-2">
                <button className="border rounded px-3 py-2" onClick={()=>promote(u.id)}>Make admin</button>
                <button className="border rounded px-3 py-2" onClick={()=>demote(u.id)}>Make user</button>
                <button className="border rounded px-3 py-2 text-red-600" onClick={()=>remove(u.id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
