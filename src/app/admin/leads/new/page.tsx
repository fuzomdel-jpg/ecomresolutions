import Link from "next/link";
import { Card } from "@/components/ui/card";
import { LeadIntakeForm } from "@/components/admin/lead-intake-form";

export const dynamic = "force-dynamic";

export default function NewLeadPage() {
  return (
    <div>
      <Link href="/admin/leads" className="text-sm text-muted">
        Back to leads
      </Link>
      <h1 className="mt-2 text-2xl font-semibold text-navy">Add a company</h1>
      <p className="mt-2 max-w-3xl text-sm text-muted">
        Record headquarters separately from the marketplace where the brand sells. An Amazon US listing does not prove a United States headquarters, and shipping to the UAE does not prove a Dubai operation. Locations without a reliable source are stored as Unverified.
      </p>
      <Card className="mt-6 p-5">
        <LeadIntakeForm />
      </Card>
    </div>
  );
}
