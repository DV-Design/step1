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
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm border rounded p-6 space-y-4">
        <h1 className="text-xl font-semibold">Sign in</h1>
        <form onSubmit={onSubmit} className="space-y-3">
          <input className="w-full border rounded px-3 py-2" placeholder="Email" value={email} onChange={(e)=>setEmail(e.target.value)} />
          <input className="w-full border rounded px-3 py-2" placeholder="Password" type="password" value={password} onChange={(e)=>setPassword(e.target.value)} />
          <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded">Sign in</button>
        </form>
        <button className="w-full border py-2 rounded" onClick={()=>router.push("/register")}>Create account</button>
      </div>
    </div>
  );
}
