import { Head, router, useForm } from "@inertiajs/react";
import AppLayout from "@/components/AppLayout";
import DatePicker from "@/components/DatePicker";
import { IconChevronLeft } from "@/components/Icons";

interface Slot {
  start_at: string;
  end_at: string;
  available: boolean;
}

interface SpaceData {
  id: number;
  name: string;
  capacity: number;
  floor: string;
}

interface Props {
  space: SpaceData;
  slots: Slot[];
  date: string;
}

export default function ReservationNew({ space, slots, date }: Props) {
  const { data, setData, post, processing, errors } = useForm({
    space_id: space.id,
    title: "",
    start_at: "",
    end_at: "",
    attendees_count: 1,
  });

  const availableSlots = slots.filter((s) => s.available);

  function formatTime(iso: string) {
    return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  function handleSlotSelect(slot: Slot) {
    setData((prev) => ({ ...prev, start_at: slot.start_at, end_at: slot.end_at }));
  }

  function handleSubmit() {
    post("/facilities/spaces/" + space.id + "/reservations", {
      preserveScroll: true,
    });
  }

  function handleDateChange(newDate: string) {
    router.visit(`/facilities/spaces/${space.id}/reservations/new?date=${newDate}`);
  }

  const selectedSlot = slots.find((s) => s.start_at === data.start_at);

  return (
    <AppLayout>
      <Head title={`Reserve ${space.name}`} />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <button
          onClick={() => router.visit(`/facilities/spaces/${space.id}`)}
          className="text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 mb-4 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors -ml-3"
        >
          <IconChevronLeft size={14} />
          Back to {space.name}
        </button>

        <h1 className="text-2xl font-bold text-slate-800 mb-1">Reserve {space.name}</h1>
        <p className="text-slate-500 text-sm mb-6">
          Floor {space.floor} · Capacity: {space.capacity} people
        </p>

        <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6 space-y-6">
          <div>
            <DatePicker
              label="Date"
              value={date}
              onChange={handleDateChange}
              minDate={new Date()}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Meeting Title</label>
            <input
              type="text"
              value={data.title}
              onChange={(e) => setData("title", e.target.value)}
              placeholder="e.g. Q3 Planning Session"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Attendees <span className="text-slate-400">(max {space.capacity})</span>
            </label>
            <input
              type="number"
              value={data.attendees_count}
              min={1}
              max={space.capacity}
              onChange={(e) => setData("attendees_count", parseInt(e.target.value) || 1)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            {errors.attendees_count && <p className="text-red-500 text-xs mt-1">{errors.attendees_count}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Available Slots <span className="text-slate-400">({availableSlots.length} available)</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-64 overflow-y-auto pr-1">
              {slots.map((slot) => {
                const isSelected = data.start_at === slot.start_at;
                return (
                  <button
                    key={slot.start_at}
                    type="button"
                    disabled={!slot.available}
                    onClick={() => slot.available && handleSlotSelect(slot)}
                    className={`px-2 py-2 rounded-lg text-xs font-medium transition-colors border ${
                      !slot.available
                        ? "bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed"
                        : isSelected
                        ? "bg-teal-600 text-white border-teal-600"
                        : "bg-white text-slate-700 border-slate-200 hover:border-teal-400 hover:text-teal-600"
                    }`}
                  >
                    {formatTime(slot.start_at)}
                  </button>
                );
              })}
            </div>
            {errors.start_at && <p className="text-red-500 text-xs mt-1">{errors.start_at}</p>}
          </div>

          {selectedSlot && (
            <div className="bg-teal-50 border border-teal-200 rounded-lg px-4 py-3 text-sm text-teal-700">
              Selected: <strong>{formatTime(selectedSlot.start_at)} – {formatTime(selectedSlot.end_at)}</strong>
            </div>
          )}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={processing || !data.title || !data.start_at}
            className="w-full py-3 bg-teal-600 text-white font-medium rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {processing ? "Confirming…" : "Confirm Reservation"}
          </button>
        </div>
      </div>
    </AppLayout>
  );
}