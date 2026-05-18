'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import { AccountPage } from '@/components/account/account-page'
import { WardrobePage } from '@/components/wardrobe/wardrobe-page'
import { AssistantHome } from '@/components/assistant/assistant-home'
import { AuthModal, type AuthMode } from '@/components/auth/auth-modal'
import { ProfileStep } from '@/components/onboarding/profile-step'
import { SegmentStep } from '@/components/onboarding/segment-step'
import { FitUploadModal } from '@/components/assistant/fit-upload-modal'
import { RecommendationModal } from '@/components/recommendation/recommendation-modal'
import { SiteFooter } from '@/components/site-footer'
import { SiteHeader } from '@/components/site-header'
import { requestRecommendation } from '@/lib/api'
import { compressImageFile, type CompressedImage } from '@/lib/compress-image'
import { initGuestSession, saveGuestProfile } from '@/lib/guest-profile'
import { getGuestSessionId, resetGuestClientState } from '@/lib/guest-session'
import { migrateLocalStorageToSupabase } from '@/lib/migrate-local-storage'
import { defaultProfile } from '@/lib/profile'
import {
  getAccessToken,
  mapSessionToAccount,
  mergeGuestSessionForUser,
  signOut,
} from '@/lib/supabase/auth'
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase/client'
import { fetchUserData, saveUserProfile } from '@/lib/supabase/profile'
import { saveOutfitToWardrobe } from '@/lib/wardrobe-storage'
import type {
  Account,
  ClothingSize,
  Gender,
  PreferenceMode,
  RecommendationResponse,
  Segment,
  StylePreference,
  UserProfile,
} from '@/lib/types'

const VIEW_KEY = 'visionist-view'

type AppView = 'assistant' | 'account' | 'wardrobe'

const getStoredView = (): AppView => {
  if (typeof window === 'undefined') {
    return 'assistant'
  }

  const storedView = window.localStorage.getItem(VIEW_KEY)

  if (storedView === 'account' || storedView === 'wardrobe') {
    return storedView
  }

  return 'assistant'
}

const bootstrapGuestOnPageLoad = () => {
  resetGuestClientState()
  return defaultProfile
}

