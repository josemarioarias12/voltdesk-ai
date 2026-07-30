import { useState } from 'react'
import { router } from '@inertiajs/react'
import AppLayout from '@/components/AppLayout'

interface UserRow {
  id: number
  full_name: string
  email: string
  role: string
  department: string | null
  active: boolean
}

interface Department {
  id: number
  name: string
}

interface Props {
  users: UserRow[]
  departments: Department[]
  assignable_roles: string[]
  new_user_password?: string
}

const TEAL   = '#028090'
const SLATE  = '#1E293B'
const GRAY   = '#475569'
const LIGHT  = '#F8FAFC'
const BORDER = '#E2E8F0'

function roleLabel(role: string) {
  return role.split('_').map(w => w[0].toUpperCase() + w.slice(1)).join(' ')
}

export default function UsersIndex({ users, departments, assignable_roles, new_user_password }: Props) {
  const [showModal, setShowModal] = useState(false)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName]   = useState('')
  const [email, setEmail]         = useState('')
  const [role, setRole]           = useState(assignable_roles[0] ?? '')
  const [departmentId, setDepartmentId] = useState<number | ''>('')
  const [creating, setCreating]   = useState(false)
  const [copied, setCopied]       = useState(false)
  const [passwordVisible, setPasswordVisible] = useState(!!new_user_password)

  function handleCreate() {
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !role) return
    setCreating(true)
    router.post('/admin/users', {
      user: { first_name: firstName, last_name: lastName, email, role, department_id: departmentId || null },
    }, {
      onFinish: () => {
        setCreating(false)
        setShowModal(false)
        setFirstName('')
        setLastName('')
        setEmail('')
        setRole(assignable_roles[0] ?? '')
        setDepartmentId('')
      },
    })
  }

  function handleCopy(text: string) {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <AppLayout title="Users">
      <div className="max-w-4xl space-y-6">

        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: SLATE }}>Users</h1>
            <p className="text-sm mt-1" style={{ color: GRAY }}>Create and manage workspace accounts</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-white"
            style={{ background: TEAL }}
          >
            + Create User
          </button>
        </div>

        {/* New password banner — shown only once */}
        {passwordVisible && new_user_password && (
          <div className="rounded-2xl border-2 p-5 space-y-3" style={{ borderColor: TEAL, background: '#F0FDFA' }}>
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold" style={{ color: TEAL }}>
                User created — copy this temporary password now, it won&apos;t be shown again
              </p>
              <button onClick={() => setPasswordVisible(false)} className="text-xs" style={{ color: GRAY }}>Dismiss</button>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: '#fff', border: `1px solid ${TEAL}` }}>
              <code className="flex-1 text-sm font-mono break-all" style={{ color: SLATE }}>{new_user_password}</code>
              <button
                onClick={() => handleCopy(new_user_password)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white flex-shrink-0"
                style={{ background: copied ? '#16A34A' : TEAL }}
              >
                {copied ? '✓ Copied' : 'Copy'}
              </button>
            </div>
            <p className="text-xs" style={{ color: '#DC2626' }}>
              ⚠ Share this password with the employee outside the system. You will not be able to see it again.
            </p>
          </div>
        )}

        <div className="rounded-2xl border overflow-x-auto" style={{ background: '#fff', borderColor: BORDER, boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
          <table className="w-full text-sm" style={{ minWidth: '640px' }}>
            <thead>
              <tr style={{ background: LIGHT, borderBottom: `1px solid ${BORDER}` }}>
                {['Name', 'Email', 'Role', 'Department', 'Status'].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-semibold" style={{ color: GRAY }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-sm" style={{ color: GRAY }}>
                    No users yet.
                  </td>
                </tr>
              ) : users.map((u, i) => (
                <tr key={u.id} style={{ borderBottom: `1px solid ${BORDER}`, opacity: u.active ? 1 : 0.5, background: i % 2 === 0 ? '#fff' : LIGHT }}>
                  <td className="px-4 py-3 font-medium" style={{ color: SLATE }}>{u.full_name}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: GRAY }}>{u.email}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: '#F0FDFA', color: TEAL }}>
                      {roleLabel(u.role)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: GRAY }}>{u.department ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1.5 text-xs font-medium">
                      <span className="w-2 h-2 rounded-full" style={{ background: u.active ? '#16A34A' : '#94A3B8' }} />
                      {u.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: 'rgba(0,0,0,0.4)' }}>
            <div className="rounded-2xl p-6 w-full max-w-md space-y-4" style={{ background: '#fff', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold" style={{ color: SLATE }}>Create User</h2>
                <button onClick={() => setShowModal(false)} className="text-lg" style={{ color: GRAY }}>✕</button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-sm font-medium" style={{ color: SLATE }}>First name</label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={e => setFirstName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border text-sm"
                    style={{ borderColor: BORDER, color: SLATE }}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium" style={{ color: SLATE }}>Last name</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={e => setLastName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border text-sm"
                    style={{ borderColor: BORDER, color: SLATE }}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium" style={{ color: SLATE }}>Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border text-sm"
                  style={{ borderColor: BORDER, color: SLATE }}
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium" style={{ color: SLATE }}>Role</label>
                <select
                  value={role}
                  onChange={e => setRole(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border text-sm"
                  style={{ borderColor: BORDER, color: SLATE }}
                >
                  {assignable_roles.map(r => (
                    <option key={r} value={r}>{roleLabel(r)}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium" style={{ color: SLATE }}>Department</label>
                <select
                  value={departmentId}
                  onChange={e => setDepartmentId(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-3 py-2 rounded-xl border text-sm"
                  style={{ borderColor: BORDER, color: SLATE }}
                >
                  <option value="">No department</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleCreate}
                disabled={creating || !firstName.trim() || !lastName.trim() || !email.trim() || !role}
                className="w-full py-2.5 rounded-xl text-sm font-semibold text-white"
                style={{ background: creating ? '#94A3B8' : TEAL }}
              >
                {creating ? 'Creating...' : 'Create User'}
              </button>
            </div>
          </div>
        )}

      </div>
    </AppLayout>
  )
}