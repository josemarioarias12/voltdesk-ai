import { router } from '@inertiajs/react'
import { useTranslation } from 'react-i18next'
import AppLayout from '@/components/AppLayout'
import EmptyState from '@/components/EmptyState'

function IconForbidden() {
  return (
    <svg width="48" height="48" fill="none" stroke="#CBD5E1" viewBox="0 0 24 24">
      <rect x="5" y="11" width="14" height="10" rx="2" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 11V7a4 4 0 118 0v4" />
    </svg>
  )
}

export default function Forbidden() {
  const { t } = useTranslation('common')

  return (
    <AppLayout title={t('errorPages.forbidden.title')}>
      <EmptyState
        icon={<IconForbidden />}
        title={t('errorPages.forbidden.title')}
        description={t('errorPages.forbidden.description')}
        action={{ label: t('errorPages.forbidden.action'), onClick: () => router.get('/dashboard') }}
      />
    </AppLayout>
  )
}
