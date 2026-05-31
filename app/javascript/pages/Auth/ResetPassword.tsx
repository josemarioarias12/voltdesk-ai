import { SharedProps } from '@/types'
import { useForm } from 'react-hook-form'
import { usePage, router } from '@inertiajs/react'
import { useState } from 'react'

interface ResetPasswordForm {
  password: string
  password_confirmation: string
  [key: string]: string
}

interface Props extends SharedProps {
  reset_password_token: string
}

export default function AuthResetPassword() {
  const { flash, reset_password_token } = usePage<Props>().props
  const { register, handleSubmit } = useForm<ResetPasswordForm>()
  const [showPassword, setShowPassword] = useState(false)

  const onSubmit = (data: ResetPasswordForm) => {
    router.put('/users/password', {
      user: { ...data, reset_password_token }
    })
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8"
      style={{
        backgroundColor: '#F8FAFC',
        backgroundImage: 'linear-gradient(rgba(2,128,144,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(2,128,144,0.06) 1px, transparent 1px)',
        backgroundSize: '32px 32px'
      }}>

      <div className="w-full max-w-md bg-white rounded-2xl overflow-hidden"
        style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>

        <div className="px-8 pt-8 pb-6 text-center">
          <div className="inline-flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: '#028090' }}>
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
            </div>
            <span className="text-2xl font-bold" style={{ color: '#028090' }}>PulseDesk AI</span>
          </div>
          <p className="text-sm" style={{ color: '#94A3B8' }}>Enterprise Operational Intelligence Platform</p>
        </div>

        <div className="mx-8" style={{ height: '0.5px', background: '#E2E8F0' }} />

        <div className="px-8 py-6">
          <p className="text-center font-bold mb-2" style={{ fontSize: '16px', color: '#0F172A' }}>
            Choose a new password
          </p>
          <p className="text-center text-sm mb-6" style={{ color: '#94A3B8' }}>
            Choose a strong password for your account.
          </p>

          {flash?.alert && (
            <div className="mb-4 px-4 py-3 rounded-xl text-sm"
              style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626' }}>
              {flash.alert}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#475569' }}>
                New password
              </label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="w-full px-3 py-3 rounded-xl text-sm outline-none pr-10"
                  style={{ border: '1px solid #E2E8F0', color: '#0F172A', background: '#fff' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: '#94A3B8' }}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#475569' }}>
                Confirm password
              </label>
              <input
                {...register('password_confirmation')}
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                className="w-full px-3 py-3 rounded-xl text-sm outline-none"
                style={{ border: '1px solid #E2E8F0', color: '#0F172A', background: '#fff' }}
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 rounded-xl text-sm font-semibold text-white"
              style={{ background: '#028090' }}
            >
              Update password
            </button>
          </form>

          <div className="text-center mt-5">
            <a href="/login" className="text-sm" style={{ color: '#028090' }}>
              ← Back to sign in
            </a>
          </div>
        </div>
      </div>

      <p className="mt-6 text-center" style={{ fontSize: '11px', color: '#94A3B8' }}>
        PulseDesk AI · Enterprise Platform · v1.0
      </p>
    </div>
  )
}