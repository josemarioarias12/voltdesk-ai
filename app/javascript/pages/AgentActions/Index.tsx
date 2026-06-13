import { router, usePage } from "@inertiajs/react";
import { useState, useCallback } from "react";
import AppLayout from "@/components/AppLayout";
import { useActionCable } from "@/hooks/useActionCable";
import type { SharedProps } from "@/types";

interface SimilarTicket {
  id: number;
  title: string;
  similarity: number;
}

interface AgentAction {
  id: number;
  ticket_id: number;
  ticket_title: string;
  action_type: string;
  status: string;
  confidence: number;
  created_at: string;
  similar_tickets: SimilarTicket[];
  top_similarity: number;
  ai_reasoning: string;
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

function SimilarityBar({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  const color = pct >= 90 ? "bg-emerald-500" : pct >= 75 ? "bg-amber-500" : "bg-red-400";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-mono text-slate-500 w-10 text-right">{pct}%</span>
    </div>
  );
}

function AiReasoningPanel({ action }: { action: AgentAction }) {
  const [open, setOpen] = useState(false);
  const hasSimilar = action.similar_tickets.length > 0;
  const hasReasoning = action.ai_reasoning.trim().length > 0;

  if (!hasSimilar && !hasReasoning) return null;

  return (
    <div className="mt-3 border-t border-slate-100 pt-3">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 text-xs font-semibold text-teal-600 hover:text-teal-700 transition-colors"
      >
        <svg
          className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-90" : ""}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
        AI Reasoning
        <span className="ml-1 px-1.5 py-0.5 bg-teal-50 text-teal-600 rounded text-xs font-mono">
          {(action.top_similarity * 100).toFixed(1)}% RAG similarity
        </span>
      </button>

      {open && (
        <div className="mt-3 space-y-4">
          {hasSimilar && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                Similar Resolved Tickets
              </p>
              <div className="space-y-2">
                {action.similar_tickets.map((ticket) => (
                  <div key={ticket.id} className="bg-slate-50 rounded-lg px-3 py-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-slate-700 truncate flex-1">
                        #{ticket.id} — {ticket.title}
                      </span>
                    </div>
                    <SimilarityBar score={ticket.similarity} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {hasReasoning && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                AI Generated Response
              </p>
              <div className="bg-slate-50 rounded-lg px-3 py-2.5 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                {action.ai_reasoning}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function AgentActionsIndex({ agent_actions }: Props) {
  const { workspace } = usePage<SharedProps>().props;
  const [processing, setProcessing] = useState<number | null>(null);
  const [liveActions, setLiveActions] = useState<AgentAction[]>(agent_actions);

  // Real-time: new pending_approval actions appear without page reload.
  // We optimistically prepend a minimal card and let Inertia reload for full data.
  const handleCableMessage = useCallback((data: Record<string, unknown>) => {
    if (data.event !== "pending_approval") return;
    // Trigger a silent Inertia reload to get the full serialized action from server.
    // Trade-off: one extra request vs duplicating serialization logic in the client.
    router.reload({ only: ["agent_actions"], onSuccess: (page) => {
      const fresh = (page.props as unknown as Props).agent_actions;
      setLiveActions(fresh);
    }});
  }, []);

  useActionCable(
    { channel: "OperationalTwinChannel", workspace_id: workspace?.id },
    handleCableMessage
  );

  const handleApprove = (id: number) => {
    setProcessing(id);
    router.patch(`/agent_actions/${id}/approve`, {}, {
      onFinish: () => setProcessing(null),
      onSuccess: () => setLiveActions((prev) => prev.filter((a) => a.id !== id)),
    });
  };

  const handleReject = (id: number) => {
    setProcessing(id);
    router.patch(`/agent_actions/${id}/reject`, {}, {
      onFinish: () => setProcessing(null),
      onSuccess: () => setLiveActions((prev) => prev.filter((a) => a.id !== id)),
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

        {liveActions.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-16 text-center">
            <div className="text-4xl mb-3">🤖</div>
            <p className="text-slate-500 font-medium">No pending actions</p>
            <p className="text-slate-400 text-sm mt-1">
              The AI agent has no actions awaiting approval.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {liveActions.map((action) => (
              <div
                key={action.id}
                className="bg-white rounded-xl border border-slate-200 p-5"
              >
                <div className="flex items-center justify-between gap-4">
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

                <AiReasoningPanel action={action} />
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}