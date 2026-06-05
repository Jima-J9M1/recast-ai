export type Plan = 'free' | 'starter' | 'pro'

export type JobStatus = 'pending' | 'transcribing' | 'generating' | 'completed' | 'failed'

export type OutputType = 'blog' | 'twitter_thread' | 'linkedin' | 'newsletter'

export interface User {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  plan: Plan
  polar_customer_id: string | null
  created_at: string
}

export interface Job {
  id: string
  user_id: string
  title: string | null
  source_type: 'youtube' | 'upload'
  source_url: string | null
  status: JobStatus
  transcript: string | null
  created_at: string
  completed_at: string | null
  outputs?: Output[]
}

export interface Output {
  id: string
  job_id: string
  type: OutputType
  content: string
  created_at: string
}

export interface Usage {
  id: string
  user_id: string
  month: string
  count: number
}

export const PLAN_LIMITS: Record<Plan, number | null> = {
  free: 1,
  starter: 10,
  pro: null,
}

export const PLAN_PRICES = {
  starter: { monthly: 19, label: 'Starter' },
  pro: { monthly: 49, label: 'Pro' },
}
