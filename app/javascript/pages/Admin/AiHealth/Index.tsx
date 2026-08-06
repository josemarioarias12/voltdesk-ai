import { Head } from "@inertiajs/react";
import { useTranslation } from "react-i18next";
import AdminLayout from "@/components/AdminLayout";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface OperationBelowThreshold {
  operation: string;
  avg_confidence: number;
  total: number;
  recommendation: string;
}

interface CostPerOperation {
  operation: string;
  avg_cost: number;
  total: number;
}

interface FailingOperation {
  operation: string;
  total: number;
  error_count: number;
  error_rate: number;
  avg_confidence: number | null;
  recommendation: string;
}

interface ConfidenceDistribution {
  [bucket: string]: number;
}

interface AiHealthMetrics {
  confidence_distribution: ConfidenceDistribution;
  operations_below_threshold: OperationBelowThreshold[];
  cost_per_operation: CostPerOperation[];
  estimated_time_saved: number;
  top_failing_operations: FailingOperation[];
  total_operations: number;
  period_days: number;
  success_rate: number;
}

interface Props {
  metrics: AiHealthMetrics;
  period_days: number;
}

const TEAL   = "#028090";
const MINT   = "#02C39A";
const RED    = "#EF4444";
const AMBER  = "#F59E0B";
const NAVY   = "#0D1B2A";
const SLATE  = "#1E293B";

function confidenceColor(value: number): string {
  if (value >= 0.7) return MINT;
  if (value >= 0.5) return AMBER;
  return RED;
}

