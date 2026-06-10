export type ContentFormat = 'blog' | 'twitter_thread' | 'linkedin' | 'newsletter' | 'email_sequence'

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

  email_sequence: `You are an email marketing expert. Transform the following transcript into a 5-part email drip sequence designed to nurture leads and drive action.

Tone: {tone}

Write exactly 5 emails. For each email use this exact format:

---
## Email [N]: [Title]
**Send:** Day [X] after signup
**Subject:** [subject line, max 50 chars]
**Preview:** [preview text, max 90 chars]

[Email body — conversational, no HTML. 150-250 words.]

**CTA:** [one clear call-to-action]

---

Email 1 (Day 0): Welcome + single biggest insight from the content
Email 2 (Day 2): Deeper dive on the most actionable takeaway
Email 3 (Day 4): Story or case study angle from the content
Email 4 (Day 6): Objection handler — address the most common "but..."
Email 5 (Day 9): Final push with strong CTA

Transcript:
{transcript}

Write all 5 emails separated by "---".`,
}
