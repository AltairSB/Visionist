'use client'

import { LogIn, Sparkles, UserPlus, X } from 'lucide-react'
import type { FormEvent } from 'react'
import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { signIn, signUp } from '@/lib/supabase/auth'
import { isSupabaseConfigured } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

export type AuthMode = 'signin' | 'signup'

type AuthModalProps = {
  isOpen: boolean
  initialMode: AuthMode
  onClose: () => void
  onAuthSuccess: () => void
}

export const AuthModal = ({ isOpen, initialMode, onClose, onAuthSuccess }: AuthModalProps) => {
  const [mode, setMode] = useState<AuthMode>(initialMode)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode)
      setErrorMessage('')
      return
    }

    setName('')
    setEmail('')
    setPassword('')
    setErrorMessage('')
    setIsSubmitting(false)
  }, [initialMode, isOpen])

  if (!isOpen) {
    return null
  }

  const isSignup = mode === 'signup'

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrorMessage('')

    if (!isSupabaseConfigured) {
      setErrorMessage('Supabase yapılandırılmamış. frontend/.env.local dosyasını kontrol edin.')
      return
    }

    if (password.length < 6) {
      setErrorMessage('Şifre en az 6 karakter olmalıdır.')
      return
    }

    setIsSubmitting(true)

    try {
      if (isSignup) {
        await signUp(email, password, name || email.split('@')[0] || 'Stil Üyesi')
      } else {
        await signIn(email, password)
      }

      onAuthSuccess()
      onClose()
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Giriş işlemi başarısız. Bilgilerinizi kontrol edin.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/55 px-5 backdrop-blur-md">
      <div className="relative w-full max-w-4xl overflow-hidden rounded-[2rem] border border-white/20 bg-mist shadow-atelier animate-float-in">
        <button
          type="button"
          onClick={onClose}
          aria-label="Giriş penceresini kapat"
          className="absolute right-4 top-4 z-10 rounded-full bg-white/80 p-2 text-plum transition hover:bg-white"
        >
          <X size={18} />
        </button>
        <div className="grid md:grid-cols-[0.9fr_1.1fr]">
          <aside className="relative hidden min-h-[32rem] overflow-hidden bg-plum p-8 text-white md:block">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(232,222,251,0.38),transparent_20rem)]" />
            <div className="relative flex h-full flex-col justify-between">
              <div>
                <span className="inline-flex size-14 items-center justify-center rounded-2xl bg-white/12 text-lilac">
                  <Sparkles size={26} />
                </span>
                <h2 className="mt-8 text-4xl font-bold tracking-[-0.04em]">
                  Dolabını ve tercihlerini yanında taşı.
                </h2>
                <p className="mt-4 leading-7 text-white/72">
                  Hesap açınca ölçülerin, stil tercihin ve dolap notların cihaz değişse bile tek profilde toplanır.
                </p>
              </div>
              <div className="rounded-3xl border border-white/15 bg-white/10 p-5 backdrop-blur">
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-lilac">Üye Avantajı</p>
                <p className="mt-2 text-white/76">
                  Dolabım alanı, kayıtlı profil ve sonradan güncellenebilir kişisel stil notları üyeye özeldir.
                </p>
              </div>
            </div>
          </aside>
          <section className="p-6 sm:p-9">
            <div className="inline-flex rounded-full bg-lilac p-1">
              {(['signin', 'signup'] as const).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setMode(item)}
                  className={cn(
                    'rounded-full px-5 py-2 text-sm font-bold transition',
                    mode === item ? 'bg-plum text-white shadow-card' : 'text-plum hover:bg-white',
                  )}
                >
                  {item === 'signin' ? 'Sign in' : 'Sign up'}
                </button>
              ))}
            </div>
            <h2 className="mt-8 text-3xl font-bold tracking-[-0.04em] text-ink">
              {isSignup ? 'Yeni stil hesabı oluştur' : 'Hesabına giriş yap'}
            </h2>
            <p className="mt-3 leading-7 text-ink/65">
              İstersen hesap oluşturmadan da kombin önerisi alabilirsin. Hesap yalnızca kayıtlı profil ve Dolabım için gerekir.
            </p>
            {errorMessage ? (
              <p className="mt-4 rounded-2xl border border-rose/30 bg-rose/10 px-4 py-3 text-sm text-rose">{errorMessage}</p>
            ) : null}
            <form onSubmit={handleSubmit} className="mt-7 space-y-4">
              {isSignup ? (
                <label className="block">
                  <span className="text-xs font-bold uppercase tracking-[0.18em] text-ink">Ad Soyad</span>
                  <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-plum/15 bg-white px-4 py-3 text-ink outline-none transition focus:border-violet focus:ring-4 focus:ring-violet/10"
                    placeholder="Adınız"
                    required
                  />
                </label>
              ) : null}
              <label className="block">
                <span className="text-xs font-bold uppercase tracking-[0.18em] text-ink">E-posta</span>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-plum/15 bg-white px-4 py-3 text-ink outline-none transition focus:border-violet focus:ring-4 focus:ring-violet/10"
                  placeholder="mail@example.com"
                  required
                />
              </label>
              <label className="block">
                <span className="text-xs font-bold uppercase tracking-[0.18em] text-ink">Şifre</span>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-plum/15 bg-white px-4 py-3 text-ink outline-none transition focus:border-violet focus:ring-4 focus:ring-violet/10"
                  placeholder="En az 6 karakter"
                  required
                  minLength={6}
                />
              </label>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSignup ? <UserPlus size={18} /> : <LogIn size={18} />}
                {isSubmitting ? 'İşleniyor...' : isSignup ? 'Hesap Oluştur' : 'Giriş Yap'}
              </Button>
            </form>
            <button
              type="button"
              onClick={onClose}
              className="mt-5 w-full rounded-2xl border border-plum/15 bg-white px-4 py-3 text-sm font-bold text-plum transition hover:bg-lilac/60"
            >
              Hesap olmadan devam et
            </button>
          </section>
        </div>
      </div>
    </div>
  )
}