function formatOperation(op: string): string {
  return op.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function AiHealthIndex({ metrics, period_days }: Props) {
  const { t } = useTranslation("admin");

  const distributionData = Object.entries(metrics.confidence_distribution).map(
    ([bucket, count]) => ({ bucket, count })
  );

  const belowThresholdData = metrics.operations_below_threshold.map((op) => ({
    name:       formatOperation(op.operation),
    confidence: op.avg_confidence,
    total:      op.total,
  }));

  const costData = metrics.cost_per_operation.map((op) => ({
    name: formatOperation(op.operation),
    cost: op.avg_cost,
  }));

  return (
    <>
      <Head title={t("aiHealth.pageTitle")} />
      <AdminLayout>
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold" style={{ color: NAVY }}>
                {t("aiHealth.header.title")}
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                {t("aiHealth.header.subtitle", { days: period_days, count: metrics.total_operations })}
              </p>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <KpiCard
              label={t("aiHealth.kpi.totalOperations")}
              value={metrics.total_operations.toLocaleString()}
              sub={t("aiHealth.kpi.aiCallsLogged")}
              color={TEAL}
            />
            <KpiCard
              label={t("aiHealth.kpi.successRate")}
              value={`${metrics.success_rate}%`}
              sub={t("aiHealth.kpi.nonErrorResponses")}
              color={metrics.success_rate >= 90 ? MINT : RED}
            />
            <KpiCard
              label={t("aiHealth.kpi.timeSaved")}
              value={`${metrics.estimated_time_saved}h`}
              sub={t("aiHealth.kpi.vsManualEffort", { days: period_days })}
              color={TEAL}
            />
            <KpiCard
              label={t("aiHealth.kpi.opsBelowThreshold")}
              value={metrics.operations_below_threshold.length.toString()}
              sub={t("aiHealth.kpi.avgConfidenceBelow")}
              color={metrics.operations_below_threshold.length > 0 ? AMBER : MINT}
            />
          </div>

          {/* Confidence Distribution */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-base font-semibold mb-4" style={{ color: SLATE }}>
              {t("aiHealth.confidenceDistribution")}
            </h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={distributionData} barSize={48}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="bucket" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={((value: number) => [value, t("aiHealth.tooltip.operations")]) as never}
                  contentStyle={{ borderRadius: 8, fontSize: 12 }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {distributionData.map((entry, idx) => {
                    const colors = [RED, AMBER, AMBER, MINT];
                    return <Cell key={idx} fill={colors[idx] ?? TEAL} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Operations Below Threshold */}
          {metrics.operations_below_threshold.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-base font-semibold mb-4" style={{ color: SLATE }}>
                {t("aiHealth.belowThreshold")}
              </h2>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={belowThresholdData} layout="vertical" barSize={20}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis type="number" domain={[0, 1]} tick={{ fontSize: 12 }} />
                  <YAxis dataKey="name" type="category" width={160} tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={((value: number) => [value.toFixed(3), t("aiHealth.tooltip.avgConfidence")]) as never}
                    contentStyle={{ borderRadius: 8, fontSize: 12 }}
                  />
                  <Bar dataKey="confidence" radius={[0, 4, 4, 0]}>
                    {belowThresholdData.map((entry, idx) => (
                      <Cell key={idx} fill={confidenceColor(entry.confidence)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>

              {/* Recommendations */}
              <div className="mt-6 space-y-3">
                <h3 className="text-sm font-semibold text-gray-600">{t("aiHealth.recommendations")}</h3>
                {metrics.operations_below_threshold.map((op) => (
                  <RecommendationCard key={op.operation} op={op} />
                ))}
              </div>
            </div>
          )}

          {/* Cost per Operation */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-base font-semibold mb-4" style={{ color: SLATE }}>
              {t("aiHealth.costPerOperation")}
            </h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={costData} barSize={36}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={50} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v: number) => `$${v.toFixed(4)}`} />
                <Tooltip
                  formatter={((value: number) => [`$${value.toFixed(6)}`, t("aiHealth.tooltip.avgCost")]) as never}
                  contentStyle={{ borderRadius: 8, fontSize: 12 }}
                />
                <Bar dataKey="cost" fill={TEAL} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Top Failing Operations */}
          {metrics.top_failing_operations.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-base font-semibold mb-4" style={{ color: SLATE }}>
                {t("aiHealth.topFailing.title")}
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500 border-b border-gray-100">
                      <th className="pb-3 font-medium">{t("aiHealth.topFailing.operation")}</th>
                      <th className="pb-3 font-medium">{t("aiHealth.topFailing.total")}</th>
                      <th className="pb-3 font-medium">{t("aiHealth.topFailing.errors")}</th>
                      <th className="pb-3 font-medium">{t("aiHealth.topFailing.errorRate")}</th>
                      <th className="pb-3 font-medium">{t("aiHealth.topFailing.avgConfidence")}</th>
                      <th className="pb-3 font-medium">{t("aiHealth.topFailing.recommendation")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metrics.top_failing_operations.map((op) => (
                      <tr key={op.operation} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="py-3 font-medium" style={{ color: NAVY }}>
                          {formatOperation(op.operation)}
                        </td>
                        <td className="py-3 text-gray-600">{op.total}</td>
                        <td className="py-3 text-red-500 font-medium">{op.error_count}</td>
                        <td className="py-3">
                          <span
                            className="px-2 py-0.5 rounded-full text-xs font-medium"
                            style={{
                              background: op.error_rate > 20 ? "#FEE2E2" : "#FEF3C7",
                              color:      op.error_rate > 20 ? RED : AMBER,
                            }}
                          >
                            {op.error_rate}%
                          </span>
                        </td>
                        <td className="py-3">
                          {op.avg_confidence != null ? (
                            <span style={{ color: confidenceColor(op.avg_confidence) }}>
                              {op.avg_confidence.toFixed(3)}
                            </span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="py-3 text-gray-500 text-xs max-w-xs">{op.recommendation}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </AdminLayout>
    </>
  );
}

function KpiCard({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: string;
  sub: string;
  color: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold mt-1" style={{ color }}>
        {value}
      </p>
      <p className="text-xs text-gray-400 mt-1">{sub}</p>
    </div>
  );
}

function RecommendationCard({ op }: { op: OperationBelowThreshold }) {
  const { t } = useTranslation("admin");
  return (
    <div className="flex gap-3 p-4 rounded-lg bg-amber-50 border border-amber-100">
      <div className="mt-0.5">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path
            d="M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM8 5v4M8 10.5v1"
            stroke="#F59E0B"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </div>
      <div>
        <p className="text-sm font-semibold text-amber-800">
          {formatOperation(op.operation)}{" "}
          <span className="font-normal text-amber-600">
            — {t("aiHealth.recommendationSuffix", { confidence: op.avg_confidence.toFixed(3), count: op.total })}
          </span>
        </p>
        <p className="text-xs text-amber-700 mt-1">{op.recommendation}</p>
      </div>
    </div>
  );
}