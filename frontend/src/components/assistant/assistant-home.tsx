'use client'

import { ArrowRight, BadgePercent, Camera, Lock, PiggyBank, Sparkles, UsersRound } from 'lucide-react'
import type { FormEvent } from 'react'
import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import type { CompressedImage } from '@/lib/compress-image'
import { pickRandomPromptSuggestions } from '@/lib/prompt-suggestions'

type AssistantHomeProps = {
  prompt: string
  isLoading: boolean
  fitMode: boolean
  fitImage: CompressedImage | null
  onPromptChange: (prompt: string) => void
  onSubmit: () => void
  onCheaperRequest: () => void
  onOpenFitModal: () => void
  onFitImageClear: () => void
  isAuthenticated: boolean
  onWardrobeClick: () => void
}

export const AssistantHome = ({
  prompt,
  isLoading,
  fitMode,
  fitImage,
  onPromptChange,
  onSubmit,
  onCheaperRequest,
  onOpenFitModal,
  onFitImageClear,
  isAuthenticated,
  onWardrobeClick,
}: AssistantHomeProps) => {
  const [promptChips, setPromptChips] = useState<string[]>([])

  useEffect(() => {
    setPromptChips(pickRandomPromptSuggestions(4))
  }, [])

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onSubmit()
  }

  const canSubmit = fitMode ? Boolean(fitImage) : prompt.trim().length >= 3
  const hasFitPhoto = Boolean(fitImage)

  return (
    <section id="assistant" className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-16">
      <div className="mx-auto max-w-3xl text-center">
        <span className="inline-flex size-16 animate-orbit-pulse items-center justify-center rounded-full bg-plum text-lilac shadow-atelier">
          <Sparkles size={30} />
        </span>
        <h1 className="mt-6 text-4xl font-bold tracking-[-0.04em] text-ink sm:text-5xl">
          {hasFitPhoto ? 'Parçana ne uyar?' : 'Bugün ne için kombin arıyorsun?'}
        </h1>
        <p className="mt-4 text-lg text-ink/65">
          {hasFitPhoto
            ? 'İsteğe bağlı notunu yaz; eksik parçaları katalogdan önerelim.'
            : 'Stil asistanın hem bütçeni hem dolabını senin için düşünsün.'}
        </p>
      </div>
      <form
        onSubmit={handleSubmit}
        className="mx-auto mt-9 max-w-4xl rounded-[2rem] border border-white/80 bg-white/82 p-4 shadow-atelier backdrop-blur"
      >
        <div
          className={`rounded-3xl border p-4 ${
            hasFitPhoto
              ? 'border-violet/30 bg-gradient-to-br from-white via-lilac/30 to-violet/10'
              : 'border-plum/10 bg-gradient-to-br from-white to-lilac/45'
          }`}
        >
          {hasFitPhoto ? (
            <>
              <div className="flex items-center gap-3 rounded-2xl border border-plum/10 bg-white/90 p-3">
                <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-xl border border-plum/10">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={fitImage?.previewUrl}
                    alt="Yüklenen parça"
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-plum">Yüklenen parça</p>
                  <p className="text-xs text-ink/55">Üst, alt veya ceket — tamamlayıcı öneriler buna göre</p>
                </div>
                <div className="flex shrink-0 flex-col gap-1 sm:flex-row">
                  <Button type="button" variant="secondary" className="text-xs" onClick={onOpenFitModal}>
                    Değiştir
                  </Button>
                  <Button type="button" variant="ghost" className="text-xs" onClick={onFitImageClear}>
                    Kaldır
                  </Button>
                </div>
              </div>
              <label
                htmlFor="fit-prompt"
                className="mt-4 block text-xs font-bold uppercase tracking-[0.2em] text-violet"
              >
                İsteğe bağlı not
              </label>
              <textarea
                id="fit-prompt"
                value={prompt}
                onChange={(event) => onPromptChange(event.target.value)}
                placeholder="Örn: akşam yemeği için şık ama rahat, indirimli parçalar..."
                rows={3}
                className="mt-2 min-h-24 w-full resize-none bg-transparent text-lg text-ink outline-none placeholder:text-ink/35"
              />
            </>
          ) : (
            <textarea
              value={prompt}
              onChange={(event) => onPromptChange(event.target.value)}
              placeholder="Yazlık, uygun fiyatlı bir akşam yemeği kombini..."
              rows={4}
              className="min-h-28 w-full resize-none bg-transparent text-lg text-ink outline-none placeholder:text-ink/35"
            />
          )}

          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
            <Button
              type="button"
              variant={hasFitPhoto ? 'primary' : 'secondary'}
              aria-label="Buna ne uyar — fotoğraf yükle"
              aria-pressed={hasFitPhoto}
              onClick={onOpenFitModal}
            >
              <Camera size={17} />
              Buna ne uyar?
            </Button>
            <Button type="submit" disabled={isLoading || !canSubmit}>
              {isLoading ? 'Düşünüyor...' : 'Kombin Bul'}
              <ArrowRight size={18} />
            </Button>
          </div>
        </div>
      </form>
      <div className="mt-7 text-center">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-ink/45">İlham al</p>
        <div className="mt-4 flex flex-wrap justify-center gap-3">
          {promptChips.map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => onPromptChange(chip)}
              className="rounded-full border border-plum/15 bg-white px-4 py-2 text-sm font-semibold text-plum shadow-card transition hover:-translate-y-0.5 hover:bg-plum hover:text-white"
            >
              {chip}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-14 grid gap-5 lg:grid-cols-[0.8fr_1.6fr]">
        <aside className="rounded-[2rem] border border-plum/10 bg-white/80 p-6 shadow-card backdrop-blur">
          <div className="inline-flex rounded-xl bg-plum p-3 text-white">
            <PiggyBank size={22} />
          </div>
          <h2 className="mt-5 text-sm font-bold uppercase tracking-[0.18em] text-plum">Akıllı Tasarruf</h2>
          <p className="mt-4 leading-7 text-ink/70">
            Asistanımız ürünlerin fiyat geçmişini ve indirim oranını yorumlayarak en doğru alım zamanını simüle eder.
          </p>
          <button
            type="button"
            onClick={onCheaperRequest}
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-violet px-4 py-2 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-plum hover:shadow-card"
          >
            <BadgePercent size={17} />
            Daha ucuzunu ara
          </button>
          <div className="mt-14 flex items-center">
            <span className="size-9 rounded-full border-2 border-lilac bg-[url('https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80')] bg-cover" />
            <span className="-ml-3 size-9 rounded-full border-2 border-lilac bg-[url('https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80')] bg-cover" />
            <span className="-ml-3 inline-flex size-9 items-center justify-center rounded-full border-2 border-lilac bg-plum text-xs font-bold text-white">
              +12k
            </span>
          </div>
        </aside>
        <div className="relative min-h-[28rem] overflow-hidden rounded-[2rem] bg-plum p-6 shadow-atelier">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(232,222,251,0.35),transparent_26rem)]" />
          <div className="relative mx-auto max-w-3xl rounded-2xl border border-white/10 bg-white/10 p-5">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-[0.2em] text-white/60">
              <span>Dolabım</span>
              <span>AI Öncesi</span>
            </div>
            <div className="mt-5 grid grid-cols-5 gap-2">
              {Array.from({ length: 15 }).map((_, index) => (
                <span
                  key={index}
                  className="h-24 rounded-t-full bg-gradient-to-b from-white/85 to-lilac/30"
                />
              ))}
            </div>
          </div>
          <div className="relative mt-8 max-w-md rounded-2xl border border-white/15 bg-white/15 p-5 text-white backdrop-blur">
            <p className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.18em] text-lilac">
              <Sparkles size={18} />
              Günün Tavsiyesi
            </p>
            <p className="mt-3 leading-7 text-white/80">
              Dolabındaki lacivert tonlarla bu haftaki indirimli ipek gömlek harika bir sessiz lüks kombini oluşturur.
            </p>
          </div>
          <UsersRound className="absolute bottom-6 right-6 text-lilac/50" size={42} />
        </div>
      </div>
      <section className="mt-6 rounded-[2rem] border border-plum/10 bg-white/82 p-6 shadow-card backdrop-blur md:flex md:items-center md:justify-between md:gap-6">
        <div>
          <p className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.2em] text-violet">
            <Lock size={17} />
            Dolabım
          </p>
          <h2 className="mt-2 text-2xl font-bold tracking-[-0.03em] text-ink">
            Kendi parçalarını kaydetmek üyeye özel.
          </h2>
          <p className="mt-2 max-w-2xl leading-7 text-ink/65">
            Hesap açmadan kombin önerisi alabilirsin. Dolabım alanı, kayıtlı ürünler ve kişisel stil hafızası için giriş gerekir.
          </p>
        </div>
        <Button
          type="button"
          variant={isAuthenticated ? 'primary' : 'ghost'}
          className="mt-5 md:mt-0"
          onClick={onWardrobeClick}
        >
          {isAuthenticated ? 'Dolabıma Git' : 'Giriş Yap ve Aç'}
          <ArrowRight size={18} />
        </Button>
      </section>
    </section>
  )
}
