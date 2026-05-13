'use client'

import { useEffect, useState } from 'react'

import { AssistantHome } from '@/components/assistant/assistant-home'
import { ProfileStep } from '@/components/onboarding/profile-step'
import { SegmentStep } from '@/components/onboarding/segment-step'
import { RecommendationResults } from '@/components/recommendation/recommendation-results'
import { SiteFooter } from '@/components/site-footer'
import { SiteHeader } from '@/components/site-header'
import { requestRecommendation } from '@/lib/api'
import type { PreferenceMode, RecommendationResponse, Segment, StylePreference, UserProfile } from '@/lib/types'

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

  const storedProfile = window.localStorage.getItem('stil-ekonomi-profile')

  if (!storedProfile) {
    return defaultProfile
  }

  try {
    return JSON.parse(storedProfile) as UserProfile
  } catch {
    return defaultProfile
  }
}

export const AppShell = () => {
  const [step, setStep] = useState(1)
  const [profile, setProfile] = useState<UserProfile>(getStoredProfile)
  const [prompt, setPrompt] = useState('Yazlık, uygun fiyatlı bir akşam yemeği kombini')
  const [recommendation, setRecommendation] = useState<RecommendationResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    window.localStorage.setItem('stil-ekonomi-profile', JSON.stringify(profile))
  }, [profile])

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

  return (
    <div className="min-h-screen text-ink">
      <SiteHeader compact={step < 3} />
      <main>
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
      </main>
      <SiteFooter />
    </div>
  )
}
