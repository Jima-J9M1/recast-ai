import OpenAI from 'openai'
import type { ToneStyle } from '@/types'

// Uses Groq-compatible OpenAI SDK — just swap base URL
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
  baseURL: 'https://api.groq.com/openai/v1',
})

export type ContentFormat = 'blog' | 'twitter_thread' | 'linkedin' | 'newsletter'

const TONE_INSTRUCTIONS: Record<ToneStyle, string> = {
  professional:
    'Maintain a professional, authoritative, and polished tone. Write as a credible industry expert.',
  casual:
    'Write in a friendly, conversational tone — like talking to a smart friend. Avoid jargon. Keep it light and approachable.',
  storytelling:
    'Lead with narrative. Use anecdotes, personal angles, and vivid examples. Make the reader feel something before you inform them.',
  educational:
    'Write as a teacher or mentor. Break concepts down clearly with analogies, numbered steps, and accessible explanations.',
  humorous:
    'Inject wit and light humor throughout — clever observations, playful language, and a fun voice. Informative but never dry.',
}

export const DEFAULT_PROMPTS: Record<ContentFormat, string> = {
  blog: `You are an expert content writer. Transform the following transcript into an engaging, SEO-optimized blog post.

Tone: {tone}

Structure:
- Compelling H1 title
- Introduction (hook the reader)
- 3-5 main sections with H2 headings
- Key takeaways or conclusion

Transcript:
{transcript}

Write the full blog post in Markdown format.`,

  twitter_thread: `You are a viral Twitter/X content creator. Transform the following transcript into a compelling Twitter thread.

Tone: {tone}

Rules:
- First tweet is the hook (must grab attention immediately)
- 8-12 tweets total
- Each tweet max 280 characters
- Number them: 1/, 2/, 3/ etc.
- Last tweet is a strong CTA
- Use line breaks for readability

Transcript:
{transcript}

Write the full Twitter thread.`,

  linkedin: `You are a LinkedIn thought leader. Transform the following transcript into a high-performing LinkedIn post.

Tone: {tone}

Structure:
- Strong opening line (no "I'm excited to share...")
- Share 3-5 key insights as short paragraphs
- Personal angle or story
- End with a question to drive comments
- Use emojis sparingly
- Max 1300 characters for optimal reach

Transcript:
{transcript}

Write the LinkedIn post.`,

  newsletter: `You are an expert newsletter writer. Transform the following transcript into an engaging email newsletter.

Tone: {tone}

Structure:
- Subject line (compelling, max 50 chars)
- Preview text (100 chars)
- Greeting
- Opening hook
- 3 key takeaways (formatted clearly)
- Deeper dive on the most interesting point
- Call-to-action
- Sign-off

Transcript:
{transcript}

Write the full newsletter in Markdown format, starting with "Subject: " and "Preview: " lines.`,
}

const MAX_TOKENS: Record<ContentFormat, number> = {
  blog: 1200,
  twitter_thread: 600,
  linkedin: 400,
  newsletter: 900,
}

// Groq free tier: ~6k TPM. Keep transcript short so parallel calls don't burst the limit.
const TRANSCRIPT_LIMIT = 4000

export async function generateContent(
  transcript: string,
  format: ContentFormat,
  tone: ToneStyle = 'professional',
  customPrompt?: string,
  language = 'English'
): Promise<string> {
  const base = customPrompt ?? DEFAULT_PROMPTS[format]
  const languageInstruction = language === 'English'
    ? ''
    : `\n\nIMPORTANT: Write the entire output in ${language}. Do not use English anywhere in the response.`
  const prompt = base
    .replace('{tone}', TONE_INSTRUCTIONS[tone])
    .replace('{transcript}', transcript.slice(0, TRANSCRIPT_LIMIT)) + languageInstruction

  const response = await openai.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: MAX_TOKENS[format],
    temperature: 0.7,
  })

  return response.choices[0].message.content ?? ''
}

export interface BrandVoice {
  persona?: string;
  audience?: string;
  style_notes?: string;
  key_phrases?: string;
  avoid_phrases?: string;
}

export function buildBrandVoiceNote(bv: BrandVoice | null | undefined): string {
  if (!bv) return "";
  const lines: string[] = [];
  if (bv.persona?.trim())       lines.push(`- Writing as: ${bv.persona.trim()}`);
  if (bv.audience?.trim())      lines.push(`- Target audience: ${bv.audience.trim()}`);
  if (bv.style_notes?.trim())   lines.push(`- Style rules: ${bv.style_notes.trim()}`);
  if (bv.key_phrases?.trim())   lines.push(`- Include these phrases/terms: ${bv.key_phrases.trim()}`);
  if (bv.avoid_phrases?.trim()) lines.push(`- Avoid these phrases: ${bv.avoid_phrases.trim()}`);
  if (lines.length === 0) return "";
  return `\n\nBrand Voice (apply consistently throughout):\n${lines.join("\n")}`;
}

export function applyBrandVoice(
  format: ContentFormat,
  customPrompt: string | undefined,
  brandVoiceNote: string
): string | undefined {
  if (!brandVoiceNote) return customPrompt;
  return (customPrompt ?? DEFAULT_PROMPTS[format]) + brandVoiceNote;
}

export async function generateTitle(transcript: string): Promise<string> {
  const response = await openai.chat.completions.create({
    model: 'llama-3.1-8b-instant',
    messages: [
      {
        role: 'user',
        content: `Generate a concise, descriptive title (max 60 chars) for this content:\n\n${transcript.slice(0, 500)}\n\nReturn only the title, nothing else.`,
      },
    ],
    max_tokens: 60,
    temperature: 0.5,
  })

  return response.choices[0].message.content?.trim() ?? 'Untitled'
}
