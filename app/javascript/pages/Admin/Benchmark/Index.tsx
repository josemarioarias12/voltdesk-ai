import { Head } from "@inertiajs/react";
import AppLayout from "@/components/AppLayout";
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

interface MetricPercentile {
  value: number;
  percentile: number;
}

interface Percentiles {
  sla_compliance: MetricPercentile;
  avg_resolution_hrs: MetricPercentile;
  avg_confidence: MetricPercentile;
  cost_per_ticket: MetricPercentile;
}

interface BenchmarkData {
  current_workspace: {
    sla_compliance: number;
    avg_resolution_hrs: number;
    avg_confidence: number;
    cost_per_ticket: number;
    ticket_volume: number;
    is_current: boolean;
  };
  percentiles: Percentiles;
  peer_percentiles: Percentiles;
  peer_count: number;
  total_count: number;
  plan: string;
  period_days: number;
}

interface Props {
  benchmark: BenchmarkData | null;
  error: string | null;
}

const TEAL  = "#028090";
const MINT  = "#02C39A";
const NAVY  = "#0D1B2A";
const SLATE = "#1E293B";
const AMBER = "#F59E0B";
const RED   = "#EF4444";

function percentileColor(p: number): string {
  if (p >= 75) return MINT;
  if (p >= 50) return TEAL;
  if (p >= 25) return AMBER;
  return RED;
}

function percentileLabel(p: number): string {
  if (p >= 75) return "Top performer";
  if (p >= 50) return "Above average";
  if (p >= 25) return "Below average";
  return "Needs attention";
}

const METRIC_LABELS: Record<string, string> = {
  sla_compliance:     "SLA Compliance",
  avg_resolution_hrs: "Resolution Speed",
  avg_confidence:     "AI Confidence",
  cost_per_ticket:    "Cost Efficiency",
};

export default function BenchmarkIndex({ benchmark, error }: Props) {
  if (error || !benchmark) {
    return (
      <>
        <Head title="Workspace Benchmark" />
        <AppLayout>
          <div className="p-6">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-amber-800">
              <p className="font-semibold">Benchmark unavailable</p>
              <p className="text-sm mt-1">{error ?? "Not enough data to generate benchmark."}</p>
            </div>
          </div>
        </AppLayout>
      </>
    );
  }

  const { percentiles, peer_percentiles, peer_count, total_count, plan, period_days } = benchmark;

  const radarData = Object.entries(percentiles).map(([key, val]) => ({
    metric:          METRIC_LABELS[key] ?? key,
    "All workspaces": val.percentile,
    "Similar plan":   peer_percentiles[key as keyof Percentiles].percentile,
  }));

  return (
    <>
      <Head title="Workspace Benchmark" />
      <AppLayout>
        <div className="p-6 space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold" style={{ color: NAVY }}>
              Workspace Benchmark
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Anonymous comparison · Last {period_days} days ·{" "}
              <span className="capitalize font-medium">{plan}</span> plan ·{" "}
              {peer_count} similar workspaces · {total_count} total
            </p>
          </div>

          {/* Percentile Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(percentiles).map(([key, val]) => (
              <PercentileCard
                key={key}
                label={METRIC_LABELS[key] ?? key}
                percentile={val.percentile}
                value={val.value}
                metricKey={key}
              />
            ))}
          </div>

          {/* Radar Chart */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-base font-semibold mb-1" style={{ color: SLATE }}>
              Performance Radar
            </h2>
            <p className="text-xs text-gray-400 mb-4">
              Percentile rank vs all workspaces and similar-plan peers. Higher = better.
            </p>
            <ResponsiveContainer width="100%" height={320}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#F1F5F9" />
                <PolarAngleAxis dataKey="metric" tick={{ fontSize: 12, fill: SLATE }} />
                <PolarRadiusAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 10 }}
                  tickCount={5}
                />
                <Radar
                  name="All workspaces"
                  dataKey="All workspaces"
                  stroke={TEAL}
                  fill={TEAL}
                  fillOpacity={0.15}
                />
                <Radar
                  name="Similar plan"
                  dataKey="Similar plan"
                  stroke={MINT}
                  fill={MINT}
                  fillOpacity={0.2}
                />
                <Tooltip
                  formatter={((value: number, name: string) => [`${value}th percentile`, name]) as never}
                  contentStyle={{ borderRadius: 8, fontSize: 12 }}
                />
              </RadarChart>
            </ResponsiveContainer>
            <div className="flex gap-6 justify-center mt-2">
              <Legend color={TEAL} label="All workspaces" />
              <Legend color={MINT} label="Similar plan peers" />
            </div>
          </div>

          {/* Detailed Table */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-base font-semibold mb-4" style={{ color: SLATE }}>
              Metric Breakdown
            </h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-100">
                  <th className="pb-3 font-medium">Metric</th>
                  <th className="pb-3 font-medium">Your Value</th>
                  <th className="pb-3 font-medium">All Workspaces</th>
                  <th className="pb-3 font-medium">Similar Plan</th>
                  <th className="pb-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(percentiles).map(([key, val]) => {
                  const peerVal = peer_percentiles[key as keyof Percentiles];
                  return (
                    <tr key={key} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-3 font-medium" style={{ color: NAVY }}>
                        {METRIC_LABELS[key] ?? key}
                      </td>
                      <td className="py-3 text-gray-700">
                        {formatValue(key, val.value)}
                      </td>
                      <td className="py-3">
                        <PercentileBadge percentile={val.percentile} />
                      </td>
                      <td className="py-3">
                        <PercentileBadge percentile={peerVal.percentile} />
                      </td>
                      <td className="py-3 text-xs" style={{ color: percentileColor(val.percentile) }}>
                        {percentileLabel(val.percentile)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Anonymity notice */}
          <p className="text-xs text-gray-400 text-center">
            All benchmark data is fully anonymized. No workspace names or identifiable information are shared.
          </p>
        </div>
      </AppLayout>
    </>
  );
}

function PercentileCard({
  label,
  percentile,
  value,
  metricKey,
}: {
  label: string;
  percentile: number;
  value: number;
  metricKey: string;
}) {
  const color = percentileColor(percentile);
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold mt-1" style={{ color }}>
        {percentile}
        <span className="text-sm font-normal text-gray-400">th percentile</span>
      </p>
      <p className="text-xs text-gray-400 mt-1">{formatValue(metricKey, value)}</p>
      <p className="text-xs font-medium mt-2" style={{ color }}>
        {percentileLabel(percentile)}
      </p>
    </div>
  );
}

function PercentileBadge({ percentile }: { percentile: number }) {
  const color = percentileColor(percentile);
  return (
    <span
      className="px-2 py-0.5 rounded-full text-xs font-medium"
      style={{ background: `${color}18`, color }}
    >
      P{percentile}
    </span>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-3 h-3 rounded-full" style={{ background: color }} />
      <span className="text-xs text-gray-500">{label}</span>
    </div>
  );
}

function formatValue(metricKey: string, value: number): string {
  switch (metricKey) {
    case "sla_compliance":     return `${value.toFixed(1)}%`;
    case "avg_resolution_hrs": return `${value.toFixed(1)}h`;
    case "avg_confidence":     return value.toFixed(3);
    case "cost_per_ticket":    return `$${value.toFixed(4)}`;
    default:                   return value.toString();
  }
}