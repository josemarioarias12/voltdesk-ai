interface StackInfo {
  backend: string
  database: string
  jobs: string
  bridge: string
}

interface Props {
  sprint: string
  status: string
  stack: StackInfo
}

export default function HomeIndex({ sprint, status, stack }: Props) {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="max-w-2xl w-full mx-auto p-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-4 py-1.5 mb-6">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-emerald-400 text-sm font-medium">
              Sprint {sprint} — {status}
            </span>
          </div>
          <h1 className="text-5xl font-bold text-white mb-3 tracking-tight">
            PulseDesk AI
          </h1>
          <p className="text-slate-400 text-lg">
            Enterprise Operational Intelligence Platform
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8">
          {Object.entries(stack).map(([key, value]) => (
            <div key={key} className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <p className="text-slate-500 text-xs font-medium uppercase tracking-widest mb-1">
                {key}
              </p>
              <p className="text-white font-semibold">{value}</p>
            </div>
          ))}
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h2 className="text-slate-300 font-semibold mb-4">Sprint 1 Checklist</h2>
          <div className="space-y-2">
            {[
              "Rails 8 + Inertia.js + React 18 conectados",
              "TypeScript strict — 0 errores",
              "Docker Compose con 4 servicios",
              "GitHub Actions CI configurado",
              "ServiceResult pattern en lib/",
            ].map((item) => (
              <div key={item} className="flex items-center gap-3">
                <span className="text-emerald-400 text-sm">✓</span>
                <span className="text-slate-400 text-sm">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}