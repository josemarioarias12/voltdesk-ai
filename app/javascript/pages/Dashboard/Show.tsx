import { usePage } from '@inertiajs/react'
import { useTranslation } from 'react-i18next'
import AppLayout from '@/components/AppLayout'
import { SharedProps } from '@/types'
import EmployeeDashboard from './Employee'
import ManagerDashboard from './Manager'
import ExecutiveDashboard from './Executive'

type DashboardMetrics =
  | ({ role: 'employee' } & React.ComponentProps<typeof EmployeeDashboard>['metrics'])
  | ({ role: 'manager' }  & React.ComponentProps<typeof ManagerDashboard>['metrics'])
  | ({ role: 'executive' } & React.ComponentProps<typeof ExecutiveDashboard>['metrics'])

interface Props {
  metrics: DashboardMetrics
}

export default function DashboardShow({ metrics }: Props) {
  const { auth } = usePage<SharedProps>().props
  const { t } = useTranslation('dashboard')

  const renderDashboard = () => {
    if (metrics.role === 'manager')   return <ManagerDashboard   metrics={metrics} />
    if (metrics.role === 'executive') return <ExecutiveDashboard metrics={metrics} />
    return <EmployeeDashboard metrics={metrics} user={auth.user!} />
  }

  return <AppLayout title={t('pageTitle')}>{renderDashboard()}</AppLayout>
}
