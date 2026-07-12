import { useState } from 'react'
import { useForm } from '@inertiajs/react'
import AppLayout from '@/components/AppLayout'
import SettingsTabs from '@/components/SettingsTabs'
import Avatar from '@/components/Avatar'

interface User {
  id: number
  email: string
  full_name: string
  first_name: string
  last_name: string
  role: string
  active: boolean
  avatar_url: string | null
}

interface Props {
  user: User
}

function csrfToken(): string {
  return (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content ?? ''
}

export default function ProfileShow({ user }: Props) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const { data, setData, patch, processing } = useForm<{
    first_name: string
    last_name: string
    avatar: File | null
  }>({
    first_name: user.first_name,
    last_name:  user.last_name,
    avatar:     null,
  })

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setData('avatar', file)
    setPreviewUrl(URL.createObjectURL(file))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    patch('/settings/profile', {
      forceFormData: true,
      headers: { 'X-CSRF-Token': csrfToken() },
    })
  }

  return (
    <AppLayout title="Profile Settings">
      <div style={{ maxWidth: '640px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#0F172A', margin: '0 0 4px' }}>
          Profile Settings
        </h1>
        <p style={{ fontSize: '13px', color: '#94A3B8', margin: '0 0 24px' }}>
          Manage your personal information
        </p>
        <SettingsTabs active="profile" />

        <form
          onSubmit={handleSubmit}
          style={{
            background:   '#fff',
            border:       '1px solid #E2E8F0',
            borderRadius: '12px',
            padding:      '24px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '28px' }}>
            <label htmlFor="avatar-upload" style={{ cursor: 'pointer' }}>
              <Avatar avatarUrl={previewUrl ?? user.avatar_url} firstName={user.first_name} size={72} />
            </label>
            <div>
              <label
                htmlFor="avatar-upload"
                style={{
                  display:      'inline-block',
                  background:   'transparent',
                  border:       '1px solid #E2E8F0',
                  borderRadius: '8px',
                  padding:      '8px 14px',
                  fontSize:     '13px',
                  fontWeight:   600,
                  color:        '#028090',
                  cursor:       'pointer',
                }}
              >
                Upload Photo
              </label>
              <input
                id="avatar-upload"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleAvatarChange}
                style={{ display: 'none' }}
              />
              <p style={{ fontSize: '12px', color: '#94A3B8', margin: '8px 0 0' }}>
                JPG, PNG or WEBP. Max 10MB.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '13px', color: '#475569', display: 'block', marginBottom: '6px' }}>
                First Name
              </label>
              <input
                type="text"
                value={data.first_name}
                onChange={e => setData('first_name', e.target.value)}
                style={{
                  width:        '100%',
                  padding:      '10px 12px',
                  border:       '1px solid #E2E8F0',
                  borderRadius: '8px',
                  fontSize:     '14px',
                }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '13px', color: '#475569', display: 'block', marginBottom: '6px' }}>
                Last Name
              </label>
              <input
                type="text"
                value={data.last_name}
                onChange={e => setData('last_name', e.target.value)}
                style={{
                  width:        '100%',
                  padding:      '10px 12px',
                  border:       '1px solid #E2E8F0',
                  borderRadius: '8px',
                  fontSize:     '14px',
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ fontSize: '13px', color: '#475569', display: 'block', marginBottom: '6px' }}>
              Email
            </label>
            <input
              type="text"
              value={user.email}
              readOnly
              style={{
                width:        '100%',
                padding:      '10px 12px',
                border:       '1px solid #E2E8F0',
                borderRadius: '8px',
                fontSize:     '14px',
                background:   '#F8FAFC',
                color:        '#94A3B8',
              }}
            />
            <p style={{ fontSize: '12px', color: '#94A3B8', margin: '6px 0 0' }}>
              Managed via Google Workspace
            </p>
          </div>

          <button
            type="submit"
            disabled={processing}
            style={{
              background:   '#028090',
              color:        '#fff',
              border:       'none',
              borderRadius: '8px',
              padding:      '10px 20px',
              fontSize:     '14px',
              fontWeight:   600,
              cursor:       processing ? 'default' : 'pointer',
              opacity:      processing ? 0.6 : 1,
            }}
          >
            {processing ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </AppLayout>
  )
}