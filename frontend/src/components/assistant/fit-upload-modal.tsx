'use client'

import { Camera, ImagePlus, X } from 'lucide-react'
import type { ChangeEvent } from 'react'
import { useEffect, useId, useRef } from 'react'

import { Button } from '@/components/ui/button'
import type { CompressedImage } from '@/lib/compress-image'
import { cn } from '@/lib/utils'

type FitUploadModalProps = {
  isOpen: boolean
  fitImage: CompressedImage | null
  isLoading: boolean
  onClose: () => void
  onSelectFile: (file: File) => void
  onClearImage: () => void
  onExitFitMode: () => void
}

export const FitUploadModal = ({
  isOpen,
  fitImage,
  isLoading,
  onClose,
  onSelectFile,
  onClearImage,
  onExitFitMode,
}: FitUploadModalProps) => {
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!isOpen) {
      return
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  if (!isOpen) {
    return null
  }

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }
    onSelectFile(file)
    event.target.value = ''
  }

  const handlePickClick = () => {
    inputRef.current?.click()
  }

  const handleExitFitMode = () => {
    onExitFitMode()
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-ink/55 px-5 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="fit-upload-title"
    >
      <div className="relative w-full max-w-lg overflow-hidden rounded-[2rem] border border-white/20 bg-mist p-6 shadow-atelier animate-float-in">
        <button
          type="button"
          onClick={onClose}
          aria-label="Pencereyi kapat"
          className="absolute right-4 top-4 rounded-full bg-white/80 p-2 text-plum transition hover:bg-white"
        >
          <X size={18} />
        </button>

        <div className="inline-flex rounded-xl bg-plum p-3 text-white">
          <Camera size={22} />
        </div>
        <h2 id="fit-upload-title" className="mt-4 text-2xl font-bold tracking-[-0.03em] text-ink">
          Buna ne uyar?
        </h2>
        <p className="mt-2 text-sm leading-7 text-ink/65">
          Kombinini tamamlamak istediğin parçanın fotoğrafını yükle. Üst giyim, alt giyim veya ceket
          olabilir; asistan eksik parçaları önerecek.
        </p>

        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
          className="sr-only"
          onChange={handleFileChange}
          aria-label="Kıyafet fotoğrafı seç"
        />

        {fitImage ? (
          <div className="mt-6 flex flex-col items-center gap-4">
            <div className="relative h-48 w-40 overflow-hidden rounded-2xl border border-plum/15 bg-white shadow-card">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={fitImage.previewUrl}
                alt="Yüklenen kıyafet önizlemesi"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              <Button type="button" variant="secondary" onClick={handlePickClick} disabled={isLoading}>
                Başka fotoğraf seç
              </Button>
              <Button type="button" variant="ghost" onClick={onClearImage} disabled={isLoading}>
                Kaldır
              </Button>
            </div>
            <Button type="button" variant="primary" className="w-full" onClick={onClose} disabled={isLoading}>
              Devam et
            </Button>
          </div>
        ) : (
          <button
            type="button"
            onClick={handlePickClick}
            disabled={isLoading}
            className={cn(
              'mt-6 flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-violet/35 bg-white px-4 py-10 transition',
              'hover:border-violet hover:bg-lilac/20 focus:outline-none focus:ring-4 focus:ring-violet/20',
            )}
          >
            <ImagePlus className="text-violet" size={32} />
            <span className="text-sm font-semibold text-plum">Fotoğraf seç</span>
            <span className="text-xs text-ink/50">JPEG, PNG veya WebP · en fazla 8 MB</span>
          </button>
        )}

        <button
          type="button"
          onClick={handleExitFitMode}
          className="mt-4 w-full text-center text-sm font-semibold text-ink/50 transition hover:text-plum"
        >
          Fit modundan çık
        </button>
      </div>
    </div>
  )
}
