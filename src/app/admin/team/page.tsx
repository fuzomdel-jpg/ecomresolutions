import { prisma } from "@/lib/db";
import { Card } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function TeamPage() {
  const team = await prisma.user.findMany({
    where: { role: { in: ["EXPERT", "ADMIN", "SUPER_ADMIN"] } },
    include: { _count: { select: { assignedCases: true } } },
  });
  return (
    <div>
      <h1 className="text-2xl font-semibold">Team</h1>
      <div className="mt-6 space-y-3">
        {team.map((member) => (
          <Card key={member.id} className="p-4 text-sm">
            <p className="font-medium">{member.name || member.email}</p>
            <p className="text-muted">
              {member.role} · {member._count.assignedCases} assigned cases
            </p>
          </Card>
        ))}
      </div>
    </div>
  );
}
