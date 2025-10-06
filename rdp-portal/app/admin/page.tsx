import Link from "next/link";

export default function AdminHub() {
  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold">Control Panel</h1>
      <p className="text-gray-600">Choose what you want to manage.</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <Link href="/admin/uds" className="block border rounded-lg p-6 hover:bg-gray-50">
          <div className="text-lg font-medium">Remote Desktops</div>
          <div className="text-sm text-gray-600">Add, edit, delete, set statuses</div>
        </Link>
        <Link href="/admin/users" className="block border rounded-lg p-6 hover:bg-gray-50">
          <div className="text-lg font-medium">Users</div>
          <div className="text-sm text-gray-600">Promote/demote admins, remove users</div>
        </Link>
      </div>
    </div>
  );
}
