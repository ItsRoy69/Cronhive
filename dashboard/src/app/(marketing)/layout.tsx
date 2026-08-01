import { SmoothScroll } from '@/components/marketing/smooth-scroll'

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SmoothScroll />
      {children}
    </>
  )
}
