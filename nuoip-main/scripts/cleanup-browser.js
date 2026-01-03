// Run this in browser console to cleanup old WhatsApp contacts

const cleanup = async () => {
    const token = localStorage.getItem('session_token')

    const response = await fetch('https://nuoip-production.up.railway.app/api/v1/admin/whatsapp/cleanup/old-contacts', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            oldSessionId: 'session-1764575170092',
            currentSessionId: 'session-1764595243929'
        })
    })

    const data = await response.json()
    console.log('Cleanup result:', data)

    if (data.success) {
        alert(data.message)
        // Reload the page to fetch contacts with correct session ID
        window.location.reload()
    } else {
        alert('Error: ' + data.message)
    }
}

cleanup()
