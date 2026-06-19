// useTrial.js — система пробного периода ChefCloud
// Ключи: chefcloud_trial_start, chefcloud_trial_plan
// Логика: 7 дней с первого открытия → показ предупреждения → ограничения

const TRIAL_KEY      = 'chefcloud_trial_start'
const PLAN_KEY       = 'chefcloud_trial_plan'
const TRIAL_DAYS     = 7

export function initTrial() {
  if (!localStorage.getItem(TRIAL_KEY)) {
    localStorage.setItem(TRIAL_KEY, new Date().toISOString())
  }
}

export function getTrialInfo() {
  initTrial()
  const plan = localStorage.getItem(PLAN_KEY)
  if (plan === 'pro') return { plan:'pro', active:true, daysLeft:999, expired:false }

  const startRaw = localStorage.getItem(TRIAL_KEY)
  if (!startRaw) return { plan:'trial', active:true, daysLeft:TRIAL_DAYS, expired:false }

  const start    = new Date(startRaw)
  const now      = new Date()
  const diffMs   = now - start
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  const daysLeft = Math.max(0, TRIAL_DAYS - diffDays)
  const expired  = daysLeft === 0

  return { plan:'trial', active:!expired, daysLeft, expired }
}

export function activatePro() {
  localStorage.setItem(PLAN_KEY, 'pro')
}

export function resetTrial() {
  localStorage.removeItem(TRIAL_KEY)
  localStorage.removeItem(PLAN_KEY)
}

import { useEffect, useState } from 'react'

export function useTrialStore() {
  const [info, setInfo] = useState(() => getTrialInfo())

  useEffect(() => {
    initTrial()
    setInfo(getTrialInfo())
  }, [])

  return {
    ...info,
    refresh: () => setInfo(getTrialInfo()),
    activatePro: () => { activatePro(); setInfo(getTrialInfo()) },
  }
}
