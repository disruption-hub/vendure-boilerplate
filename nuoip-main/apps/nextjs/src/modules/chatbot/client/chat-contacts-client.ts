import type { ChatContact } from '../domain/contact'

/**
 * Loads contacts for a tenant using either session token (chat auth) or admin auth
 */
export async function loadContacts(tenantId?: string, sessionToken?: string | null): Promise<ChatContact[]> {
  if (!tenantId?.trim()) {
    console.warn('[chat-contacts-client] No tenantId provided, returning empty array')
    return []
  }

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    let url: string
    const fetchOptions: RequestInit = {
      method: 'GET',
      headers,
    }

    // If we have a session token, use the chat auth endpoint
    if (sessionToken) {
      url = `/api/chat/contacts?tenantId=${encodeURIComponent(tenantId)}`
      headers['Authorization'] = `Bearer ${sessionToken}`
    } else {
      // Fallback to admin endpoint if no session token (requires admin auth)
      url = `/api/admin/tenants/${encodeURIComponent(tenantId)}/contacts`
      fetchOptions.credentials = 'include' // Use NextAuth session cookie
    }

    console.log('[chat-contacts-client] Loading contacts...', {
      hasSessionToken: !!sessionToken,
      tenantId,
      url: url,
    })

    const response = await fetch(url, fetchOptions)

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error body')

      // Only log if we had a session token (unexpected error)
      // No session token = expected failure (user not logged in yet)
      if (sessionToken) {
        // For 401 errors, use warn instead of error (expired sessions are expected)
        if (response.status === 401) {
          console.warn(
            `[chat-contacts-client] Session expired - Status: ${response.status} ${response.statusText}`,
            '\nPlease log in again to refresh your session.',
            '\nTenant:', tenantId
          )
        } else {
          // For other errors, use error level
          console.error(
            `[chat-contacts-client] Failed to load contacts - Status: ${response.status} ${response.statusText}`,
            '\nURL:', url,
            '\nError:', errorText.substring(0, 200),
            '\nTenant:', tenantId
          )
        }
      } else {
        console.log('[chat-contacts-client] Contacts not loaded (no session token)')
      }

      // Return empty array on error (store will add FlowBot fallback)
      return []
    }

    const data = await response.json()

    console.log('[chat-contacts-client] Response received', {
      isArray: Array.isArray(data),
      hasSuccess: !!data?.success,
      hasContacts: !!data?.contacts,
      contactsCount: data?.contacts?.length || 0,
      dataKeys: Object.keys(data || {}),
    })

    // Handle different response formats
    if (Array.isArray(data)) {
      console.log('[chat-contacts-client] Returning array directly', { count: data.length })
      return data
    }

    if (data.success && Array.isArray(data.contacts)) {
      console.log('[chat-contacts-client] Returning contacts from success response', { count: data.contacts.length })
      return data.contacts
    }

    if (Array.isArray(data.data)) {
      console.log('[chat-contacts-client] Returning contacts from data field', { count: data.data.length })
      return data.data
    }

    console.warn('[chat-contacts-client] Unexpected response format', {
      dataKeys: Object.keys(data || {}),
      tenantId,
      dataType: typeof data,
    })
    return []
  } catch (error) {
    console.error('[chat-contacts-client] Error loading contacts', {
      error: error instanceof Error ? error.message : 'Unknown error',
      tenantId,
      hasSessionToken: !!sessionToken,
    })
    return []
  }
}

export async function getContact(id: string): Promise<any> {
  return null;
}

export async function createContact(data: {
  tenantId?: string;
  displayName: string;
  phone?: string | null;
}): Promise<ChatContact> {
  const { tenantId, displayName, phone } = data

  if (!tenantId) {
    throw new Error('Missing tenantId')
  }

  const response = await fetch(`/api/admin/tenants/${encodeURIComponent(tenantId)}/contacts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ displayName, phone }),
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error')
    throw new Error(`Failed to create contact: ${errorText}`)
  }

  const result = await response.json()
  return result.contact || result
}

export async function updateContact(
  id: string,
  data: {
    tenantId?: string;
    displayName?: string;
    phone?: string | null;
    description?: string | null;
    email?: string | null;
  }
): Promise<ChatContact> {
  const { tenantId, displayName, phone, description, email } = data

  if (!tenantId) {
    throw new Error('Missing tenantId')
  }

  // Try session token first (from localStorage), then fall back to admin auth
  let sessionToken: string | null = null
  if (typeof window !== 'undefined') {
    try {
      const chatAuthStorage = localStorage.getItem('chat-auth-storage')
      if (chatAuthStorage) {
        const parsed = JSON.parse(chatAuthStorage)
        sessionToken = parsed?.state?.sessionToken || null
      }
    } catch (e) {
      console.warn('[chat-contacts-client] Failed to get session token from localStorage', e)
    }
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  let url: string
  const fetchOptions: RequestInit = {
    method: 'PUT',
    headers,
    body: JSON.stringify({
      tenantId,
      displayName,
      phone,
      description,
      email,
    }),
  }

  if (sessionToken) {
    // Use chat auth endpoint
    url = `/api/chat/contacts/${encodeURIComponent(id)}`
    headers['Authorization'] = `Bearer ${sessionToken}`
  } else {
    // Fallback to admin endpoint
    url = `/api/admin/tenants/${encodeURIComponent(tenantId)}/contacts/${encodeURIComponent(id)}`
    fetchOptions.credentials = 'include'
  }

  console.log('[chat-contacts-client] Updating contact', {
    contactId: id,
    tenantId,
    hasSessionToken: !!sessionToken,
    url,
  })

  const response = await fetch(url, fetchOptions)

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error')
    console.error('[chat-contacts-client] Failed to update contact', {
      status: response.status,
      error: errorText.substring(0, 200),
    })
    throw new Error(`Failed to update contact: ${errorText}`)
  }

  const result = await response.json()
  console.log('[chat-contacts-client] Contact updated successfully', {
    contactId: id,
    success: result?.success,
  })

  return result.contact || result
}

export async function deleteContact(id: string): Promise<void> {
  return Promise.resolve();
}

export async function listGroups(): Promise<any[]> {
  return [];
}

export async function getGroup(id: string): Promise<any> {
  return null;
}

export async function createGroup(data: any): Promise<any> {
  return null;
}

export async function updateGroup(id: string, data: any): Promise<any> {
  return null;
}

export async function deleteGroup(id: string): Promise<void> {
  return Promise.resolve();
}

