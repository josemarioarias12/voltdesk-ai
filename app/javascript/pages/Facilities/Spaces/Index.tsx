import { Head, router, usePage } from "@inertiajs/react";
import { lazy, Suspense, useState } from "react";
import { useTranslation } from "react-i18next";
import AppLayout from "@/components/AppLayout";
import { FloorMap } from "@/components/FloorMap";
import { IconBuilding } from "@/components/Icons";
import { slugify } from "@/utils/slugify";

const OfficeScene3D = lazy(() => import("@/components/OfficeScene3D"));

interface SpaceData {
  id: number;
  name: string;
  floor: string;
  capacity: number;
  status: string;
  space_type: string;
  reservations_today: number;
  reserved_soon?: boolean;
  utilization_today?: { reserved_slots: number; percentage: number };
}

interface AvailabilitySlot {
  start_at: string;
  end_at: string;
  available: boolean;
}

interface PresenceData {
  space_id: number;
  user_id: number;
  user_name: string;
  end_at: string;
}

interface MyReservation {
  id: number;
  start_at: string;
  end_at: string;
}

interface Props {
  spaces: SpaceData[];
  panel_slots?: AvailabilitySlot[] | null;
  active_presences?: PresenceData[];
  my_panel_reservation?: MyReservation | null;
}

function statusBadgeStyle(status: string): React.CSSProperties {
  const map: Record<string, React.CSSProperties> = {
    available: { background: "rgba(2,195,154,0.12)", color: "#02967A" },
    maintenance: { background: "rgba(245,158,11,0.12)", color: "#b45309" },
    inactive: { background: "#f1f5f9", color: "#64748b" },
  };
  return map[status] ?? map.inactive;
}

function slotTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export default function SpacesIndex({ spaces, panel_slots, active_presences, my_panel_reservation }: Props) {
  const { t } = useTranslation(["facilities", "common"]);
  const [view, setView] = useState<"list" | "map" | "3d">("map");
  const [panelSpaceId, setPanelSpaceId] = useState<number | null>(null);
  const [rescheduling, setRescheduling] = useState(false);
  const { workspace } = usePage().props as unknown as { workspace: { id: number } | null };
  const workspaceId = workspace?.id ?? 0;

  const panelSpace = panelSpaceId ? spaces.find((sp) => sp.id === panelSpaceId) ?? null : null;

  function handleSpaceClick(space: SpaceData) {
    router.visit(`/facilities/spaces/${space.id}`);
  }

  function refreshPanel(spaceId: number) {
    router.reload({
      only: ["panel_slots", "my_panel_reservation"],
      data: { panel_space_id: spaceId },
    });
  }

  function openPanel(spaceId: number) {
    setPanelSpaceId(spaceId);
    setRescheduling(false);
    refreshPanel(spaceId);
  }

  function closePanel() {
    setPanelSpaceId(null);
    setRescheduling(false);
  }

  function handleCancelReservation() {
    if (!my_panel_reservation || !panelSpaceId) return;
    router.patch(
      `/facilities/reservations/${my_panel_reservation.id}/cancel`,
      {},
      { preserveScroll: true, onSuccess: () => refreshPanel(panelSpaceId) }
    );
  }

  function handleRescheduleTo(slot: AvailabilitySlot) {
    if (!my_panel_reservation || !panelSpaceId) return;
    router.patch(
      `/facilities/reservations/${my_panel_reservation.id}/reschedule`,
      { start_at: slot.start_at, end_at: slot.end_at },
      {
        preserveScroll: true,
        onSuccess: () => {
          setRescheduling(false);
          refreshPanel(panelSpaceId);
        },
      }
    );
  }

  return (
    <AppLayout>
      <Head title={t("index.pageTitle")} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">{t("index.heading")}</h1>
            <p className="text-slate-500 text-sm mt-1">{t("index.subtitle", { count: spaces.length })}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex rounded-lg border border-slate-200 overflow-hidden">
              <button
                onClick={() => setView("map")}
                className={`px-4 py-2 text-sm font-medium transition-colors ${view === "map" ? "bg-teal-600 text-white" : "bg-white text-slate-600 hover:bg-slate-50"}`}
              >
                {t("index.toggle.floorMap")}
              </button>
              <button
                onClick={() => setView("list")}
                className={`px-4 py-2 text-sm font-medium transition-colors ${view === "list" ? "bg-teal-600 text-white" : "bg-white text-slate-600 hover:bg-slate-50"}`}
              >
                {t("index.toggle.list")}
              </button>
              <button
                onClick={() => setView("3d")}
                className={`px-4 py-2 text-sm font-medium transition-colors ${view === "3d" ? "bg-teal-600 text-white" : "bg-white text-slate-600 hover:bg-slate-50"}`}
              >
                {t("index.toggle.threeD")}
              </button>
            </div>
            <button
              onClick={() => router.visit("/facilities/spaces/utilization")}
              className="px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors"
            >
              {t("index.aiOptimizer")}
            </button>
          </div>
        </div>

        {view === "map" && (
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">
              {t("index.floorMapSection.heading")}
            </h2>
            <FloorMap spaces={spaces} workspaceId={workspaceId} onSpaceClick={handleSpaceClick} />
          </div>
        )}

        {view === "3d" && (
          <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">
              {t("index.threeDSection.heading")}
            </h2>
            <div className="relative">
              <Suspense
                fallback={
                  <div className="flex items-center justify-center h-[420px] sm:h-[600px] text-slate-400 gap-2">
                    <IconBuilding size={20} />
                    {t("index.threeDSection.loading")}
                  </div>
                }
              >
                <OfficeScene3D
                  spaces={spaces}
                  workspaceId={workspaceId}
                  initialPresences={active_presences ?? []}
                  onSpaceClick={openPanel}
                />
              </Suspense>

              {panelSpace && (
                <div className="absolute top-12 right-0 w-full max-w-72 sm:w-72 max-h-[560px] flex flex-col bg-white rounded-xl border border-slate-200 shadow-lg overflow-hidden">
                  <div className="flex items-start justify-between p-4 border-b border-slate-100">
                    <div>
                      <h3 className="font-semibold text-slate-800">{panelSpace.name}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {t("index.panel.capacityLine", { floor: panelSpace.floor, count: panelSpace.capacity })}
                      </p>
                    </div>
                    <button
                      onClick={closePanel}
                      aria-label={t("index.panel.closeLabel")}
                      className="text-slate-400 hover:text-slate-600 text-lg leading-none px-1"
                    >
                      ×
                    </button>
                  </div>

                  {my_panel_reservation && (
                    <div className="px-4 py-3 bg-teal-50 border-b border-teal-100">
                      <p className="text-xs font-semibold text-teal-700 uppercase tracking-wide">
                        {t("index.panel.yourReservation")}
                      </p>
                      <p className="text-sm text-teal-800 mt-0.5">
                        {slotTime(my_panel_reservation.start_at)} – {slotTime(my_panel_reservation.end_at)}
                      </p>
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => setRescheduling((r) => !r)}
                          className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${rescheduling ? "bg-teal-600 text-white border-teal-600" : "bg-white text-teal-700 border-teal-300 hover:bg-teal-50"}`}
                        >
                          {rescheduling ? t("index.panel.pickNewSlot") : t("index.panel.changeTime")}
                        </button>
                        <button
                          onClick={handleCancelReservation}
                          className="px-3 py-1.5 text-xs font-medium rounded-lg border border-red-200 text-red-600 bg-white hover:bg-red-50 transition-colors"
                        >
                          {t("index.panel.cancel")}
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="px-4 pt-3 pb-1 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    {t("index.panel.todaysAvailability")}
                  </div>

                  <div className="flex-1 overflow-y-auto px-4 pb-2">
                    {panel_slots == null && (
                      <p className="text-sm text-slate-400 py-4">{t("index.panel.loadingAvailability")}</p>
                    )}
                    {panel_slots != null && panel_slots.length === 0 && (
                      <p className="text-sm text-slate-400 py-4">{t("index.panel.noSlots")}</p>
                    )}
                    {panel_slots != null &&
                      panel_slots.map((slot) => (
                        <div
                          key={slot.start_at}
                          className="flex items-center justify-between py-1.5 border-b border-slate-50 last:border-0"
                        >
                          <span className="text-sm text-slate-600">
                            {slotTime(slot.start_at)} – {slotTime(slot.end_at)}
                          </span>
                          {rescheduling && slot.available ? (
                            <button
                              onClick={() => handleRescheduleTo(slot)}
                              className="px-2 py-0.5 rounded-full text-xs font-medium bg-teal-600 text-white hover:bg-teal-700 transition-colors"
                            >
                              {t("index.panel.moveHere")}
                            </button>
                          ) : (
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-medium ${slot.available ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-400"}`}
                            >
                              {slot.available ? t("index.panel.available") : t("index.panel.reserved")}
                            </span>
                          )}
                        </div>
                      ))}
                  </div>

                  <div className="p-4 border-t border-slate-100">
                    <button
                      onClick={() => router.visit(`/facilities/spaces/${panelSpace.id}/reservations/new`)}
                      className="w-full px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors"
                    >
                      {t("index.panel.reserveThisSpace")}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {view === "list" && (
          <div>
            {spaces.length === 0 && (
              <div className="bg-white rounded-xl border border-slate-200 px-4 py-12 text-center text-slate-400">
                {t("index.list.empty")}
              </div>
            )}
            {[...new Set(spaces.map((sp) => sp.floor))].sort().map((floor) => (
              <div key={floor} className="mb-6 last:mb-0">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 px-1">
                  {t("index.list.floorLabel", { floor })}
                </h3>
                <div className="space-y-2">
                  {spaces.filter((sp) => sp.floor === floor).map((space) => (
                    <div
                      key={space.id}
                      onClick={() => handleSpaceClick(space)}
                      className="flex items-center gap-4 p-3 bg-white rounded-xl cursor-pointer transition-shadow hover:shadow-md"
                      style={{ border: "1px solid rgba(15,23,42,0.08)", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}
                    >
                      <div
                        className="flex-shrink-0 rounded-lg overflow-hidden flex items-center justify-center"
                        style={{ width: 72, height: 72, background: "#eef2f7" }}
                      >
                        <img
                          src={`/images/spaces/${slugify(space.name)}.png`}
                          alt={space.name}
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate" style={{ color: "#0D1B2A" }}>{space.name}</p>
                        <p className="text-xs text-slate-500 capitalize mt-0.5">
                          {t(`spaceType.${space.space_type}`)} · {t("index.list.capacityLabel", { count: space.capacity })}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                        <span
                          className="px-2 py-1 rounded-full text-xs font-medium capitalize"
                          style={statusBadgeStyle(space.status)}
                        >
                          {t(`spaceStatus.${space.status}`)}
                        </span>
                        <span className="text-xs text-slate-400">{t("index.list.reservationsToday", { count: space.reservations_today })}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
