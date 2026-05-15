'use client'

import { useEffect, useState } from 'react'

import { AccountPage } from '@/components/account/account-page'
import { WardrobePage } from '@/components/wardrobe/wardrobe-page'
import { AssistantHome } from '@/components/assistant/assistant-home'
import { AuthModal, type AuthMode } from '@/components/auth/auth-modal'
import { ProfileStep } from '@/components/onboarding/profile-step'
import { SegmentStep } from '@/components/onboarding/segment-step'
import { RecommendationModal } from '@/components/recommendation/recommendation-modal'
import { SiteFooter } from '@/components/site-footer'
import { SiteHeader } from '@/components/site-header'
import { requestRecommendation } from '@/lib/api'
import { saveOutfitToWardrobe } from '@/lib/wardrobe-storage'
import { defaultProfile, normalizeProfile } from '@/lib/profile'
import type {
  Account,
  Gender,
  PreferenceMode,
  RecommendationResponse,
  Segment,
  StylePreference,
  UserProfile,
} from '@/lib/types'

const ONBOARDING_KEY = 'visionist-onboarding-complete'
const VIEW_KEY = 'visionist-view'

type AppView = 'assistant' | 'account' | 'wardrobe'

const getOnboardingComplete = (): boolean => {
  if (typeof window === 'undefined') {
    return false
  }

  return window.localStorage.getItem(ONBOARDING_KEY) === 'true'
}

const setOnboardingComplete = (isComplete: boolean) => {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(ONBOARDING_KEY, isComplete ? 'true' : 'false')
}

const getStoredProfile = (): UserProfile => {
  if (typeof window === 'undefined') {
    return defaultProfile
  }

  const storedProfile = window.localStorage.getItem('visionist-profile')

  if (!storedProfile) {
    return defaultProfile
  }

  try {
    return normalizeProfile(JSON.parse(storedProfile) as Partial<UserProfile>)
  } catch {
    return defaultProfile
  }
}

const getStoredAccount = (): Account | null => {
  if (typeof window === 'undefined') {
    return null
  }

  const storedAccount = window.localStorage.getItem('visionist-account')

  if (!storedAccount) {
    return null
  }

  try {
    return JSON.parse(storedAccount) as Account
  } catch {
    return null
  }
}

const getStoredView = (storedAccount: Account | null): AppView => {
  if (!storedAccount || typeof window === 'undefined') {
    return 'assistant'
  }

  const storedView = window.localStorage.getItem(VIEW_KEY)

  if (storedView === 'account' || storedView === 'wardrobe') {
    return storedView
  }

  return 'assistant'
}

const hasAccountCompletedOnboarding = (storedAccount: Account | null) => {
  if (!storedAccount) {
    return false
  }

  return storedAccount.hasCompletedOnboarding === true || getOnboardingComplete()
}

