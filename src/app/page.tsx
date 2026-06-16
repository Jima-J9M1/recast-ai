import Link from "next/link";
import { Zap, FileText, Hash, Briefcase, Mail, ArrowRight, Check, Star, Users, Rss, Layers, Mic } from "lucide-react";

const stats = [
  { value: "4", label: "content formats per video" },
  { value: "60s", label: "average processing time" },
  { value: "12+", label: "languages supported" },
  { value: "25MB", label: "audio upload limit" },
];

const outputs = [
  {
    icon: FileText,
    title: "Blog Post",
    description: "SEO-optimized long-form article with proper structure, headings, and meta description.",
    tag: "Ranks on Google",
  },
  {
    icon: Hash,
    title: "Twitter Thread",
    description: "Viral-ready thread with a strong hook, key insights, and a CTA that drives follows.",
    tag: "Grows your audience",
  },
  {
    icon: Briefcase,
    title: "LinkedIn Post",
    description: "Professional-tone post crafted for B2B reach, engagement, and lead generation.",
    tag: "Builds authority",
  },
  {
    icon: Mail,
    title: "Newsletter",
    description: "Ready-to-send email with a compelling subject line and copy your subscribers love.",
    tag: "Drives open rates",
  },
];

const steps = [
  {
    step: "01",
    title: "Drop a YouTube URL or audio file",
    desc: "Paste any YouTube video, podcast, or upload an audio file up to 25 MB. We handle the rest.",
  },
  {
    step: "02",
    title: "GPT-4o reads your content",
    desc: "We extract the transcript and run it through GPT-4o with your brand voice and tone settings baked in.",
  },
  {
    step: "03",
    title: "4 platform-ready pieces in under 60 seconds",
    desc: "Blog post, Twitter thread, LinkedIn post, and newsletter — each optimized for its platform.",
  },
];

const features = [
  {
    icon: Rss,
    title: "Auto-import YouTube channels",
    description: "Subscribe to any channel. Every new video gets turned into content automatically — hands-free.",
  },
  {
    icon: Layers,
    title: "Brand voice that sticks",
    description: "Set your tone, audience, and phrases once. Every output sounds like you wrote it.",
  },
  {
    icon: Mic,
    title: "Podcast & audio support",
    description: "Upload MP3, M4A, WAV, or OGG up to 25 MB. Works for any spoken content.",
  },
  {
    icon: Users,
    title: "Team workspaces",
    description: "Invite your team, share a credit pool, and collaborate on content at scale.",
  },
];

const plans = [
  {
    name: "Free",
    price: 0,
    description: "Try it out, no card needed",
    features: [
      "3 videos per month",
      "All 4 content formats",
      "Audio upload (up to 25 MB)",
      "Brand voice setup",
      "Copy & export",
    ],
    cta: "Start Free",
    href: "/signup",
    highlight: false,
  },
  {
    name: "Starter",
    price: 19,
    description: "For consistent creators",
    features: [
      "25 videos per month",
      "All 4 content formats",
      "Audio upload (up to 25 MB)",
      "Brand voice + custom prompts",
      "Content history & versioning",
      "3 auto-import RSS feeds",
      "Batch process 10 URLs",
      "SEO mode",
      "Email support",
    ],
    cta: "Get Started",
    href: "/signup?plan=starter",
    highlight: true,
  },
  {
    name: "Pro",
    price: 49,
    description: "For teams & power users",
    features: [
      "Unlimited videos",
      "All 4 content formats",
      "Audio upload (up to 25 MB)",
      "Brand voice + custom prompts",
      "Content history & versioning",
      "10 auto-import RSS feeds",
      "Batch process 50 URLs",
      "SEO mode",
      "Team workspace (up to 10 members)",
      "Webhooks & API access",
      "Priority support",
    ],
    cta: "Go Pro",
    href: "/signup?plan=pro",
    highlight: false,
  },
];

