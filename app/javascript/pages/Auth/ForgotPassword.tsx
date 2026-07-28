import { SharedProps } from '@/types'
import { useForm } from 'react-hook-form'
import { usePage, router } from '@inertiajs/react'
import { useState } from 'react'
import { IconBolt, IconLock } from '@/components/Icons'

interface ForgotPasswordForm {
  email: string
  [key: string]: string
}

export default function AuthForgotPassword() {
  const { flash } = usePage<SharedProps>().props
  const { register, handleSubmit } = useForm<ForgotPasswordForm>()
  const [emailFocus, setEmailFocus] = useState(false)

  const onSubmit = (data: ForgotPasswordForm) => {
    router.post('/users/password', { user: data })
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0D1B2A',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '64px 24px 24px',
      fontFamily: 'Inter, system-ui, sans-serif',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: `linear-gradient(rgba(2,128,144,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(2,128,144,0.04) 1px, transparent 1px)`,
        backgroundSize: '48px 48px',
      }} />

      <div style={{
        position: 'absolute', top: '30%', left: '50%', transform: 'translate(-50%,-50%)',
        width: 600, height: 600,
        background: 'radial-gradient(circle, rgba(2,128,144,0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg,#028090,#02C39A)', zIndex: 9999 }} />

      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9998, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 24px' }}>
        <a
          href="/"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#94A3B8', fontSize: 12, fontWeight: 600, textDecoration: 'none', fontFamily: 'Inter, system-ui, sans-serif', padding: '6px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)', transition: 'all 0.15s' }}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#02C39A'; e.currentTarget.style.borderColor = 'rgba(2,195,154,0.3)'; e.currentTarget.style.background = 'rgba(2,195,154,0.05)' }}
          onMouseLeave={(e) => { e.currentTarget.style.color = '#94A3B8'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 5 5 12 12 19"/>
          </svg>
          Back to home
        </a>
      </div>

      <div style={{
        width: '100%',
        maxWidth: 440,
        background: 'rgba(13,27,42,0.95)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 20,
        boxShadow: '0 32px 64px rgba(0,0,0,0.5), 0 0 0 1px rgba(2,195,154,0.05)',
        overflow: 'hidden',
        position: 'relative',
        zIndex: 1,
      }}>
        <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 300, height: 1, background: 'linear-gradient(90deg, transparent, rgba(2,195,154,0.4), transparent)' }} />

        <div style={{ padding: '32px 32px 24px', textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#028090,#02C39A)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(2,195,154,0.3)' }}>
              <IconBolt size={18} color="#fff" />
            </div>
            <span style={{ fontSize: 20, fontWeight: 800, background: 'linear-gradient(135deg,#028090,#02C39A)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              VoltDesk AI
            </span>
          </div>
          <p style={{ fontSize: 12, color: '#64748B', margin: 0, fontWeight: 500 }}>
            Enterprise Operational Intelligence Platform
          </p>
        </div>

        <div style={{ padding: '28px 32px 32px' }}>
          <p style={{ textAlign: 'center', fontWeight: 700, fontSize: 15, color: '#fff', marginBottom: 6 }}>
            Reset your password
          </p>
          <p style={{ textAlign: 'center', fontSize: 13, color: '#64748B', marginBottom: 24 }}>
            Enter your email and we'll send you reset instructions.
          </p>

          {flash?.alert && (
            <div style={{ marginBottom: 16, padding: '12px 16px', borderRadius: 12, background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.2)', color: '#EF4444', fontSize: 13 }}>
              {flash.alert}
            </div>
          )}
          {flash?.notice && (
            <div style={{ marginBottom: 16, padding: '12px 16px', borderRadius: 12, background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.2)', color: '#16A34A', fontSize: 13 }}>
              {flash.notice}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 8 }}>
                Work email
              </label>
              <input
                {...register('email')}
                type="email"
                autoComplete="email"
                placeholder="you@company.com"
                onFocus={() => setEmailFocus(true)}
                onBlur={() => setEmailFocus(false)}
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  borderRadius: 10,
                  border: `1px solid ${emailFocus ? '#028090' : 'rgba(255,255,255,0.08)'}`,
                  background: 'rgba(255,255,255,0.04)',
                  color: '#fff',
                  fontSize: 14,
                  outline: 'none',
                  fontFamily: 'Inter, system-ui, sans-serif',
                  transition: 'border-color 0.2s',
                  boxSizing: 'border-box' as const,
                }}
              />
            </div>

            <button
              type="submit"
              style={{
                width: '100%',
                padding: '13px',
                borderRadius: 12,
                background: 'linear-gradient(135deg,#028090,#02C39A)',
                border: 'none',
                color: '#fff',
                fontSize: 15,
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'Inter, system-ui, sans-serif',
                boxShadow: '0 4px 16px rgba(2,128,144,0.3)',
              }}
            >
              Send reset instructions
            </button>
          </form>

          <a
            href="/login"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              width: '100%', padding: '12px 16px', borderRadius: 12, marginTop: 12,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#94A3B8', fontSize: 14, fontWeight: 600, textDecoration: 'none',
              boxSizing: 'border-box' as const,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 5 5 12 12 19"/>
            </svg>
            Back to sign in
          </a>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 20, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <IconLock size={11} color="#64748B" />
            <p style={{ fontSize: 11, color: '#64748B', margin: 0 }}>256-bit encryption</p>
          </div>
        </div>
      </div>
    </div>
  )
}