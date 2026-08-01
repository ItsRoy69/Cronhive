import Link from 'next/link'
import Image from 'next/image'
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
  X,
  MessageSquare,
  FileText,
  HelpCircle,
  Globe,
  Lock,
  Users,
  Webhook,
  Star,
} from 'lucide-react'
import { Reveal } from '@/components/marketing/reveal'
import { AnimatedNumber } from '@/components/marketing/animated-number'
import { CiscoLogo, MondayLogo, SendbirdLogo, SlackLogo, SlackMark } from '@/components/marketing/logos'
import { Logo } from '@/components/marketing/logo'
import { Navbar } from '@/components/marketing/navbar'

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
    <section id="hero" data-nav-theme="light" className="relative overflow-hidden bg-white pt-20 pb-32">
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
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/keys"
              className="btn-shine group inline-flex items-center gap-2 rounded-full bg-indigo-600 px-6 py-3 text-sm font-medium text-white shadow-lg shadow-indigo-200 transition-all hover:-translate-y-0.5 hover:bg-indigo-700 hover:shadow-xl hover:shadow-indigo-300 active:translate-y-0"
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
            <div className="pointer-events-none absolute -inset-6 -z-10" aria-hidden>
              <Image
                src="/marketing/hero-glow.jpg"
                alt=""
                fill
                sizes="(min-width: 1024px) 900px, 100vw"
                className="object-cover opacity-30 blur-2xl"
              />
            </div>

            <div
              data-nav-theme="dark"
              className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900 shadow-2xl shadow-slate-400/20"
            >
              <div className="flex items-center gap-1.5 border-b border-slate-700 bg-slate-800 px-4 py-3">
                <span className="size-3 rounded-full bg-red-400" />
                <span className="size-3 rounded-full bg-yellow-400" />
                <span className="size-3 rounded-full bg-green-400" />
              </div>
              <div className="p-4 sm:p-6">
                <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
                  {['All Jobs', 'Running', 'Failed', 'Paused'].map((label, i) => (
                    <div key={label} className="rounded-lg bg-slate-800 p-2.5 transition-colors hover:bg-slate-750 sm:p-3">
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
                      className="flex items-center justify-between gap-3 rounded-lg bg-slate-800/60 px-3 py-3 transition-colors hover:bg-slate-800 sm:px-4"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span
                          className={`size-2 shrink-0 rounded-full ${job.status === 'success' ? 'bg-green-400' : 'bg-red-400'}`}
                        />
                        <span className="truncate text-sm text-slate-200">{job.name}</span>
                      </div>
                      <code className="shrink-0 font-mono text-xs text-slate-400">{job.cron}</code>
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
          <div className="mx-auto mt-16 max-w-xl rounded-2xl border border-slate-200 bg-slate-50/60 p-5 text-left">
            <div className="mb-2 flex items-center gap-0.5" aria-hidden>
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="size-3.5 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <p className="text-sm leading-relaxed text-slate-700">
              &quot;Our nightly backup job failed silently for three weeks before anyone noticed. By the
              time we caught it manually, we&apos;d already lost data we couldn&apos;t recover. CronHive
              would have paged us the first night it missed a run.&quot;
            </p>
            <div className="mt-4 flex items-center gap-3">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-100 to-violet-100 ring-1 ring-indigo-200/50">
                <span className="text-xs font-semibold text-indigo-600">MC</span>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-900">Marcus Chen</p>
                <p className="text-xs text-slate-500">Senior DevOps Engineer, Fernhill Robotics</p>
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
    <section id="trusted" data-nav-theme="dark" className="bg-slate-950 py-24">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-center gap-16 px-6 md:flex-row md:gap-28">
        <Reveal>
          <h2 className="text-2xl leading-snug font-bold text-white">
            Trusted and loved by
            <br />
            the world&apos;s best teams
          </h2>
        </Reveal>
        <div className="grid grid-cols-2 place-items-center gap-x-10 gap-y-10 sm:gap-x-16 md:gap-x-28 md:gap-y-12">
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

function JobRunSparkline() {
  const bars = [35, 60, 28, 78, 52, 90, 68, 95]
  return (
    <div className="flex h-8 items-end gap-1">
      {bars.map((h, i) => (
        <span
          key={i}
          className="w-1.5 rounded-full bg-gradient-to-t from-emerald-500/50 to-emerald-400"
          style={{ height: `${h}%` }}
        />
      ))}
    </div>
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
        <div className="relative">
          <div className="pointer-events-none absolute -inset-4 -z-10" aria-hidden>
            <Image
              src="/marketing/jobs-glow.jpg"
              alt=""
              fill
              sizes="(min-width: 768px) 600px, 100vw"
              className="object-cover opacity-25 blur-2xl"
            />
          </div>

          <div
            data-nav-theme="dark"
            className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900 shadow-xl shadow-slate-300/40"
          >
            <div className="flex items-center gap-1.5 border-b border-slate-700 bg-slate-800 px-4 py-3">
              <span className="size-3 rounded-full bg-red-400" />
              <span className="size-3 rounded-full bg-yellow-400" />
              <span className="size-3 rounded-full bg-green-400" />
            </div>
            <div className="p-5">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">Recent activity</span>
                <span className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-400">
                  <span className="relative flex size-1.5">
                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex size-1.5 rounded-full bg-emerald-400" />
                  </span>
                  Live
                </span>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3 rounded-lg border border-red-500/20 bg-red-500/10 p-4">
                  <div className="relative flex size-8 shrink-0 items-center justify-center rounded-full bg-red-500/15">
                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-red-500/30" />
                    <X className="relative size-4 text-red-400" strokeWidth={2.5} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-white">Job failed</p>
                    <p className="text-xs text-slate-400">&quot;Snowflake Exporter&quot; cron job has failed</p>
                  </div>
                  <span className="shrink-0 text-xs font-medium text-slate-500">2m ago</span>
                </div>

                <div className="rounded-lg border border-slate-700/60 bg-slate-800/60 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-amber-500/15">
                      <Clock className="size-4 text-amber-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-white">Send invoices job is running</p>
                      <p className="text-xs text-slate-400">Elapsed 32:51 · Expected 48 min</p>
                    </div>
                    <span className="shrink-0 text-xs font-medium text-indigo-400">Show details</span>
                  </div>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-700">
                    <div className="h-full w-[68%] rounded-full bg-gradient-to-r from-indigo-500 to-violet-500" />
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-700/60 bg-slate-800/60 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/15">
                      <Check className="size-4 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">Data Backup</p>
                      <p className="text-xs text-slate-400">8 runs · 100% success (30d)</p>
                    </div>
                  </div>
                  <JobRunSparkline />
                </div>
              </div>
            </div>
          </div>

          <div className="animate-float absolute -bottom-6 -left-6 hidden w-48 rounded-xl border border-slate-200 bg-white p-3 shadow-lg shadow-slate-200/60 lg:block">
            <div className="mb-1.5 flex items-center gap-2">
              <div className="flex size-5 items-center justify-center rounded bg-emerald-500">
                <Check className="size-3 text-white" strokeWidth={2.5} />
              </div>
              <span className="text-xs font-medium text-slate-900">Job health</span>
            </div>
            <p className="text-lg font-bold text-slate-900">
              99.2% <span className="text-xs font-normal text-slate-500">success rate</span>
            </p>
          </div>
        </div>
      </Reveal>
    </div>
  )
}

function RegionResponseBars() {
  const bars = [42, 58, 30, 70, 48, 65, 38, 55]
  return (
    <div className="flex h-6 items-end gap-1">
      {bars.map((h, i) => (
        <span
          key={i}
          className="w-1.5 rounded-full bg-gradient-to-t from-indigo-500/40 to-indigo-400"
          style={{ height: `${h}%` }}
        />
      ))}
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
        <div className="relative">
          <div className="pointer-events-none absolute -inset-4 -z-10" aria-hidden>
            <Image
              src="/marketing/checks-glow.jpg"
              alt=""
              fill
              sizes="(min-width: 768px) 600px, 100vw"
              className="object-cover opacity-25 blur-2xl"
            />
          </div>

          <div
            data-nav-theme="dark"
            className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900 shadow-xl shadow-slate-300/40"
          >
            <div className="flex items-center gap-1.5 border-b border-slate-700 bg-slate-800 px-4 py-3">
              <span className="size-3 rounded-full bg-red-400" />
              <span className="size-3 rounded-full bg-yellow-400" />
              <span className="size-3 rounded-full bg-green-400" />
            </div>
            <div className="p-5">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">Global response time</span>
                <span className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-400">
                  <span className="relative flex size-1.5">
                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex size-1.5 rounded-full bg-emerald-400" />
                  </span>
                  Live
                </span>
              </div>

              <div className="mb-4 flex items-center justify-between rounded-lg border border-slate-700/60 bg-slate-800/60 px-3 py-2.5">
                <RegionResponseBars />
                <span className="text-xs font-medium text-slate-300">187ms avg</span>
              </div>

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

          <div className="animate-float absolute -right-6 -bottom-6 hidden w-48 rounded-xl border border-slate-200 bg-white p-3 shadow-lg shadow-slate-200/60 lg:block">
            <div className="mb-1.5 flex items-center gap-2">
              <div className="flex size-5 items-center justify-center rounded bg-indigo-500">
                <Globe className="size-3 text-white" strokeWidth={2.5} />
              </div>
              <span className="text-xs font-medium text-slate-900">Global reach</span>
            </div>
            <p className="text-lg font-bold text-slate-900">
              13+ <span className="text-xs font-normal text-slate-500">regions monitored</span>
            </p>
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

function ChannelBadge({
  icon: Icon,
  label,
  iconClass,
}: {
  icon: React.ElementType
  label: string
  iconClass: string
}) {
  return (
    <div className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white py-1 pr-3 pl-1 shadow-sm">
      <span className={`flex size-5 items-center justify-center rounded-full ${iconClass}`}>
        <Icon className="size-3 text-white" strokeWidth={2.5} />
      </span>
      <span className="text-xs font-medium text-slate-700">{label}</span>
    </div>
  )
}

function SecurityBadge({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5">
      <Icon className="size-3.5 text-indigo-600" />
      <span className="text-xs font-medium text-slate-700">{label}</span>
    </div>
  )
}

function FeaturesSection() {
  const channels = [
    { icon: SlackMark, label: 'Slack', iconClass: 'bg-[#4A154B]' },
    { icon: Bell, label: 'PagerDuty', iconClass: 'bg-[#06AC38]' },
    { icon: Phone, label: 'SMS', iconClass: 'bg-blue-500' },
    { icon: Mail, label: 'Email', iconClass: 'bg-red-500' },
    { icon: Webhook, label: 'Webhooks', iconClass: 'bg-slate-700' },
  ]

  const certifications = [
    { icon: Shield, label: 'SOC 2 Type II' },
    { icon: Lock, label: 'AES-256 at rest' },
    { icon: Users, label: 'Multi-tenant isolation' },
  ]

  return (
    <section id="features" data-nav-theme="light" className="bg-white py-24">
      <div className="mx-auto max-w-7xl space-y-24 px-6">
        <JobsFeature />
        <ChecksFeature />

        <div className="grid gap-10 border-t border-slate-100 pt-16 sm:gap-8 md:grid-cols-2">
          <Reveal className="flex gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-indigo-50">
              <Bell className="size-6 text-indigo-600" />
            </div>
            <div>
              <h4 className="mb-1.5 text-lg font-semibold text-slate-900">Instant alerting</h4>
              <p className="text-sm leading-relaxed text-slate-500">
                Send alerts to 9+ destinations including SMS, Email, Slack and PagerDuty.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {channels.map(c => (
                  <ChannelBadge key={c.label} icon={c.icon} label={c.label} iconClass={c.iconClass} />
                ))}
              </div>
            </div>
          </Reveal>
          <Reveal delay={100} className="flex gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-indigo-50">
              <Shield className="size-6 text-indigo-600" />
            </div>
            <div>
              <h4 className="mb-1.5 text-lg font-semibold text-slate-900">Enterprise-grade security</h4>
              <p className="text-sm leading-relaxed text-slate-500">
                SOC2 compliant, encrypted at rest, with strict multi-tenant isolation.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {certifications.map(c => (
                  <SecurityBadge key={c.label} icon={c.icon} label={c.label} />
                ))}
              </div>
            </div>
          </Reveal>
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
    <section id="stats" data-nav-theme="dark" className="bg-slate-950 py-20">
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
  ]

  return (
    <section id="contact" data-nav-theme="light" className="bg-white py-24">
      <div className="mx-auto max-w-5xl px-6">
        <Reveal>
          <div className="grid gap-12 md:grid-cols-2 md:gap-20">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Book a demo</h2>
              <p className="mt-3 text-slate-500">
                Fill out the form and our team will get back to you within 24 hours.
              </p>
              <ul className="mt-10 space-y-4 border-t border-slate-100 pt-8">
                {links.map(l => (
                  <li key={l.label} className="flex items-center gap-3 text-sm text-slate-600">
                    <l.icon className="size-4 text-indigo-600" strokeWidth={1.75} />
                    {l.label}
                  </li>
                ))}
              </ul>
            </div>

            <form className="space-y-5">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Your name</label>
                <input
                  className="w-full rounded-md border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none"
                  placeholder="John"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Your email</label>
                <input
                  className="w-full rounded-md border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none"
                  placeholder="john@company.com"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Message</label>
                <textarea
                  rows={4}
                  className="w-full resize-none rounded-md border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none"
                  placeholder="Tell us about your needs..."
                />
              </div>
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
              >
                Send message
              </button>
            </form>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

function CTASection() {
  return (
    <section data-nav-theme="dark" className="bg-slate-950 py-24">
      <Reveal className="mx-auto max-w-3xl px-6 text-center">
        <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Are you excited for CronHive?
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-slate-400">
          Send alerts to 9+ destinations including SMS, Email and popular services like Slack and PagerDuty.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-5 sm:flex-row">
          <Link
            href="/keys"
            className="inline-flex items-center gap-2 rounded-md bg-white px-5 py-2.5 text-sm font-medium text-slate-900 transition-colors hover:bg-slate-200"
          >
            Start for free today
            <ArrowRight className="size-4" />
          </Link>
          <Link href="#contact" className="text-sm font-medium text-slate-400 transition-colors hover:text-white">
            Talk to sales &rarr;
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
    <footer data-nav-theme="dark" className="border-t border-slate-800 bg-slate-950 py-16">
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
