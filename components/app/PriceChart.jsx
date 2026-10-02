// Minimal SVG price chart — no chart library, matches the 1px-border aesthetic.
export default function PriceChart({ data }) {
  if (!data || data.length < 2) return null;
  const W = 600, H = 180, P = 12;
  const prices = data.map((d) => d.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const span = max - min || 1;
  const x = (i) => P + (i * (W - 2 * P)) / (data.length - 1);
  const y = (v) => H - P - ((v - min) / span) * (H - 2 * P);
  const points = data.map((d, i) => `${x(i)},${y(d.price)}`).join(" ");

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-40" role="img">
      {/* min / max guides */}
      <line x1={P} y1={y(max)} x2={W - P} y2={y(max)} stroke="var(--line)" strokeWidth="1" strokeDasharray="3 4" />
      <line x1={P} y1={y(min)} x2={W - P} y2={y(min)} stroke="var(--line)" strokeWidth="1" strokeDasharray="3 4" />
      <text x={W - P} y={y(max) - 5} textAnchor="end" fontSize="10" fill="var(--muted)" fontFamily="var(--font-plex-mono)">
        {max.toLocaleString("en-US")}
      </text>
      <text x={W - P} y={y(min) + 12} textAnchor="end" fontSize="10" fill="var(--muted)" fontFamily="var(--font-plex-mono)">
        {min.toLocaleString("en-US")}
      </text>
      {/* line + dots */}
      <polyline points={points} fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      {data.map((d, i) => (
        <circle key={i} cx={x(i)} cy={y(d.price)} r="3.5" fill="var(--surface)" stroke="var(--accent)" strokeWidth="2" />
      ))}
      {/* x labels: first & last */}
      <text x={P} y={H - 1} fontSize="10" fill="var(--muted)" fontFamily="var(--font-plex-mono)">
        {data[0].date}
      </text>
      <text x={W - P} y={H - 1} textAnchor="end" fontSize="10" fill="var(--muted)" fontFamily="var(--font-plex-mono)">
        {data[data.length - 1].date}
      </text>
    </svg>
  );
}
