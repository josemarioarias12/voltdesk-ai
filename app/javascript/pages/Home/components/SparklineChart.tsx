import { useState } from "react";

export default function SparklineChart() {
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);

  const data = [28, 35, 31, 42, 38, 45, 40, 52, 48, 55, 47, 60, 54, 62, 58, 65, 61, 70, 64, 68, 72, 66, 74, 70, 78, 72, 80, 75, 82, 78];
  const width = 160;
  const height = 48;
  const minVal = Math.min(...data);
  const maxVal = Math.max(...data);
  const getX = (i: number) => (i / (data.length - 1)) * width;
  const getY = (v: number) => height - ((v - minVal) / (maxVal - minVal)) * (height - 8) - 4;
  const pathD = data.map((v, i) => `${i === 0 ? "M" : "L"}${getX(i).toFixed(1)},${getY(v).toFixed(1)}`).join(" ");
  const areaD = pathD + ` L${width},${height} L0,${height}Z`;

  return (
    <div style={{ position: "relative" }}>
      <p style={{ color: "#475569", fontSize: 10, marginBottom: 8 }}>Ticket Volume — 30 Days</p>
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: "100%", height: 48, cursor: "crosshair", overflow: "visible" }}>
        <defs>
          <linearGradient id="sg2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#02C39A" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#02C39A" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaD} fill="url(#sg2)" />
        <path d={pathD} fill="none" stroke="#02C39A" strokeWidth="1.5" strokeLinejoin="round" />
        {data.map((v, i) => {
          const x = getX(i);
          const y = getY(v);
          const isHovered = hoveredPoint === i;
          return (
            <g key={i}>
              <rect x={x - 4} y={0} width={8} height={height} fill="transparent"
                onMouseEnter={() => setHoveredPoint(i)}
                onMouseLeave={() => setHoveredPoint(null)}
              />
              {isHovered && (
                <>
                  <line x1={x} y1={0} x2={x} y2={height} stroke="rgba(2,195,154,0.3)" strokeWidth="1" strokeDasharray="2,2" />
                  <circle cx={x} cy={y} r={3} fill="#02C39A" stroke="#0a1520" strokeWidth="1.5" />
                  <rect x={Math.min(x - 16, width - 36)} y={y - 22} width={34} height={16} rx={4} fill="#028090" />
                  <text x={Math.min(x, width - 19)} y={y - 11} textAnchor="middle" fill="#fff" fontSize={9} fontWeight={600}>{v} tkts</text>
                </>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
