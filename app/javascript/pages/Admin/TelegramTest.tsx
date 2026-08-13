import { router } from '@inertiajs/react'
import { useTranslation } from 'react-i18next'
import AdminLayout from '@/components/AdminLayout'

export default function TelegramTest() {
  const { t } = useTranslation('admin')

  function generateBrief() {
    router.post('/admin/telegram-test', {})
  }

  return (
    <AdminLayout title={t('telegramTest.pageTitle')}>
      <div style={{ maxWidth: 600, margin: '40px auto', padding: '0 24px' }}>
        <div style={{
          background: '#fff',
          border: '1px solid rgba(15,23,42,0.08)',
          borderRadius: 12,
          padding: 32,
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0D1B2A', marginBottom: 8, letterSpacing: '-0.02em' }}>
            {t('telegramTest.header.title')}
          </h1>
          <p style={{ fontSize: 13, color: '#64748B', marginBottom: 24, lineHeight: 1.75 }}>
            {t('telegramTest.header.subtitle')}
          </p>

          <button
            onClick={generateBrief}
            style={{
              background: '#028090',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '10px 20px',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            {t('telegramTest.runTest')}
          </button>
        </div>
      </div>
    </AdminLayout>
  )
}
