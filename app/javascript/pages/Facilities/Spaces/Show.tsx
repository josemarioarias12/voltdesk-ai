import { Head, router } from "@inertiajs/react";
import AppLayout from "@/layouts/AppLayout";

interface Reservation {
  id: number;
  title: string;
  start_at: string;
  end_at: string;
  attendees_count: number;
  status: string;
  user: { id: number; name: string };
}

interface SpaceData {
  id: number;
  name: string;
  floor: string;
  capacity: number;
  status: string;
  space_type: string;
  equipment: Record<string, unknown>;
  reservations_today: number;
}

interface Props {
  space: SpaceData;
  reservations: Reservation[];
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
}

export default function SpaceShow({ space, reservations }: Props) {
  return (
    <AppLayout>
      <Head title={space.name} />
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <button
              onClick={() => router.visit("/facilities/spaces")}
              className="text-sm text-slate-500 hover:text-slate-700 mb-2 flex items-center gap-1"
            >
              ← Back to Spaces
            </button>
            <h1 className="text-2xl font-bold text-slate-800">{space.name}</h1>
            <p className="text-slate-500 text-sm mt-1">
              Floor {space.floor} · {space.space_type.replace(/_/g, " ")} · Capacity: {space.capacity}
            </p>
          </div>
          <button
            onClick={() => router.visit(`/facilities/spaces/${space.id}/reservations/new`)}
            className="px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors"
          >
            Reserve Space
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: "Status", value: space.status, accent: space.status === "available" ? "text-emerald-600" : "text-amber-600" },
            { label: "Reservations Today", value: space.reservations_today, accent: "text-slate-800" },
            { label: "Upcoming", value: reservations.length, accent: "text-slate-800" },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl border border-slate-200 p-4">
              <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">{stat.label}</p>
              <p className={`text-xl font-bold capitalize ${stat.accent}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Upcoming Reservations */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-700">Upcoming Reservations</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {reservations.length === 0 && (
              <div className="px-6 py-12 text-center text-slate-400 text-sm">
                No upcoming reservations for this space.
              </div>
            )}
            {reservations.map((res) => (
              <div key={res.id} className="px-6 py-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-800">{res.title}</p>
                  <p className="text-sm text-slate-500 mt-0.5">
                    {formatDate(res.start_at)} · {formatTime(res.start_at)} – {formatTime(res.end_at)}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {res.user.name} · {res.attendees_count} attendees
                  </p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${
                  res.status === "confirmed" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
                }`}>
                  {res.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}