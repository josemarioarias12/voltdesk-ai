import { Head, router } from "@inertiajs/react";
import { useState } from "react";
import AppLayout from "@/layouts/AppLayout";
import { FloorMap } from "@/components/FloorMap";

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

interface Props {
  spaces: SpaceData[];
}

function statusBadge(status: string) {
  const map: Record<string, string> = {
    available: "bg-emerald-100 text-emerald-700",
    maintenance: "bg-amber-100 text-amber-700",
    inactive: "bg-slate-100 text-slate-500",
  };
  return map[status] ?? "bg-slate-100 text-slate-500";
}

export default function SpacesIndex({ spaces }: Props) {
  const [view, setView] = useState<"list" | "map">("map");
  const workspaceId = (window as unknown as { _workspaceId?: number })._workspaceId ?? 0;

  function handleSpaceClick(space: SpaceData) {
    router.visit(`/facilities/spaces/${space.id}`);
  }

  return (
    <AppLayout>
      <Head title="Spaces" />
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Facilities & Spaces</h1>
            <p className="text-slate-500 text-sm mt-1">{spaces.length} spaces across all floors</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex rounded-lg border border-slate-200 overflow-hidden">
              <button
                onClick={() => setView("map")}
                className={`px-4 py-2 text-sm font-medium transition-colors ${view === "map" ? "bg-teal-600 text-white" : "bg-white text-slate-600 hover:bg-slate-50"}`}
              >
                Floor Map
              </button>
              <button
                onClick={() => setView("list")}
                className={`px-4 py-2 text-sm font-medium transition-colors ${view === "list" ? "bg-teal-600 text-white" : "bg-white text-slate-600 hover:bg-slate-50"}`}
              >
                List
              </button>
            </div>
            <button
              onClick={() => router.visit("/facilities/spaces/utilization")}
              className="px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors"
            >
              AI Optimizer
            </button>
          </div>
        </div>

        {view === "map" && (
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">
              Live Floor Map — updates in real time
            </h2>
            <FloorMap spaces={spaces} workspaceId={workspaceId} onSpaceClick={handleSpaceClick} />
          </div>
        )}

        {view === "list" && (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {["Space", "Floor", "Type", "Capacity", "Status", "Today"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {spaces.map((space) => (
                  <tr
                    key={space.id}
                    onClick={() => handleSpaceClick(space)}
                    className="hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-slate-800">{space.name}</td>
                    <td className="px-4 py-3 text-slate-500">Floor {space.floor}</td>
                    <td className="px-4 py-3 text-slate-500 capitalize">{space.space_type.replace("_", " ")}</td>
                    <td className="px-4 py-3 text-slate-500">{space.capacity} people</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${statusBadge(space.status)}`}>
                        {space.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{space.reservations_today} reservations</td>
                  </tr>
                ))}
                {spaces.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                      No spaces configured yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppLayout>
  );
}