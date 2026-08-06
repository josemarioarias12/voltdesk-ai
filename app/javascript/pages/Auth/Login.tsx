import { SharedProps } from '@/types'
import { useForm } from 'react-hook-form'
import { usePage } from '@inertiajs/react'
import { useMemo, useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { useWebAuthn } from '@/hooks/useWebAuthn'
import { getPlatformAuthenticatorName } from '@/utils/platformAuthLabel'
import {
  IconBrandGoogle,
  IconShieldCheck,
  IconBuilding,
  IconRobot,
  IconEye,
  IconEyeOff,
  IconLock,
  IconBolt,
  IconFaceId,
} from '@/components/Icons'

interface LoginForm {
  email: string
  password: string
  [key: string]: string
}

export default function AuthLogin() {
  const { t } = useTranslation('auth')
  const { flash } = usePage<SharedProps>().props
  const [showPassword, setShowPassword] = useState(false)
  const { register } = useForm<LoginForm>()
  const emailRef    = useRef<HTMLInputElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)
  const [emailFocus, setEmailFocus]       = useState(false)
  const [passwordFocus, setPasswordFocus] = useState(false)
  const [faceIdHint, setFaceIdHint] = useState<string | null>(null)

  const { isSupported, status, errorMessage, authenticateWithPasskey } = useWebAuthn()
  const platformAuthName = useMemo(() => getPlatformAuthenticatorName(), [])

  const getCsrfToken = () =>
    document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? ''

  const handleGoogleLogin = () => {
    const form  = document.createElement('form')
    form.method = 'POST'
    form.action = '/users/auth/google_oauth2'
    const input   = document.createElement('input')
    input.type    = 'hidden'
    input.name    = 'authenticity_token'
    input.value   = getCsrfToken()
    form.appendChild(input)
    document.body.appendChild(form)
    form.submit()
  }

  const onSubmit = () => {
    const email    = emailRef.current?.value ?? ''
    const password = passwordRef.current?.value ?? ''
    const form     = document.createElement('form')
    form.method    = 'POST'
    form.action    = '/users/login'
    form.style.display = 'none'
    const fields: Record<string, string> = {
      'authenticity_token': getCsrfToken(),
      'user[email]':        email,
      'user[password]':     password,
    }
    Object.entries(fields).forEach(([name, value]) => {
      const input = document.createElement('input')
      input.type  = 'hidden'
      input.name  = name
      input.value = value
      form.appendChild(input)
    })
    document.body.appendChild(form)
    form.submit()
  }

  const handleFaceIdLogin = async () => {
    const email = emailRef.current?.value ?? ''

    if (!email) {
      setFaceIdHint(t('login.faceIdEnterEmailFirst'))
      emailRef.current?.focus()
      return
    }

    setFaceIdHint(null)
    const redirectTo = await authenticateWithPasskey(email)

    if (redirectTo) {
      window.location.href = redirectTo
    }
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

      {/* Background grid */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: `linear-gradient(rgba(2,128,144,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(2,128,144,0.04) 1px, transparent 1px)`,
        backgroundSize: '48px 48px',
      }} />

      {/* Radial glow */}
      <div style={{
        position: 'absolute', top: '30%', left: '50%', transform: 'translate(-50%,-50%)',
        width: 600, height: 600,
        background: 'radial-gradient(circle, rgba(2,128,144,0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Top accent line */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg,#028090,#02C39A)', zIndex: 9999 }} />

      {/* Back to home */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9998, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 24px' }}>
        <motion.a
          href="/"
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#94A3B8',fontSize: 12, fontWeight: 600, textDecoration: 'none', fontFamily: 'Inter, system-ui, sans-serif',padding: '6px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)', transition: 'all 0.15s' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#02C39A'; e.currentTarget.style.borderColor = 'rgba(2,195,154,0.3)'; e.currentTarget.style.background = 'rgba(2,195,154,0.05)' }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#94A3B8'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 5 5 12 12 19"/>
          </svg>
          {t('login.backToHome')}
        </motion.a>
        <div />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        style={{
          width: '100%',
          maxWidth: 440,
          background: 'rgba(13,27,42,0.95)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 20,
          boxShadow: '0 32px 64px rgba(0,0,0,0.5), 0 0 0 1px rgba(2,195,154,0.05)',
          overflow: 'hidden',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Inner glow top */}
        <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 300,height: 1, background: 'linear-gradient(90deg, transparent, rgba(2,195,154,0.4), transparent)' }} />

        {/* Header */}
        <div style={{ padding: '32px 32px 24px', textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 300 }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 8}}
          >
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#028090,#02C39A)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(2,195,154,0.3)' }}>
              <IconBolt size={18} color="#fff" />
            </div>
            <span style={{ fontSize: 20, fontWeight: 800, background: 'linear-gradient(135deg,#028090,#02C39A)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              VoltDesk AI
            </span>
          </motion.div>
          <p style={{ fontSize: 12, color: '#64748B', margin: 0, fontWeight: 500 }}>
            {t('login.pageSubtitle')}
          </p>
        </div>

        <div style={{ padding: '20px 32px 24px' }}>

          {/* Flash messages */}
          {flash?.alert && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ marginBottom: 16, padding: '12px 16px', borderRadius: 12, background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.2)', color: '#EF4444', fontSize: 13 }}
            >
              {flash.alert}
            </motion.div>
          )}
          {flash?.notice && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ marginBottom: 16, padding: '12px 16px', borderRadius: 12, background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.2)', color: '#16A34A', fontSize: 13 }}
            >
              {flash.notice}
            </motion.div>
          )}

          <p style={{ textAlign: 'center', fontWeight: 700, fontSize: 15, color: '#fff', marginBottom: 20 }}>
            {t('login.signInTitle')}
          </p>

          {/* Google OAuth */}
          <motion.button
            type="button"
            onClick={handleGoogleLogin}
            whileHover={{ scale: 1.02, background: 'rgba(255,255,255,0.07)' }}
            whileTap={{ scale: 0.98 }}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
              width: '100%', padding: '12px 16px', borderRadius: 12,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer',
              fontFamily: 'Inter, system-ui, sans-serif',
              marginBottom: 6,
            }}
          >
            <IconBrandGoogle size={18} />
            {t('login.continueWithGoogle')}
          </motion.button>
          <p style={{ textAlign: 'center', fontSize: 11, color: '#64748B', marginBottom: 20}}>
              {t('login.googleHint')}
            </p>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
            <span style={{ fontSize: 11, color: '#64748B', fontWeight: 500 }}>{t('login.secureLoginDivider')}</span>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
          </div>

          {/* Trust badges */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 8, marginBottom: 20 }}>
              {[
                { icon: <IconShieldCheck size={16} color="#02C39A" />, label: t('login.badges.soc2') },
                { icon: <IconBuilding size={16} color="#02C39A" />, label: t('login.badges.multiTenant') },
                { icon: <IconRobot size={16} color="#02C39A" />, label: t('login.badges.aiAuditLog') },
              ].map((badge) => (
                <div
                  key={badge.label}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding:'10px 8px', borderRadius: 10, background: 'rgba(2,195,154,0.08)', border: '1px solid rgba(2,195,154,0.25)' }}
                >
                  {badge.icon}
                  <span style={{ fontSize: 10, color: '#94A3B8', fontWeight: 600, textAlign:'center' }}>{badge.label}</span>
                </div>
              ))}
            </div>

          <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', marginBottom: 20 }} />

          {/* Email + Password */}
          <form onSubmit={(e) => { e.preventDefault(); onSubmit() }} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 8 }}>
                {t('login.workEmail')}
              </label>
              <input
                {...register('email')}
                ref={emailRef}
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

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase'as const, letterSpacing: '0.08em' }}>
                  {t('login.password')}
                </label>
                <a href="/users/password/new" style={{ fontSize: 11, color: '#028090', textDecoration: 'none', fontWeight: 500 }}>
                  {t('login.forgotPassword')}
                </a>
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  {...register('password')}
                  ref={passwordRef}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  onFocus={() => setPasswordFocus(true)}
                  onBlur={() => setPasswordFocus(false)}
                  style={{
                    width: '100%',
                    padding: '11px 42px 11px 14px',
                    borderRadius: 10,
                    border: `1px solid ${passwordFocus ? '#028090' : 'rgba(255,255,255,0.08)'}`,
                    background: 'rgba(255,255,255,0.04)',
                    color: '#fff',
                    fontSize: 14,
                    outline: 'none',
                    fontFamily: 'Inter, system-ui, sans-serif',
                    transition: 'border-color 0.2s',
                    boxSizing: 'border-box' as const,
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer',color: '#64748B', display: 'flex', padding: 0 }}
                >
                  {showPassword ? <IconEyeOff size={16} /> : <IconEye size={16} />}
                </button>
              </div>
            </div>

            <motion.button
              type="submit"
              whileHover={{ scale: 1.02, boxShadow: '0 8px 24px rgba(2,128,144,0.4)' }}
              whileTap={{ scale: 0.98 }}
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
                marginTop: 4,
              }}
            >
              {t('login.signIn')}
            </motion.button>
          </form>

          {/* Face ID login */}
          {isSupported && (
            <div style={{ marginTop: 12 }}>
              <motion.button
                type="button"
                onClick={handleFaceIdLogin}
                disabled={status === 'in_progress'}
                whileHover={{ scale: status === 'in_progress' ? 1 : 1.02 }}
                whileTap={{ scale: status === 'in_progress' ? 1 : 0.98 }}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  width: '100%', padding: '12px 16px', borderRadius: 12,
                  background: 'rgba(2,195,154,0.06)',
                  border: '1px solid rgba(2,195,154,0.2)',
                  color: '#02C39A', fontSize: 14, fontWeight: 600,
                  cursor: status === 'in_progress' ? 'default' : 'pointer',
                  opacity: status === 'in_progress' ? 0.6 : 1,
                  fontFamily: 'Inter, system-ui, sans-serif',
                }}
              >
                <IconFaceId size={18} color="#02C39A" />
                {status === 'in_progress' ? t('login.faceIdVerifying') : t('login.faceIdSignIn', { authenticator: platformAuthName })}
              </motion.button>
              {(faceIdHint || errorMessage) && (
                <p style={{ textAlign: 'center', fontSize: 11, color: '#F97316', marginTop: 8 }}>
                  {faceIdHint ?? t('login.faceIdError')}
                </p>
              )}
            </div>
          )}

          {/* Footer */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop:20, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <IconLock size={11} color="#64748B" />
            <p style={{ fontSize: 11, color: '#64748B', margin: 0 }}>
              {t('login.encryptionNote')}{' '}
              <a href="#" style={{ color: '#94A3B8', textDecoration: 'none' }}>{t('login.terms')}</a>
              {' · '}
              <a href="#" style={{ color: '#94A3B8', textDecoration: 'none' }}>{t('login.privacy')}</a>
            </p>
          </div>
        </div>
      </motion.div>

      {/* Footer note */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        style={{ marginTop: 24, fontSize: 12, color: '#64748B', textAlign: 'center', position: 'relative', zIndex: 1 }}
      >
        {t('login.noAccount')}
      </motion.p>
    </div>
  )
}