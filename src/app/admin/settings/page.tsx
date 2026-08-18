import { prisma } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { DiagnosticCreditForm } from "@/components/admin/diagnostic-credit-form";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const setting = await prisma.appSetting.findUnique({ where: { key: "diagnosticCreditPolicy" } });
  const value = (setting?.value as { enabled?: boolean; message?: string }) ?? {};
  const logs = await prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 20, include: { actor: true } });
  return (
    <div>
      <h1 className="text-2xl font-semibold">Settings</h1>
      <Card className="mt-6 p-5">
        <h2 className="font-medium">Diagnostic credit</h2>
        <DiagnosticCreditForm enabled={value.enabled !== false} message={value.message ?? ""} />
      </Card>
      <h2 className="mt-8 font-semibold">Recent audit log</h2>
      <ul className="mt-3 space-y-2 text-sm">
        {logs.map((log) => (
          <li key={log.id}>
            {log.createdAt.toISOString()} · {log.actor?.email ?? "system"} · {log.action}
          </li>
        ))}
      </ul>
    </div>
  );
}
