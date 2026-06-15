import { Head, router } from "@inertiajs/react";
import { useState } from "react";
import AppLayout from "@/components/AppLayout";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface SeriesPoint {
  period: string;
  avg_sentiment: number;
  survey_count: number;
  ticket_volume: number;
}

interface TrendSummary {
  sentiment_delta: number;
  volume_ratio: number | null;
  avg_sentiment: number;
  total_ticket_volume: number;
}

interface DepartmentTrend {
  department_id: number;
  department_name: string;
  department_color: string;
  series: SeriesPoint[];
  summary: TrendSummary;
}

interface Alert {
  type: string;
  message: string;
  severity: "critical" | "warning";
}

interface DepartmentAlert {
  department_id: number;
  department_name: string;
  alerts: Alert[];
}

interface Department {
  id: number;
  name: string;
  color: string;
}

interface TrendingData {
  trends: DepartmentTrend[];
  alerts: DepartmentAlert[];
  period_days: number;
  interval: string;
  departments: Department[];
}

interface Props {
  data: TrendingData | null;
  error: string | null;
  period: string;
}

const TEAL  = "#028090";
const MINT  = "#02C39A";
const NAVY  = "#0D1B2A";
const SLATE = "#1E293B";
const AMBER = "#F59E0B";
const RED   = "#EF4444";

const PERIODS = [
  { value: "7d",  label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "90d", label: "90 days" },
];

