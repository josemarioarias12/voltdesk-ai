import { router } from "@inertiajs/react";
import { useState } from "react";
import AppLayout from "@/components/AppLayout";

interface Condition {
  field: string;
  operator: string;
  value: string;
  [key: string]: string;
}

interface Action {
  type: string;
  body?: string;
  priority?: string;
  agent_id?: string;
  [key: string]: string | undefined;
}

interface WorkflowRule {
  id: number;
  name: string;
  trigger_event: string;
  conditions: Condition[];
  actions: Action[];
  active: boolean;
  execution_count: number;
  created_at: string;
}

interface Props {
  workflow_rules: WorkflowRule[];
}

const TRIGGER_EVENTS = [
  { value: "ticket_created",    label: "Ticket Created" },
  { value: "ticket_updated",    label: "Ticket Updated" },
  { value: "ticket_resolved",   label: "Ticket Resolved" },
  { value: "sla_breach",        label: "SLA Breach" },
  { value: "assignment_change", label: "Assignment Changed" },
];

const CONDITION_FIELDS = [
  { value: "status",        label: "Status" },
  { value: "priority",      label: "Priority" },
  { value: "category",      label: "Category" },
  { value: "urgency_score", label: "Urgency Score" },
  { value: "minutes_open",  label: "Minutes Open" },
  { value: "assigned_to",   label: "Assigned To" },
];

const OPERATORS = [
  { value: "eq",      label: "equals" },
  { value: "neq",     label: "not equals" },
  { value: "gt",      label: "greater than" },
  { value: "lt",      label: "less than" },
  { value: "gte",     label: "≥" },
  { value: "lte",     label: "≤" },
  { value: "contains", label: "contains" },
  { value: "blank",   label: "is blank" },
  { value: "present", label: "is present" },
];

const ACTION_TYPES = [
  { value: "reassign_agent",    label: "Reassign Agent" },
  { value: "escalate_priority", label: "Escalate Priority" },
  { value: "notify_user",       label: "Notify User" },
  { value: "notify_manager",    label: "Notify Manager" },
  { value: "create_agent_action", label: "Create Agent Action" },
  { value: "post_comment",      label: "Post Comment" },
];

const EMPTY_RULE = {
  name: "",
  trigger_event: "ticket_created",
  conditions: [{ field: "urgency_score", operator: "gte", value: "80" }] as Condition[],
  actions: [{ type: "escalate_priority", priority: "high" }] as Action[],
};

