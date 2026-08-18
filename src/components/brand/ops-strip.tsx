export function OpsStrip() {
  const items = [
    ["Specialist-led", "Experienced marketplace operators, not a ticket queue."],
    ["Fixed scope", "Price and inclusions before you pay."],
    ["Case-tracked", "Human-readable case IDs and live status."],
    ["Written proof", "Resolution report when the work is done."],
  ];
  return (
    <div className="grid gap-px overflow-hidden rounded-2xl border border-border bg-border md:grid-cols-4">
      {items.map(([title, copy]) => (
        <div key={title} className="bg-white px-5 py-4">
          <p className="text-sm font-semibold text-navy">{title}</p>
          <p className="mt-1 text-xs text-muted">{copy}</p>
        </div>
      ))}
    </div>
  );
}
