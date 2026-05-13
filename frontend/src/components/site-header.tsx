import { Bell, CircleUserRound } from 'lucide-react'

type SiteHeaderProps = {
  compact?: boolean
}

export const SiteHeader = ({ compact = false }: SiteHeaderProps) => {
  return (
    <header className="sticky top-0 z-20 border-b border-plum/10 bg-mist/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
        <a
          href="#assistant"
          className="text-2xl font-bold tracking-[-0.03em] text-ink sm:text-3xl"
        >
          Stil & Ekonomi
        </a>
        {!compact ? (
          <nav aria-label="Ana menü" className="hidden items-center gap-8 text-sm font-semibold md:flex">
            <a className="border-b-2 border-plum pb-1 text-plum" href="#assistant">
              Asistan
            </a>
            <a className="text-ink/60 transition hover:text-plum" href="#wardrobe">
              Dolabım
            </a>
            <a className="text-ink/60 transition hover:text-plum" href="#deals">
              Fırsatlar
            </a>
          </nav>
        ) : null}
        <div className="flex items-center gap-3 text-ink">
          <button
            type="button"
            aria-label="Bildirimleri aç"
            className="rounded-full bg-lilac/70 p-2 transition hover:bg-lilac"
          >
            <Bell size={18} />
          </button>
          <button
            type="button"
            aria-label="Profil menüsünü aç"
            className="rounded-full bg-plum p-2 text-white transition hover:bg-violet"
          >
            <CircleUserRound size={18} />
          </button>
        </div>
      </div>
    </header>
  )
}
