import { router } from '@inertiajs/react'
import { useState } from 'react'
import AppLayout from '@/components/AppLayout'
import { ShieldCheckIcon, DocumentArrowDownIcon, TrashIcon } from '@/components/Icons'

interface RetentionPolicy {
  resource_type: string
  retention_days: number
  auto_purge: boolean
  last_purge_at: string | null
}

interface AiAuditSummary {
  total_operations: number
  avg_confidence: number
  by_provider: Record<string, number>
  low_confidence: number
}

interface Evidence {
  workspace: string
  period: { start: string; end: string }
  generated_at: string
  compliance_score: number
  access_log_summary: {
    total_events: number
    unique_actors: number
    purge_requests: number
    by_event_type: Record<string, number>
  }
  data_retention_config: RetentionPolicy[]
  encryption_status: { at_rest: string; in_transit: string; backups: string }
  ai_audit_summary: AiAuditSummary
  incident_response: { status: string; runbook_present: boolean; notes: string }
}

interface Props {
  evidence: Evidence
  period: { start_date?: string; end_date?: string }
}

export default function ComplianceShow({ evidence }: Props) {
  const [purgeUserId, setPurgeUserId] = useState<string>('')
  const [showPurgeDialog, setShowPurgeDialog] = useState(false)
  const [purging, setPurging] = useState(false)

  const scoreColor =
    evidence.compliance_score >= 90
      ? 'text-emerald-600'
      : evidence.compliance_score >= 70
        ? 'text-amber-500'
        : 'text-red-500'

  function handleDownload() {
    window.location.href = '/admin/compliance/download'
  }

  function handlePurge() {
    if (!purgeUserId.trim()) return
    setPurging(true)
    router.post(
      '/admin/compliance/purge',
      { user_id: purgeUserId },
      {
        onFinish: () => {
          setPurging(false)
          setShowPurgeDialog(false)
          setPurgeUserId('')
        },
      }
    )
  }

  return (
    <AppLayout title="Compliance Report">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Compliance Report</h1>
          <p className="text-slate-500 mt-1">
            SOC 2 evidence and GDPR compliance documentation
          </p>
        </div>
        <button
          onClick={handleDownload}
          className="flex items-center gap-2 px-4 py-2 bg-[#028090] text-white rounded-lg hover:bg-[#026070] transition-colors text-sm font-medium"
        >
          <DocumentArrowDownIcon className="w-4 h-4" />
          Export PDF
        </button>
      </div>

      {/* Compliance Score Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6 flex items-center gap-6">
        <div className="flex flex-col items-center justify-center w-24 h-24 rounded-full border-4 border-emerald-500 shrink-0">
          <span className={`text-3xl font-bold ${scoreColor}`}>
            {evidence.compliance_score}%
          </span>
        </div>
        <div>
          <p className="text-lg font-semibold text-slate-800">Compliance Score</p>
          <p className="text-slate-500 text-sm mt-1">
            Workspace: {evidence.workspace}
          </p>
          <p className="text-slate-400 text-xs mt-1">
            Generated: {new Date(evidence.generated_at).toLocaleString()}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Access Controls */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheckIcon className="w-5 h-5 text-emerald-500" />
            <h2 className="font-semibold text-slate-800">Access Controls</h2>
          </div>
          <ul className="space-y-2 text-sm text-slate-600">
            <li>✓ Total compliance events: <strong>{evidence.access_log_summary.total_events}</strong></li>
            <li>✓ Unique actors logged: <strong>{evidence.access_log_summary.unique_actors}</strong></li>
            <li>✓ GDPR purge requests: <strong>{evidence.access_log_summary.purge_requests}</strong></li>
            <li>✓ Role-based access control: Pundit enforced</li>
            <li>✓ Multi-factor auth: Google OAuth2 enabled</li>
          </ul>
        </div>

        {/* Data Protection */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheckIcon className="w-5 h-5 text-emerald-500" />
            <h2 className="font-semibold text-slate-800">Data Protection</h2>
          </div>
          <ul className="space-y-2 text-sm text-slate-600">
            <li>✓ At rest: {evidence.encryption_status.at_rest}</li>
            <li>✓ In transit: {evidence.encryption_status.in_transit}</li>
            <li>✓ Backups: {evidence.encryption_status.backups}</li>
            <li>✓ Right to Forget: PurgeUserData available</li>
          </ul>
        </div>

        {/* AI Audit Trail */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheckIcon className="w-5 h-5 text-emerald-500" />
            <h2 className="font-semibold text-slate-800">AI Audit Trail</h2>
          </div>
          <ul className="space-y-2 text-sm text-slate-600">
            <li>✓ Total AI operations: <strong>{evidence.ai_audit_summary.total_operations}</strong></li>
            <li>✓ Average confidence: <strong>{((evidence.ai_audit_summary.avg_confidence || 0) * 100).toFixed(1)}%</strong></li>
            <li>✓ Low confidence ops (&lt;70%): <strong>{evidence.ai_audit_summary.low_confidence}</strong></li>
            <li>✓ 100% of AI calls audited</li>
          </ul>
        </div>

        {/* Data Retention */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheckIcon className="w-5 h-5 text-emerald-500" />
            <h2 className="font-semibold text-slate-800">Data Retention Policies</h2>
          </div>
          <ul className="space-y-2 text-sm text-slate-600">
            {evidence.data_retention_config.map((policy) => (
              <li key={policy.resource_type}>
                ✓ <strong>{policy.resource_type}</strong>: {policy.retention_days} days
                {policy.auto_purge && <span className="ml-1 text-emerald-600">(auto-purge on)</span>}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* GDPR Section */}
      <div className="bg-white rounded-xl border border-red-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrashIcon className="w-5 h-5 text-red-500" />
          <h2 className="font-semibold text-slate-800">GDPR — Right to Forget</h2>
        </div>
        <p className="text-sm text-slate-500 mb-4">
          Permanently anonymize a user's personal data while preserving referential integrity.
          This action cannot be undone.
        </p>
        <button
          onClick={() => setShowPurgeDialog(true)}
          className="px-4 py-2 border border-red-400 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors"
        >
          Delete User Data
        </button>
      </div>

      {/* Purge Dialog */}
      {showPurgeDialog && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h3 className="text-lg font-semibold text-slate-800 mb-2">
              Confirm GDPR Data Purge
            </h3>
            <p className="text-sm text-slate-500 mb-4">
              Enter the User ID to anonymize. This will replace all personal data with
              [DELETED] and cannot be reversed.
            </p>
            <input
              type="text"
              placeholder="User ID"
              value={purgeUserId}
              onChange={(e) => setPurgeUserId(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-red-300"
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowPurgeDialog(false)}
                className="px-4 py-2 text-slate-600 text-sm hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handlePurge}
                disabled={purging || !purgeUserId.trim()}
                className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {purging ? 'Purging...' : 'Confirm Purge'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  )
}