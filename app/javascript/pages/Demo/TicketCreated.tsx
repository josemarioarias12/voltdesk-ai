import { motion } from 'framer-motion'

interface Props { ticket_number: string }

export default function DemoTicketCreated({ ticket_number }: Props) {
  return (
    <div style={{ minHeight: '100vh', background: '#0F172A', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'system-ui, sans-serif' }}>
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        style={{ background: '#fff', borderRadius: 20, padding: '40px 32px', textAlign: 'center' as const, maxWidth: 340, width: '100%', boxShadow: '0 24px 48px rgba(0,0,0,0.4)' }}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.15, type: 'spring', stiffness: 400, damping: 15 }}
          style={{ width: 72, height: 72, borderRadius: '50%', background: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}
        >
          <svg width="36" height="36" fill="none" viewBox="0 0 24 24" stroke="#16A34A" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </motion.div>
        <p style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', marginBottom: 8 }}>Ticket submitted!</p>
        <p style={{ fontSize: 24, fontWeight: 700, color: '#028090', fontFamily: 'monospace', marginBottom: 12 }}>{ticket_number}</p>
        <p style={{ fontSize: 14, color: '#475569' }}>Watch it appear on the screen and get classified by AI in real time.</p>
      </motion.div>
    </div>
  )
}
