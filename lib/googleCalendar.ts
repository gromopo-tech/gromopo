import { google } from "googleapis";
import { OAuth2Client } from "google-auth-library";

const SCOPES = ["https://www.googleapis.com/auth/calendar"];

export let oAuth2Client: OAuth2Client | null = null;

// Initialize OAuth2 client
export const initializeOAuthClient = (clientId: string, clientSecret: string, redirectUri: string) => {
  oAuth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
};

// Generate authentication URL
export const getAuthUrl = (): string => {
  if (!oAuth2Client) throw new Error("OAuth2 client not initialized");
  return oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
  });
};

// Set credentials after user authentication
export const setCredentials = (tokens: any) => {
  if (!oAuth2Client) throw new Error("OAuth2 client not initialized");
  oAuth2Client.setCredentials(tokens);
};

// Get or create a specific calendar
export const getOrCreateCalendar = async (calendarName: string) => {
  if (!oAuth2Client) throw new Error("OAuth2 client not initialized");

  const calendar = google.calendar({ version: "v3", auth: oAuth2Client });
  const { data } = await calendar.calendarList.list();

  const existingCalendar = data.items?.find((cal) => cal.summary === calendarName);
  if (existingCalendar) return existingCalendar;

  const newCalendar = await calendar.calendars.insert({
    requestBody: { summary: calendarName },
  });
  return newCalendar.data;
};

// Fetch events for a specific calendar and date range
export const getEvents = async (calendarId: string, timeMin: string, timeMax: string) => {
  if (!oAuth2Client) throw new Error("OAuth2 client not initialized");

  const calendar = google.calendar({ version: "v3", auth: oAuth2Client });
  const { data } = await calendar.events.list({
    calendarId,
    timeMin,
    timeMax,
    singleEvents: true,
    orderBy: "startTime",
  });
  return data.items || [];
};