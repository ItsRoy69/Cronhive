import Link from 'next/link'
import {
  ArrowRight,
  Activity,
  Clock,
  Bell,
  Shield,
  Zap,
  Mail,
  Phone,
  Check,
  MessageSquare,
  FileText,
  HelpCircle,
  Share2,
} from 'lucide-react'
import { Reveal } from '@/components/marketing/reveal'
import { AnimatedNumber } from '@/components/marketing/animated-number'
import { CiscoLogo, MondayLogo, SendbirdLogo, SlackLogo } from '@/components/marketing/logos'

function Logo({ light = false }: { light?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 shadow-sm shadow-indigo-500/30">
        <Activity className="size-4.5 text-white" strokeWidth={2.5} />
      </div>
      <span className={`text-lg font-semibold tracking-tight ${light ? 'text-white' : 'text-slate-900'}`}>
        CronHive
      </span>
    </div>
  )
}

function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/75 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Logo />
        <nav className="hidden items-center gap-8 text-sm text-slate-600 md:flex">
          <Link href="#features" className="transition-colors hover:text-slate-900">
            Product
          </Link>
          <Link href="#stats" className="transition-colors hover:text-slate-900">
            Pricing
          </Link>
          <Link href="#trusted" className="transition-colors hover:text-slate-900">
            Customers
          </Link>
          <Link href="#contact" className="transition-colors hover:text-slate-900">
            Docs
          </Link>
        </nav>
        <div className="flex items-center gap-4">
          <Link
            href="/keys"
            className="hidden text-sm text-slate-600 transition-colors hover:text-slate-900 sm:block"
          >
            Sign in
          </Link>
          <Link
            href="/keys"
            className="inline-flex items-center gap-1.5 rounded-full bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-indigo-700 hover:shadow-md hover:shadow-indigo-200 active:translate-y-0"
          >
            Start for free
          </Link>
        </div>
      </div>
    </header>
  )
}

function FloatingAlert({
  icon: Icon,
  iconClass,
  text,
  className,
  delay,
}: {
  icon: React.ElementType
  iconClass: string
  text: string
  className?: string
  delay?: string
}) {
  return (
    <div
      className={`animate-float w-56 rounded-xl border border-slate-200 bg-white p-3 shadow-lg shadow-slate-200/60 ${className ?? ''}`}
      style={{ animationDelay: delay }}
    >
      <div className="mb-1.5 flex items-center gap-2">
        <div className={`flex size-5 items-center justify-center rounded ${iconClass}`}>
          <Icon className="size-3 text-white" strokeWidth={2.5} />
        </div>
        <span className="text-xs font-medium text-slate-900">CronHive Alert</span>
      </div>
      <p className="text-xs leading-snug text-slate-600">{text}</p>
    </div>
  )
}

