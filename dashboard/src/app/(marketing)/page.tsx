import Link from 'next/link'
import { ArrowRight, Clock, Bell, Shield, Zap, Mail, Phone, MapPin } from 'lucide-react'

function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/80 backdrop-blur-md">
      <div className="mx-auto max-w-7xl flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="size-7 rounded bg-amber-500 flex items-center justify-center">
            <span className="text-sm font-bold text-black">C</span>
          </div>
          <span className="text-lg font-semibold text-gray-900">CronHive</span>
        </div>
        <nav className="hidden md:flex items-center gap-8 text-sm text-gray-600">
          <Link href="#features" className="hover:text-gray-900 transition-colors">Product</Link>
          <Link href="#stats" className="hover:text-gray-900 transition-colors">Pricing</Link>
          <Link href="#trusted" className="hover:text-gray-900 transition-colors">Customers</Link>
          <Link href="#contact" className="hover:text-gray-900 transition-colors">Docs</Link>
        </nav>
        <div className="flex items-center gap-4">
          <Link href="/keys" className="text-sm text-gray-600 hover:text-gray-900 transition-colors hidden sm:block">
            Sign in
          </Link>
          <Link
            href="/keys"
            className="inline-flex items-center gap-1.5 rounded-full bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
          >
            Start for free
          </Link>
        </div>
      </div>
    </header>
  )
}

