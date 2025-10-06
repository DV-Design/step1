import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]/route";

async function getUds() {
  const res = await fetch(`${process.env.NEXTAUTH_URL}/api/uds`, { cache: "no-store" });
  if (!res.ok) return [];
  return res.json();
}

export default async function Dashboard() {
  const session = await getServerSession(authOptions);
  if (!session) return <div className="p-6">Please sign in.</div>;
  const udsList = await getUds();

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Available Remote Desktops</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {udsList.map((uds: any) => (
          <div key={uds.id} className="rounded border p-4 space-y-2">
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
      </div>
    </div>
  );
}
