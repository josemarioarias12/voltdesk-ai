import { SharedProps } from '@/types'
import { usePage } from '@inertiajs/react'

export default function DashboardIndex() {
  const { auth, workspace } = usePage<SharedProps>().props

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-slate-900">
          Welcome, {auth.user?.first_name}
        </h1>
        <p className="text-slate-500 mt-1">
          {workspace?.name} · {auth.user?.role}
        </p>
        <p className="mt-8 text-slate-400 text-sm">
          Sprint 2 complete. Core modules coming in S3–S8.
        </p>
      </div>
    </div>
  )
}