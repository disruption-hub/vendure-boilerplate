export interface LabsMobileConfig {
  username: string
  token: string
  senderId?: string | null
  endpoint?: string | null
  baseUrl?: string | null
}

export async function getLabsMobileConfig(): Promise<LabsMobileConfig | null> {
  const username = process.env.LABSMOBILE_USERNAME?.trim() ?? ''
  const token = process.env.LABSMOBILE_TOKEN?.trim() ?? ''
  const senderId = process.env.LABSMOBILE_SENDER_ID?.trim() ?? null
  const endpoint = process.env.LABSMOBILE_ENDPOINT?.trim() ?? null

  if (!username || !token) {
    return null
  }

  return {
    username,
    token,
    senderId,
    endpoint,
  }
}
