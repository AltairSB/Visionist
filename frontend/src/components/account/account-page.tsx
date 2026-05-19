'use client'

import { CheckCircle2, LogOut, Save, Settings, Sparkles, UserRound, X } from 'lucide-react'
import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { getGenderLabels } from '@/lib/style-images'
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
  { id: 'chic', label: 'Şık' },
  { id: 'vintage', label: 'Vintage' },
  { id: 'minimal', label: 'Minimal' },
]

type AccountPageProps = {
  account: Account
  profile: UserProfile
  onProfileSave: (profile: UserProfile) => void
  onBackToAssistant: () => void
  onOpenAccountSettings: () => void
  onSignOut: () => void
}

export const AccountPage = ({
  account,
  profile,
  onProfileSave,
  onBackToAssistant,
  onOpenAccountSettings,
  onSignOut,
}: AccountPageProps) => {
  const [draftProfile, setDraftProfile] = useState(profile)
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false)

  useEffect(() => {
    setDraftProfile(profile)
  }, [profile])

  const genderOptions = getGenderLabels(draftProfile.segment)

  const handleDraftChange = (nextProfile: Partial<UserProfile>) => {
    setDraftProfile((current) => ({ ...current, ...nextProfile }))
  }

  const handleSave = () => {
    onProfileSave(draftProfile)
    setIsSaveModalOpen(true)
  }

  const handleCloseSaveModal = () => {
    setIsSaveModalOpen(false)
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
              <Button type="button" variant="secondary" onClick={onOpenAccountSettings}>
                <Settings size={18} />
                Hesap ayarları
              </Button>
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
            <div className="mt-7">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-ink">Cinsiyet</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {genderOptions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => handleDraftChange({ gender: option.id })}
                    className={cn(
                      'rounded-full border px-4 py-2 text-sm font-bold transition',
                      draftProfile.gender === option.id
                        ? 'border-violet bg-violet text-white'
                        : 'border-plum/15 bg-white text-plum hover:bg-lilac/60',
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-7">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-ink">Beden tercihi</p>
              <div className="mt-3 grid grid-cols-4 gap-2">
                {(['S', 'M', 'L', 'XL'] as const).map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => handleDraftChange({ preferred_size: size })}
                    className={cn(
                      'rounded-xl border py-2.5 text-sm font-bold transition',
                      draftProfile.preferred_size === size
                        ? 'border-violet bg-violet text-white'
                        : 'border-plum/15 bg-mist text-plum hover:bg-lilac/60',
                    )}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-7 grid gap-5 sm:grid-cols-2">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-ink">Segment</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {segmentOptions.map((segment) => (
                    <button
                      key={segment.id}
                      type="button"
                      onClick={() => handleDraftChange({ segment: segment.id })}
                      className={cn(
                        'rounded-full border px-4 py-2 text-sm font-bold transition',
                        draftProfile.segment === segment.id
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
                      onClick={() => handleDraftChange({ style: style.id })}
                      className={cn(
                        'rounded-full border px-4 py-2 text-sm font-bold transition',
                        draftProfile.style === style.id
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
            <div className="mt-8">
              <Button type="button" className="w-full sm:w-auto" onClick={handleSave}>
                <Save size={18} />
                Güncellemeleri Kaydet
              </Button>
            </div>
          </section>
        </div>
      </div>
      {isSaveModalOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink/55 px-5 backdrop-blur-md">
          <div
            role="dialog"
            aria-label="Profil kaydedildi"
            className="relative w-full max-w-md rounded-[2rem] border border-white/20 bg-mist p-8 text-center shadow-atelier"
          >
            <button
              type="button"
              onClick={handleCloseSaveModal}
              aria-label="Bildirimi kapat"
              className="absolute right-4 top-4 rounded-full bg-white/80 p-2 text-plum transition hover:bg-white"
            >
              <X size={18} />
            </button>
            <span className="mx-auto inline-flex size-16 items-center justify-center rounded-full bg-plum text-lilac">
              <CheckCircle2 size={32} />
            </span>
            <h3 className="mt-6 text-2xl font-bold tracking-[-0.03em] text-ink">Profil güncellendi</h3>
            <p className="mt-3 leading-7 text-ink/65">
              Tercihleriniz kaydedildi. Kombin önerileri yeni bilgilerinize göre hazırlanacak.
            </p>
            <Button type="button" className="mt-7 w-full" onClick={handleCloseSaveModal}>
              Tamam
            </Button>
          </div>
        </div>
      ) : null}
    </section>
  )
}
