import { useEffect, useRef, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useActionCable } from "@/hooks/useActionCable";
import { slugify } from "@/utils/slugify";

interface SpaceData {
  id: number;
  name: string;
  floor: string;
  capacity: number;
  status: string;
  space_type: string;
  reservations_today: number;
  utilization_today?: { reserved_slots: number; percentage: number };
}

interface TooltipState {
  visible: boolean;
  x: number;
  y: number;
  space: SpaceData | null;
}

interface FloorMapProps {
  spaces: SpaceData[];
  workspaceId: number;
  onSpaceClick?: (space: SpaceData) => void;
}

const COLS = 4;
const CARD_SIZE = 150;
const GAP_X = 32;
const GAP_Y = 32;
const PADDING = 32;

function utilizationColor(pct: number, status: string): string {
  if (status !== "available") return "#94a3b8";
  if (pct < 50) return "#02C39A";
  if (pct <= 80) return "#f59e0b";
  return "#ef4444";
}

function utilizationPct(space: SpaceData): number {
  return space.utilization_today?.percentage ?? 0;
}

export function FloorMap({ spaces, workspaceId, onSpaceClick }: FloorMapProps) {
  const { t } = useTranslation(["facilities", "common"]);
  const [liveSpaces, setLiveSpaces] = useState<SpaceData[]>(spaces);
  const [tooltip, setTooltip] = useState<TooltipState>({ visible: false, x: 0, y: 0, space: null });
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => { setLiveSpaces(spaces); }, [spaces]);

  const handleCableData = useCallback((data: Record<string, unknown>) => {
    const type = data.type as string;
    const space = data.space as SpaceData;
    if (type !== "space_updated") return;
    setLiveSpaces((prev) =>
      prev.map((sp) => (sp.id === space.id ? { ...sp, ...space } : sp))
    );
  }, []);

  useActionCable({ channel: "SpacesChannel", workspaceId }, handleCableData);

  const floors = [...new Set(liveSpaces.map((sp) => sp.floor))].sort();

  let totalHeight = PADDING;
  const floorLayouts: { floor: string; y: number; spaces: SpaceData[] }[] = [];

  floors.forEach((floor) => {
    const floorSpaces = liveSpaces.filter((sp) => sp.floor === floor);
    const rows = Math.ceil(floorSpaces.length / COLS);
    floorLayouts.push({ floor, y: totalHeight, spaces: floorSpaces });
    totalHeight += 28 + rows * (CARD_SIZE + GAP_Y) + GAP_Y;
  });

  const svgWidth = COLS * (CARD_SIZE + GAP_X) - GAP_X + PADDING * 2;
  const svgHeight = totalHeight + PADDING;

  const cards = floorLayouts.flatMap(({ spaces: floorSpaces, y }) =>
    floorSpaces.map((space, idx) => {
      const col = idx % COLS;
      const row = Math.floor(idx / COLS);
      const rx = PADDING + col * (CARD_SIZE + GAP_X);
      const ry = y + 28 + row * (CARD_SIZE + GAP_Y);
      const pct = utilizationPct(space);
      const fill = utilizationColor(pct, space.status);
      return { space, rx, ry, pct, fill };
    })
  );

  return (
    <div className="relative w-full overflow-x-auto">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="w-full h-auto"
        style={{ minWidth: 600 }}
      >
        <defs>
          <linearGradient id="cardScrim" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#000000" stopOpacity="0" />
            <stop offset="1" stopColor="#000000" stopOpacity="0.7" />
          </linearGradient>
          {cards.map(({ space, rx, ry }) => (
            <clipPath id={`clip-${space.id}`} key={space.id}>
              <rect x={rx} y={ry} width={CARD_SIZE} height={CARD_SIZE} rx={10} />
            </clipPath>
          ))}
        </defs>

        {cards.map(({ space, rx, ry, pct, fill }) => (
          <g
            key={space.id}
            style={{ cursor: "pointer" }}
            onClick={() => onSpaceClick?.(space)}
            onMouseEnter={(evt) => {
              const svg = svgRef.current;
              if (!svg) return;
              const rect = svg.getBoundingClientRect();
              setTooltip({
                visible: true,
                x: evt.clientX - rect.left,
                y: evt.clientY - rect.top,
                space,
              });
            }}
            onMouseLeave={() => setTooltip((prev) => ({ ...prev, visible: false }))}
          >
            <g clipPath={`url(#clip-${space.id})`}>
              <rect x={rx} y={ry} width={CARD_SIZE} height={CARD_SIZE} fill="#eef2f7" />
              <image
                href={`/images/spaces/${slugify(space.name)}.png`}
                x={rx}
                y={ry}
                width={CARD_SIZE}
                height={CARD_SIZE}
                preserveAspectRatio="xMidYMid slice"
                style={{ pointerEvents: "none" }}
              />
              <rect x={rx} y={ry + CARD_SIZE - 56} width={CARD_SIZE} height={56} fill="url(#cardScrim)" style={{ pointerEvents: "none" }} />
            </g>
            <circle cx={rx + CARD_SIZE - 14} cy={ry + 14} r={6} fill={fill} stroke="#ffffff" strokeWidth={1.5} style={{ pointerEvents: "none" }} />
            <text x={rx + 10} y={ry + CARD_SIZE - 30} fill="#ffffff"
              fontSize={13} fontWeight="700" style={{ pointerEvents: "none" }}>
              {space.name.length > 18 ? space.name.slice(0, 16) + "…" : space.name}
            </text>
            <text x={rx + 10} y={ry + CARD_SIZE - 14} fill="#ffffff"
              fontSize={11} opacity={0.9} style={{ pointerEvents: "none" }}>
              {t("floorMap.occupied", { pct: pct.toFixed(0) })}
            </text>
          </g>
        ))}

        {floorLayouts.map(({ floor, y }) => (
          <text key={`label-${floor}`} x={PADDING} y={y + 18}
            fill="#0D1B2A" fontSize={14} fontWeight="700">
            {t("index.list.floorLabel", { floor })}
          </text>
        ))}
      </svg>

      {tooltip.visible && tooltip.space && (
        <div
          className="absolute z-50 bg-white border border-slate-200 rounded-lg shadow-lg p-3 text-sm pointer-events-none"
          style={{ left: tooltip.x + 12, top: tooltip.y - 10, minWidth: 180 }}
        >
          <p className="font-semibold text-slate-800 mb-1">{tooltip.space.name}</p>
          <p className="text-slate-500">{t("floorMap.tooltip.type", { type: t(`spaceType.${tooltip.space.space_type}`) })}</p>
          <p className="text-slate-500">{t("floorMap.tooltip.capacity", { count: tooltip.space.capacity })}</p>
          <p className="text-slate-500">{t("floorMap.tooltip.status", { status: t(`spaceStatus.${tooltip.space.status}`) })}</p>
          <p className="text-slate-500">{t("floorMap.tooltip.reservationsToday", { count: tooltip.space.reservations_today })}</p>
          <p className="text-slate-500">{t("floorMap.tooltip.utilization", { pct: utilizationPct(tooltip.space).toFixed(1) })}</p>
        </div>
      )}

      <div className="flex gap-4 mt-3 text-xs text-slate-500">
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-full" style={{ background: "#02C39A" }} /> {t("floorMap.legend.available")}
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-full" style={{ background: "#f59e0b" }} /> {t("floorMap.legend.busy")}
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-full" style={{ background: "#ef4444" }} /> {t("floorMap.legend.full")}
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-full" style={{ background: "#94a3b8" }} /> {t("floorMap.legend.unavailable")}
        </span>
      </div>
    </div>
  );
}
