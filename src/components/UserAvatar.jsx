import React, { useState } from 'react'

export default function UserAvatar({
  user,
  className = 'w-6 h-6',
  textClassName = 'text-[10px]',
}) {
  const [hasError, setHasError] = useState(false)

  const initial = (
    user?.firstName?.[0] ||
    user?.name?.[0] ||
    user?.email?.[0] ||
    'U'
  ).toUpperCase()

  if (user?.picture && !hasError) {
    return (
      <img
        src={user.picture}
        alt={user.name || 'User Profile'}
        referrerPolicy="no-referrer"
        crossOrigin="anonymous"
        onError={() => setHasError(true)}
        className={`${className} rounded-full object-cover ring-1 ring-slate-200/80 shadow-2xs shrink-0`}
      />
    )
  }

  return (
    <div
      className={`${className} rounded-full bg-slate-900 text-white flex items-center justify-center font-bold ${textClassName} shrink-0 shadow-2xs select-none`}
    >
      {initial}
    </div>
  )
}
