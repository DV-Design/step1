"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function RegisterPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName]   = useState("");
  const [email, setEmail]         = useState("");
  const [password, setPassword]   = useState("");
  const router = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ firstName, lastName, email, password }),
    });
    if (res.ok) router.push("/login");
    else alert("Registration failed");
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm border rounded p-6 space-y-4">
        <h1 className="text-xl font-semibold">Create account</h1>
        <form onSubmit={onSubmit} className="space-y-3">
          <input className="w-full border rounded px-3 py-2" placeholder="First name" value={firstName} onChange={(e)=>setFirstName(e.target.value)} />
          <input className="w-full border rounded px-3 py-2" placeholder="Last name" value={lastName} onChange={(e)=>setLastName(e.target.value)} />
          <input className="w-full border rounded px-3 py-2" placeholder="Email" value={email} onChange={(e)=>setEmail(e.target.value)} />
          <input className="w-full border rounded px-3 py-2" placeholder="Password" type="password" value={password} onChange={(e)=>setPassword(e.target.value)} />
          <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded">Register</button>
        </form>
        <button className="w-full border py-2 rounded" onClick={()=>router.push("/login")}>Back to sign in</button>
      </div>
    </div>
  );
}
