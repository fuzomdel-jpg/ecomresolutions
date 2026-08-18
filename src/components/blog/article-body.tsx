export function ArticleBody({ body }: { body: string }) {
  const blocks = body.trim().split(/\n{2,}/);
  return (
    <div className="space-y-4 text-sm leading-7 text-navy">
      {blocks.map((block, index) => {
        if (block.startsWith("## ")) {
          return (
            <h2 key={index} className="pt-4 text-lg font-semibold">
              {block.replace(/^## /, "")}
            </h2>
          );
        }
        return (
          <p key={index} className="text-muted">
            {block}
          </p>
        );
      })}
    </div>
  );
}
