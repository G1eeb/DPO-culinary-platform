interface AvatarProps {
  avatarUrl?: string | null
  username: string
  size?: number
  className?: string
}

const TONES = [
  '#A98E6B', '#7E8C6E', '#B5654A', '#6B7A8D',
  '#8D6B7A', '#7A8D6B', '#6B8D8A', '#8D7A6B',
]

function initials(name: string) {
  return name
    .split(/[\s_]/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
}

function tone(name: string) {
  let h = 0
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) & 0xffffffff
  return TONES[Math.abs(h) % TONES.length]
}

export function Avatar({ avatarUrl, username, size = 38, className = '' }: AvatarProps) {
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={username}
        className={`rounded-full object-cover flex-none ${className}`}
        style={{ width: size, height: size }}
      />
    )
  }
  return (
    <span
      className={`flex-none rounded-full flex items-center justify-center text-white font-semibold font-manrope ${className}`}
      style={{ width: size, height: size, background: tone(username), fontSize: size * 0.35 }}
    >
      {initials(username)}
    </span>
  )
}
