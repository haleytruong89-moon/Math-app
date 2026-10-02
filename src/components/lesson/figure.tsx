/**
 * Right triangle ABC (right angle at A) with altitude AH — drawn to scale:
 * B(20,170), C(300,170), H(110,170), A(110, 39.2) so that AH² = BH·CH (130.8² ≈ 90·190).
 */
export function RightTriangleAltitude({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 320 200"
      role="img"
      aria-label="Tam giác ABC vuông tại A, đường cao AH vuông góc với cạnh huyền BC tại H"
      className={`mx-auto block w-full max-w-xs ${className}`}
    >
      <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round">
        <polygon points="20,170 300,170 110,39.2" />
      </g>
      <line x1="110" y1="39.2" x2="110" y2="170" stroke="var(--accent)" strokeWidth="2" strokeDasharray="5 4" />
      <g fill="none" stroke="currentColor" strokeWidth="1.2" opacity="0.7">
        <polyline points="103.2,49.1 113.1,55.9 119.9,46" />
        <polyline points="122,170 122,158 110,158" />
      </g>
      <g fontFamily="var(--font-body)" fontSize="16" fontStyle="italic" fill="currentColor">
        <text x="104" y="30">A</text>
        <text x="4" y="186">B</text>
        <text x="304" y="186">C</text>
        <text x="104" y="190" fill="var(--accent)">H</text>
      </g>
    </svg>
  );
}
