import { LeadDashboard } from "@/components/admin/lead-dashboard";
import { getResearchConfig, listLeadCompanies } from "@/lib/leads/persist";

export const dynamic = "force-dynamic";

export default async function UsLeadsPage() {
  const [companies, config] = await Promise.all([listLeadCompanies(), getResearchConfig()]);
  return <LeadDashboard companies={companies} config={config} market="US" />;
}
