import { useEffect, useRef, useState } from 'react'
import { Link } from '@inertiajs/react'
import { useIsMobile } from '@/hooks/useIsMobile'
import Avatar from '@/components/Avatar'

interface Props {
  avatarUrl?: string | null
  firstName?: string | null
  fullName?: string | null
  role?: string | null
}

export default function UserMenu({ avatarUrl, firstName, fullName, role }: Props) {
  const [menuOpen, setMenuOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef   = useRef<HTMLDivElement>(null)
  const isMobile  = useIsMobile()

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        menuRef.current && !menuRef.current.contains(e.target as Node) &&
        buttonRef.current && !buttonRef.current.contains(e.target as Node)
      ) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const anchorTop = buttonRef.current
    ? buttonRef.current.getBoundingClientRect().bottom + 8
    : 0

  const containerStyle: React.CSSProperties = isMobile
    ? {
        position:     'fixed',
        top:          `${anchorTop}px`,
        left:         '12px',
        right:        '12px',
        width:        'auto',
        background:   '#fff',
        borderRadius: '16px',
        border:       '1px solid #E2E8F0',
        boxShadow:    '0 16px 40px rgba(0,0,0,0.12)',
        zIndex:       1000,
        overflow:     'hidden',
      }
    : {
        position:     'absolute',
        top:          'calc(100% + 8px)',
        right:        0,
        width:        '240px',
        background:   '#fff',
        borderRadius: '16px',
        border:       '1px solid #E2E8F0',
        boxShadow:    '0 16px 40px rgba(0,0,0,0.12)',
        zIndex:       1000,
        overflow:     'hidden',
      }

  return (
    <div style={{ position: 'relative' }}>
      <button
        ref={buttonRef}
        onClick={() => setMenuOpen(prev => !prev)}
        style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}
        aria-label="User menu"
      >
        <Avatar avatarUrl={avatarUrl} firstName={firstName} size={36} />
      </button>

      {menuOpen && (
        <div ref={menuRef} style={containerStyle}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid #F1F5F9' }}>
            <p style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A', margin: '0 0 2px' }}>
              {fullName}
            </p>
            <p style={{ fontSize: '12px', color: '#94A3B8', margin: 0, textTransform: 'capitalize' }}>
              {role?.replace(/_/g, ' ')}
            </p>
          </div>

          <Link
            href="/settings/profile"
            onClick={() => setMenuOpen(false)}
            style={{
              display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px',
              fontSize: '13px', fontWeight: 500, color: '#0F172A', textDecoration: 'none',
            }}
          >
            <ProfileIcon />
            Profile Settings
          </Link>

          <form method="post" action="/users/logout" style={{ margin: 0, borderTop: '1px solid #F1F5F9' }}>
            <input type="hidden" name="_method" value="delete" />
            <input type="hidden" name="authenticity_token" value={document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? ''} />
            <button
              type="submit"
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px',
                fontSize: '13px', fontWeight: 500, color: '#EF4444', background: 'transparent', border: 'none', cursor: 'pointer',
              }}
            >
              <SignOutIcon />
              Sign out
            </button>
          </form>
        </div>
      )}
    </div>
  )
}

function ProfileIcon() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
}

function SignOutIcon() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
}