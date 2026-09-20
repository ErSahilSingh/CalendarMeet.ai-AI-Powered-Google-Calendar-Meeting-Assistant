import { google } from 'googleapis';
import { oauth2Client, GOOGLE_SCOPES, isGoogleOAuthConfigured } from '../config/google.js';
import { v4 as uuidv4 } from 'uuid';

export interface CreateEventParams {
  title: string;
  description?: string;
  startTime: string; // ISO string
  endTime: string;   // ISO string
  hostEmail: string;
  attendeeEmail: string;
}

export interface GoogleEventResult {
  googleEventId: string;
  htmlLink: string;
  meetLink?: string;
  status: string;
}

export class GoogleCalendarService {
  /**
   * Generates the Google OAuth2 consent URL
   */
  static getAuthUrl(): string {
    if (!isGoogleOAuthConfigured) {
      return '';
    }
    return oauth2Client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: GOOGLE_SCOPES,
    });
  }

  /**
   * Exchanges an authorization code for access & refresh tokens
   */
  static async getTokensFromCode(code: string) {
    if (!isGoogleOAuthConfigured) {
      throw new Error('Google OAuth credentials not configured');
    }
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Fetch user profile info
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const { data: profile } = await oauth2.userinfo.get();

    return {
      tokens,
      profile: {
        googleId: profile.id || uuidv4(),
        email: profile.email || '',
        name: profile.name || 'Google User',
        avatar: profile.picture || '',
      },
    };
  }

  /**
   * Creates an authenticated client for a user's tokens
   */
  private static getAuthenticatedClient(accessToken: string, refreshToken?: string) {
    const client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    return client;
  }

  /**
   * Inserts an event directly into the user's primary Google Calendar
   * Sends actual email invitations to attendee and host
   */
  static async createEvent(
    accessToken: string,
    refreshToken: string | undefined,
    params: CreateEventParams
  ): Promise<GoogleEventResult> {
    // If not configured or running in mock dev mode, provide realistic simulated event
    if (!isGoogleOAuthConfigured || accessToken.startsWith('mock_')) {
      const mockId = `g_evt_${Date.now()}`;
      return {
        googleEventId: mockId,
        htmlLink: `https://calendar.google.com/calendar/r/eventedit/${mockId}`,
        meetLink: `https://meet.google.com/${uuidv4().substring(0, 3)}-${uuidv4().substring(0, 4)}-${uuidv4().substring(0, 3)}`,
        status: 'confirmed',
      };
    }

    const auth = this.getAuthenticatedClient(accessToken, refreshToken);
    const calendar = google.calendar({ version: 'v3', auth });

    const attendeesList = [
      { email: params.hostEmail },
      { email: params.attendeeEmail },
    ];

    const eventPayload: any = {
      summary: params.title,
      description: params.description || `Scheduled via CalendarMeet.ai\nHost: ${params.hostEmail}\nGuest: ${params.attendeeEmail}`,
      start: {
        dateTime: params.startTime,
      },
      end: {
        dateTime: params.endTime,
      },
      attendees: attendeesList,
      conferenceData: {
        createRequest: {
          requestId: uuidv4(),
          conferenceSolutionKey: { type: 'hangoutsMeet' },
        },
      },
    };

    const response = await calendar.events.insert({
      calendarId: 'primary',
      sendUpdates: 'all', // Instructs Google Calendar to email all attendees!
      conferenceDataVersion: 1,
      requestBody: eventPayload,
    });

    const data = response.data;
    const meetLink = data.conferenceData?.entryPoints?.find(
      (ep) => ep.entryPointType === 'video'
    )?.uri || data.hangoutLink || undefined;

    return {
      googleEventId: data.id || `evt_${Date.now()}`,
      htmlLink: data.htmlLink || `https://calendar.google.com/calendar/r`,
      meetLink,
      status: data.status || 'confirmed',
    };
  }

  /**
   * Deletes an event from Google Calendar
   */
  static async deleteEvent(
    accessToken: string,
    refreshToken: string | undefined,
    googleEventId: string
  ): Promise<boolean> {
    if (!isGoogleOAuthConfigured || accessToken.startsWith('mock_')) {
      return true;
    }

    try {
      const auth = this.getAuthenticatedClient(accessToken, refreshToken);
      const calendar = google.calendar({ version: 'v3', auth });

      await calendar.events.delete({
        calendarId: 'primary',
        eventId: googleEventId,
        sendUpdates: 'all',
      });
      return true;
    } catch (err: any) {
      console.error(`[Google Calendar] Failed to delete event ${googleEventId}:`, err.message);
      return false;
    }
  }

  /**
   * Lists upcoming meetings from Google Calendar
   */
  static async listUpcomingEvents(accessToken: string, refreshToken?: string) {
    if (!isGoogleOAuthConfigured || accessToken.startsWith('mock_')) {
      return [];
    }

    try {
      const auth = this.getAuthenticatedClient(accessToken, refreshToken);
      const calendar = google.calendar({ version: 'v3', auth });

      const res = await calendar.events.list({
        calendarId: 'primary',
        timeMin: new Date().toISOString(),
        maxResults: 15,
        singleEvents: true,
        orderBy: 'startTime',
      });

      return res.data.items || [];
    } catch (err: any) {
      console.error('[Google Calendar] List events error:', err.message);
      return [];
    }
  }
}
