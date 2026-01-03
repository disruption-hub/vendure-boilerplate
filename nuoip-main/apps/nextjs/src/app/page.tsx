import type { Metadata } from 'next'
import { LandingPage } from '@/components/landing/LandingPage'

export const metadata: Metadata = {
  title: 'FlowCast — Platform Home',
  description: 'FlowCast: CRM, FlowBot and analytics. Mobile-first engagement platform for teams.',
  alternates: {
    canonical: 'https://flowcast.chat',
  },
  openGraph: {
    title: 'FlowCast — Platform Home',
    description: 'FlowCast: CRM, FlowBot and analytics. Mobile-first engagement platform for teams.',
    url: 'https://flowcast.chat',
    siteName: 'FlowCast',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FlowCast — Platform Home',
    description: 'FlowCast: CRM, FlowBot and analytics. Mobile-first engagement platform for teams.',
  },
}

export default async function HomePage() {
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? 'flowcast.chat'
  
  return <LandingPage rootDomain={rootDomain} />
}