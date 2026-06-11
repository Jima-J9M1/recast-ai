export type Plan = 'free' | 'starter' | 'pro'

export type JobStatus = 'pending' | 'transcribing' | 'generating' | 'completed' | 'failed' | 'cancelled'

export type OutputType = 'blog' | 'twitter_thread' | 'linkedin' | 'newsletter' | 'extras' | 'email_sequence'

export type ToneStyle = 'professional' | 'casual' | 'storytelling' | 'educational' | 'humorous'

export const LANGUAGES = [
  { code: 'English',    flag: '🇬🇧' },
  { code: 'Spanish',    flag: '🇪🇸' },
  { code: 'French',     flag: '🇫🇷' },
  { code: 'Portuguese', flag: '🇧🇷' },
  { code: 'German',     flag: '🇩🇪' },
  { code: 'Italian',    flag: '🇮🇹' },
  { code: 'Dutch',      flag: '🇳🇱' },
  { code: 'Japanese',   flag: '🇯🇵' },
  { code: 'Chinese',    flag: '🇨🇳' },
  { code: 'Arabic',     flag: '🇸🇦' },
  { code: 'Hindi',      flag: '🇮🇳' },
  { code: 'Korean',     flag: '🇰🇷' },
] as const

export type Language = typeof LANGUAGES[number]['code']

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
  tone: ToneStyle
  language: string
  seo_mode: boolean
  transcript: string | null
  error_message: string | null
  created_at: string
  completed_at: string | null
  outputs?: Output[]
}

export interface Output {
  id: string
  job_id: string
  type: OutputType
  content: string
  version: number
  created_at: string
  starred?: boolean
}

export interface PromptTemplate {
  id: string
  user_id: string
  format: OutputType
  prompt: string
  updated_at: string
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

export const BATCH_LIMITS: Record<Plan, number> = {
  free: 0,
  starter: 5,
  pro: 20,
}

export const FEED_LIMITS: Record<Plan, number> = {
  free: 0,
  starter: 1,
  pro: 5,
}

export interface Feed {
  id: string
  user_id: string
  channel_id: string
  rss_url: string
  last_video_id: string | null
  tone: ToneStyle
  language: string
  seo_mode: boolean
  active: boolean
  created_at: string
}
