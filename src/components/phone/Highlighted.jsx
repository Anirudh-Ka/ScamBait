// Renders text with red flags (or legit signs) swiped in with a highlighter.
// marks: [{ quote, kind: 'flag' | 'legit', index }]
export function findRanges(text, marks) {
  const ranges = [];
  for (const mark of marks) {
    if (!mark.quote) continue;
    let from = 0;
    let idx;
    while ((idx = text.indexOf(mark.quote, from)) !== -1) {
      const end = idx + mark.quote.length;
      if (!ranges.some((r) => idx < r.end && end > r.start)) {
        ranges.push({ start: idx, end, mark });
        break;
      }
      from = idx + 1;
    }
  }
  return ranges.sort((a, b) => a.start - b.start);
}

export default function Highlighted({ text, marks = [], active, onActivate, className = '' }) {
  const ranges = findRanges(text, marks);
  const out = [];
  let pos = 0;
  ranges.forEach((r, i) => {
    if (r.start > pos) out.push(text.slice(pos, r.start));
    const isActive = active === r.mark.index;
    out.push(
      <mark
        key={`${r.start}-${i}`}
        tabIndex={0}
        role="button"
        aria-pressed={isActive}
        onClick={() => onActivate?.(r.mark.index)}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onActivate?.(r.mark.index))}
        className={`marker bg-transparent text-inherit ${r.mark.kind === 'legit' ? 'legit' : ''} ${isActive ? 'active' : ''}`}
        style={{ animationDelay: `${i * 220}ms` }}
      >
        {text.slice(r.start, r.end)}
        <span className="sr-only"> ({r.mark.kind === 'legit' ? 'sign it is real' : 'red flag'} {r.mark.index + 1})</span>
      </mark>
    );
    pos = r.end;
  });
  if (pos < text.length) out.push(text.slice(pos));
  return <span className={`whitespace-pre-wrap ${className}`}>{out}</span>;
}
