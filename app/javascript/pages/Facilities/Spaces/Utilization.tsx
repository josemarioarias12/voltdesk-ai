import { Head, router } from "@inertiajs/react";
import { useState } from "react";
import AppLayout from "@/components/AppLayout";
import { IconChevronLeft } from "@/components/Icons";

interface UtilizationData {
  space_id: number;
  space_name: string;
  floor: string;
  space_type: string;
  capacity: number;
  total_reservations: number;
  utilization_percentage: number;
  status: "underutilized" | "optimal" | "overdemanded";
}

interface Recommendation {
  space: string;
  current_utilization: string;
  recommendation: string;
  estimated_impact: string;
}

interface OptimizationResult {
  summary: string;
  underutilized: Recommendation[];
  overdemanded: Recommendation[];
  quick_wins: string[];
  projected_improvement: string;
}

interface Props {
  utilization: UtilizationData[];
}

function statusColor(status: string) {
  if (status === "underutilized") return "bg-blue-100 text-blue-700";
  if (status === "optimal") return "bg-emerald-100 text-emerald-700";
  return "bg-red-100 text-red-700";
}

function barColor(pct: number) {
  if (pct < 50) return "bg-emerald-500";
  if (pct <= 80) return "bg-amber-500";
  return "bg-red-500";
}

export default function SpaceUtilization({ utilization }: Props) {
  const [optimization, setOptimization] = useState<OptimizationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function runOptimizer() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/facilities/spaces/optimize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? "",
        },
      });
      const json = await res.json();
      if (json.error) {
        setError(json.error);
      } else {
        setOptimization(json.recommendations);
      }
    } catch {
      setError("Failed to generate optimization report.");
    } finally {
      setLoading(false);
    }
  }

  const avgUtilization = utilization.length
    ? (utilization.reduce((sum, sp) => sum + sp.utilization_percentage, 0) / utilization.length).toFixed(1)
    : "0";

  return (
    <AppLayout>
      <Head title="Space Utilization" />
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <button onClick={() => router.visit("/facilities/spaces")}
              className="text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 mb-2 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors -ml-3">
              <IconChevronLeft size={14} />
              Back to Spaces
            </button>
            <h1 className="text-2xl font-bold text-slate-800">Space Utilization</h1>
            <p className="text-slate-500 text-sm mt-1">Last 90 days · {utilization.length} spaces analyzed</p>
          </div>
          <button
            onClick={runOptimizer}
            disabled={loading}
            className="px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 disabled:opacity-50 transition-colors"
          >
            {loading ? "Analyzing…" : "✨ Generate AI Recommendations"}
          </button>
        </div>

        {/* Summary stat */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Avg Utilization</p>
            <p className="text-2xl font-bold text-slate-800">{avgUtilization}%</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Underutilized</p>
            <p className="text-2xl font-bold text-blue-600">
              {utilization.filter((s) => s.status === "underutilized").length}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Overdemanded</p>
            <p className="text-2xl font-bold text-red-600">
              {utilization.filter((s) => s.status === "overdemanded").length}
            </p>
          </div>
        </div>

        {/* Utilization table */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto mb-8">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {["Space", "Floor", "Type", "Capacity", "Reservations", "Utilization", "Status"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {utilization.map((sp) => (
                <tr key={sp.space_id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-800">{sp.space_name}</td>
                  <td className="px-4 py-3 text-slate-500">Floor {sp.floor}</td>
                  <td className="px-4 py-3 text-slate-500 capitalize">{sp.space_type.replace(/_/g, " ")}</td>
                  <td className="px-4 py-3 text-slate-500">{sp.capacity}</td>
                  <td className="px-4 py-3 text-slate-500">{sp.total_reservations}</td>
                  <td className="px-4 py-3 w-40">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-slate-100 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${barColor(sp.utilization_percentage)}`}
                          style={{ width: `${Math.min(sp.utilization_percentage, 100)}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-600 w-10 text-right">{sp.utilization_percentage}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${statusColor(sp.status)}`}>
                      {sp.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* AI Recommendations */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm mb-6">{error}</div>
        )}

        {optimization && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6">
            <h2 className="text-lg font-semibold text-slate-800">AI Space Optimizer Recommendations</h2>
            <p className="text-slate-600 text-sm">{optimization.summary}</p>

            {optimization.underutilized.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-blue-700 mb-3">Underutilized Spaces</h3>
                <div className="space-y-3">
                  {optimization.underutilized.map((rec, idx) => (
                    <div key={idx} className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                      <p className="font-medium text-slate-800">{rec.space} <span className="text-blue-600 text-xs">({rec.current_utilization})</span></p>
                      <p className="text-sm text-slate-600 mt-1">{rec.recommendation}</p>
                      <p className="text-xs text-blue-600 mt-1">Impact: {rec.estimated_impact}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {optimization.overdemanded.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-red-700 mb-3">Overdemanded Spaces</h3>
                <div className="space-y-3">
                  {optimization.overdemanded.map((rec, idx) => (
                    <div key={idx} className="bg-red-50 border border-red-100 rounded-lg p-4">
                      <p className="font-medium text-slate-800">{rec.space} <span className="text-red-600 text-xs">({rec.current_utilization})</span></p>
                      <p className="text-sm text-slate-600 mt-1">{rec.recommendation}</p>
                      <p className="text-xs text-red-600 mt-1">Impact: {rec.estimated_impact}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {optimization.quick_wins.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-slate-700 mb-2">Quick Wins</h3>
                <ul className="space-y-1">
                  {optimization.quick_wins.map((win, idx) => (
                    <li key={idx} className="text-sm text-slate-600 flex items-start gap-2">
                      <span className="text-teal-500 mt-0.5">✓</span> {win}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
              <p className="text-sm font-medium text-teal-800">Projected Improvement</p>
              <p className="text-sm text-teal-700 mt-1">{optimization.projected_improvement}</p>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}