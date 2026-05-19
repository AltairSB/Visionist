export const SiteFooter = () => {
  return (
    <footer className="border-t border-plum/10 bg-plum text-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-6 sm:px-8 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xl font-semibold">Visionist</p>
          <p className="mt-1 text-sm text-white/70">
            © 2026 Visionist. Tüm hakları saklıdır.
          </p>
        </div>
        <nav aria-label="Alt menü" className="flex flex-wrap gap-5 text-sm text-white/75">
          <a className="transition hover:text-white" href="#privacy">
            Gizlilik
          </a>
          <a className="transition hover:text-white" href="#terms">
            Kullanım Şartları
          </a>
          <a className="transition hover:text-white" href="#support">
            Destek
          </a>
        </nav>
      </div>
    </footer>
  )
}