export const AppShell = () => {
  const [view, setView] = useState<AppView>('assistant')
  const [step, setStep] = useState(1)
  const [profile, setProfile] = useState<UserProfile>(defaultProfile)
  const [account, setAccount] = useState<Account | null>(null)
  const [prompt, setPrompt] = useState('Yazlık, uygun fiyatlı bir akşam yemeği kombini')
  const [recommendation, setRecommendation] = useState<RecommendationResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [isAuthOpen, setIsAuthOpen] = useState(false)
  const [authMode, setAuthMode] = useState<AuthMode>('signin')
  const [hasHydratedStorage, setHasHydratedStorage] = useState(false)
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false)

  useEffect(() => {
    const storedAccount = getStoredAccount()
    const storedProfile = storedAccount ? getStoredProfile() : defaultProfile
    const onboardingComplete = hasAccountCompletedOnboarding(storedAccount)

    setProfile(storedProfile)
    setAccount(storedAccount)
    setView(getStoredView(storedAccount))
    setHasCompletedOnboarding(onboardingComplete)
    setStep(onboardingComplete ? 3 : 1)
    setHasHydratedStorage(true)
  }, [])

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

    window.localStorage.setItem('visionist-profile', JSON.stringify(profile))
  }, [hasHydratedStorage, profile])

  useEffect(() => {
    if (!hasHydratedStorage) {
      return
    }

    if (!account) {
      window.localStorage.removeItem('visionist-account')
      window.localStorage.removeItem(VIEW_KEY)
      return
    }

    window.localStorage.setItem('visionist-account', JSON.stringify(account))
  }, [account, hasHydratedStorage])

  useEffect(() => {
    if (!hasHydratedStorage) {
      return
    }

    window.localStorage.setItem(VIEW_KEY, view)
  }, [hasHydratedStorage, view])

  const completeOnboarding = () => {
    if (!account) {
      return
    }

    setOnboardingComplete(true)
    setHasCompletedOnboarding(true)
    setAccount((currentAccount) =>
      currentAccount ? { ...currentAccount, hasCompletedOnboarding: true } : currentAccount,
    )
  }

  const handleGenderChange = (gender: Gender) => {
    setProfile((currentProfile) => ({ ...currentProfile, gender }))
  }

  const handleSegmentChange = (segment: Segment) => {
    setProfile((currentProfile) => ({ ...currentProfile, segment }))
  }

  const handleStepOneContinue = () => {
    setStep(2)
  }

  const handleHeightChange = (height: number) => {
    setProfile((currentProfile) => ({ ...currentProfile, height }))
  }

  const handleWeightChange = (weight: number) => {
    setProfile((currentProfile) => ({ ...currentProfile, weight }))
  }

  const handleStyleChange = (style: StylePreference) => {
    setProfile((currentProfile) => ({ ...currentProfile, style }))
  }

  const handleProfileContinue = () => {
    if (account) {
      completeOnboarding()
    }
    setStep(3)
  }

  const handleRecommendation = async (preference: PreferenceMode = 'balanced') => {
    const trimmedPrompt = prompt.trim()

    if (trimmedPrompt.length < 3) {
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
      })

      setRecommendation(response)
      setErrorMessage('')
    } catch (error) {
      console.error('Kombin önerisi hatası:', error)
      setErrorMessage('Kombin oluşturulamadı. Lütfen tekrar deneyin.')
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

  const handleSaveToWardrobe = (savedRecommendation: RecommendationResponse) => {
    saveOutfitToWardrobe(prompt, savedRecommendation)
    setRecommendation(null)
    setView('wardrobe')
  }

  const handleAuthenticate = (nextAccount: Account, mode: AuthMode) => {
    const isSignup = mode === 'signup'
    const storedAccount = getStoredAccount()
    const isReturningUser = storedAccount?.email === nextAccount.email
    const nextOnboardingComplete = isSignup
      ? false
      : isReturningUser
        ? hasAccountCompletedOnboarding(storedAccount)
        : getOnboardingComplete()

    if (isSignup) {
      setOnboardingComplete(false)
    }

    setAccount({
      ...nextAccount,
      hasCompletedOnboarding: nextOnboardingComplete,
    })
    setIsAuthOpen(false)
    setHasCompletedOnboarding(nextOnboardingComplete)
    setView('assistant')
    setStep(nextOnboardingComplete ? 3 : 1)
  }

  const handleSignOut = () => {
    setAccount(null)
    setProfile(defaultProfile)
    setView('assistant')
    setHasCompletedOnboarding(false)
    setStep(1)
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
    if (!account) {
      handleOpenAuth('signin')
      return
    }

    setView('account')
  }

  const handleWardrobeClick = () => {
    if (!account) {
      handleOpenAuth('signin')
      return
    }

    setView('wardrobe')
  }

  const isOnboardingFlow = step < 3 && view === 'assistant'

  return (
    <div className="min-h-screen text-ink">
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
      <main>
        {view === 'account' && account ? (
          <AccountPage
            account={account}
            profile={profile}
            onProfileSave={setProfile}
            onBackToAssistant={handleLogoClick}
            onSignOut={handleSignOut}
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
                onContinue={handleStepOneContinue}
              />
            ) : null}
            {step === 2 ? (
              <ProfileStep
                segment={profile.segment}
                gender={profile.gender}
                height={profile.height}
                weight={profile.weight}
                style={profile.style}
                onHeightChange={handleHeightChange}
                onWeightChange={handleWeightChange}
                onStyleChange={handleStyleChange}
                onBack={() => setStep(1)}
                onContinue={handleProfileContinue}
              />
            ) : null}
            {step === 3 ? (
              <>
                <AssistantHome
                  prompt={prompt}
                  isLoading={isLoading}
                  onPromptChange={setPrompt}
                  onSubmit={() => void handleRecommendation()}
                  onCheaperRequest={handleCheaperRequest}
                  isAuthenticated={Boolean(account)}
                  onWardrobeClick={handleWardrobeClick}
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
        onAuthenticate={handleAuthenticate}
      />
      {recommendation ? (
        <RecommendationModal
          isOpen
          recommendation={recommendation}
          prompt={prompt}
          profile={profile}
          isAuthenticated={Boolean(account)}
          onClose={handleCloseRecommendation}
          onSaveToWardrobe={handleSaveToWardrobe}
          onRecommendationChange={setRecommendation}
        />
      ) : null}
    </div>
  )
}
