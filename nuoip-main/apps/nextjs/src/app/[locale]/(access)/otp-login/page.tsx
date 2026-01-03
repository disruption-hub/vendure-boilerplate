import OtpLoginPage from '@/app/(access)/otp-login/page'
export { metadata } from '@/app/(access)/otp-login/page'

interface LocaleOtpLoginPageProps {
  params: Promise<{ locale: string }>
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

export default async function LocaleOtpLoginPage({ params, searchParams }: LocaleOtpLoginPageProps) {
  // Await params to avoid React error
  await params
  // Pass only searchParams to the base component
  return <OtpLoginPage searchParams={searchParams} />
}

