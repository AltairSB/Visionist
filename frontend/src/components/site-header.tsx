import { Bell, CircleUserRound, LogIn, Sparkles, UserPlus } from 'lucide-react'

import type { Account } from '@/lib/types'
import { cn } from '@/lib/utils'

type SiteHeaderProps = {
  account: Account | null
  compact?: boolean
  view: 'assistant' | 'account'
  onAuthClick: () => void
  onAccountClick: () => void
  onAssistantClick: () => void
  onWardrobeClick: () => void
}

export const SiteHeader = ({
  account,
  compact = false,
  view,
  onAuthClick,
  onAccountClick,
  onAssistantClick,
  onWardrobeClick,
}: SiteHeaderProps) => {
  return (
    <header className="sticky top-0 z-20 border-b border-plum/10 bg-mist/86 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
        <button
          type="button"
          onClick={onAssistantClick}
          className="group flex items-center gap-3 rounded-full pr-2 text-left transition hover:-translate-y-0.5"
          aria-label="Visionist ana sayfasına git"
        >
          <span className="relative inline-flex size-11 items-center justify-center rounded-2xl bg-plum text-lilac shadow-card transition group-hover:bg-violet group-hover:shadow-atelier">
            <span className="font-display text-3xl font-bold leading-none tracking-[-0.08em]">V</span>
            <Sparkles className="absolute -right-1 -top-1 rounded-full bg-white p-0.5 text-violet" size={16} />
          </span>
          <span className="flex flex-col leading-none">
            <span className="bg-gradient-to-r from-ink via-plum to-violet bg-clip-text font-display text-[2rem] font-bold tracking-[-0.06em] text-transparent sm:text-[2.45rem]">
              Visionist
            </span>
            <span className="-mt-0.5 hidden text-[0.6rem] font-bold uppercase tracking-[0.34em] text-violet/70 sm:block">
              AI Atelier
            </span>
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
                account ? 'text-ink/60 hover:text-plum' : 'text-ink/35 hover:text-plum',
              )}
              aria-label={account ? 'Dolabım sayfasını aç' : 'Dolabım için giriş yap'}
            >
              Dolabım{account ? '' : ' · Üye'}
            </button>
            <a className="text-ink/60 transition hover:text-plum" href="#deals">
              Fırsatlar
            </a>
          </nav>
        ) : null}
        <div className="flex items-center gap-2 text-ink sm:gap-3">
          <button
            type="button"
            aria-label="Bildirimleri aç"
            className="rounded-full border border-plum/10 bg-white p-2 transition hover:-translate-y-0.5 hover:bg-lilac"
          >
            <Bell size={18} />
          </button>
          {account ? (
            <button
              type="button"
              onClick={onAccountClick}
              aria-label="Hesap sayfasını aç"
              className="group flex items-center gap-2 rounded-full bg-plum py-2 pl-2 pr-3 text-white transition hover:-translate-y-0.5 hover:bg-violet hover:shadow-card"
            >
              <span className="inline-flex size-7 items-center justify-center rounded-full bg-white/15">
                <CircleUserRound size={17} />
              </span>
              <span className="hidden max-w-24 truncate text-sm font-bold sm:block">{account.name}</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onAuthClick}
                className="hidden items-center gap-2 rounded-full border border-plum/20 bg-white px-4 py-2 text-sm font-bold text-plum transition hover:-translate-y-0.5 hover:bg-lilac/60 sm:inline-flex"
              >
                <LogIn size={16} />
                Sign in
              </button>
              <button
                type="button"
                onClick={onAuthClick}
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
