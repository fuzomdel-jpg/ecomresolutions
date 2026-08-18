import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth-helpers";

export default async function SettingsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/app/settings");
  return (
    <div>
      <h1 className="text-2xl font-semibold text-navy">Settings</h1>
      <p className="mt-2 text-sm text-muted">
        Organization users, roles, and connected stores will live here. V1 supports a workspace with multiple users.
      </p>
    </div>
  );
}
