import { PublicShell } from "@/components/layout/public-shell";
import { Card } from "@/components/ui/card";
import { ProblemComposer } from "@/components/composer/problem-composer";

export const metadata = { title: "How it works" };

export default function HowItWorksPage() {
  return (
    <PublicShell>
      <div className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-3xl font-semibold text-navy">How it works</h1>
        <p className="mt-2 text-muted">No long discovery calls. No unnecessary retainers.</p>
        <div className="mt-8 space-y-4">
          {[
            ["01", "Tell us what's wrong.", "Describe the issue in the composer. Attach screenshots or reports if you have them."],
            ["02", "We diagnose the issue.", "We classify the likely problem and recommend a service and price."],
            ["03", "We fix and verify it.", "After payment, a specialist works the case with you inside the platform."],
            ["04", "You receive the resolution report.", "Problem, root cause, action taken, verification, and prevention notes."],
          ].map(([step, title, copy]) => (
            <Card key={step} className="p-5">
              <p className="text-xs font-semibold text-accent">{step}</p>
              <p className="mt-1 font-medium text-navy">{title}</p>
              <p className="mt-1 text-sm text-muted">{copy}</p>
            </Card>
          ))}
        </div>
        <div className="mt-10">
          <ProblemComposer />
        </div>
      </div>
    </PublicShell>
  );
}
