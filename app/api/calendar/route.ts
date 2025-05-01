import { NextResponse } from "next/server";
import { initializeOAuthClient, getAuthUrl, setCredentials, getEvents, oAuth2Client } from "@/lib/googleCalendar";

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI!;
console.log(`Redirect URI: ${REDIRECT_URI}`)
initializeOAuthClient(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");

  if (!code) {
    const authUrl = getAuthUrl();
    return NextResponse.json({ authUrl });
  }

  if (!oAuth2Client) {
    return NextResponse.json({ error: "OAuth2 client is not initialized" }, { status: 500 });
  }
  const { tokens } = await oAuth2Client.getToken(code);
  setCredentials(tokens);

  const timeMin = new Date(new Date().setDate(new Date().getDate() - 30)).toISOString();
  const timeMax = new Date(new Date().setDate(new Date().getDate() + 30)).toISOString();
  const calendarId = 'primary' //primary calendar of users account
  const events = await getEvents(calendarId, timeMin, timeMax);

  // Redirect back to the SchedulesPage with the events as a query parameter
  const redirectUrl = new URL("/dashboard/schedules", request.url);
  redirectUrl.searchParams.set("fetchedDaysOff", JSON.stringify(events));
  return NextResponse.redirect(redirectUrl);
}