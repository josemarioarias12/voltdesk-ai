import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useWebAuthn } from '@/hooks/useWebAuthn'
import { IconFaceId } from '@/components/Icons'

const TEAL = '#028090'
const MINT = '#02C39A'

export default function FaceIdPrompt({ show }: { show: boolean }) {
  const [dismissed, setDismissed] = useState(false)
  const [activated, setActivated] = useState(false)
  const { isSupported, status, registerPasskey } = useWebAuthn()

  const visible = show && isSupported && !dismissed && !activated

  async function handleActivate() {
    const success = await registerPasskey()
    if (success) setActivated(true)
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '12px 16px', margin: '0 0 16px',
            borderRadius: 12,
            background: 'rgba(2,195,154,0.06)',
            border: '1px solid rgba(2,195,154,0.2)',
          }}
        >
          <IconFaceId size={20} color={MINT} />
          <p style={{ flex: 1, fontSize: 13, color: '#0D1B2A', margin: 0, fontWeight: 500 }}>
            Sign in faster next time with Face ID
          </p>
          <button
            type="button"
            onClick={handleActivate}
            disabled={status === 'in_progress'}
            style={{
              padding: '7px 14px', borderRadius: 8, border: 'none',
              background: TEAL, color: '#fff', fontSize: 12, fontWeight: 600,
              cursor: status === 'in_progress' ? 'default' : 'pointer',
              opacity: status === 'in_progress' ? 0.6 : 1,
            }}
          >
            {status === 'in_progress' ? 'Waiting…' : 'Activate'}
          </button>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', fontSize: 12, padding: '4px 8px' }}
          >
            Not now
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}