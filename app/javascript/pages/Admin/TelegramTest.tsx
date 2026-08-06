import React from 'react'
import { router } from '@inertiajs/react'
import { useTranslation } from 'react-i18next'
import AdminLayout from '@/components/AdminLayout'

interface Props {
  status: 'sent' | 'failed'
  message: string
}

export default function TelegramTest({ status, message }: Props) {
  const { t } = useTranslation('admin')

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

          {message && (
            <div style={{
              background: status === 'sent' ? 'rgba(2,195,154,0.06)' : 'rgba(239,68,68,0.06)',
              border: `1px solid ${status === 'sent' ? 'rgba(2,195,154,0.2)' : 'rgba(239,68,68,0.2)'}`,
              borderRadius: 8,
              padding: '12px 16px',
              marginBottom: 24
            }}>
              <p style={{ fontSize: 13, color: status === 'sent' ? '#028090' : '#DC2626', lineHeight: 1.75,margin: 0 }}>
                {status === 'sent' ? t('telegramTest.sentPrefix') : t('telegramTest.failedPrefix')}{message}
              </p>
            </div>
          )}

          <button
            onClick={() => router.get('/admin/telegram-test')}
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