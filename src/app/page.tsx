import Link from "next/link";
import { Zap, FileText, Hash, Briefcase, Mail, ArrowRight, Check, Star } from "lucide-react";

const features = [
  {
    icon: FileText,
    title: "Blog Post",
    description: "SEO-optimized long-form article with proper structure and headings.",
  },
  {
    icon: Hash,
    title: "Twitter Thread",
    description: "Viral-ready thread with hook, insights, and strong CTA.",
  },
  {
    icon: Briefcase,
    title: "LinkedIn Post",
    description: "Professional post crafted for engagement and reach.",
  },
  {
    icon: Mail,
    title: "Newsletter",
    description: "Ready-to-send email with subject line and compelling copy.",
  },
];

const steps = [
  { step: "01", title: "Paste a YouTube URL", desc: "Drop any YouTube video or podcast link." },
  { step: "02", title: "AI processes it", desc: "We fetch the transcript and feed it to GPT-4o." },
  { step: "03", title: "Get 4 content pieces", desc: "Blog, thread, LinkedIn post, and newsletter — ready to publish." },
];

const plans = [
  {
    name: "Free",
    price: 0,
    description: "Try it out",
    features: ["1 video per month", "All 4 content formats", "Copy & export"],
    cta: "Start Free",
    href: "/signup",
    highlight: false,
  },
  {
    name: "Starter",
    price: 19,
    description: "For creators",
    features: ["10 videos per month", "All 4 content formats", "Copy & export", "Content history"],
    cta: "Get Started",
    href: "/signup?plan=starter",
    highlight: true,
  },
  {
    name: "Pro",
    price: 49,
    description: "Unlimited everything",
    features: ["Unlimited videos", "All 4 content formats", "Copy & export", "Content history", "Priority support"],
    cta: "Go Pro",
    href: "/signup?plan=pro",
    highlight: false,
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 glass border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-lg text-white">RecastAI</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm text-white/60 hover:text-white transition-colors">
            Sign in
          </Link>
          <Link
            href="/signup"
            className="text-sm px-4 py-2 rounded-full bg-purple-600 text-white hover:bg-purple-500 transition-colors"
          >
            Get Started Free
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-24 px-6 text-center overflow-hidden">
        {/* Background glow */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full opacity-20 blur-3xl pointer-events-none"
          style={{ background: "radial-gradient(circle, #7c3aed, transparent)" }}
        />

        <div className="relative max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass text-sm text-purple-300 mb-8">
            <Star className="w-3 h-3 fill-current" />
            Turn 1 video into 4 pieces of viral content
          </div>

          <h1 className="text-5xl md:text-7xl font-bold leading-tight mb-6">
            <span className="text-white">Stop spending hours</span>
            <br />
            <span className="gradient-text">repurposing content</span>
          </h1>

          <p className="text-xl text-white/60 max-w-2xl mx-auto mb-10 leading-relaxed">
            Paste any YouTube URL. Get a blog post, Twitter thread, LinkedIn post, and newsletter
            — all in under 60 seconds. Powered by GPT-4o.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/signup"
              className="flex items-center gap-2 px-8 py-4 rounded-full bg-purple-600 text-white text-lg font-semibold hover:bg-purple-500 transition-all glow-purple"
            >
              Start for free <ArrowRight className="w-5 h-5" />
            </Link>
            <p className="text-sm text-white/40">No credit card required</p>
          </div>

          {/* Demo preview */}
          <div className="mt-16 glass rounded-2xl p-6 max-w-2xl mx-auto text-left">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/60" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                <div className="w-3 h-3 rounded-full bg-green-500/60" />
              </div>
              <span className="text-xs text-white/30">recastai.app</span>
            </div>
            <div className="flex gap-2 items-center p-3 bg-white/5 rounded-xl mb-4">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              <span className="text-sm text-white/60">youtube.com/watch?v=dQw4w9WgXcQ</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {features.map((f) => (
                <div key={f.title} className="p-3 bg-white/5 rounded-xl flex items-center gap-2">
                  <f.icon className="w-4 h-4 text-purple-400" />
                  <span className="text-sm text-white/70">{f.title}</span>
                  <Check className="w-3 h-3 text-green-400 ml-auto" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-white mb-4">
            One video → four content formats
          </h2>
          <p className="text-center text-white/50 mb-16">
            Everything you need to grow your audience across every platform.
          </p>
          <div className="grid md:grid-cols-4 gap-6">
            {features.map((f) => (
              <div key={f.title} className="glass rounded-2xl p-6">
                <div className="w-10 h-10 rounded-xl bg-purple-900/50 flex items-center justify-center mb-4">
                  <f.icon className="w-5 h-5 text-purple-400" />
                </div>
                <h3 className="font-semibold text-white mb-2">{f.title}</h3>
                <p className="text-sm text-white/50 leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-white mb-4">
            Three steps. Done.
          </h2>
          <p className="text-center text-white/50 mb-16">No learning curve. No setup.</p>
          <div className="space-y-8">
            {steps.map((s, i) => (
              <div key={s.step} className="flex gap-6 items-start glass rounded-2xl p-6">
                <div className="text-4xl font-black gradient-text shrink-0">{s.step}</div>
                <div>
                  <h3 className="font-semibold text-white text-lg mb-1">{s.title}</h3>
                  <p className="text-white/50">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-white mb-4">Simple pricing</h2>
          <p className="text-center text-white/50 mb-16">Start free. Upgrade when you need more.</p>
          <div className="grid md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-2xl p-6 flex flex-col ${
                  plan.highlight
                    ? "bg-purple-600/20 border border-purple-500/40 glow-purple"
                    : "glass"
                }`}
              >
                {plan.highlight && (
                  <div className="text-xs text-purple-300 font-semibold mb-3 uppercase tracking-widest">
                    Most Popular
                  </div>
                )}
                <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                <p className="text-white/50 text-sm mt-1 mb-4">{plan.description}</p>
                <div className="mb-6">
                  <span className="text-4xl font-black text-white">${plan.price}</span>
                  <span className="text-white/40 text-sm">/month</span>
                </div>
                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-white/70">
                      <Check className="w-4 h-4 text-purple-400 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href={plan.href}
                  className={`w-full py-3 rounded-full text-center text-sm font-semibold transition-all ${
                    plan.highlight
                      ? "bg-purple-600 text-white hover:bg-purple-500"
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
      <section className="py-24 px-6">
        <div className="max-w-2xl mx-auto glass rounded-3xl p-12 text-center glow-purple">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to 10x your content output?
          </h2>
          <p className="text-white/60 mb-8">
            Join creators who save 5+ hours every week with RecastAI.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-purple-600 text-white font-semibold hover:bg-purple-500 transition-all"
          >
            Start for free — no credit card needed <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-white/5 text-center text-white/30 text-sm">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Zap className="w-4 h-4 text-purple-500" />
          <span className="font-semibold text-white/60">RecastAI</span>
        </div>
        <p>© {new Date().getFullYear()} RecastAI. All rights reserved.</p>
      </footer>
    </div>
  );
}
