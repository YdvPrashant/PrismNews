// Swiss print "registration marks" — a small hairline cross centered on each
// corner of a framed card. Purely decorative (aria-hidden). The parent must be
// `relative`; place this on a wrapper OUTSIDE any `overflow-hidden` frame so the
// crosses aren't clipped.
const CORNERS = [
  "-left-[5px] -top-[5px]",
  "-right-[5px] -top-[5px]",
  "-left-[5px] -bottom-[5px]",
  "-right-[5px] -bottom-[5px]",
];

export default function CornerMarks() {
  return (
    <span aria-hidden className="pointer-events-none absolute inset-0">
      {CORNERS.map((pos) => (
        <span key={pos} className={`absolute h-[9px] w-[9px] ${pos}`}>
          <span className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-ink/30" />
          <span className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-ink/30" />
        </span>
      ))}
    </span>
  );
}
