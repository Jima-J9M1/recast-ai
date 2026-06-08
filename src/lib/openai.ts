import OpenAI from 'openai'
import type { ToneStyle } from '@/types'
import { DEFAULT_PROMPTS, type ContentFormat } from '@/lib/prompts'

export type { ContentFormat }
export { DEFAULT_PROMPTS }

// Uses Groq-compatible OpenAI SDK — just swap base URL
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
  baseURL: 'https://api.groq.com/openai/v1',
})

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

export const SEO_BLOG_PROMPT = `You are an expert SEO content writer. Transform the following transcript into a search-engine-optimized blog post.

Tone: {tone}

Requirements:
1. Start your response with exactly: "**SEO keyword:** [your chosen primary keyword]"
2. Second line: "**Meta description:** [max 155 characters, contains the keyword]"
3. Blank line, then the full article
4. H1 title must contain the primary keyword
5. Use the keyword naturally in the first 100 words and at least one H2 heading
6. Structure: H1 → intro → 3-5 H2 sections → FAQ (3-5 questions readers would Google) → conclusion
7. Target 900-1200 words (not counting the keyword/meta lines)
8. Write for humans first — natural keyword placement only

Transcript:
{transcript}

Write the full blog post in Markdown format.`

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

const EXTRAS_PROMPT = `You are a content analyst. Extract the most shareable and valuable pieces from this transcript.

Return EXACTLY this Markdown structure with no other text:

## Key Quotes
Extract 3-5 powerful quotable lines (verbatim or near-verbatim from the transcript):
> "Quote text here"

## Key Takeaways
List 5-7 concise, actionable insights:
- Insight here

## Content Hooks
Write 3 attention-grabbing openers for different contexts:
**Blog hook:** Opening sentence for a blog post intro
**Social hook:** Opening line for a Twitter or LinkedIn post
**Email hook:** Compelling email subject line

Transcript:
{transcript}

Return only the three Markdown sections above.`

export async function generateExtras(transcript: string): Promise<string> {
  const prompt = EXTRAS_PROMPT.replace('{transcript}', transcript.slice(0, TRANSCRIPT_LIMIT));
  const response = await openai.chat.completions.create({
    model: 'llama-3.1-8b-instant',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 700,
    temperature: 0.5,
  });
  return response.choices[0].message.content ?? '';
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
