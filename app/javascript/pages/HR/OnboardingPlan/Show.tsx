import { useState } from 'react'
import AppLayout from '@/components/AppLayout'
import { router } from '@inertiajs/react'
import { useTranslation } from 'react-i18next'
import { OnboardingPlan } from '@/types'

interface Props {
  plan: OnboardingPlan
  user: { name: string; role: string; department: string }
}

const SECTION_CONFIG: Record<string, { bg: string; icon: string; color: string; border: string; emoji: string }> = {
  setup:         { bg: '#EFF6FF', icon: '⚙️',  color: '#2563EB', border: '#BFDBFE', emoji: '⚙️' },
  team:          { bg: '#F0FDF4', icon: '👥',  color: '#16A34A', border: '#BBF7D0', emoji: '👥' },
  systems:       { bg: '#FFF7ED', icon: '📖',  color: '#EA580C', border: '#FED7AA', emoji: '📖' },
  contributions: { bg: '#FDF4FF', icon: '⭐',  color: '#9333EA', border: '#E9D5FF', emoji: '⭐' },
}

export default function OnboardingPlanShow({ plan, user }: Props) {
  const { t } = useTranslation('hr')
  const [completedIds, setCompletedIds] = useState<Set<number>>(
    new Set(
      plan.sections.flatMap(s => s.tasks.filter(t => t.completed).map(t => t.id))
    )
  )

  const totalTasks = plan.sections.flatMap(s => s.tasks).length
  const doneTasks  = completedIds.size
  const pct        = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0

  const toggleTask = (planId: number, taskId: number, completed: boolean) => {
    setCompletedIds(prev => {
      const next = new Set(prev)
      completed ? next.delete(taskId) : next.add(taskId)
      return next
    })
    router.patch(`/hr/onboarding_plans/${planId}/update_task`, {
      task_id:   taskId,
      completed: !completed,
    }, { preserveScroll: true })
  }

  return (
    <AppLayout title={t('onboardingPlan.pageTitle')}>
      <div style={{ maxWidth: '900px' }}>
        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#0F172A', margin: '0 0 4px' }}>
            {t('onboardingPlan.welcome', { name: user.name })}
          </h1>
          <p style={{ color: '#475569', fontSize: '14px', margin: '0 0 12px' }}>
            {user.role} · {user.department}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '5px',
              background: '#028090', color: '#fff',
              fontSize: '11px', fontWeight: '600', padding: '4px 10px', borderRadius: '20px',
            }}>
              {t('onboardingPlan.generatedByGpt')}
            </span>
            <span style={{ fontSize: '12px', color: '#94A3B8' }}>
              {t('onboardingPlan.startedTarget', { started: plan.started_at, target: plan.target_completion_date ?? t('onboardingPlan.tbd') })}
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{
          background: '#fff', borderRadius: '16px', padding: '20px 24px',
          border: '1px solid #E2E8F0', boxShadow: '0 4px 24px rgba(0,0,0,0.05)',
          marginBottom: '20px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '14px', fontWeight: '600', color: '#0F172A' }}>{t('onboardingPlan.overallProgress')}</span>
            <span style={{ fontSize: '20px', fontWeight: '700', color: '#028090' }}>{pct}%</span>
          </div>
          <div style={{ background: '#E2E8F0', borderRadius: '100px', height: '10px', overflow: 'hidden' }}>
            <div style={{
              width: `${pct}%`, height: '100%',
              background: '#028090', borderRadius: '100px',
              transition: 'width 0.4s ease',
            }} />
          </div>
        </div>

        {/* KPI cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', marginBottom: '24px' }}>
          {[
            { label: t('onboardingPlan.kpi.tasksCompleted'), value: `${doneTasks}/${totalTasks}`, sub: t('onboardingPlan.kpi.tasksDone') },
            { label: t('onboardingPlan.kpi.daysSinceStart'), value: plan.started_at, sub: t('onboardingPlan.kpi.started') },
            { label: t('onboardingPlan.kpi.targetDate'), value: plan.target_completion_date ?? t('onboardingPlan.tbd'), sub: t('onboardingPlan.kpi.completion') },
          ].map((card, i) => (
            <div key={i} style={{
              background: '#fff', borderRadius: '16px', padding: '18px 20px',
              border: '1px solid #E2E8F0', boxShadow: '0 4px 24px rgba(0,0,0,0.05)',
            }}>
              <p style={{ fontSize: '11px', fontWeight: '600', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 5px' }}>{card.label}</p>
              <p style={{ fontSize: '22px', fontWeight: '700', color: '#0F172A', margin: '0 0 2px' }}>{card.value}</p>
              <p style={{ fontSize: '12px', color: '#475569', margin: 0 }}>{card.sub}</p>
            </div>
          ))}
        </div>

        {/* Sections */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          {plan.sections.map(section => {
            const cfg = SECTION_CONFIG[section.category] ?? SECTION_CONFIG.setup
            const sectionDone = section.tasks.filter(t => completedIds.has(t.id)).length
            const sectionPct  = section.tasks.length > 0 ? Math.round((sectionDone / section.tasks.length) * 100) : 0

            return (
              <div key={section.category} style={{
                background: '#fff', borderRadius: '16px',
                border: '1px solid #E2E8F0', boxShadow: '0 4px 24px rgba(0,0,0,0.05)',
                overflow: 'hidden',
              }}>
                {/* Section header */}
                <div style={{
                  background: cfg.bg, borderBottom: `1px solid ${cfg.border}`,
                  padding: '14px 18px',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '32px', height: '32px', borderRadius: '10px',
                      background: cfg.color, color: '#fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px',
                    }}>
                      {cfg.emoji}
                    </div>
                    <div>
                      <p style={{ fontSize: '13px', fontWeight: '700', color: '#0F172A', margin: 0 }}>{section.title}</p>
                      <p style={{ fontSize: '11px', color: '#475569', margin: 0 }}>{t('onboardingPlan.sectionCompleted', { done: sectionDone, total: section.tasks.length })}</p>
                    </div>
                  </div>
                  <span style={{
                    fontSize: '13px', fontWeight: '700', color: cfg.color,
                    background: '#fff', padding: '3px 10px', borderRadius: '20px',
                    border: `1px solid ${cfg.border}`,
                  }}>
                    {sectionPct}%
                  </span>
                </div>

                {/* Tasks */}
                <div style={{ padding: '4px 0' }}>
                  {section.tasks.map(task => {
                    const done = completedIds.has(task.id)
                    return (
                      <div
                        key={task.id}
                        onClick={() => toggleTask(plan.id, task.id, done)}
                        style={{
                          display: 'flex', alignItems: 'flex-start', gap: '11px',
                          padding: '10px 18px', cursor: 'pointer',
                          background: 'transparent', transition: 'background 0.15s',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#F8FAFC')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        <div style={{
                          width: '20px', height: '20px', borderRadius: '6px', flexShrink: 0,
                          background: done ? '#16A34A' : '#fff',
                          border: done ? 'none' : '2px solid #CBD5E1',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          marginTop: '1px', color: '#fff', fontSize: '12px',
                        }}>
                          {done && '✓'}
                        </div>
                        <div style={{ flex: 1 }}>
                          <p style={{
                            fontSize: '13px', margin: '0 0 2px',
                            color:          done ? '#94A3B8' : '#0F172A',
                            textDecoration: done ? 'line-through' : 'none',
                          }}>
                            {task.title}
                          </p>
                          {task.due_date && !done && (
                            <span style={{ fontSize: '11px', color: '#94A3B8' }}>
                              {t('onboardingPlan.dueDate', { date: task.due_date })}
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </AppLayout>
  )
}