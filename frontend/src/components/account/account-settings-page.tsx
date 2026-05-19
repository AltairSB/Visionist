'use client'

import { ArrowLeft, CheckCircle2, KeyRound, Trash2, UserRound, X } from 'lucide-react'
import type { FormEvent } from 'react'
import { useCallback, useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { deleteAccount } from '@/lib/api'
import { signIn, signOut, updatePassword } from '@/lib/supabase/auth'
import { updateDisplayName } from '@/lib/supabase/profile'
import type { Account } from '@/lib/types'

type AccountSettingsPageProps = {
  account: Account
  onBack: () => void
  onAccountUpdated: (account: Account) => void
  onAccountDeleted: () => void
}

type ActiveModal = 'name' | 'password' | 'delete' | 'success' | null

const DELETE_CONFIRM_TEXT = 'SİL'

const translateAuthError = (message: string): string => {
  if (message.includes('same_password') || message.includes('Same password')) {
    return 'Yeni şifre mevcut şifrenizle aynı olamaz.'
  }

  if (message.includes('weak_password') || message.includes('Password')) {
    return 'Şifre yeterince güçlü değil. En az 6 karakter kullanın.'
  }

  if (message.includes('session') || message.includes('reauthenticate')) {
    return 'Güvenlik için çıkış yapıp tekrar giriş yaptıktan sonra şifrenizi değiştirin.'
  }

  return message
}

export const AccountSettingsPage = ({
  account,
  onBack,
  onAccountUpdated,
  onAccountDeleted,
}: AccountSettingsPageProps) => {
  const [activeModal, setActiveModal] = useState<ActiveModal>(null)
  const [successMessage, setSuccessMessage] = useState('')

  const [displayNameDraft, setDisplayNameDraft] = useState(account.name)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [deleteConfirmText, setDeleteConfirmText] = useState('')

  const [errorMessage, setErrorMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleCloseModal = useCallback(() => {
    if (isSubmitting) {
      return
    }

    setActiveModal(null)
    setErrorMessage('')
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setDeleteConfirmText('')
  }, [isSubmitting])

  useEffect(() => {
    if (!activeModal) {
      return
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isSubmitting) {
        handleCloseModal()
      }
    }

    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [activeModal, handleCloseModal, isSubmitting])

  const handleOpenNameModal = () => {
    setDisplayNameDraft(account.name)
    setErrorMessage('')
    setActiveModal('name')
  }

  const handleOpenPasswordModal = () => {
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setErrorMessage('')
    setActiveModal('password')
  }

  const handleOpenDeleteModal = () => {
    setDeleteConfirmText('')
    setErrorMessage('')
    setActiveModal('delete')
  }

  const handleNameSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrorMessage('')

    const trimmed = displayNameDraft.trim()

    if (trimmed.length < 2) {
      setErrorMessage('Görünen ad en az 2 karakter olmalıdır.')
      return
    }

    setIsSubmitting(true)

    try {
      const saved = await updateDisplayName(account.id, trimmed)

      if (!saved) {
        setErrorMessage('Ad güncellenemedi. Lütfen tekrar deneyin.')
        return
      }

      onAccountUpdated({ ...account, name: trimmed })
      setSuccessMessage('Görünen adınız güncellendi.')
      setActiveModal('success')
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Ad güncellenemedi.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePasswordSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrorMessage('')

    if (currentPassword.length < 6) {
      setErrorMessage('Mevcut şifrenizi girin.')
      return
    }

    if (newPassword.length < 6) {
      setErrorMessage('Yeni şifre en az 6 karakter olmalıdır.')
      return
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Yeni şifreler eşleşmiyor.')
      return
    }

    setIsSubmitting(true)

    try {
      await signIn(account.email, currentPassword)
      await updatePassword(newPassword)
      setSuccessMessage('Şifreniz güncellendi.')
      setActiveModal('success')
    } catch (error) {
      setErrorMessage(
        translateAuthError(
          error instanceof Error ? error.message : 'Şifre güncellenemedi.',
        ),
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrorMessage('')

    if (deleteConfirmText.trim() !== DELETE_CONFIRM_TEXT) {
      setErrorMessage(`Onaylamak için "${DELETE_CONFIRM_TEXT}" yazın.`)
      return
    }

    setIsSubmitting(true)

    try {
      await deleteAccount()
      await signOut()
      onAccountDeleted()
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Hesap silinemedi.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="mx-auto max-w-3xl px-5 py-10 sm:px-8 sm:py-14">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 text-sm font-bold text-plum transition hover:text-violet"
      >
        <ArrowLeft size={18} />
        Hesaba dön
      </button>

      <div className="mt-8 overflow-hidden rounded-[2rem] border border-plum/10 bg-white/78 shadow-card backdrop-blur">
        <div className="bg-plum px-6 py-8 text-white sm:px-8">
          <span className="inline-flex size-14 items-center justify-center rounded-2xl bg-white/12 text-lilac">
            <UserRound size={28} />
          </span>
          <h1 className="mt-5 text-3xl font-bold tracking-[-0.04em]">Hesap ayarları</h1>
          <p className="mt-2 text-white/70">Ad, şifre ve hesap güvenliği</p>
        </div>

        <div className="space-y-4 p-6 sm:p-8">
          <div className="rounded-2xl border border-plum/10 bg-mist/50 p-5">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-violet">Görünen ad</p>
            <p className="mt-2 text-lg font-bold text-ink">{account.name}</p>
            <Button type="button" variant="secondary" className="mt-4" onClick={handleOpenNameModal}>
              Düzenle
            </Button>
          </div>

          <div className="rounded-2xl border border-plum/10 bg-mist/50 p-5">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-violet">E-posta</p>
            <p className="mt-2 text-lg font-bold text-ink">{account.email}</p>
            <p className="mt-2 text-sm text-ink/55">E-posta adresi bu sürümde değiştirilemez.</p>
          </div>

          <div className="rounded-2xl border border-plum/10 bg-mist/50 p-5">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-violet">Şifre</p>
            <p className="mt-2 text-sm text-ink/65">Hesabınızı korumak için güçlü bir şifre kullanın.</p>
            <Button type="button" variant="secondary" className="mt-4" onClick={handleOpenPasswordModal}>
              <KeyRound size={18} />
              Şifreyi değiştir
            </Button>
          </div>

          <div className="rounded-2xl border border-rose/25 bg-rose/5 p-5">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-rose">Hesabı sil</p>
            <p className="mt-2 text-sm leading-6 text-ink/65">
              Hesabınızı sildiğinizde profil, kombin geçmişi ve dolap kayıtları kalıcı olarak silinir.
            </p>
            <button
              type="button"
              onClick={handleOpenDeleteModal}
              className="mt-4 inline-flex items-center gap-2 rounded-xl border border-rose/40 bg-white px-4 py-2.5 text-sm font-bold text-rose transition hover:bg-rose/10"
            >
              <Trash2 size={18} />
              Hesabı sil
            </button>
          </div>
        </div>
      </div>

      {activeModal === 'name' ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink/55 px-5 backdrop-blur-md">
          <form
            role="dialog"
            aria-label="Görünen adı düzenle"
            onSubmit={(event) => void handleNameSubmit(event)}
            className="relative w-full max-w-md rounded-[2rem] border border-white/20 bg-mist p-8 shadow-atelier"
          >
            <button
              type="button"
              onClick={handleCloseModal}
              aria-label="Kapat"
              className="absolute right-4 top-4 rounded-full bg-white/80 p-2 text-plum transition hover:bg-white"
            >
              <X size={18} />
            </button>
            <h2 className="text-2xl font-bold tracking-[-0.03em] text-ink">Görünen ad</h2>
            <label className="mt-6 block text-sm font-bold text-ink" htmlFor="display-name">
              Adınız
            </label>
            <input
              id="display-name"
              type="text"
              value={displayNameDraft}
              onChange={(event) => setDisplayNameDraft(event.target.value)}
              className="mt-2 w-full rounded-xl border border-plum/15 bg-white px-4 py-3 text-ink outline-none ring-violet/30 focus:ring-2"
              autoComplete="name"
            />
            {errorMessage ? <p className="mt-3 text-sm text-rose">{errorMessage}</p> : null}
            <div className="mt-7 flex gap-3">
              <Button type="button" variant="secondary" className="flex-1" onClick={handleCloseModal}>
                İptal
              </Button>
              <Button type="submit" className="flex-1" disabled={isSubmitting}>
                {isSubmitting ? 'Kaydediliyor…' : 'Kaydet'}
              </Button>
            </div>
          </form>
        </div>
      ) : null}

      {activeModal === 'password' ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink/55 px-5 backdrop-blur-md">
          <form
            role="dialog"
            aria-label="Şifre değiştir"
            onSubmit={(event) => void handlePasswordSubmit(event)}
            className="relative w-full max-w-md rounded-[2rem] border border-white/20 bg-mist p-8 shadow-atelier"
          >
            <button
              type="button"
              onClick={handleCloseModal}
              aria-label="Kapat"
              className="absolute right-4 top-4 rounded-full bg-white/80 p-2 text-plum transition hover:bg-white"
            >
              <X size={18} />
            </button>
            <h2 className="text-2xl font-bold tracking-[-0.03em] text-ink">Şifre değiştir</h2>
            <label className="mt-6 block text-sm font-bold text-ink" htmlFor="current-password">
              Mevcut şifre
            </label>
            <input
              id="current-password"
              type="password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              className="mt-2 w-full rounded-xl border border-plum/15 bg-white px-4 py-3 text-ink outline-none ring-violet/30 focus:ring-2"
              autoComplete="current-password"
            />
            <label className="mt-4 block text-sm font-bold text-ink" htmlFor="new-password">
              Yeni şifre
            </label>
            <input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              className="mt-2 w-full rounded-xl border border-plum/15 bg-white px-4 py-3 text-ink outline-none ring-violet/30 focus:ring-2"
              autoComplete="new-password"
            />
            <label className="mt-4 block text-sm font-bold text-ink" htmlFor="confirm-password">
              Yeni şifre (tekrar)
            </label>
            <input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="mt-2 w-full rounded-xl border border-plum/15 bg-white px-4 py-3 text-ink outline-none ring-violet/30 focus:ring-2"
              autoComplete="new-password"
            />
            {errorMessage ? <p className="mt-3 text-sm text-rose">{errorMessage}</p> : null}
            <div className="mt-7 flex gap-3">
              <Button type="button" variant="secondary" className="flex-1" onClick={handleCloseModal}>
                İptal
              </Button>
              <Button type="submit" className="flex-1" disabled={isSubmitting}>
                {isSubmitting ? 'Güncelleniyor…' : 'Şifreyi güncelle'}
              </Button>
            </div>
          </form>
        </div>
      ) : null}

      {activeModal === 'delete' ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink/55 px-5 backdrop-blur-md">
          <form
            role="dialog"
            aria-label="Hesabı sil"
            onSubmit={(event) => void handleDeleteSubmit(event)}
            className="relative w-full max-w-md rounded-[2rem] border border-rose/30 bg-mist p-8 shadow-atelier"
          >
            <button
              type="button"
              onClick={handleCloseModal}
              aria-label="Kapat"
              className="absolute right-4 top-4 rounded-full bg-white/80 p-2 text-plum transition hover:bg-white"
            >
              <X size={18} />
            </button>
            <h2 className="text-2xl font-bold tracking-[-0.03em] text-rose">Hesabı sil</h2>
            <p className="mt-3 leading-7 text-ink/65">
              Bu işlem geri alınamaz. Tüm verileriniz kalıcı olarak silinecektir.
            </p>
            <label className="mt-6 block text-sm font-bold text-ink" htmlFor="delete-confirm">
              Onaylamak için <span className="text-rose">{DELETE_CONFIRM_TEXT}</span> yazın
            </label>
            <input
              id="delete-confirm"
              type="text"
              value={deleteConfirmText}
              onChange={(event) => setDeleteConfirmText(event.target.value)}
              className="mt-2 w-full rounded-xl border border-rose/30 bg-white px-4 py-3 text-ink outline-none ring-rose/30 focus:ring-2"
              autoComplete="off"
            />
            {errorMessage ? <p className="mt-3 text-sm text-rose">{errorMessage}</p> : null}
            <div className="mt-7 flex gap-3">
              <Button type="button" variant="secondary" className="flex-1" onClick={handleCloseModal}>
                İptal
              </Button>
              <button
                type="submit"
                disabled={isSubmitting || deleteConfirmText.trim() !== DELETE_CONFIRM_TEXT}
                className="flex-1 rounded-xl bg-rose px-4 py-3 text-sm font-bold text-white transition hover:bg-rose/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? 'Siliniyor…' : 'Hesabı kalıcı sil'}
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {activeModal === 'success' ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink/55 px-5 backdrop-blur-md">
          <div
            role="dialog"
            aria-label="İşlem başarılı"
            className="relative w-full max-w-md rounded-[2rem] border border-white/20 bg-mist p-8 text-center shadow-atelier"
          >
            <button
              type="button"
              onClick={handleCloseModal}
              aria-label="Kapat"
              className="absolute right-4 top-4 rounded-full bg-white/80 p-2 text-plum transition hover:bg-white"
            >
              <X size={18} />
            </button>
            <span className="mx-auto inline-flex size-16 items-center justify-center rounded-full bg-plum text-lilac">
              <CheckCircle2 size={32} />
            </span>
            <h3 className="mt-6 text-2xl font-bold tracking-[-0.03em] text-ink">Tamamlandı</h3>
            <p className="mt-3 leading-7 text-ink/65">{successMessage}</p>
            <Button type="button" className="mt-7 w-full" onClick={handleCloseModal}>
              Tamam
            </Button>
          </div>
        </div>
      ) : null}
    </section>
  )
}
