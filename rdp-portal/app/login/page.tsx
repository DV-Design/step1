"use client";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const res = await signIn("credentials", { redirect: false, email, password });
    if (res?.ok) router.push("/dashboard");
    else alert("Invalid email or password");
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <div className="w-full max-w-sm border rounded-lg p-6 space-y-4 shadow-sm bg-white">
        <h1 className="text-2xl font-semibold text-center">Sign in</h1>
        <form onSubmit={onSubmit} className="space-y-3">
          <div className="space-y-1">
            <label className="text-sm text-gray-700">Email</label>
            <input className="w-full border rounded px-3 py-2" placeholder="you@example.com" value={email} onChange={(e)=>setEmail(e.target.value)} />
          </div>
          <div className="space-y-1">
            <label className="text-sm text-gray-700">Password</label>
            <input className="w-full border rounded px-3 py-2" placeholder="••••••••" type="password" value={password} onChange={(e)=>setPassword(e.target.value)} />
          </div>
          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 transition text-white py-2 rounded">Sign in</button>
        </form>
        <button className="w-full border py-2 rounded hover:bg-gray-50" onClick={()=>router.push("/register")}>Create account</button>
      </div>
    </div>
  );
}