function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-white pt-20 pb-32">
      {/* Decorative gradient blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="animate-blob absolute -top-24 left-1/4 size-96 rounded-full bg-indigo-200/40 blur-3xl" />
        <div
          className="animate-blob absolute top-40 right-1/4 size-96 rounded-full bg-violet-200/40 blur-3xl"
          style={{ animationDelay: '3s' }}
        />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 text-center">
        <Reveal>
          <span className="mb-6 inline-flex items-center gap-1.5 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-600">
            <Zap className="size-3" />
            Now monitoring from 13+ global regions
          </span>
          <h1 className="text-5xl leading-tight font-bold tracking-tight text-slate-900 md:text-6xl">
            Simple{' '}
            <span className="inline-flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 align-middle md:size-13">
              <Activity className="size-6 text-white md:size-7" strokeWidth={2.5} />
            </span>{' '}
            monitoring
            <br />
            for every application
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-500">
            Performance insights and uptime monitoring for cron jobs, websites, APIs and more.
          </p>
        </Reveal>

        <Reveal delay={120}>
          <div className="mt-10 flex items-center justify-center gap-3">
            <Link
              href="/keys"
              className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-6 py-3 text-sm font-medium text-white shadow-lg shadow-indigo-200 transition-all hover:-translate-y-0.5 hover:bg-indigo-700 hover:shadow-xl hover:shadow-indigo-300 active:translate-y-0"
            >
              Start for free
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="#features"
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-6 py-3 text-sm font-medium text-slate-700 transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50"
            >
              See how it works
            </Link>
          </div>
        </Reveal>

        {/* Dashboard Preview */}
        <Reveal delay={220}>
          <div className="relative mx-auto mt-16 max-w-4xl">
            <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900 shadow-2xl shadow-slate-400/20">
              <div className="flex items-center gap-1.5 border-b border-slate-700 bg-slate-800 px-4 py-3">
                <span className="size-3 rounded-full bg-red-400" />
                <span className="size-3 rounded-full bg-yellow-400" />
                <span className="size-3 rounded-full bg-green-400" />
              </div>
              <div className="p-6">
                <div className="mb-4 grid grid-cols-4 gap-3">
                  {['All Jobs', 'Running', 'Failed', 'Paused'].map((label, i) => (
                    <div key={label} className="rounded-lg bg-slate-800 p-3 transition-colors hover:bg-slate-750">
                      <p className="text-xs text-slate-400">{label}</p>
                      <p className="mt-1 text-lg font-semibold text-white">{[24, 18, 3, 3][i]}</p>
                    </div>
                  ))}
                </div>
                <div className="space-y-2">
                  {[
                    { name: 'Invoice Generator', status: 'success', cron: '0 */6 * * *' },
                    { name: 'Data Backup', status: 'success', cron: '0 2 * * *' },
                    { name: 'Email Digest', status: 'failed', cron: '0 9 * * 1' },
                    { name: 'Cache Cleanup', status: 'success', cron: '*/30 * * * *' },
                  ].map(job => (
                    <div
                      key={job.name}
                      className="flex items-center justify-between rounded-lg bg-slate-800/60 px-4 py-3 transition-colors hover:bg-slate-800"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`size-2 rounded-full ${job.status === 'success' ? 'bg-green-400' : 'bg-red-400'}`}
                        />
                        <span className="text-sm text-slate-200">{job.name}</span>
                      </div>
                      <code className="font-mono text-xs text-slate-400">{job.cron}</code>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Floating alert cards */}
            <div className="absolute -right-6 top-16 hidden lg:block">
              <FloatingAlert
                icon={MessageSquare}
                iconClass="bg-[#4A154B]"
                text={'"Shopify Sync" cron job has failed'}
              />
              <FloatingAlert
                icon={Mail}
                iconClass="bg-red-500"
                text={'"Storefront API" check is failing'}
                className="mt-3 ml-6"
                delay="1.5s"
              />
            </div>
          </div>
        </Reveal>

        {/* Testimonial */}
        <Reveal delay={300}>
          <div className="mx-auto mt-16 max-w-xl text-left">
            <p className="text-sm leading-relaxed text-slate-600 italic">
              &quot;Before using CronHive we had an important data backup job fail silently for over a
              month.&quot;
            </p>
            <div className="mt-3 flex items-center gap-3">
              <div className="flex size-8 items-center justify-center rounded-full bg-gradient-to-br from-indigo-100 to-violet-100">
                <span className="text-xs font-semibold text-indigo-600">NG</span>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-900">Natalie Gordon</p>
                <p className="text-xs text-slate-500">CEO of Babylist</p>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

function TrustedBySection() {
  const logos = [
    { name: 'Cisco', Mark: CiscoLogo },
    { name: 'monday.com', Mark: MondayLogo },
    { name: 'Sendbird', Mark: SendbirdLogo },
    { name: 'Slack', Mark: SlackLogo },
  ]
  return (
    <section id="trusted" className="bg-slate-950 py-24">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-center gap-16 px-6 md:flex-row md:gap-28">
        <Reveal>
          <h2 className="text-2xl leading-snug font-bold text-white">
            Trusted and loved by
            <br />
            the world&apos;s best teams
          </h2>
        </Reveal>
        <div className="grid grid-cols-2 place-items-center gap-x-28 gap-y-12">
          {logos.map(({ name, Mark }, i) => (
            <Reveal key={name} delay={i * 80} className="flex items-center justify-center">
              <Mark className="text-slate-500 transition-colors hover:text-white" />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

function JobsFeature() {
  return (
    <div className="grid items-center gap-12 md:grid-cols-2">
      <Reveal>
        <span className="mb-4 inline-block rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium tracking-wide text-indigo-600 uppercase">
          Jobs
        </span>
        <h3 className="text-3xl font-bold text-slate-900">Understand your cron jobs.</h3>
        <p className="mt-4 leading-relaxed text-slate-500">
          Capture the status, metrics and output from every cron job and background process. Name and
          organize each job, and ensure the right people are alerted when something goes wrong.
        </p>
      </Reveal>
      <Reveal delay={120}>
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl shadow-slate-200/60">
          <div className="flex items-center gap-1.5 border-b border-slate-100 bg-slate-50 px-4 py-3">
            <span className="size-3 rounded-full bg-red-400" />
            <span className="size-3 rounded-full bg-yellow-400" />
            <span className="size-3 rounded-full bg-green-400" />
          </div>
          <div className="space-y-3 p-5">
            <div className="flex items-center gap-3 rounded-lg border border-red-100 bg-red-50 p-4">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-red-100">
                <span className="text-sm text-red-600">✕</span>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900">Job failed</p>
                <p className="text-xs text-slate-500">&quot;Snowflake Exporter&quot; cron job has failed</p>
              </div>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 bg-slate-50 p-4">
              <div className="flex items-center gap-3">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-amber-100">
                  <Clock className="size-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">Send invoices job is running</p>
                  <p className="text-xs text-slate-500">Elapsed 32:51 · Expected 48 min</p>
                </div>
              </div>
              <span className="shrink-0 text-xs font-medium text-indigo-600">Show details</span>
            </div>
          </div>
        </div>
      </Reveal>
    </div>
  )
}

function ChecksFeature() {
  const points = [
    'Freakishly fast and incredibly reliable.',
    "You'll find out first whenever there is a problem.",
  ]
  return (
    <div className="grid items-center gap-12 md:grid-cols-2">
      <Reveal className="order-2 md:order-1">
        <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900 shadow-xl shadow-slate-300/40">
          <div className="flex items-center gap-1.5 border-b border-slate-700 bg-slate-800 px-4 py-3">
            <span className="size-3 rounded-full bg-red-400" />
            <span className="size-3 rounded-full bg-yellow-400" />
            <span className="size-3 rounded-full bg-green-400" />
          </div>
          <div className="p-5">
            <div className="mb-4 h-2 w-2/3 rounded-full bg-slate-700" />
            <div className="relative flex h-40 items-center justify-center overflow-hidden rounded-lg bg-slate-800">
              <div
                className="absolute inset-0 opacity-40"
                style={{
                  backgroundImage: 'radial-gradient(circle, rgba(129,140,248,0.5) 1px, transparent 1px)',
                  backgroundSize: '14px 14px',
                }}
              />
              {[
                { top: '30%', left: '20%' },
                { top: '55%', left: '45%' },
                { top: '35%', left: '68%' },
                { top: '65%', left: '80%' },
              ].map((pos, i) => (
                <span
                  key={i}
                  className="absolute size-2 rounded-full bg-indigo-400 shadow-[0_0_0_4px_rgba(129,140,248,0.25)]"
                  style={pos}
                />
              ))}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {['SSL Monitoring', 'Performance Monitoring', 'Content Monitoring', 'Global Uptime Monitoring'].map(
                label => (
                  <div key={label} className="flex items-center gap-1.5 rounded-lg bg-slate-800 px-2.5 py-1.5">
                    <Check className="size-3 text-green-400" />
                    <span className="text-[11px] text-slate-300">{label}</span>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </Reveal>
      <Reveal delay={120} className="order-1 md:order-2">
        <span className="mb-4 inline-block rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium tracking-wide text-indigo-600 uppercase">
          Checks
        </span>
        <h3 className="text-3xl font-bold text-slate-900">Uptime and Performance monitoring, done right.</h3>
        <p className="mt-4 leading-relaxed text-slate-500">
          Monitor and validate your websites and APIs from 13+ locations worldwide. Create simple uptime
          checks, or build complex tests with custom assertions.
        </p>
        <ul className="mt-5 space-y-2">
          {points.map(point => (
            <li key={point} className="flex items-center gap-2 text-sm text-slate-600">
              <Check className="size-4 shrink-0 text-indigo-600" />
              {point}
            </li>
          ))}
        </ul>
        <Link
          href="#contact"
          className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 transition-colors hover:text-indigo-700"
        >
          Learn more
          <ArrowRight className="size-3.5" />
        </Link>
      </Reveal>
    </div>
  )
}

function FeaturesSection() {
  const miniFeatures = [
    {
      icon: Bell,
      title: 'Instant alerting',
      description: 'Send alerts to 9+ destinations including SMS, Email, Slack and PagerDuty.',
    },
    {
      icon: Shield,
      title: 'Enterprise-grade security',
      description: 'SOC2 compliant, encrypted at rest, with strict multi-tenant isolation.',
    },
  ]

  return (
    <section id="features" className="bg-white py-24">
      <div className="mx-auto max-w-7xl space-y-24 px-6">
        <JobsFeature />
        <ChecksFeature />

        <div className="grid gap-8 border-t border-slate-100 pt-16 md:grid-cols-2">
          {miniFeatures.map((f, i) => (
            <Reveal key={f.title} delay={i * 100} className="flex gap-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-indigo-50">
                <f.icon className="size-6 text-indigo-600" />
              </div>
              <div>
                <h4 className="mb-1.5 text-lg font-semibold text-slate-900">{f.title}</h4>
                <p className="text-sm leading-relaxed text-slate-500">{f.description}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

function StatsSection() {
  const stats = [
    { value: '50,000+', label: 'Jobs monitored by CronHive' },
    { value: '15,000+', label: 'Alerts sent per day' },
    { value: '30,000,000+', label: 'Events received per day' },
    { value: '3,000,000+', label: 'Website and API checks per day' },
    { value: '5,000,000+', label: 'Incidents detected' },
    { value: '2014', label: 'Founded in California' },
  ]
  return (
    <section id="stats" className="bg-slate-950 py-20">
      <div className="mx-auto max-w-7xl px-6">
        <Reveal>
          <h2 className="mb-12 text-2xl font-bold text-white">The world&apos;s leading job monitoring service</h2>
        </Reveal>
        <div className="grid grid-cols-2 gap-x-8 gap-y-10 md:grid-cols-3">
          {stats.map((s, i) => (
            <Reveal key={s.label} delay={i * 60}>
              <p className="bg-gradient-to-br from-indigo-400 to-violet-400 bg-clip-text text-3xl font-bold text-transparent md:text-4xl">
                <AnimatedNumber value={s.value} />
              </p>
              <p className="mt-2 text-sm text-slate-400">{s.label}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

function ContactSection() {
  const links = [
    { icon: Phone, label: '+1 (555) 000-0000' },
    { icon: Mail, label: 'hello@cronhive.io' },
    { icon: HelpCircle, label: 'FAQ' },
    { icon: FileText, label: 'Documentation' },
    { icon: Share2, label: 'Follow us' },
  ]

  return (
    <section id="contact" className="bg-slate-50 py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid gap-16 md:grid-cols-2">
          <Reveal>
            <h2 className="mb-4 text-3xl font-bold text-slate-900">Book a demo</h2>
            <p className="mb-8 text-slate-500">
              Fill up the form and our team will get back to you within 24 hours.
            </p>
            <div className="space-y-4">
              {links.map(l => (
                <div key={l.label} className="flex items-center gap-3 text-sm text-slate-600">
                  <l.icon className="size-4 text-indigo-600" />
                  {l.label}
                </div>
              ))}
            </div>
          </Reveal>
          <Reveal delay={120}>
            <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
              <div className="space-y-5">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Your Name</label>
                  <input
                    className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm transition-shadow focus:border-transparent focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    placeholder="John"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Your Mail</label>
                  <input
                    className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm transition-shadow focus:border-transparent focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    placeholder="john@company.com"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Your Message</label>
                  <textarea
                    rows={4}
                    className="w-full resize-none rounded-lg border border-slate-200 px-4 py-2.5 text-sm transition-shadow focus:border-transparent focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    placeholder="Tell us about your needs..."
                  />
                </div>
                <button className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-all hover:-translate-y-0.5 hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-200 active:translate-y-0">
                  Book Now
                </button>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}

function CTASection() {
  return (
    <section className="bg-white py-20">
      <Reveal className="mx-auto max-w-7xl px-6 text-center">
        <h2 className="text-3xl font-bold text-slate-900">
          Are you excited for CronHive? <span className="inline-block">🎉</span>
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-slate-500">
          Send alerts to 9+ destinations including SMS, Email and popular services like Slack and PagerDuty.
        </p>
        <div className="mt-8">
          <Link
            href="/keys"
            className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-6 py-3 text-sm font-medium text-white shadow-lg shadow-indigo-200 transition-all hover:-translate-y-0.5 hover:bg-indigo-700 hover:shadow-xl active:translate-y-0"
          >
            Start for free today
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </Reveal>
    </section>
  )
}

function Footer() {
  const columns = [
    { title: 'Products', links: ['Jobs', 'Checks', 'Heartbeats', 'Status Pages'] },
    { title: 'Company', links: ['About us', 'Customers', 'Contact support', 'Status'] },
    { title: 'Documentation', links: ['API', 'Integrations', 'Guides', 'Official SDKs'] },
  ]

  return (
    <footer className="border-t border-slate-800 bg-slate-950 py-16">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div>
            <Logo light />
            <p className="mt-4 text-xs text-slate-500">© 2026 CronHive, Inc.</p>
          </div>
          {columns.map(col => (
            <div key={col.title}>
              <h4 className="mb-3 text-sm font-semibold text-white">{col.title}</h4>
              <ul className="space-y-2">
                {col.links.map(link => (
                  <li key={link}>
                    <span className="cursor-pointer text-sm text-slate-400 transition-colors hover:text-white">
                      {link}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-wrap gap-4 border-t border-slate-800 pt-8 text-xs text-slate-500">
          <span className="cursor-pointer hover:text-slate-300">Terms &amp; Conditions</span>
          <span className="cursor-pointer hover:text-slate-300">Privacy Policy</span>
        </div>
      </div>
    </footer>
  )
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <HeroSection />
      <TrustedBySection />
      <FeaturesSection />
      <StatsSection />
      <ContactSection />
      <CTASection />
      <Footer />
    </div>
  )
}
