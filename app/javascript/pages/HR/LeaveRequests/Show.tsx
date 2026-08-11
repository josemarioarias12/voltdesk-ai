import { useState, useEffect } from 'react'
import { router } from '@inertiajs/react'
import { useTranslation } from 'react-i18next'
import AppLayout from '@/components/AppLayout'
import { LeaveRequest } from '@/types'
import { CARD, LABEL, BADGE, SLATE, NAVY, TEAL, DANGER, DANGER_BG, WARNING, WARNING_BG, SUCCESS, SUCCESS_BG } from '@/styles/tokens'

interface Props {
  leave_request: LeaveRequest
}

function BackIcon({ size = 16, color = SLATE[600] }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 12H5m0 0l7 7m-7-7l7-7" />
    </svg>
  )
}

function ClipboardIcon({ size = 16, color = NAVY }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
      <rect x="9" y="3" width="6" height="4" rx="1" strokeWidth={2} />
    </svg>
  )
}

function CalendarIcon({ size = 13, color = SLATE[400] }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
      <rect x="3" y="5" width="18" height="16" rx="2" strokeWidth={2} />
      <path strokeLinecap="round" d="M16 3v4M8 3v4M3 10h18" />
    </svg>
  )
}

function ClockIcon({ size = 13, color = SLATE[400] }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
      <circle cx="12" cy="12" r="9" strokeWidth={2} />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 7v5l3 3" />
    </svg>
  )
}

function MailIcon({ size = 13, color = SLATE[400] }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
      <rect x="3" y="5" width="18" height="14" rx="2" strokeWidth={2} />
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 7l9 6 9-6" />
    </svg>
  )
}

function LockIcon({ size = 13, color = SLATE[400] }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
      <rect x="4" y="10" width="16" height="10" rx="2" strokeWidth={2} />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 10V7a4 4 0 118 0v3" />
    </svg>
  )
}

function CheckIcon({ size = 16, color = '#fff' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  )
}

function XIcon({ size = 16, color = DANGER }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}

function ShieldIcon({ size = 16, color = '#7C3AED' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" />
    </svg>
  )
}

function AlertIcon({ size = 15, color = WARNING }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
    </svg>
  )
}

function CheckBadgeIcon({ size = 16, color = SUCCESS }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

function XBadgeIcon({ size = 16, color = DANGER }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
      <circle cx="12" cy="12" r="9" strokeWidth={2} />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 9l-6 6M9 9l6 6" />
    </svg>
  )
}

function ListIcon({ size = 14, color = SLATE[400] }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
    </svg>
  )
}

function PlusIcon({ size = 14, color = SLATE[400] }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14m-7-7h14" />
    </svg>
  )
}

function ChevronIcon({ size = 14, color = SLATE[400] }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6" />
    </svg>
  )
}

function useWindowWidth() {
  const [width, setWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200)
  useEffect(() => {
    const handler = () => setWidth(window.innerWidth)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])
  return width
}

