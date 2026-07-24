import { router } from '@inertiajs/react'
import { useTranslation } from 'react-i18next'
import AppLayout from '@/components/AppLayout'
import EmptyState from '@/components/EmptyState'

function IconNotFound() {
  return (
    <svg width="48" height="48" fill="none" stroke="#CBD5E1" viewBox="0 0 24 24">
      <circle cx="11" cy="11" r="7" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-4.35-4.35M9.5 9a1.5 1.5 0 013 0c0 1-1.5 1.25-1.5 2.5M11 14.5h.01" />
    </svg>
  )
}

export default function NotFound() {
  const { t } = useTranslation('common')

  return (
    <AppLayout title={t('errorPages.notFound.title')}>
      <EmptyState
        icon={<IconNotFound />}
        title={t('errorPages.notFound.title')}
        description={t('errorPages.notFound.description')}
        action={{ label: t('errorPages.notFound.action'), onClick: () => router.get('/dashboard') }}
      />
    </AppLayout>
  )
}