function formatPeriod(period: string, interval: string): string {
  const date = new Date(period);
  if (interval === "day") {
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function sentimentColor(delta: number): string {
  if (delta >= 0.05) return MINT;
  if (delta >= -0.05) return TEAL;
  if (delta >= -0.15) return AMBER;
  return RED;
}

function sentimentLabel(score: number): string {
  if (score >= 0.5)  return "Very Positive";
  if (score >= 0.1)  return "Positive";
  if (score >= -0.1) return "Neutral";
  if (score >= -0.5) return "Negative";
  return "Very Negative";
}

export default function SentimentTrendingIndex({ data, error, period }: Props) {
  const [activeDept, setActiveDept] = useState<number | null>(null);

  function changePeriod(newPeriod: string) {
    router.get("/hr/sentiment-trending", { period: newPeriod }, { preserveState: false });
  }

  if (error || !data) {
    return (
      <>
        <Head title="Sentiment Trending" />
        <AppLayout>
          <div className="p-6">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-amber-800">
              <p className="font-semibold">No sentiment data available</p>
              <p className="text-sm mt-1">{error ?? "Submit satisfaction surveys to see trends."}</p>
            </div>
          </div>
        </AppLayout>
      </>
    );
  }

  const displayedTrend = activeDept
    ? data.trends.find((trend) => trend.department_id === activeDept)
    : data.trends[0];

  return (
    <>
      <Head title="Sentiment Trending" />
      <AppLayout>
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold" style={{ color: NAVY }}>
                Sentiment Trending
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Correlated with ticket volume · Last {data.period_days} days
              </p>
            </div>
            {/* Period selector */}
            <div className="flex gap-2">
              {PERIODS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => changePeriod(opt.value)}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                  style={
                    period === opt.value
                      ? { background: TEAL, color: "#fff" }
                      : { background: "#F1F5F9", color: SLATE }
                  }
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Alerts */}
          {data.alerts.length > 0 && (
            <div className="space-y-3">
              {data.alerts.map((deptAlert) =>
                deptAlert.alerts.map((alert, idx) => (
                  <div
                    key={`${deptAlert.department_id}-${idx}`}
                    className="flex gap-3 p-4 rounded-xl border"
                    style={
                      alert.severity === "critical"
                        ? { background: "#FEF2F2", borderColor: "#FECACA" }
                        : { background: "#FFFBEB", borderColor: "#FDE68A" }
                    }
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="mt-0.5 shrink-0">
                      <path
                        d="M8 1.5L1.5 13.5h13L8 1.5zM8 6v4M8 11.5v1"
                        stroke={alert.severity === "critical" ? RED : AMBER}
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <p
                      className="text-sm"
                      style={{ color: alert.severity === "critical" ? "#991B1B" : "#92400E" }}
                    >
                      <span className="font-semibold">{deptAlert.department_name}: </span>
                      {alert.message}
                    </p>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Department tabs */}
          {data.departments.length > 1 && (
            <div className="flex gap-2 flex-wrap">
              {data.trends.map((trend) => (
                <button
                  key={trend.department_id}
                  onClick={() => setActiveDept(trend.department_id)}
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  style={
                    (activeDept ?? data.trends[0]?.department_id) === trend.department_id
                      ? { background: trend.department_color || TEAL, color: "#fff" }
                      : { background: "#F1F5F9", color: SLATE }
                  }
                >
                  {trend.department_name}
                </button>
              ))}
            </div>
          )}

          {/* Dual-axis Chart */}
          {displayedTrend && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-semibold" style={{ color: SLATE }}>
                    {displayedTrend.department_name}
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Avg sentiment vs ticket volume per {data.interval}
                  </p>
                </div>
                {displayedTrend.summary && (
                  <SummaryBadge summary={displayedTrend.summary} />
                )}
              </div>

              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart
                  data={displayedTrend.series.map((point) => ({
                    ...point,
                    period: formatPeriod(point.period, data.interval),
                  }))}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                  <YAxis
                    yAxisId="volume"
                    orientation="left"
                    tick={{ fontSize: 11 }}
                    label={{
                      value: "Tickets",
                      angle: -90,
                      position: "insideLeft",
                      offset: 10,
                      style: { fontSize: 11, fill: "#94A3B8" },
                    }}
                  />
                  <YAxis
                    yAxisId="sentiment"
                    orientation="right"
                    domain={[-1, 1]}
                    tick={{ fontSize: 11 }}
                    label={{
                      value: "Sentiment",
                      angle: 90,
                      position: "insideRight",
                      offset: 10,
                      style: { fontSize: 11, fill: "#94A3B8" },
                    }}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, fontSize: 12 }}
                    formatter={((value: number, name: string) => {
                      if (name === "Sentiment Score") return [value.toFixed(3), name];
                      return [value, name];
                    }) as unknown as never}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar
                    yAxisId="volume"
                    dataKey="ticket_volume"
                    name="Ticket Volume"
                    fill={`${TEAL}40`}
                    stroke={TEAL}
                    strokeWidth={1}
                    radius={[3, 3, 0, 0]}
                  />
                  <Line
                    yAxisId="sentiment"
                    type="monotone"
                    dataKey="avg_sentiment"
                    name="Sentiment Score"
                    stroke={MINT}
                    strokeWidth={2.5}
                    dot={{ fill: MINT, r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Department Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.trends.map((trend) => (
              <DeptSummaryCard
                key={trend.department_id}
                trend={trend}
                onClick={() => setActiveDept(trend.department_id)}
                active={(activeDept ?? data.trends[0]?.department_id) === trend.department_id}
              />
            ))}
          </div>
        </div>
      </AppLayout>
    </>
  );
}

function SummaryBadge({ summary }: { summary: TrendSummary }) {
  const color = sentimentColor(summary.sentiment_delta);
  const sign  = summary.sentiment_delta >= 0 ? "+" : "";
  return (
    <div
      className="px-3 py-1.5 rounded-lg text-sm font-medium"
      style={{ background: `${color}18`, color }}
    >
      {sign}{(summary.sentiment_delta * 100).toFixed(1)} pts trend
    </div>
  );
}

function DeptSummaryCard({
  trend,
  onClick,
  active,
}: {
  trend: DepartmentTrend;
  onClick: () => void;
  active: boolean;
}) {
  const { summary } = trend;
  const color = sentimentColor(summary?.sentiment_delta ?? 0);

  return (
    <button
      onClick={onClick}
      className="text-left bg-white rounded-xl border shadow-sm p-5 transition-all hover:shadow-md"
      style={{ borderColor: active ? TEAL : "#F1F5F9" }}
    >
      <div className="flex items-center justify-between mb-3">
        <div
          className="w-2.5 h-2.5 rounded-full"
          style={{ background: trend.department_color || TEAL }}
        />
        <span className="text-xs text-gray-400">{trend.series.length} periods</span>
      </div>
      <p className="font-semibold text-sm" style={{ color: NAVY }}>
        {trend.department_name}
      </p>
      {summary && (
        <>
          <p className="text-2xl font-bold mt-2" style={{ color }}>
            {summary.avg_sentiment >= 0 ? "+" : ""}
            {summary.avg_sentiment.toFixed(3)}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            {sentimentLabel(summary.avg_sentiment)}
          </p>
          <div className="flex gap-3 mt-3 text-xs text-gray-500">
            <span>{summary.total_ticket_volume} tickets</span>
            <span style={{ color }}>
              {summary.sentiment_delta >= 0 ? "▲" : "▼"}{" "}
              {Math.abs(summary.sentiment_delta * 100).toFixed(1)} pts
            </span>
          </div>
        </>
      )}
    </button>
  );
}