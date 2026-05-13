'use client'

import { useEffect, useState } from 'react'

import { AccountPage } from '@/components/account/account-page'
import { AssistantHome } from '@/components/assistant/assistant-home'
import { AuthModal } from '@/components/auth/auth-modal'
import { ProfileStep } from '@/components/onboarding/profile-step'
import { SegmentStep } from '@/components/onboarding/segment-step'
import { RecommendationResults } from '@/components/recommendation/recommendation-results'
import { SiteFooter } from '@/components/site-footer'
import { SiteHeader } from '@/components/site-header'
import { requestRecommendation } from '@/lib/api'
import type {
  Account,
  PreferenceMode,
  RecommendationResponse,
  Segment,
  StylePreference,
  UserProfile,
} from '@/lib/types'

const defaultProfile: UserProfile = {
  segment: 'adult',
  height: 178,
  weight: 72,
  style: 'classic',
}

const getStoredProfile = () => {
  if (typeof window === 'undefined') {
    return defaultProfile
  }

  const storedProfile = window.localStorage.getItem('visionist-profile')

  if (!storedProfile) {
    return defaultProfile
  }

  try {
    return JSON.parse(storedProfile) as UserProfile
  } catch {
    return defaultProfile
  }
}

const getStoredAccount = () => {
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

export const AppShell = () => {
  const [view, setView] = useState<'assistant' | 'account'>('assistant')
  const [step, setStep] = useState(1)
  const [profile, setProfile] = useState<UserProfile>(getStoredProfile)
  const [account, setAccount] = useState<Account | null>(getStoredAccount)
  const [prompt, setPrompt] = useState('Yazlık, uygun fiyatlı bir akşam yemeği kombini')
  const [recommendation, setRecommendation] = useState<RecommendationResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [isAuthOpen, setIsAuthOpen] = useState(false)

  useEffect(() => {
    window.localStorage.setItem('visionist-profile', JSON.stringify(profile))
  }, [profile])

  useEffect(() => {
    if (!account) {
      window.localStorage.removeItem('visionist-account')
      return
    }

    window.localStorage.setItem('visionist-account', JSON.stringify(account))
  }, [account])

  const handleSegmentChange = (segment: Segment) => {
    setProfile((currentProfile) => ({ ...currentProfile, segment }))
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

  const handleRecommendation = async (preference: PreferenceMode = 'balanced') => {
    setIsLoading(true)
    setErrorMessage('')

    try {
      const response = await requestRecommendation({
        profile,
        prompt,
        preference,
      })

      setRecommendation(response)
      setStep(3)
    } catch {
      setErrorMessage('Backend servisine ulaşılamadı. Lütfen FastAPI sunucusunun çalıştığından emin olun.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCheaperRequest = () => {
    void handleRecommendation('cheaper')
  }

  const handleAuthenticate = (nextAccount: Account) => {
    setAccount(nextAccount)
    setIsAuthOpen(false)
    setView('account')
  }

  const handleSignOut = () => {
    setAccount(null)
    setView('assistant')
  }

  const handleAssistantClick = () => {
    setView('assistant')
    setStep(3)
  }

  const handleAccountClick = () => {
    if (!account) {
      setIsAuthOpen(true)
      return
    }

    setView('account')
  }

  const handleWardrobeClick = () => {
    if (!account) {
      setIsAuthOpen(true)
      return
    }

    setView('account')
  }

  return (
    <div className="min-h-screen text-ink">
      <SiteHeader
        account={account}
        compact={step < 3 && view === 'assistant'}
        view={view}
        onAuthClick={() => setIsAuthOpen(true)}
        onAccountClick={handleAccountClick}
        onAssistantClick={handleAssistantClick}
        onWardrobeClick={handleWardrobeClick}
      />
      <main>
        {view === 'account' && account ? (
          <AccountPage
            account={account}
            profile={profile}
            onProfileChange={setProfile}
            onBackToAssistant={handleAssistantClick}
            onSignOut={handleSignOut}
          />
        ) : (
          <>
            {step === 1 ? (
              <SegmentStep selectedSegment={profile.segment} onSelectSegment={handleSegmentChange} />
            ) : null}
            {step === 2 ? (
              <ProfileStep
                height={profile.height}
                weight={profile.weight}
                style={profile.style}
                onHeightChange={handleHeightChange}
                onWeightChange={handleWeightChange}
                onStyleChange={handleStyleChange}
                onBack={() => setStep(1)}
                onContinue={() => setStep(3)}
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
                  onRequireAuth={handleWardrobeClick}
                />
                {errorMessage ? (
                  <div className="mx-auto mb-8 max-w-3xl rounded-2xl border border-rose/30 bg-rose/10 px-5 py-4 text-rose">
                    {errorMessage}
                  </div>
                ) : null}
                {recommendation ? (
                  <RecommendationResults
                    recommendation={recommendation}
                    onCheaperRequest={handleCheaperRequest}
                  />
                ) : null}
              </>
            ) : null}
          </>
        )}
      </main>
      <SiteFooter />
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onAuthenticate={handleAuthenticate}
      />
    </div>
  )
}
