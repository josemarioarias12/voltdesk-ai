import { router } from "@inertiajs/react";
import { useState } from "react";
import AppLayout from "@/components/AppLayout";

interface AgentAction {
  id: number;
  ticket_id: number;
  ticket_title: string;
  action_type: string;
  status: string;
  confidence: number;
  created_at: string;
}

interface Props {
  agent_actions: AgentAction[];
}

const CONFIDENCE_COLOR = (score: number) => {
  if (score >= 0.9) return "text-emerald-600 bg-emerald-50";
  if (score >= 0.75) return "text-amber-600 bg-amber-50";
  return "text-red-600 bg-red-50";
};

const ACTION_LABEL: Record<string, string> = {
  auto_resolve:      "Auto Resolve",
  post_comment:      "Post Comment",
  reassign_agent:    "Reassign Agent",
  escalate_priority: "Escalate Priority",
  notify_user:       "Notify User",
};

export default function AgentActionsIndex({ agent_actions }: Props) {
  const [processing, setProcessing] = useState<number | null>(null);

  const handleApprove = (id: number) => {
    setProcessing(id);
    router.patch(`/agent_actions/${id}/approve`, {}, {
      onFinish: () => setProcessing(null),
    });
  };

  const handleReject = (id: number) => {
    setProcessing(id);
    router.patch(`/agent_actions/${id}/reject`, {}, {
      onFinish: () => setProcessing(null),
    });
  };

  return (
    <AppLayout title="AI Agent — Pending Approvals">
      <div className="p-6 max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800">AI Agent Actions</h1>
          <p className="text-slate-500 mt-1">
            Review and approve autonomous actions before execution.
          </p>
        </div>

        {agent_actions.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-16 text-center">
            <div className="text-4xl mb-3">🤖</div>
            <p className="text-slate-500 font-medium">No pending actions</p>
            <p className="text-slate-400 text-sm mt-1">
              The AI agent has no actions awaiting approval.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {agent_actions.map((action) => (
              <div
                key={action.id}
                className="bg-white rounded-xl border border-slate-200 p-5 flex items-center justify-between gap-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold uppercase tracking-wide text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full">
                      {ACTION_LABEL[action.action_type] ?? action.action_type}
                    </span>
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${CONFIDENCE_COLOR(action.confidence)}`}
                    >
                      {(action.confidence * 100).toFixed(1)}% confidence
                    </span>
                  </div>
                  <p className="text-slate-800 font-medium truncate">
                    {action.ticket_title}
                  </p>
                  <p className="text-slate-400 text-xs mt-0.5">
                    Ticket #{action.ticket_id} · {new Date(action.created_at).toLocaleString()}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleApprove(action.id)}
                    disabled={processing === action.id}
                    className="px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors"
                  >
                    {processing === action.id ? "Processing…" : "Approve"}
                  </button>
                  <button
                    onClick={() => handleReject(action.id)}
                    disabled={processing === action.id}
                    className="px-4 py-2 bg-white hover:bg-red-50 disabled:opacity-50 text-red-600 border border-red-200 text-sm font-semibold rounded-lg transition-colors"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}