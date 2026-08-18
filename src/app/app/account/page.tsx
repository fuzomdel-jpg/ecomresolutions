import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import { Card } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/app/account");
  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  return (
    <div>
      <h1 className="text-2xl font-semibold text-navy">Account</h1>
      <Card className="mt-4 p-5 text-sm">
        <p>{user.name}</p>
        <p className="text-muted">{user.email}</p>
        <p className="mt-2 text-muted">Role: {user.role}</p>
      </Card>
      <h2 className="mt-8 text-lg font-semibold">Notifications</h2>
      {notifications.length === 0 ? (
        <p className="mt-2 text-sm text-muted">You&apos;re all caught up.</p>
      ) : (
        <ul className="mt-3 space-y-2 text-sm">
          {notifications.map((item) => (
            <li key={item.id}>
              <p className="font-medium">{item.title}</p>
              <p className="text-muted">{item.body}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
