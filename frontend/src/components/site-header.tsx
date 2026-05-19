'use client'

import { Bell, CircleUserRound, LogIn, Pencil, UserPlus, X } from 'lucide-react'
import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'

import type { Account } from '@/lib/types'
import { cn } from '@/lib/utils'

type SiteHeaderProps = {
  account: Account | null
  compact?: boolean
  view: 'assistant' | 'account' | 'account-settings' | 'wardrobe'
  onSignInClick: () => void
  onSignUpClick: () => void
  onAccountClick: () => void
  onAccountSettingsClick: () => void
  onLogoClick: () => void
  onAssistantClick: () => void
  onWardrobeClick: () => void
}

export const SiteHeader = ({
  account,
  compact = false,
  view,
  onSignInClick,
  onSignUpClick,
  onAccountClick,
  onAccountSettingsClick,
  onLogoClick,
  onAssistantClick,
  onWardrobeClick,
}: SiteHeaderProps) => {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
  const notificationsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isNotificationsOpen) {
      return
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!notificationsRef.current?.contains(event.target as Node)) {
        setIsNotificationsOpen(false)
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsNotificationsOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isNotificationsOpen])

  const handleNotificationsToggle = () => {
    setIsNotificationsOpen((current) => !current)
  }

  return (
    <header className="sticky top-0 z-20 border-b border-plum/10 bg-mist/86 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
        <button
          type="button"
          onClick={onLogoClick}
          className="group flex items-center gap-3 rounded-full pr-2 text-left transition hover:-translate-y-0.5"
          aria-label="Visionist ana sayfasına git"
        >
          <span className="relative inline-flex size-11 shrink-0 overflow-hidden rounded-2xl shadow-card ring-0 ring-violet/0 transition group-hover:shadow-atelier group-hover:ring-2 group-hover:ring-violet/35 group-hover:brightness-110">
            <Image
              src="/logo/visionist-mark.png"
              alt=""
              width={44}
              height={44}
              className="size-full object-cover"
              priority
            />
          </span>
          <span className="bg-gradient-to-r from-ink via-plum to-violet bg-clip-text font-display text-[2rem] font-bold tracking-[-0.06em] text-transparent sm:text-[2.45rem]">
            Visionist
          </span>
        </button>
        {!compact ? (
          <nav aria-label="Ana menü" className="hidden items-center gap-8 text-sm font-semibold md:flex">
            <button
              type="button"
              onClick={onAssistantClick}
              className={cn(
                'pb-1 transition',
                view === 'assistant' ? 'border-b-2 border-plum text-plum' : 'text-ink/60 hover:text-plum',
              )}
            >
              Asistan
            </button>
            <button
              type="button"
              onClick={onWardrobeClick}
              className={cn(
                'pb-1 transition',
                view === 'wardrobe'
                  ? 'border-b-2 border-plum text-plum'
                  : account
                    ? 'text-ink/60 hover:text-plum'
                    : 'text-ink/35 hover:text-plum',
              )}
              aria-label={account ? 'Dolabım sayfasını aç' : 'Dolabım için giriş yap'}
            >
              Dolabım{account ? '' : ' · Üye'}
            </button>
          </nav>
        ) : null}
        <div className="flex items-center gap-2 text-ink sm:gap-3">
          <div ref={notificationsRef} className="relative">
            <button
              type="button"
              aria-label="Bildirimleri aç"
              aria-expanded={isNotificationsOpen}
              aria-haspopup="dialog"
              onClick={handleNotificationsToggle}
              className="rounded-full border border-plum/10 bg-white p-2 transition hover:-translate-y-0.5 hover:bg-lilac"
            >
              <Bell size={18} />
            </button>
            {isNotificationsOpen ? (
              <div
                role="dialog"
                aria-label="Bildirimler"
                className="absolute right-0 top-full z-30 mt-2 w-72 rounded-2xl border border-plum/10 bg-white p-4 shadow-atelier"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-plum">Bildirimler</p>
                    <p className="mt-1 text-sm leading-6 text-ink/65">
                      İndirim ve fiyat düşüşü uyarıları burada görünecek. Bu sürümde henüz aktif değil.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsNotificationsOpen(false)}
                    aria-label="Bildirim panelini kapat"
                    className="rounded-full p-1 text-ink/50 transition hover:bg-lilac/60 hover:text-plum"
                  >
                    <X size={16} />
                  </button>
                </div>
                <p className="mt-4 rounded-xl bg-lilac/50 px-3 py-2 text-xs font-semibold text-plum">
                  Henüz bildiriminiz yok.
                </p>
              </div>
            ) : null}
          </div>
          {account ? (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={onAccountClick}
                aria-label="Hesap sayfasını aç"
                className="group flex items-center gap-2 rounded-full bg-plum py-2 pl-2 pr-2 text-white transition hover:-translate-y-0.5 hover:bg-violet hover:shadow-card sm:pr-3"
              >
                <span className="inline-flex size-7 items-center justify-center rounded-full bg-white/15">
                  <CircleUserRound size={17} />
                </span>
                <span className="hidden max-w-24 truncate text-sm font-bold sm:block">{account.name}</span>
              </button>
              <button
                type="button"
                onClick={onAccountSettingsClick}
                aria-label="Hesap ayarlarını düzenle"
                className="rounded-full border border-plum/10 bg-white p-2 text-plum transition hover:-translate-y-0.5 hover:bg-lilac"
              >
                <Pencil size={16} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onSignInClick}
                className="hidden items-center gap-2 rounded-full border border-plum/20 bg-white px-4 py-2 text-sm font-bold text-plum transition hover:-translate-y-0.5 hover:bg-lilac/60 sm:inline-flex"
              >
                <LogIn size={16} />
                Sign in
              </button>
              <button
                type="button"
                onClick={onSignUpClick}
                className="inline-flex items-center gap-2 rounded-full bg-plum px-4 py-2 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-violet hover:shadow-card"
              >
                <UserPlus size={16} />
                <span className="hidden sm:inline">Sign up</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
