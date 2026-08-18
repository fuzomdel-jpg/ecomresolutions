import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { appUrl } from "@/lib/env";

export async function notifyUser(input: {
  userId: string;
  type: string;
  title: string;
  body: string;
  link?: string;
  caseId?: string;
}) {
  const notification = await prisma.notification.create({ data: input });
  const user = await prisma.user.findUnique({ where: { id: input.userId } });
  if (user?.email) {
    await sendEmail({
      to: user.email,
      subject: input.title,
      text: `${input.body}\n\n${input.link ? `${appUrl()}${input.link}` : appUrl()}`,
    }).catch((error) => console.error("notify_email_failed", error));
  }
  return notification;
}

export async function notifyCaseStakeholders(input: {
  caseId: string;
  type: string;
  title: string;
  body: string;
  excludeUserId?: string;
}) {
  const record = await prisma.case.findUnique({
    where: { id: input.caseId },
    include: { organization: { include: { members: true } } },
  });
  if (!record) return;
  const userIds = new Set<string>([record.customerId]);
  if (record.assignedAgentId) userIds.add(record.assignedAgentId);
  for (const member of record.organization.members) userIds.add(member.userId);
  const specialists = await prisma.user.findMany({
    where: { role: { in: ["EXPERT", "ADMIN", "SUPER_ADMIN"] } },
    select: { id: true },
  });
  if (["case_created", "case_nearing_sla", "case_overdue"].includes(input.type)) {
    specialists.forEach((user) => userIds.add(user.id));
  }
  for (const userId of userIds) {
    if (userId === input.excludeUserId) continue;
    await notifyUser({
      userId,
      type: input.type,
      title: input.title,
      body: input.body,
      link: userId === record.customerId ? `/app/cases/${record.id}` : `/admin/cases/${record.id}`,
      caseId: record.id,
    });
  }
}