const testimonials = [
  {
    quote: "I used to spend 3 hours turning each podcast into social posts. Now it takes 60 seconds and the quality is honestly better than what I was writing myself.",
    author: "Marcus T.",
    role: "Podcast host, 40k subscribers",
  },
  {
    quote: "The RSS auto-import feature alone is worth the price. My YouTube channel posts automatically to every platform without me touching anything.",
    author: "Priya S.",
    role: "YouTube creator",
  },
  {
    quote: "We run a content agency and batch processing 50 client videos at once has completely changed how we operate.",
    author: "Jordan K.",
    role: "Content agency founder",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 glass border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-600 flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-lg text-white">RecastAI</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm text-white/50">
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#how-it-works" className="hover:text-white transition-colors">How it works</a>
          <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm text-white/60 hover:text-white transition-colors">
            Sign in
          </Link>
          <Link
            href="/signup"
            className="text-sm px-4 py-2 rounded-full bg-amber-600 text-white hover:bg-amber-500 transition-colors"
          >
            Start Free
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-36 pb-24 px-6 text-center overflow-hidden">
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[500px] rounded-full opacity-20 blur-3xl pointer-events-none"
          style={{ background: "radial-gradient(circle, #d97706, transparent)" }}
        />

        <div className="relative max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass text-sm text-amber-300 mb-8 border border-amber-500/20">
            <Star className="w-3 h-3 fill-current" />
            Powered by GPT-4o — results in under 60 seconds
          </div>

          <h1 className="text-5xl md:text-7xl font-bold leading-tight mb-6">
            <span className="text-white">One video.</span>
            <br />
            <span className="gradient-text">Four content pieces.</span>
          </h1>

          <p className="text-xl text-white/60 max-w-2xl mx-auto mb-10 leading-relaxed">
            Paste a YouTube URL or upload a podcast. Get a blog post, Twitter thread, LinkedIn post,
            and newsletter — all platform-optimized, all in your brand voice.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link
              href="/signup"
              className="flex items-center gap-2 px-8 py-4 rounded-full bg-amber-600 text-white text-lg font-semibold hover:bg-amber-500 transition-all glow-purple"
            >
              Start for free <ArrowRight className="w-5 h-5" />
            </Link>
            <p className="text-sm text-white/40">3 videos free · No credit card</p>
          </div>

          {/* Demo UI */}
          <div className="glass rounded-2xl p-6 max-w-2xl mx-auto text-left border border-white/5">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/60" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                <div className="w-3 h-3 rounded-full bg-green-500/60" />
              </div>
              <span className="text-xs text-white/30">recastai.app</span>
            </div>
            <div className="flex gap-2 items-center p-3 bg-white/5 rounded-xl mb-4 border border-white/5">
              <div className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
              <span className="text-sm text-white/50 truncate">youtube.com/watch?v=example</span>
              <span className="ml-auto text-xs px-3 py-1 rounded-full bg-amber-600 text-white shrink-0">Generate</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {outputs.map((o) => (
                <div key={o.title} className="p-3 bg-white/5 rounded-xl flex items-center gap-2 border border-white/5">
                  <o.icon className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="text-sm text-white/70">{o.title}</span>
                  <Check className="w-3 h-3 text-green-400 ml-auto shrink-0" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Social proof stats */}
      <section className="py-12 px-6 border-y border-white/5">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-3xl font-black gradient-text mb-1">{s.value}</div>
              <div className="text-sm text-white/40">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* What you get */}
      <section className="py-24 px-6" id="features">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">One input → four platform-ready outputs</h2>
            <p className="text-white/50 max-w-xl mx-auto">
              Each format is independently optimized — not just reformatted. Your blog post ranks on Google.
              Your thread hooks on X. Your LinkedIn post builds authority.
            </p>
          </div>
          <div className="grid md:grid-cols-4 gap-6">
            {outputs.map((o) => (
              <div key={o.title} className="glass rounded-2xl p-6 border border-white/5">
                <div className="w-10 h-10 rounded-xl bg-amber-900/50 flex items-center justify-center mb-4">
                  <o.icon className="w-5 h-5 text-amber-400" />
                </div>
                <div className="text-xs text-amber-400 font-semibold mb-2 uppercase tracking-wider">{o.tag}</div>
                <h3 className="font-semibold text-white mb-2">{o.title}</h3>
                <p className="text-sm text-white/50 leading-relaxed">{o.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Premium features */}
      <section className="py-24 px-6 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">Built for serious creators</h2>
            <p className="text-white/50">Not just a one-trick tool. RecastAI grows with your content operation.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {features.map((f) => (
              <div key={f.title} className="glass rounded-2xl p-8 flex gap-5 border border-white/5">
                <div className="w-12 h-12 rounded-xl bg-amber-900/50 flex items-center justify-center shrink-0">
                  <f.icon className="w-6 h-6 text-amber-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-lg mb-2">{f.title}</h3>
                  <p className="text-white/50 leading-relaxed">{f.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-6 border-t border-white/5" id="how-it-works">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">Three steps. Done.</h2>
            <p className="text-white/50">No setup. No learning curve. First result in under 2 minutes.</p>
          </div>
          <div className="space-y-6">
            {steps.map((s) => (
              <div key={s.step} className="flex gap-6 items-start glass rounded-2xl p-8 border border-white/5">
                <div className="text-4xl font-black gradient-text shrink-0 w-14">{s.step}</div>
                <div>
                  <h3 className="font-semibold text-white text-lg mb-2">{s.title}</h3>
                  <p className="text-white/50 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 px-6 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-white mb-16">Creators who get their time back</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div key={t.author} className="glass rounded-2xl p-8 flex flex-col border border-white/5">
                <div className="flex gap-1 mb-6">
                  {["s1","s2","s3","s4","s5"].map((k) => (
                    <Star key={k} className="w-4 h-4 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-white/70 leading-relaxed flex-1 mb-6">&ldquo;{t.quote}&rdquo;</p>
                <div>
                  <div className="font-semibold text-white text-sm">{t.author}</div>
                  <div className="text-white/40 text-xs mt-0.5">{t.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-24 px-6 border-t border-white/5" id="pricing">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">Simple, honest pricing</h2>
            <p className="text-white/50">Start free. Upgrade only when you need more. Cancel anytime.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 items-start">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-2xl p-8 flex flex-col ${
                  plan.highlight
                    ? "bg-amber-600/20 border border-amber-500/40 glow-purple"
                    : "glass border border-white/5"
                }`}
              >
                {plan.highlight && (
                  <div className="text-xs text-amber-300 font-semibold mb-3 uppercase tracking-widest">
                    Most Popular
                  </div>
                )}
                <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                <p className="text-white/40 text-sm mt-1 mb-5">{plan.description}</p>
                <div className="mb-8">
                  <span className="text-5xl font-black text-white">${plan.price}</span>
                  <span className="text-white/40 text-sm">/month</span>
                </div>
                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-white/70">
                      <Check className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href={plan.href}
                  className={`w-full py-3 rounded-full text-center text-sm font-semibold transition-all ${
                    plan.highlight
                      ? "bg-amber-600 text-white hover:bg-amber-500"
                      : "border border-white/20 text-white hover:bg-white/10"
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 border-t border-white/5">
        <div className="max-w-2xl mx-auto glass rounded-3xl p-12 text-center glow-purple border border-amber-500/20">
          <h2 className="text-3xl font-bold text-white mb-4">
            Stop leaving content on the table
          </h2>
          <p className="text-white/60 mb-8 leading-relaxed">
            Every video you publish without repurposing is 4 pieces of content you&apos;re not getting.
            Start turning your backlog into content that works across every platform.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-amber-600 text-white font-semibold hover:bg-amber-500 transition-all"
          >
            Start free — 3 videos included <ArrowRight className="w-4 h-4" />
          </Link>
          <p className="text-white/30 text-sm mt-4">No credit card. No commitment. Cancel anytime.</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-6 border-t border-white/5">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500" />
            <span className="font-semibold text-white/60">RecastAI</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-white/30">
            <a href="#pricing" className="hover:text-white/60 transition-colors">Pricing</a>
            <Link href="/login" className="hover:text-white/60 transition-colors">Sign in</Link>
            <Link href="/signup" className="hover:text-white/60 transition-colors">Sign up</Link>
          </div>
          <p className="text-white/30 text-sm">© {new Date().getFullYear()} RecastAI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