function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-white pt-20 pb-32">
      <div className="mx-auto max-w-7xl px-6 text-center">
        <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-gray-900 leading-tight">
          Simple <span className="inline-block">🔄</span> monitoring
          <br />for every application
        </h1>
        <p className="mt-6 text-lg text-gray-500 max-w-2xl mx-auto">
          Performance insights and uptime monitoring for cron jobs, websites, APIs and more.
        </p>
        <div className="mt-10">
          <Link
            href="/keys"
            className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-6 py-3 text-sm font-medium text-white hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
          >
            Start for free
            <ArrowRight className="size-4" />
          </Link>
        </div>

        {/* Dashboard Preview */}
        <div className="mt-16 relative mx-auto max-w-4xl">
          <div className="rounded-xl border border-gray-200 bg-gray-900 shadow-2xl overflow-hidden">
            <div className="flex items-center gap-1.5 px-4 py-3 bg-gray-800 border-b border-gray-700">
              <span className="size-3 rounded-full bg-red-400" />
              <span className="size-3 rounded-full bg-yellow-400" />
              <span className="size-3 rounded-full bg-green-400" />
            </div>
            <div className="p-6">
              <div className="grid grid-cols-4 gap-3 mb-4">
                {['All Jobs', 'Running', 'Failed', 'Paused'].map((label, i) => (
                  <div key={label} className="rounded-lg bg-gray-800 p-3">
                    <p className="text-xs text-gray-400">{label}</p>
                    <p className="text-lg font-semibold text-white mt-1">
                      {[24, 18, 3, 3][i]}
                    </p>
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
                  <div key={job.name} className="flex items-center justify-between rounded-lg bg-gray-800/60 px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className={`size-2 rounded-full ${job.status === 'success' ? 'bg-green-400' : 'bg-red-400'}`} />
                      <span className="text-sm text-gray-200">{job.name}</span>
                    </div>
                    <code className="text-xs text-gray-400 font-mono">{job.cron}</code>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Floating alert cards */}
          <div className="absolute -right-4 top-20 hidden lg:block">
            <div className="rounded-lg bg-white border border-gray-200 shadow-lg p-3 w-56">
              <div className="flex items-center gap-2 mb-1">
                <div className="size-5 rounded bg-amber-500 flex items-center justify-center">
                  <span className="text-[10px] font-bold text-black">C</span>
                </div>
                <span className="text-xs font-medium text-gray-900">CronHive Alert</span>
              </div>
              <p className="text-xs text-gray-600">&quot;Shopify Sync&quot; cron job has failed</p>
            </div>
            <div className="rounded-lg bg-white border border-gray-200 shadow-lg p-3 w-56 mt-3 ml-4">
              <div className="flex items-center gap-2 mb-1">
                <div className="size-5 rounded bg-amber-500 flex items-center justify-center">
                  <span className="text-[10px] font-bold text-black">C</span>
                </div>
                <span className="text-xs font-medium text-gray-900">CronHive Alert</span>
              </div>
              <p className="text-xs text-gray-600">&quot;Storefront API&quot; check is failing</p>
            </div>
          </div>
        </div>

        {/* Testimonial */}
        <div className="mt-16 max-w-xl mx-auto text-left">
          <p className="text-sm text-gray-600 italic leading-relaxed">
            &quot;Before using CronHive we had an important data backup job fail silently for over a month.&quot;
          </p>
          <div className="flex items-center gap-3 mt-3">
            <div className="size-8 rounded-full bg-indigo-100 flex items-center justify-center">
              <span className="text-xs font-semibold text-indigo-600">NG</span>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-900">Natalie Gordon</p>
              <p className="text-xs text-gray-500">CEO of Babyst</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function StatsSection() {
  const stats = [
    { value: '50,000+', label: 'Jobs monitored by CronHive' },
    { value: '15,000+', label: 'Alerts sent per day' },
    { value: '5,000,000+', label: 'Websites and API checks per day' },
    { value: '30,000,000+', label: 'Events received per day' },
  ]
  return (
    <section id="stats" className="bg-gray-900 py-20">
      <div className="mx-auto max-w-7xl px-6">
        <h2 className="text-2xl font-bold text-white mb-12">
          The world&apos;s leading job monitoring service
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map(s => (
            <div key={s.label}>
              <p className="text-3xl md:text-4xl font-bold text-amber-400">{s.value}</p>
              <p className="text-sm text-gray-400 mt-2">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function TrustedBySection() {
  const logos = ['Cisco', 'Monday', 'Sendbird', 'Slack']
  return (
    <section id="trusted" className="bg-indigo-600 py-16">
      <div className="mx-auto max-w-7xl px-6 flex flex-col md:flex-row items-center gap-12">
        <h2 className="text-2xl font-bold text-white leading-snug md:w-1/3">
          Trusted and loved by
          <br />the world&apos;s best teams
        </h2>
        <div className="flex flex-wrap items-center gap-10 md:gap-16">
          {logos.map(logo => (
            <span key={logo} className="text-xl font-semibold text-white/80">{logo}</span>
          ))}
        </div>
      </div>
    </section>
  )
}

function FeaturesSection() {
  const features = [
    {
      icon: Clock,
      title: 'Understand your cron jobs',
      description: 'Capture the status, metrics and output from every cron job and background process. Name and organize each job, and ensure the right people are alerted when something goes wrong.',
    },
    {
      icon: Zap,
      title: 'Uptime and Performance monitoring, done right',
      description: 'Monitor and validate your websites and APIs from 13+ locations worldwide. Check simple uptime, uptime checks, or build complex tests with custom assertions.',
    },
    {
      icon: Bell,
      title: 'Instant alerting',
      description: 'Send alerts to 15+ destinations including SMS, Email and popular services like Slack and PagerDuty. Get notified the moment something fails.',
    },
    {
      icon: Shield,
      title: 'Enterprise-grade security',
      description: 'SOC2 compliant, encrypted at rest, multi-tenant isolation. Your monitoring data is safe with us.',
    },
  ]

  return (
    <section id="features" className="py-24 bg-white">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center mb-16">
          <span className="inline-block px-3 py-1 rounded-full bg-amber-50 text-amber-600 text-xs font-medium uppercase tracking-wide mb-4">
            Features
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
            Everything you need to monitor your infrastructure
          </h2>
        </div>
        <div className="grid md:grid-cols-2 gap-12">
          {features.map(f => (
            <div key={f.title} className="flex gap-4">
              <div className="shrink-0 size-12 rounded-lg bg-indigo-50 flex items-center justify-center">
                <f.icon className="size-6 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Job failure preview */}
        <div className="mt-20 mx-auto max-w-3xl">
          <div className="rounded-xl border border-gray-200 bg-white shadow-lg overflow-hidden">
            <div className="flex items-center gap-1.5 px-4 py-3 bg-gray-50 border-b border-gray-200">
              <span className="size-3 rounded-full bg-red-400" />
              <span className="size-3 rounded-full bg-yellow-400" />
              <span className="size-3 rounded-full bg-green-400" />
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-red-50 border border-red-100">
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-full bg-red-100 flex items-center justify-center">
                    <span className="text-red-600 text-sm">✕</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Job failed</p>
                    <p className="text-xs text-gray-500">your job has failed</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-full bg-amber-100 flex items-center justify-center">
                    <Clock className="size-4 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Send Invoices job is running</p>
                    <p className="text-xs text-gray-500">Elapsed time: 32:51 · Expected time: 45 min</p>
                  </div>
                </div>
                <span className="text-xs text-indigo-600 font-medium cursor-pointer">Show details</span>
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg bg-red-50 border border-red-100">
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-full bg-red-100 flex items-center justify-center">
                    <span className="text-red-600 text-sm">!</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">&quot;Snowflake Exporter&quot;</p>
                    <p className="text-xs text-gray-500">cron job has failed</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function ContactSection() {
  return (
    <section id="contact" className="py-24 bg-gray-50">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid md:grid-cols-2 gap-16">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Book a demo</h2>
            <p className="text-gray-500 mb-8">
              Fill up the form and our team will get back to you within 24 hours.
            </p>
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <Phone className="size-4 text-indigo-600" />
                +1 (555) 000-0000
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <Mail className="size-4 text-indigo-600" />
                hello@cronhive.io
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <MapPin className="size-4 text-indigo-600" />
                San Francisco, California
              </div>
            </div>
          </div>
          <div className="rounded-xl bg-white border border-gray-200 shadow-sm p-8">
            <div className="space-y-5">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">Your Name</label>
                <input className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" placeholder="John" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">Your Mail</label>
                <input className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" placeholder="john@company.com" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">Your Message</label>
                <textarea rows={4} className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none" placeholder="Tell us about your needs..." />
              </div>
              <button className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 transition-colors">
                Book Now
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function CTASection() {
  return (
    <section className="py-20 bg-white">
      <div className="mx-auto max-w-7xl px-6 text-center">
        <h2 className="text-3xl font-bold text-gray-900">
          Are you excited for CronHive? <span className="inline-block">🎉</span>
        </h2>
        <p className="mt-4 text-gray-500 max-w-lg mx-auto">
          Send alerts to 15+ destinations including SMS, Email and popular services like Slack and PagerDuty.
        </p>
        <div className="mt-8">
          <Link
            href="/keys"
            className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-6 py-3 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
          >
            Start for free
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}

function Footer() {
  const columns = [
    { title: 'Products', links: ['Cron Monitoring', 'Uptime Monitoring', 'Heartbeats', 'Status Pages'] },
    { title: 'Company', links: ['About us', 'Customers', 'Contact Support', 'Status'] },
    { title: 'Documentation', links: ['API', 'Integrations', 'SDKs', 'Official Docs'] },
  ]

  return (
    <footer className="border-t border-gray-200 bg-white py-16">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="size-6 rounded bg-amber-500 flex items-center justify-center">
                <span className="text-xs font-bold text-black">C</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">CronHive</span>
            </div>
            <p className="text-xs text-gray-500">© 2024 CronHive, Inc.</p>
          </div>
          {columns.map(col => (
            <div key={col.title}>
              <h4 className="text-sm font-semibold text-gray-900 mb-3">{col.title}</h4>
              <ul className="space-y-2">
                {col.links.map(link => (
                  <li key={link}>
                    <span className="text-sm text-gray-500 hover:text-gray-700 cursor-pointer transition-colors">
                      {link}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 pt-8 border-t border-gray-100 flex flex-wrap gap-4 text-xs text-gray-400">
          <span>Terms & Conditions</span>
          <span>Privacy Policy</span>
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
      <StatsSection />
      <TrustedBySection />
      <FeaturesSection />
      <ContactSection />
      <CTASection />
      <Footer />
    </div>
  )
}
