import type { ChatOtpRequest, ChatOtpResponse, ChatOtpVerifyRequest, ChatOtpVerifyResponse } from '@/types/chat-auth'

export const requestOtp = async (input: ChatOtpRequest): Promise<ChatOtpResponse> => {
  try {
    const response = await fetch('/api/chat/otp/request', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to request OTP' }))
      const errorMessage = error.message || error.error || 'Failed to request OTP'
      const errorCode = error.code || 'OTP_REQUEST_FAILED'
      const err = new Error(errorMessage) as any
      err.code = errorCode
      throw err
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error requesting OTP:', error)
    throw error
  }
}

export const verifyOtp = async (verificationId: string, code: string): Promise<ChatOtpVerifyResponse> => {
  try {
    const payload: ChatOtpVerifyRequest = {
      verificationId,
      code,
    }

    const response = await fetch('/api/chat/otp/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to verify OTP' }))
      const errorMessage = error.message || error.error || 'Failed to verify OTP'
      const errorCode = error.code || 'VERIFICATION_FAILED'
      const err = new Error(errorMessage) as any
      err.code = errorCode
      throw err
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error verifying OTP:', error)
    throw error
  }
}

export const syncSession = async (input: ChatOtpRequest & { sessionToken?: string | null }): Promise<any> => {
  try {
    const response = await fetch('/api/chat/otp/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to sync session' }))
      throw new Error(error.message || error.error || 'Failed to sync session')
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error syncing session:', error)
    throw error
  }
}

export const loadSession = async (token: string, extend: boolean = true): Promise<any> => {
  try {
    const response = await fetch('/api/chat/otp/session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
  },
      body: JSON.stringify({ token, extend }),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to load session' }))
      const errorMessage = error.message || error.error || 'Failed to load session'
      const errorCode = error.code || 'SESSION_LOAD_FAILED'
      const err = new Error(errorMessage) as any
      err.code = errorCode
      throw err
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error loading session:', error)
    throw error
  }
}

export const fetchProfile = async (token: string): Promise<any> => {
  try {
    const response = await fetch(`/api/chat/otp/profile?token=${encodeURIComponent(token)}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to fetch profile' }))
      const errorMessage = error.message || error.error || 'Failed to fetch profile'
      const errorCode = error.code || 'PROFILE_FETCH_FAILED'
      const err = new Error(errorMessage) as any
      err.code = errorCode
      throw err
    }

    const data = await response.json()
    // Backend returns { success: true, profile: {...} }
    if (data.success && data.profile) {
      return data.profile
    }
    return data.profile || null
  } catch (error) {
    console.error('Error fetching profile:', error)
    throw error
  }
}

export const updateProfile = async (token: string, input: { displayName: string; email: string }): Promise<any> => {
  try {
    const response = await fetch('/api/chat/otp/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ token, ...input }),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to update profile' }))
      const errorMessage = error.message || error.error || 'Failed to update profile'
      const errorCode = error.code || 'PROFILE_UPDATE_FAILED'
      const err = new Error(errorMessage) as any
      err.code = errorCode
      throw err
    }

    const data = await response.json()
    // Backend returns { success: true, profile: {...} }
    if (data.success && data.profile) {
      return data.profile
    }
    return data.profile || null
  } catch (error) {
    console.error('Error updating profile:', error)
    throw error
  }
}

export const revokeSession = async (token: string): Promise<{ success: boolean }> => {
  try {
    const response = await fetch('/api/chat/otp/session', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ token }),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to revoke session' }))
      const errorMessage = error.message || error.error || 'Failed to revoke session'
      const errorCode = error.code || 'SESSION_REVOKE_FAILED'
      const err = new Error(errorMessage) as any
      err.code = errorCode
      throw err
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error revoking session:', error)
    throw error
  }
}
