"use client";

export function ResolutionReport({
  caseNumber,
  resolution,
}: {
  caseNumber: string;
  resolution: {
    problem: string;
    rootCause: string;
    actionTaken: string;
    verification: string;
    result: string;
    recommendedPrevention: string;
  };
}) {
  return (
    <article className="mb-6 rounded-2xl border border-border bg-white p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-navy">Resolution report · {caseNumber}</h2>
        <button type="button" className="text-sm text-accent" onClick={() => window.print()}>
          Download
        </button>
      </div>
      {[
        ["Case", caseNumber],
        ["Problem", resolution.problem],
        ["Root Cause", resolution.rootCause],
        ["Resolution", resolution.actionTaken],
        ["Verification", resolution.verification],
        ["Result", resolution.result],
        ["Recommendations", resolution.recommendedPrevention],
      ].map(([label, value]) => (
        <section key={label} className="mt-4">
          <h3 className="text-sm font-semibold text-navy">{label}</h3>
          <p className="mt-1 whitespace-pre-wrap text-sm text-muted">{value}</p>
        </section>
      ))}
    </article>
  );
}
