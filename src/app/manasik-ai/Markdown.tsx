import React from 'react';

// Tiny renderer for the subset of markdown the assistant uses (paragraphs, lists,
// tables, headings, **bold**, `code`). Builds React elements — never raw HTML —
// so model output can't inject markup.

function inline(text: string, keyPrefix: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).filter(Boolean);
  return parts.map((part, i) => {
    const key = `${keyPrefix}-${i}`;
    if (part.startsWith('**') && part.endsWith('**')) return <strong key={key} className="font-semibold text-foreground">{part.slice(2, -2)}</strong>;
    if (part.startsWith('`') && part.endsWith('`')) return <code key={key} className="px-1 py-0.5 rounded bg-muted font-mono text-[0.85em]">{part.slice(1, -1)}</code>;
    return <React.Fragment key={key}>{part.replace(/(^|\s)\*(\S[^*]*\S|\S)\*(?=\s|$|[.,;:!?])/g, '$1$2')}</React.Fragment>;
  });
}

const cells = (row: string) =>
  row
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((c) => c.trim());

export default function Markdown({ text }: { text: string }) {
  const lines = text.replace(/\r/g, '').split('\n');
  const blocks: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const key = `b${i}`;

    if (!line.trim()) {
      i++;
      continue;
    }

    if (line.trim().startsWith('|')) {
      const rows: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) rows.push(lines[i++]);
      const [header, ...rest] = rows;
      const body = rest.filter((r) => !/^\s*\|?\s*:?-{2,}/.test(r));
      blocks.push(
        <div key={key} className="overflow-x-auto scrollbar-thin my-2 rounded-lg border border-border">
          <table className="w-full text-xs">
            <thead className="bg-muted/70">
              <tr>
                {cells(header).map((c, ci) => (
                  <th key={ci} className="px-3 py-2 text-start font-semibold text-foreground whitespace-nowrap">{inline(c, `${key}h${ci}`)}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {body.map((r, ri) => (
                <tr key={ri}>
                  {cells(r).map((c, ci) => (
                    <td key={ci} className="px-3 py-1.5 text-muted-foreground align-top">{inline(c, `${key}r${ri}c${ci}`)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      continue;
    }

    const bullet = /^\s*[-*•]\s+/;
    const numbered = /^\s*\d+[.)]\s+/;
    if (bullet.test(line) || numbered.test(line)) {
      const ordered = numbered.test(line);
      const pattern = ordered ? numbered : bullet;
      const items: string[] = [];
      while (i < lines.length && pattern.test(lines[i])) items.push(lines[i++].replace(pattern, ''));
      const ListTag = ordered ? 'ol' : 'ul';
      blocks.push(
        <ListTag key={key} className={`my-1.5 ps-5 space-y-1 ${ordered ? 'list-decimal' : 'list-disc'} marker:text-primary`}>
          {items.map((item, ii) => (
            <li key={ii}>{inline(item, `${key}i${ii}`)}</li>
          ))}
        </ListTag>
      );
      continue;
    }

    const heading = /^\s*#{1,6}\s+/;
    if (heading.test(line)) {
      blocks.push(
        <p key={key} className="font-semibold text-foreground mt-2">
          {inline(line.replace(heading, ''), key)}
        </p>
      );
      i++;
      continue;
    }

    const para: string[] = [];
    // The first line is always taken, so an unrecognised line can never stall the loop.
    while (i < lines.length && lines[i].trim() && (!para.length || !/^\s*(\||[-*•]\s|\d+[.)]\s|#{1,6}\s)/.test(lines[i]))) {
      para.push(lines[i++]);
    }
    blocks.push(
      <p key={key} className="my-1.5">
        {para.map((p, pi) => (
          <React.Fragment key={pi}>
            {pi > 0 && <br />}
            {inline(p, `${key}p${pi}`)}
          </React.Fragment>
        ))}
      </p>
    );
  }

  return <div className="text-sm leading-relaxed [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">{blocks}</div>;
}
