import { useState } from 'react'
import { Head } from '@inertiajs/react'
import { motion, AnimatePresence } from 'framer-motion'
import AppLayout from '@/components/AppLayout'
import { useActionCable } from '@/hooks/useActionCable'

interface Actor {
  name: string
  role: string
}

interface LogEntry {
  id: number
  actor: Actor | null
  field: string
  model: string
  accessor_role: string
  timestamp: string
}

interface Props {
  entries: LogEntry[]
  total_count: number
  period: string
}

const ROLE_COLORS: Record<string, string> = {
  employee: 'bg-slate-100 text-slate-700',
  agent: 'bg-blue-100 text-blue-700',
  it_manager: 'bg-purple-100 text-purple-700',
  hr_manager: 'bg-pink-100 text-pink-700',
  workspace_admin: 'bg-teal-100 text-teal-700',
  super_admin: 'bg-orange-100 text-orange-700',
}

function RoleBadge({ role }: { role: string }) {
  const color = ROLE_COLORS[role] ?? 'bg-gray-100 text-gray-700'
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${color}`}>
      {role.replace(/_/g, ' ')}
    </span>
  )
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleString()
}

export default function DataAccessLogIndex({ entries: initialEntries, total_count, period }: Props) {
  const [entries, setEntries] = useState<LogEntry[]>(initialEntries)
  const workspaceId = (window as unknown as { workspaceId?: number }).workspaceId ?? 0

  useActionCable(
    { channel: `workspace_admin:${workspaceId ?? 0}` },
    (data: Record<string, unknown>) => {
      if (data.event !== 'data_access_denied') return
      const newEntry: LogEntry = {
        id: Date.now(),
        actor: null,
        field: data.field as string,
        model: '',
        accessor_role: data.accessor_role as string,
        timestamp: data.timestamp as string,
      }
      setEntries((prev) => [newEntry, ...prev])
    }
  )

  return (
    <AppLayout>
      <Head title="Data Access Log" />
      <div className="p-6 max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800">Data Access Log</h1>
          <p className="text-slate-500 mt-1">
            Denied field access attempts in the last {period} — {total_count} total
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Actor</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Role</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Field Attempted</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Model</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Timestamp</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence initial={false}>
                {entries.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-16 text-slate-400">
                      No denied access attempts in the last {period}.
                    </td>
                  </tr>
                ) : (
                  entries.map((entry) => (
                    <motion.tr
                      key={entry.id}
                      initial={{ opacity: 0, y: -12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="border-b border-slate-100 hover:bg-slate-50"
                    >
                      <td className="px-4 py-3 font-medium text-slate-800">
                        {entry.actor?.name ?? '—'}
                      </td>
                      <td className="px-4 py-3">
                        <RoleBadge role={entry.accessor_role} />
                      </td>
                      <td className="px-4 py-3 font-mono text-rose-600 text-xs">{entry.field}</td>
                      <td className="px-4 py-3 text-slate-600">{entry.model || '—'}</td>
                      <td className="px-4 py-3 text-slate-500">{formatTime(entry.timestamp)}</td>
                    </motion.tr>
                  ))
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  )
}