function SensitiveField({ label, value, restrictedLabel }: { label: string; value: string | null; restrictedLabel: string }) {
  const redacted = value === '[REDACTED]'
  return (
    <div>
      <p style={{ fontSize: 11, fontWeight: 600, color: SLATE[400], textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 4px' }}>{label}</p>
      {redacted ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', background: SLATE[50], borderRadius: 8 }}>
          <LockIcon />
          <span style={{ fontSize: 13, color: SLATE[400], fontStyle: 'italic' }}>{restrictedLabel}</span>
        </div>
      ) : (
        <p style={{ fontSize: 14, color: NAVY, margin: 0 }}>{value}</p>
      )}
    </div>
  )
}

export default function LeaveRequestsShow({ leave_request: lr }: Props) {
  const { t } = useTranslation(['hr', 'common'])
  const [rejectionReason, setRejectionReason] = useState('')
  const [showRejectForm, setShowRejectForm]   = useState(false)
  const [submitting, setSubmitting]           = useState(false)

  const windowWidth = useWindowWidth()
  const isMobile     = windowWidth < 900

  const STATUS_STYLES: Record<string, { bg: string; color: string; label: string }> = {
    pending:                 { bg: WARNING_BG, color: WARNING, label: t('hr:status.pending') },
    pending_second_approval: { bg: '#F5F3FF', color: '#7C3AED', label: t('hr:status.pendingSecondApproval') },
    approved:                { bg: SUCCESS_BG, color: SUCCESS, label: t('hr:status.approved') },
    rejected:                { bg: DANGER_BG, color: DANGER, label: t('hr:status.rejected') },
  }

  const status = STATUS_STYLES[lr.status] ?? STATUS_STYLES.pending
  const hasSensitiveFields = lr.medical_notes !== undefined || lr.doctor_certificate_url !== undefined

  function leaveTypeLabel(type: string) {
    return t(`hr:leaveType.${type}`, { defaultValue: type })
  }

  function roleLabel(role: string) {
    return t(`common:roles.${role}`, { defaultValue: role.replace(/_/g, ' ') })
  }

  const handleApprove = () => {
    setSubmitting(true)
    router.post(`/hr/leave_requests/${lr.id}/approve`, {}, { onFinish: () => setSubmitting(false) })
  }

  const handleReject = () => {
    if (!rejectionReason.trim()) return
    setSubmitting(true)
    router.post(`/hr/leave_requests/${lr.id}/reject`, { rejection_reason: rejectionReason }, {
      onFinish: () => setSubmitting(false),
    })
  }

  const showDecisionPanel = lr.can_approve || lr.can_final_approve || lr.can_reject
  const isFinalStage = lr.status === 'pending_second_approval'

  return (
    <AppLayout title={t('hr:leaveRequests.show.title', { id: String(lr.id).padStart(5, '0') })}>
      <div style={{ maxWidth: 1000 }}>
        <div style={{ display: 'flex', alignItems: isMobile ? 'stretch' : 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? 12 : 0 }}>
          <div>
            <button
              onClick={() => router.get('/hr/leave_requests')}
              style={{ background: 'none', border: 'none', color: SLATE[600], cursor: 'pointer', fontSize: 14, padding: 0, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <BackIcon /> {t('hr:leaveRequests.show.back')}
            </button>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: NAVY, letterSpacing: '-0.02em', margin: '0 0 4px' }}>
              {t('hr:leaveRequests.show.title', { id: String(lr.id).padStart(5, '0') })}
            </h1>
            <p style={{ color: SLATE[600], fontSize: 13, margin: 0 }}>{t('hr:leaveRequests.show.subtitle')}</p>
          </div>
          <span style={{ ...BADGE, fontSize: 13, padding: '6px 14px', color: status.color, background: status.bg, display: 'flex', alignItems: 'center', gap: 6, alignSelf: isMobile ? 'flex-start' : undefined }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: status.color }} />
            {status.label}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 340px', gap: 20 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ ...CARD, padding: 24 }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: NAVY, margin: '0 0 20px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <ClipboardIcon /> {t('hr:leaveRequests.show.requestDetails')}
              </h2>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, paddingBottom: 20, borderBottom: '1px solid rgba(15,23,42,0.06)', flexWrap: 'wrap', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: TEAL, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700 }}>
                    {lr.user.full_name.charAt(0)}
                  </div>
                  <div>
                    <p style={{ fontSize: 15, fontWeight: 700, color: NAVY, margin: 0 }}>{lr.user.full_name}</p>
                    <p style={{ fontSize: 13, color: SLATE[400], margin: 0 }}>{roleLabel(lr.user.role ?? '')} · {lr.user.department ?? 'General'}</p>
                  </div>
                </div>
                <span style={{ ...BADGE, color: '#2563EB', background: '#EFF6FF' }}>
                  {leaveTypeLabel(lr.leave_type)}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: 16, marginBottom: 20 }}>
                {[
                  { label: t('hr:leaveRequests.show.startDate'), icon: <CalendarIcon />, value: lr.start_date },
                  { label: t('hr:leaveRequests.show.endDate'), icon: <CalendarIcon />, value: lr.end_date },
                  { label: t('hr:leaveRequests.show.duration'), icon: <ClockIcon />, value: t('hr:leaveRequests.show.day', { count: lr.business_days }) },
                  { label: t('hr:leaveRequests.show.submitted'), icon: <MailIcon />, value: new Date(lr.created_at).toLocaleDateString() },
                ].map(item => (
                  <div key={item.label}>
                    <p style={{ fontSize: 11, fontWeight: 600, color: SLATE[400], textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 4px' }}>{item.label}</p>
                    <p style={{ fontSize: 14, color: NAVY, margin: 0, display: 'flex', alignItems: 'center', gap: 5 }}>{item.icon} {item.value}</p>
                  </div>
                ))}
              </div>

              {lr.reason && (
                <div style={{ marginBottom: 16 }}>
                  <p style={{ fontSize: 11, fontWeight: 600, color: SLATE[400], textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 8px' }}>{t('hr:leaveRequests.show.reason')}</p>
                  <div style={{ background: SLATE[50], borderRadius: 10, padding: '12px 16px', fontSize: 14, color: SLATE[600] }}>{lr.reason}</div>
                </div>
              )}

              {lr.coverage_plan && (
                <div style={{ marginBottom: 16 }}>
                  <p style={{ fontSize: 11, fontWeight: 600, color: SLATE[400], textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 8px' }}>{t('hr:leaveRequests.show.coveragePlan')}</p>
                  <div style={{ background: SLATE[50], borderRadius: 10, padding: '12px 16px', fontSize: 14, color: SLATE[600] }}>{lr.coverage_plan}</div>
                </div>
              )}

              {hasSensitiveFields && (
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16, marginBottom: 16, paddingTop: 16, borderTop: '1px solid rgba(15,23,42,0.06)' }}>
                  <SensitiveField label={t('hr:leaveRequests.show.medicalNotes')} value={lr.medical_notes} restrictedLabel={t('hr:leaveRequests.show.restricted')} />
                  <SensitiveField label={t('hr:leaveRequests.show.doctorCertificate')} value={lr.doctor_certificate_url} restrictedLabel={t('hr:leaveRequests.show.restricted')} />
                </div>
              )}

              {lr.rejection_reason && (
                <div>
                  <p style={{ fontSize: 11, fontWeight: 600, color: SLATE[400], textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 8px' }}>{t('hr:leaveRequests.show.rejectionReason')}</p>
                  <div style={{ background: DANGER_BG, borderRadius: 10, padding: '12px 16px', fontSize: 14, color: DANGER }}>{lr.rejection_reason}</div>
                </div>
              )}
            </div>

            {showDecisionPanel && (
              <div style={{ ...CARD, padding: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
                  <h2 style={{ fontSize: 15, fontWeight: 700, color: NAVY, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                    {isFinalStage ? <ShieldIcon /> : <ClipboardIcon />}
                    {isFinalStage ? t('hr:leaveRequests.show.finalApproval') : t('hr:leaveRequests.show.decision')}
                  </h2>
                  <span style={{ ...BADGE, color: WARNING, background: WARNING_BG }}>{t('hr:leaveRequests.show.actionRequired')}</span>
                </div>

                {lr.coverage_conflicts.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 16, padding: '10px 14px', background: WARNING_BG, borderRadius: 10 }}>
                    <AlertIcon />
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 600, color: WARNING, margin: '0 0 4px' }}>
                        {t('hr:leaveRequests.show.coverageWarning.title')}
                      </p>
                      <p style={{ fontSize: 13, color: SLATE[600], margin: '0 0 6px' }}>
                        {t('hr:leaveRequests.show.coverageWarning.description', {
                          count: lr.coverage_conflicts.length,
                          department: lr.user.department ?? 'General',
                        })}
                      </p>
                      <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: SLATE[600] }}>
                        {lr.coverage_conflicts.map(conflict => (
                          <li key={conflict.id}>
                            {conflict.user_name} — {t('hr:leaveRequests.show.coverageWarning.dateRange', { start: conflict.start_date, end: conflict.end_date })}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {isFinalStage && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 16, padding: '10px 14px', background: '#F5F3FF', borderRadius: 10 }}>
                    <AlertIcon color="#7C3AED" />
                    <p style={{ fontSize: 13, color: '#6D28D9', margin: 0 }}>
                      {t('hr:leaveRequests.show.alreadyApproved', { name: lr.approved_by?.full_name ?? t('hr:leaveRequests.show.aManager') })}
                    </p>
                  </div>
                )}

                {(lr.can_approve || lr.can_final_approve) && (
                  <button
                    onClick={handleApprove}
                    disabled={submitting}
                    style={{
                      width: '100%', padding: 13, borderRadius: 10, border: 'none', color: '#fff',
                      background: isFinalStage ? '#7C3AED' : SUCCESS,
                      fontSize: 15, fontWeight: 600, cursor: 'pointer', marginBottom: 10,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    }}
                  >
                    {isFinalStage ? <ShieldIcon color="#fff" /> : <CheckIcon />}
                    {isFinalStage ? t('hr:leaveRequests.show.giveFinalApproval') : t('hr:leaveRequests.show.approveRequest')}
                  </button>
                )}

                {lr.can_reject && (
                  <button
                    onClick={() => setShowRejectForm(prev => !prev)}
                    style={{ width: '100%', padding: 12, borderRadius: 10, background: 'transparent', color: DANGER, border: `1px solid ${DANGER}`, fontSize: 15, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                  >
                    <XIcon /> {t('hr:leaveRequests.show.rejectRequest')}
                  </button>
                )}

                {showRejectForm && (
                  <div style={{ marginTop: 16 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: DANGER, margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <AlertIcon color={DANGER} /> {t('hr:leaveRequests.show.rejectionRequired')}
                    </p>
                    <textarea
                      value={rejectionReason}
                      onChange={e => setRejectionReason(e.target.value)}
                      placeholder={t('hr:leaveRequests.show.rejectionPlaceholder')}
                      rows={3}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #FCA5A5', fontSize: 14, resize: 'vertical', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', marginBottom: 10 }}
                    />
                    <button
                      onClick={handleReject}
                      disabled={!rejectionReason.trim() || submitting}
                      style={{ width: '100%', padding: 11, borderRadius: 10, background: rejectionReason.trim() ? DANGER : SLATE[400], color: '#fff', border: 'none', fontSize: 14, fontWeight: 600, cursor: rejectionReason.trim() ? 'pointer' : 'not-allowed' }}
                    >
                      {t('hr:leaveRequests.show.confirmRejection')}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {lr.approved_by && (
              <div style={{ ...CARD, padding: 20 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: NAVY, margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 6 }}>
                  {lr.status === 'rejected' ? <XBadgeIcon /> : <CheckBadgeIcon />}
                  {lr.status === 'rejected' ? t('hr:leaveRequests.show.rejectedBy') : t('hr:leaveRequests.show.approvedBy')}
                </h3>
                <p style={{ fontSize: 14, color: SLATE[600], margin: 0 }}>{lr.approved_by.full_name}</p>
                {isFinalStage && (
                  <p style={{ fontSize: 12, color: SLATE[400], margin: '6px 0 0' }}>{t('hr:leaveRequests.show.awaitingFinalNote')}</p>
                )}
              </div>
            )}

            <div style={{ ...CARD, padding: 20 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: NAVY, margin: '0 0 12px' }}>{t('hr:leaveRequests.show.quickActions')}</h3>
              {[
                { label: t('hr:leaveRequests.show.viewAll'), icon: <ListIcon />, path: '/hr/leave_requests' },
                { label: t('hr:leaveRequests.show.newRequest'), icon: <PlusIcon />, path: '/hr/leave_requests/new' },
              ].map(action => (
                <button
                  key={action.path}
                  onClick={() => router.get(action.path)}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', background: 'none', border: 'none', borderBottom: '1px solid rgba(15,23,42,0.06)', cursor: 'pointer', fontSize: 13, color: SLATE[600] }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>{action.icon} {action.label}</span>
                  <ChevronIcon />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
