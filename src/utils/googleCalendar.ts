// Removed Session import

export interface CalendarEvent {
    summary: string
    description?: string
    start: {
        dateTime: string
        timeZone: string
    }
    end: {
        dateTime: string
        timeZone: string
    }
}

export const createGoogleCalendarEvent = async (token: string, event: CalendarEvent) => {
    if (!token) {
        console.error('No Google provider token found. User must be logged in with Google and granted calendar permissions.')
        return null
    }

    try {
        const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(event)
        })

        if (!response.ok) {
            const errorData = await response.json()
            throw new Error(`Google Calendar API Error: ${errorData.error.message}`)
        }

        return await response.json()
    } catch (error) {
        console.error('Error creating Google Calendar event:', error)
        return null
    }
}
