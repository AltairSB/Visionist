'use client'

import { LogOut, Save, Shirt, Sparkles, UserRound } from 'lucide-react'

import { Button } from '@/components/ui/button'
import type { Account, Segment, StylePreference, UserProfile } from '@/lib/types'
import { cn } from '@/lib/utils'

const segmentOptions: { id: Segment; label: string }[] = [
  { id: 'child', label: 'Çocuk' },
  { id: 'young', label: 'Genç' },
  { id: 'adult', label: 'Yetişkin' },
]

const styleOptions: { id: StylePreference; label: string }[] = [
  { id: 'classic', label: 'Klasik' },
  { id: 'sport', label: 'Spor' },
  { id: 'daily', label: 'Günlük' },
]

type AccountPageProps = {
  account: Account
  profile: UserProfile
  onProfileChange: (profile: UserProfile) => void
  onBackToAssistant: () => void
  onSignOut: () => void
}

export const AccountPage = ({
  account,
  profile,
  onProfileChange,
  onBackToAssistant,
  onSignOut,
}: AccountPageProps) => {
  const handleProfileChange = (nextProfile: Partial<UserProfile>) => {
    onProfileChange({ ...profile, ...nextProfile })
  }

  return (
    <section className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14">
      <div className="grid gap-6 lg:grid-cols-[0.82fr_1.18fr]">
        <aside className="relative overflow-hidden rounded-[2rem] bg-plum p-7 text-white shadow-atelier">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(232,222,251,0.42),transparent_20rem)]" />
          <div className="relative">
            <span className="inline-flex size-16 items-center justify-center rounded-3xl bg-white/12 text-lilac">
              <UserRound size={30} />
            </span>
            <h1 className="mt-7 text-4xl font-bold tracking-[-0.04em]">{account.name}</h1>
            <p className="mt-2 text-white/68">{account.email}</p>
            <div className="mt-8 rounded-3xl border border-white/15 bg-white/10 p-5 backdrop-blur">
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-lilac">Kayıtlı Profil</p>
              <p className="mt-3 leading-7 text-white/75">
                Ölçüleriniz ve stil tercihiniz öneri motoru tarafından her kombin isteğinde kullanılır.
              </p>
            </div>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row lg:flex-col">
              <Button type="button" variant="secondary" onClick={onBackToAssistant}>
                <Sparkles size={18} />
                Asistana Dön
              </Button>
              <button
                type="button"
                onClick={onSignOut}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/20"
              >
                <LogOut size={18} />
                Çıkış Yap
              </button>
            </div>
          </div>
        </aside>
        <div className="space-y-6">
          <section className="rounded-[2rem] border border-plum/10 bg-white/78 p-6 shadow-card backdrop-blur sm:p-8">
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-violet">Profil Bilgileri</p>
            <h2 className="mt-2 text-3xl font-bold tracking-[-0.04em] text-ink">
              Bilgilerini sonradan güncelle.
            </h2>
            <div className="mt-7 grid gap-5 sm:grid-cols-2">
              <label className="block">
                <span className="text-xs font-bold uppercase tracking-[0.18em] text-ink">Boy (cm)</span>
                <input
                  type="number"
                  value={profile.height}
                  onChange={(event) => handleProfileChange({ height: Number(event.target.value) })}
                  className="mt-2 w-full rounded-2xl border border-plum/15 bg-mist px-4 py-3 outline-none transition focus:border-violet focus:ring-4 focus:ring-violet/10"
                />
              </label>
              <label className="block">
                <span className="text-xs font-bold uppercase tracking-[0.18em] text-ink">Kilo (kg)</span>
                <input
                  type="number"
                  value={profile.weight}
                  onChange={(event) => handleProfileChange({ weight: Number(event.target.value) })}
                  className="mt-2 w-full rounded-2xl border border-plum/15 bg-mist px-4 py-3 outline-none transition focus:border-violet focus:ring-4 focus:ring-violet/10"
                />
              </label>
            </div>
            <div className="mt-7 grid gap-5 sm:grid-cols-2">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-ink">Segment</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {segmentOptions.map((segment) => (
                    <button
                      key={segment.id}
                      type="button"
                      onClick={() => handleProfileChange({ segment: segment.id })}
                      className={cn(
                        'rounded-full border px-4 py-2 text-sm font-bold transition',
                        profile.segment === segment.id
                          ? 'border-plum bg-plum text-white'
                          : 'border-plum/15 bg-white text-plum hover:bg-lilac/60',
                      )}
                    >
                      {segment.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-ink">Stil</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {styleOptions.map((style) => (
                    <button
                      key={style.id}
                      type="button"
                      onClick={() => handleProfileChange({ style: style.id })}
                      className={cn(
                        'rounded-full border px-4 py-2 text-sm font-bold transition',
                        profile.style === style.id
                          ? 'border-violet bg-violet text-white'
                          : 'border-plum/15 bg-white text-plum hover:bg-lilac/60',
                      )}
                    >
                      {style.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-8 rounded-2xl bg-lilac/70 p-4 text-sm font-semibold text-plum">
              <Save className="mr-2 inline" size={17} />
              Değişiklikler otomatik olarak bu cihazda kaydedilir.
            </div>
          </section>
          <section id="wardrobe" className="rounded-[2rem] border border-plum/10 bg-plum p-6 text-white shadow-card sm:p-8">
            <p className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.22em] text-lilac">
              <Shirt size={18} />
              Dolabım
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-[-0.04em]">Üyeye özel stil hafızası</h2>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {['Lacivert blazer', 'Bej kazak', 'Beyaz sneaker'].map((item) => (
                <div key={item} className="rounded-2xl border border-white/12 bg-white/10 p-4">
                  <span className="block h-28 rounded-xl bg-gradient-to-br from-lilac/70 to-white/15" />
                  <p className="mt-3 font-bold">{item}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </section>
  )
}