export default function WorkflowRulesIndex({ workflow_rules }: Props) {
  const [showBuilder, setShowBuilder] = useState(false);
  const [form, setForm] = useState(EMPTY_RULE);

  const addCondition = () =>
    setForm((prev) => ({
      ...prev,
      conditions: [...prev.conditions, { field: "status", operator: "eq", value: "" }],
    }));

  const removeCondition = (idx: number) =>
    setForm((prev) => ({
      ...prev,
      conditions: prev.conditions.filter((_, i) => i !== idx),
    }));

  const updateCondition = (idx: number, key: keyof Condition, val: string) =>
    setForm((prev) => ({
      ...prev,
      conditions: prev.conditions.map((cond, i) =>
        i === idx ? { ...cond, [key]: val } : cond
      ),
    }));

  const addAction = () =>
    setForm((prev) => ({
      ...prev,
      actions: [...prev.actions, { type: "notify_user", body: "" }],
    }));

  const removeAction = (idx: number) =>
    setForm((prev) => ({
      ...prev,
      actions: prev.actions.filter((_, i) => i !== idx),
    }));

  const updateAction = (idx: number, key: keyof Action, val: string) =>
    setForm((prev) => ({
      ...prev,
      actions: prev.actions.map((act, i) =>
        i === idx ? { ...act, [key]: val } : act
      ),
    }));

  const handleSubmit = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    router.post("/workflow_rules", { workflow_rule: form as any }, {
      onSuccess: () => {
        setShowBuilder(false);
        setForm(EMPTY_RULE);
      },
    });
  };

  const handleToggle = (rule: WorkflowRule) => {
    router.patch(`/workflow_rules/${rule.id}`, {
      workflow_rule: { active: !rule.active },
    });
  };

  const handleDelete = (id: number) => {
    if (!confirm("Delete this workflow rule?")) return;
    router.delete(`/workflow_rules/${id}`);
  };

  return (
    <AppLayout title="Workflow Rules">
      <div className="p-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Workflow Rules</h1>
            <p className="text-slate-500 mt-1">
              Automate actions based on ticket events — no code required.
            </p>
          </div>
          <button
            onClick={() => setShowBuilder(!showBuilder)}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            {showBuilder ? "Cancel" : "+ New Rule"}
          </button>
        </div>

        {/* Rule Builder */}
        {showBuilder && (
          <div className="bg-white border border-teal-200 rounded-xl p-6 mb-6 space-y-5">
            <h2 className="text-lg font-semibold text-slate-800">New Workflow Rule</h2>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Rule Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="e.g. Escalate urgent unassigned tickets"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Trigger Event</label>
              <select
                value={form.trigger_event}
                onChange={(e) => setForm((p) => ({ ...p, trigger_event: e.target.value }))}
                className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                {TRIGGER_EVENTS.map((evt) => (
                  <option key={evt.value} value={evt.value}>{evt.label}</option>
                ))}
              </select>
            </div>

            {/* Conditions */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-slate-700">Conditions (ALL must match)</label>
                <button onClick={addCondition} className="text-xs text-teal-600 hover:underline">+ Add condition</button>
              </div>
              <div className="space-y-2">
                {form.conditions.map((cond, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <select
                      value={cond.field}
                      onChange={(e) => updateCondition(idx, "field", e.target.value)}
                      className="border border-slate-200 rounded-lg px-2 py-1.5 text-sm"
                    >
                      {CONDITION_FIELDS.map((f) => (
                        <option key={f.value} value={f.value}>{f.label}</option>
                      ))}
                    </select>
                    <select
                      value={cond.operator}
                      onChange={(e) => updateCondition(idx, "operator", e.target.value)}
                      className="border border-slate-200 rounded-lg px-2 py-1.5 text-sm"
                    >
                      {OPERATORS.map((op) => (
                        <option key={op.value} value={op.value}>{op.label}</option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={cond.value}
                      onChange={(e) => updateCondition(idx, "value", e.target.value)}
                      placeholder="value"
                      className="border border-slate-200 rounded-lg px-2 py-1.5 text-sm w-28"
                    />
                    <button
                      onClick={() => removeCondition(idx)}
                      className="text-red-400 hover:text-red-600 text-xs"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-slate-700">Actions</label>
                <button onClick={addAction} className="text-xs text-teal-600 hover:underline">+ Add action</button>
              </div>
              <div className="space-y-2">
                {form.actions.map((act, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <select
                      value={act.type}
                      onChange={(e) => updateAction(idx, "type", e.target.value)}
                      className="border border-slate-200 rounded-lg px-2 py-1.5 text-sm"
                    >
                      {ACTION_TYPES.map((atype) => (
                        <option key={atype.value} value={atype.value}>{atype.label}</option>
                      ))}
                    </select>
                    {(act.type === "notify_user" || act.type === "notify_manager" || act.type === "post_comment") && (
                      <input
                        type="text"
                        value={act.body ?? ""}
                        onChange={(e) => updateAction(idx, "body", e.target.value)}
                        placeholder="Message body"
                        className="border border-slate-200 rounded-lg px-2 py-1.5 text-sm flex-1"
                      />
                    )}
                    {act.type === "escalate_priority" && (
                      <select
                        value={act.priority ?? "high"}
                        onChange={(e) => updateAction(idx, "priority", e.target.value)}
                        className="border border-slate-200 rounded-lg px-2 py-1.5 text-sm"
                      >
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="critical">Critical</option>
                      </select>
                    )}
                    <button
                      onClick={() => removeAction(idx)}
                      className="text-red-400 hover:text-red-600 text-xs"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={!form.name}
              className="px-5 py-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              Create Rule
            </button>
          </div>
        )}

        {/* Rules List */}
        {workflow_rules.length === 0 && !showBuilder ? (
          <div className="bg-white rounded-xl border border-slate-200 p-16 text-center">
            <div className="text-4xl mb-3">⚡</div>
            <p className="text-slate-500 font-medium">No workflow rules yet</p>
            <p className="text-slate-400 text-sm mt-1">Create your first rule to automate ticket operations.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {workflow_rules.map((rule) => (
              <div
                key={rule.id}
                className="bg-white rounded-xl border border-slate-200 p-5 flex items-center justify-between gap-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`w-2 h-2 rounded-full ${rule.active ? "bg-emerald-500" : "bg-slate-300"}`} />
                    <p className="font-semibold text-slate-800">{rule.name}</p>
                    <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                      {TRIGGER_EVENTS.find((e) => e.value === rule.trigger_event)?.label ?? rule.trigger_event}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    {rule.conditions.length} condition{rule.conditions.length !== 1 ? "s" : ""} ·{" "}
                    {rule.actions.length} action{rule.actions.length !== 1 ? "s" : ""} ·{" "}
                    Executed {rule.execution_count} time{rule.execution_count !== 1 ? "s" : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleToggle(rule)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                      rule.active
                        ? "border-slate-200 text-slate-600 hover:bg-slate-50"
                        : "border-teal-200 text-teal-600 hover:bg-teal-50"
                    }`}
                  >
                    {rule.active ? "Disable" : "Enable"}
                  </button>
                  <button
                    onClick={() => handleDelete(rule.id)}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-colors"
                  >
                    Delete
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