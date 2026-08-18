import { PublicShell } from "@/components/layout/public-shell";

export const metadata = { title: "Security" };

export default function SecurityPage() {
  return (
    <PublicShell>
      <div className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-3xl font-semibold text-navy">Security</h1>
        <p className="mt-3 text-muted">
          Ecom Resolutions is a B2B workspace. We design access so your seller accounts remain yours.
        </p>
        <div className="mt-8 space-y-6 text-sm leading-6 text-navy">
          <section>
            <h2 className="font-semibold">Scoped access</h2>
            <p className="text-muted">Specialists only request the permissions needed to diagnose or implement the purchased scope.</p>
          </section>
          <section>
            <h2 className="font-semibold">Collaborator access</h2>
            <p className="text-muted">Where the platform supports it, we prefer collaborator or user invites over shared logins.</p>
          </section>
          <section>
            <h2 className="font-semibold">Temporary access</h2>
            <p className="text-muted">Access should be time-bound to the case whenever the marketplace allows it.</p>
          </section>
          <section>
            <h2 className="font-semibold">No password sharing where avoidable</h2>
            <p className="text-muted">We do not ask for passwords when collaborator access is available.</p>
          </section>
          <section>
            <h2 className="font-semibold">Secure file handling</h2>
            <p className="text-muted">Uploads are type-checked, size-limited, stored privately, and served only to authorized users.</p>
          </section>
          <section>
            <h2 className="font-semibold">Role-based access</h2>
            <p className="text-muted">Customers, specialists, and admins have separate permissions. Roles are enforced on the server.</p>
          </section>
          <section>
            <h2 className="font-semibold">Audit logs</h2>
            <p className="text-muted">Sensitive case actions are written to an audit log.</p>
          </section>
          <section>
            <h2 className="font-semibold">Data protection</h2>
            <p className="text-muted">
              We do not claim SOC 2, ISO, or other certifications on this page unless they are actually in place.
            </p>
          </section>
        </div>
      </div>
    </PublicShell>
  );
}
