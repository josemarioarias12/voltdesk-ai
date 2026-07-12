interface Props {
  avatarUrl?: string | null
  firstName?: string | null
  size: number
}

export default function Avatar({ avatarUrl, firstName, size }: Props) {
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={firstName ? `${firstName}'s avatar` : 'User avatar'}
        style={{
          width:        `${size}px`,
          height:       `${size}px`,
          borderRadius: '50%',
          objectFit:    'cover',
          flexShrink:   0,
        }}
      />
    )
  }

  return (
    <div
      style={{
        width:          `${size}px`,
        height:         `${size}px`,
        borderRadius:   '50%',
        background:     '#028090',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        flexShrink:     0,
      }}
    >
      <span style={{
        color:      '#fff',
        fontWeight: 700,
        fontSize:   `${Math.round(size * 0.4)}px`,
      }}>
        {firstName?.charAt(0) ?? 'U'}
      </span>
    </div>
  )
}