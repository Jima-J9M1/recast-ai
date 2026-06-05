import OpenAI from 'openai'

// Uses Groq-compatible OpenAI SDK — just swap base URL
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
  baseURL: 'https://api.groq.com/openai/v1',
})

export type ContentFormat = 'blog' | 'twitter_thread' | 'linkedin' | 'newsletter'

const PROMPTS: Record<ContentFormat, string> = {
  blog: `You are an expert content writer. Transform the following transcript into an engaging, SEO-optimized blog post.

Structure:
- Compelling H1 title
- Introduction (hook the reader)
- 3-5 main sections with H2 headings
- Key takeaways or conclusion
- Conversational but authoritative tone

Transcript:
{transcript}

Write the full blog post in Markdown format.`,

  twitter_thread: `You are a viral Twitter/X content creator. Transform the following transcript into a compelling Twitter thread.

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

// Groq free tier: ~6k TPM. Keep transcript short so 4 parallel calls don't burst the limit.
const TRANSCRIPT_LIMIT = 4000

export async function generateContent(
  transcript: string,
  format: ContentFormat
): Promise<string> {
  const prompt = PROMPTS[format].replace('{transcript}', transcript.slice(0, TRANSCRIPT_LIMIT))

  const response = await openai.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: MAX_TOKENS[format],
    temperature: 0.7,
  })

  return response.choices[0].message.content ?? ''
}

export async function generateTitle(transcript: string): Promise<string> {
  const response = await openai.chat.completions.create({
    // Use the fast 8B model for the title — quality doesn't need 70B
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
