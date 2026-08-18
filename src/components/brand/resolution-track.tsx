export function ResolutionTrack({ current = 0 }: { current?: number }) {
  const steps = [
    { n: "01", title: "Tell us what's wrong", copy: "Describe the listing, feed, or catalog issue." },
    { n: "02", title: "We diagnose it", copy: "Likely issue, recommended resolution, and price." },
    { n: "03", title: "We fix and verify", copy: "A specialist implements scoped corrections." },
    { n: "04", title: "You get the report", copy: "Written proof of what changed. No marketplace guarantees." },
  ];
  return (
    <ol className="grid gap-3 md:grid-cols-4">
      {steps.map((step, index) => {
        const active = index <= current;
        return (
          <li
            key={step.n}
            className={`relative rounded-2xl border p-5 ${active ? "border-accent bg-accent-soft/60" : "border-border bg-white"}`}
          >
            <p className={`text-xs font-semibold ${active ? "text-accent" : "text-muted"}`}>
              {step.n}
              {index === current ? <span className="ml-2 rounded-full bg-accent px-2 py-0.5 text-[10px] text-white">Now</span> : null}
            </p>
            <p className="mt-2 font-medium text-navy">{step.title}</p>
            <p className="mt-1 text-sm text-muted">{step.copy}</p>
          </li>
        );
      })}
    </ol>
  );
}