export const AppShell = () => {
  const [view, setView] = useState<AppView>('assistant')
  const [step, setStep] = useState(1)
  const [profile, setProfile] = useState<UserProfile>(defaultProfile)
  const [defaultPreference, setDefaultPreference] = useState<PreferenceMode>('balanced')
  const [account, setAccount] = useState<Account | null>(null)
  const [authReady, setAuthReady] = useState(false)
  const [prompt, setPrompt] = useState('Yazlık, uygun fiyatlı bir akşam yemeği kombini')
  const [recommendation, setRecommendation] = useState<RecommendationResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [isAuthOpen, setIsAuthOpen] = useState(false)
  const [authMode, setAuthMode] = useState<AuthMode>('signin')
  const [hasHydratedStorage, setHasHydratedStorage] = useState(false)
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false)
  const [fitMode, setFitMode] = useState(false)
  const [fitImage, setFitImage] = useState<CompressedImage | null>(null)
  const [isFitModalOpen, setIsFitModalOpen] = useState(false)
  const [lastRecommendationWasFit, setLastRecommendationWasFit] = useState(false)
  const skipGuestProfileDebounceRef = useRef(true)

  const isAuthenticated = authReady && Boolean(account)

  const syncUserSession = useCallback(async () => {
    setAuthReady(false)

    const supabase = getSupabase()

    if (!supabase) {
      setAccount(null)
      setHasCompletedOnboarding(false)
      setStep(1)
      setAuthReady(true)
      return
    }

    const { data } = await supabase.auth.getSession()
    const session = data.session

    if (!session?.user) {
      setAccount(null)
      setHasCompletedOnboarding(false)
      setStep(1)
      setAuthReady(true)
      return
    }

    await migrateLocalStorageToSupabase(session.user.id)
    await mergeGuestSessionForUser(session.user.id, getGuestSessionId())

    const userData = await fetchUserData(session.user.id)

    if (userData) {
      setProfile(userData.profile)
      setDefaultPreference(userData.defaultPreference)
      setHasCompletedOnboarding(userData.onboardingCompleted)
      setStep(userData.onboardingCompleted ? 3 : 1)
      setAccount(
        mapSessionToAccount(
          {
            id: session.user.id,
            email: session.user.email,
            created_at: session.user.created_at,
            user_metadata: session.user.user_metadata,
          },
          userData.onboardingCompleted,
        ),
      )
      setAuthReady(true)
      return
    }

    setAccount(
      mapSessionToAccount(
        {
          id: session.user.id,
          email: session.user.email,
          created_at: session.user.created_at,
          user_metadata: session.user.user_metadata,
        },
        false,
      ),
    )
    setAuthReady(true)
  }, [])

  useEffect(() => {
    const freshGuestProfile = bootstrapGuestOnPageLoad()
    setProfile(freshGuestProfile)
    setStep(1)
    setHasCompletedOnboarding(false)
    setView(getStoredView())
    setHasHydratedStorage(true)
    skipGuestProfileDebounceRef.current = true

    void (async () => {
      await syncUserSession()

      const supabase = getSupabase()
      const session = supabase ? (await supabase.auth.getSession()).data.session : null

      if (!session?.user) {
        await initGuestSession(freshGuestProfile)
      }
    })()
  }, [syncUserSession])

  useEffect(() => {
    if (!hasHydratedStorage || !authReady || account) {
      return
    }

    if (skipGuestProfileDebounceRef.current) {
      skipGuestProfileDebounceRef.current = false
      return
    }

    const timer = setTimeout(() => {
      void saveGuestProfile(profile)
    }, 400)

    return () => clearTimeout(timer)
  }, [account, authReady, hasHydratedStorage, profile])

  useEffect(() => {
    const supabase = getSupabase()

    if (!supabase) {
      return
    }

    const { data: subscription } = supabase.auth.onAuthStateChange(() => {
      void syncUserSession()
    })

    return () => {
      subscription.subscription.unsubscribe()
    }
  }, [syncUserSession])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const previousScrollRestoration = window.history.scrollRestoration
    window.history.scrollRestoration = 'manual'

    return () => {
      window.history.scrollRestoration = previousScrollRestoration
    }
  }, [])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [step, view])

  useEffect(() => {
    if (!hasHydratedStorage) {
      return
    }

    window.localStorage.setItem(VIEW_KEY, view)
  }, [hasHydratedStorage, view])

  const completeOnboarding = async () => {
    if (!account) {
      return
    }

    setHasCompletedOnboarding(true)
    setAccount((currentAccount) =>
      currentAccount ? { ...currentAccount, hasCompletedOnboarding: true } : currentAccount,
    )

    if (isSupabaseConfigured) {
      await saveUserProfile(account.id, profile, defaultPreference, true)
    }
  }

  const handleSegmentChange = (segment: Segment) => {
    setProfile((currentProfile) => ({ ...currentProfile, segment }))
  }

  const handleGenderChange = (gender: Gender) => {
    setProfile((currentProfile) => ({ ...currentProfile, gender }))
  }

  const handleStepOneContinue = async () => {
    if (!account) {
      await saveGuestProfile(profile)
    }

    setStep(2)
  }

  const handlePreferredSizeChange = (preferred_size: ClothingSize) => {
    setProfile((currentProfile) => ({ ...currentProfile, preferred_size }))
  }

  const handleStyleChange = (style: StylePreference) => {
    setProfile((currentProfile) => ({ ...currentProfile, style }))
  }

  const handleProfileContinue = async () => {
    if (account && isSupabaseConfigured) {
      await saveUserProfile(account.id, profile, defaultPreference, true)
    } else {
      await saveGuestProfile(profile)
    }

    if (account) {
      await completeOnboarding()
    }

    setStep(3)
  }

  const handleProfileSave = async (nextProfile: UserProfile) => {
    setProfile(nextProfile)

    if (account && isSupabaseConfigured) {
      await saveUserProfile(account.id, nextProfile, defaultPreference, hasCompletedOnboarding)
    }
  }

  const handleOpenFitModal = () => {
    setErrorMessage('')
    setIsFitModalOpen(true)
  }

  const handleCloseFitModal = () => {
    setIsFitModalOpen(false)
  }

  const handleFitModeExit = () => {
    setFitMode(false)
    setFitImage(null)
    setIsFitModalOpen(false)
    setErrorMessage('')
  }

  const handleFitImageClear = () => {
    setFitImage(null)
    setFitMode(false)
    setErrorMessage('')
  }

  const handleFitFileSelect = async (file: File) => {
    setErrorMessage('')
    try {
      const compressed = await compressImageFile(file)
      setFitImage(compressed)
      setFitMode(true)
      setIsFitModalOpen(false)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Görsel yüklenemedi.')
    }
  }

  const handleRecommendation = async (preference: PreferenceMode = defaultPreference) => {
    const trimmedPrompt = prompt.trim()

    if (fitMode) {
      if (!fitImage) {
        setErrorMessage('Buna ne uyar için bir fotoğraf yükleyin.')
        return
      }
    } else if (trimmedPrompt.length < 3) {
      setErrorMessage('Kombin için en az 3 karakterlik bir istek yazın.')
      return
    }

    setIsLoading(true)
    setErrorMessage('')

    try {
      const response = await requestRecommendation({
        profile,
        prompt: trimmedPrompt,
        preference,
        mode: fitMode ? 'fit' : 'text',
        image_base64: fitMode && fitImage ? fitImage.base64 : undefined,
        image_mime_type: fitMode && fitImage ? fitImage.mimeType : undefined,
      })

      setRecommendation(response)
      setLastRecommendationWasFit(fitMode)

      if (!response.recommendation_id) {
        setErrorMessage(
          'Kombin oluşturuldu ancak veritabanına kaydedilemedi. Dolaba kaydetme çalışmayabilir.',
        )
      } else {
        setErrorMessage('')
      }
    } catch (error) {
      console.error('Kombin önerisi hatası:', error)
      setErrorMessage(
        error instanceof Error ? error.message : 'Kombin oluşturulamadı. Lütfen tekrar deneyin.',
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleCheaperRequest = () => {
    void handleRecommendation('cheaper')
  }

  const handleCloseRecommendation = () => {
    setRecommendation(null)
  }

  const handleSaveToWardrobe = async (
    savedRecommendation: RecommendationResponse,
  ): Promise<{ ok: boolean; error?: string }> => {
    const token = await getAccessToken()

    if (!token) {
      return {
        ok: false,
        error: 'Oturum doğrulanamadı. Çıkış yapıp tekrar giriş yapın.',
      }
    }

    if (!account) {
      return { ok: false, error: 'Hesap bilgisi yüklenemedi. Sayfayı yenileyip tekrar deneyin.' }
    }

    if (!savedRecommendation.recommendation_id) {
      return { ok: false, error: 'Öneri kimliği bulunamadı. Yeni bir kombin isteyin.' }
    }

    const result = await saveOutfitToWardrobe(
      savedRecommendation.recommendation_id,
      prompt,
      token,
    )

    if (!result.ok) {
      return { ok: false, error: result.error ?? 'Dolaba kaydedilemedi.' }
    }

    setRecommendation(null)
    setView('wardrobe')
    return { ok: true }
  }

  const handleAuthSuccess = async () => {
    await syncUserSession()
    setIsAuthOpen(false)
    setView('assistant')
  }

  const handleSignOut = async () => {
    await signOut()
    setAccount(null)
    setProfile(defaultProfile)
    resetGuestClientState()
    skipGuestProfileDebounceRef.current = true
    await initGuestSession(defaultProfile)
    setView('assistant')
    setHasCompletedOnboarding(false)
    setStep(1)
    setAuthReady(true)
    window.scrollTo(0, 0)
  }

  const handleLogoClick = () => {
    setView('assistant')

    if (account && hasCompletedOnboarding) {
      setStep(3)
      return
    }

    setStep(1)
  }

  const handleAssistantNavClick = () => {
    handleLogoClick()
  }

  const handleOpenAuth = (mode: AuthMode) => {
    setAuthMode(mode)
    setIsAuthOpen(true)
  }

  const handleAccountClick = () => {
    if (!isAuthenticated) {
      handleOpenAuth('signin')
      return
    }

    setView('account')
  }

  const handleWardrobeClick = () => {
    if (!isAuthenticated) {
      handleOpenAuth('signin')
      return
    }

    setView('wardrobe')
  }

  const isOnboardingFlow = step < 3 && view === 'assistant'

  return (
    <div className="flex min-h-screen flex-col text-ink">
      <SiteHeader
        account={account}
        compact={isOnboardingFlow}
        view={view}
        onSignInClick={() => handleOpenAuth('signin')}
        onSignUpClick={() => handleOpenAuth('signup')}
        onAccountClick={handleAccountClick}
        onLogoClick={handleLogoClick}
        onAssistantClick={handleAssistantNavClick}
        onWardrobeClick={handleWardrobeClick}
      />
      <main className="flex-1">
        {view === 'account' && account ? (
          <AccountPage
            account={account}
            profile={profile}
            onProfileSave={(nextProfile) => void handleProfileSave(nextProfile)}
            onBackToAssistant={handleLogoClick}
            onSignOut={() => void handleSignOut()}
          />
        ) : view === 'wardrobe' && account ? (
          <WardrobePage />
        ) : (
          <>
            {step === 1 ? (
              <SegmentStep
                selectedGender={profile.gender}
                selectedSegment={profile.segment}
                onSelectGender={handleGenderChange}
                onSelectSegment={handleSegmentChange}
                onContinue={() => void handleStepOneContinue()}
              />
            ) : null}
            {step === 2 ? (
              <ProfileStep
                segment={profile.segment}
                gender={profile.gender}
                preferredSize={profile.preferred_size}
                style={profile.style}
                onPreferredSizeChange={handlePreferredSizeChange}
                onStyleChange={handleStyleChange}
                onBack={() => setStep(1)}
                onContinue={() => void handleProfileContinue()}
              />
            ) : null}
            {step === 3 ? (
              <>
                <AssistantHome
                  prompt={prompt}
                  isLoading={isLoading}
                  fitMode={fitMode}
                  fitImage={fitImage}
                  onPromptChange={setPrompt}
                  onSubmit={() => void handleRecommendation()}
                  onCheaperRequest={handleCheaperRequest}
                  onOpenFitModal={handleOpenFitModal}
                  onFitImageClear={handleFitImageClear}
                  isAuthenticated={isAuthenticated}
                  onWardrobeClick={handleWardrobeClick}
                />
                <FitUploadModal
                  isOpen={isFitModalOpen}
                  fitImage={fitImage}
                  isLoading={isLoading}
                  onClose={handleCloseFitModal}
                  onSelectFile={(file) => void handleFitFileSelect(file)}
                  onClearImage={handleFitImageClear}
                  onExitFitMode={handleFitModeExit}
                />
                {errorMessage ? (
                  <div className="mx-auto mb-8 max-w-3xl rounded-2xl border border-rose/30 bg-rose/10 px-5 py-4 text-rose">
                    {errorMessage}
                  </div>
                ) : null}
              </>
            ) : null}
          </>
        )}
      </main>
      <SiteFooter />
      <AuthModal
        isOpen={isAuthOpen}
        initialMode={authMode}
        onClose={() => setIsAuthOpen(false)}
        onAuthSuccess={() => void handleAuthSuccess()}
      />
      {recommendation ? (
        <RecommendationModal
          isOpen
          recommendation={recommendation}
          prompt={prompt}
          profile={profile}
          isAuthenticated={isAuthenticated}
          uploadedGarmentPreview={lastRecommendationWasFit ? fitImage?.previewUrl : undefined}
          onClose={handleCloseRecommendation}
          onSaveToWardrobe={handleSaveToWardrobe}
          onRecommendationChange={(next) => {
            setRecommendation(next)
            if (!next.recommendation_id) {
              setErrorMessage(
                'Kombin güncellendi ancak veritabanına kaydedilemedi. Dolaba kaydetme çalışmayabilir.',
              )
            }
          }}
        />
      ) : null}
    </div>
  )
}
