import { SharedProps } from '@/types'
import { useForm } from 'react-hook-form'
import { usePage, router } from '@inertiajs/react'
import { useState } from 'react'
import {
  IconBrandGoogle,
  IconShieldCheck,
  IconBuilding,
  IconRobot,
  IconEye,
  IconEyeOff,
  IconLock,
  IconBolt,
} from '@/components/Icons'

interface LoginForm {
  email: string
  password: string
  [key: string]: string
}

function PasswordStrength({ password }: { password: string }) {
  const getStrength = (p: string) => {
    let score = 0
    if (p.length >= 8) score++
    if (/[A-Z]/.test(p)) score++
    if (/[0-9]/.test(p)) score++
    if (/[^A-Za-z0-9]/.test(p)) score++
    return score
  }

  const strength = getStrength(password)
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong']
  const colors = ['', '#EF4444', '#F97316', '#EAB308', '#028090']

  if (!password) return null

  return (
    <div className="mt-2">
      <div className="flex gap-1 mb-1">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-1 flex-1 rounded-full transition-all duration-300"
            style={{ background: i <= strength ? colors[strength] : '#E2E8F0' }}
          />
        ))}
      </div>
      <p className="text-xs" style={{ color: colors[strength] }}>
        {labels[strength]}
      </p>
    </div>
  )
}

export default function AuthLogin() {
  const { flash } = usePage<SharedProps>().props
  const [showPassword, setShowPassword] = useState(false)
  const [password, setPassword] = useState('')
  const { register, handleSubmit } = useForm<LoginForm>()

 const getCsrfToken = () =>
    document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? ''

  const handleGoogleLogin = () => {
    const form = document.createElement('form')
    form.method = 'POST'
    form.action = '/users/auth/google_oauth2'
    const input = document.createElement('input')
    input.type = 'hidden'
    input.name = 'authenticity_token'
    input.value = getCsrfToken()
    form.appendChild(input)
    document.body.appendChild(form)
    form.submit()
  }

  const onSubmit = (data: LoginForm) => {
    router.post('/users/login', {
      user: { email: data.email, password: data.password }
    })
  }

  const passwordRegister = register('password')

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-8"
      style={{ background: '#0F172A' }}
    >
      <div
        className="w-full max-w-md bg-white rounded-2xl overflow-hidden"
        style={{ boxShadow: '0 24px 48px rgba(0,0,0,0.4)' }}
      >
        {/* Header */}
        <div className="px-8 pt-8 pb-6 text-center">
          <div className="inline-flex items-center gap-2 mb-2">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: '#028090' }}
            >
              <IconBolt size={18} color="#fff" />
            </div>
            <span className="text-2xl font-bold" style={{ color: '#028090' }}>
              PulseDesk AI
            </span>
          </div>
          <p className="text-sm" style={{ color: '#94A3B8' }}>
            Enterprise Operational Intelligence Platform
          </p>
        </div>

        <div className="mx-8" style={{ height: '0.5px', background: '#E2E8F0' }} />

        <div className="px-8 py-6">
          {/* Flash messages */}
          {flash?.alert && (
            <div
              className="mb-4 px-4 py-3 rounded-xl text-sm"
              style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626' }}
            >
              {flash.alert}
            </div>
          )}
          {flash?.notice && (
            <div
              className="mb-4 px-4 py-3 rounded-xl text-sm"
              style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', color: '#16A34A' }}
            >
              {flash.notice}
            </div>
          )}

          <p className="text-center font-bold mb-5" style={{ fontSize: '16px', color: '#0F172A' }}>
            Sign in to your workspace
          </p>

        {/* Google OAuth */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            className="flex items-center justify-center gap-3 w-full py-3 px-4 rounded-xl text-sm font-medium transition-colors cursor-pointer mb-2"
            style={{ border: '1px solid #E2E8F0', background: '#fff', color: '#1E293B' }}
          >
            <IconBrandGoogle size={18} />
            Continue with Google
          </button>

          <p className="text-center text-xs mb-5" style={{ color: '#94A3B8' }}>
            Use your corporate Google Workspace account
          </p>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1" style={{ height: '0.5px', background: '#E2E8F0' }} />
            <span className="text-xs" style={{ color: '#94A3B8' }}>
              Secure enterprise login
            </span>
            <div className="flex-1" style={{ height: '0.5px', background: '#E2E8F0' }} />
          </div>

          {/* Trust badges */}
          <div className="grid grid-cols-3 gap-2 mb-5">
            {[
              { icon: <IconShieldCheck size={18} color="#028090" />, label: 'SOC 2 Type II' },
              { icon: <IconBuilding size={18} color="#028090" />, label: 'Multi-tenant Isolated' },
              { icon: <IconRobot size={18} color="#028090" />, label: 'AI Audit Log' },
            ].map((badge) => (
              <div
                key={badge.label}
                className="flex flex-col items-center gap-1 py-2 px-1 rounded-xl"
                style={{ border: '1px solid #E2E8F0', background: '#F8FAFC' }}
              >
                {badge.icon}
                <span
                  className="text-center font-medium"
                  style={{ fontSize: '10px', color: '#475569' }}
                >
                  {badge.label}
                </span>
              </div>
            ))}
          </div>

          <div className="mb-5" style={{ height: '0.5px', background: '#E2E8F0' }} />

          {/* Email + Password */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label
                className="block text-sm font-medium mb-1.5"
                style={{ color: '#475569' }}
              >
                Work email
              </label>
              <input
                {...register('email')}
                type="email"
                autoComplete="email"
                placeholder="you@company.com"
                className="w-full px-3 py-3 rounded-xl text-sm outline-none transition-all"
                style={{
                  border: '1px solid #E2E8F0',
                  color: '#0F172A',
                  background: '#fff',
                }}
                onFocus={(e) => (e.target.style.borderColor = '#028090')}
                onBlur={(e) => (e.target.style.borderColor = '#E2E8F0')}
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-sm font-medium" style={{ color: '#475569' }}>
                  Password
                </label>
                <a href="/users/password/new" className="text-xs" style={{ color: '#028090' }}>
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <input
                  {...passwordRegister}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="w-full px-3 py-3 rounded-xl text-sm outline-none pr-10 transition-all"
                  style={{
                    border: '1px solid #E2E8F0',
                    color: '#0F172A',
                    background: '#fff',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = '#028090')}
                  onBlur={(e) => (e.target.style.borderColor = '#E2E8F0')}
                  onChange={(e) => {
                    passwordRegister.onChange(e)
                    setPassword(e.target.value)
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: '#94A3B8' }}
                >
                  {showPassword
                    ? <IconEyeOff size={16} />
                    : <IconEye size={16} />
                  }
                </button>
              </div>
              <PasswordStrength password={password} />
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 rounded-xl text-sm font-semibold text-white transition-colors"
              style={{ background: '#028090' }}
            >
              Sign in
            </button>
          </form>

          <div
            className="flex items-center justify-center gap-2 mt-5 pt-5"
            style={{ borderTop: '0.5px solid #E2E8F0' }}
          >
            <IconLock size={12} color="#94A3B8" />
            <p className="text-center" style={{ fontSize: '11px', color: '#94A3B8' }}>
              256-bit encryption ·{' '}
              <a href="#" style={{ color: '#028090' }}>Terms</a>
              {' '}·{' '}
              <a href="#" style={{ color: '#028090' }}>Privacy</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}