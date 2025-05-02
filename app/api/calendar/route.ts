import { NextResponse } from "next/server";
import { initializeOAuthClient, getAuthUrl, setCredentials, getEvents, oAuth2Client } from "@/lib/googleCalendar";

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI!;

initializeOAuthClient(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

export async function GET(request: Request) {

  const headers = {
    "Access-Control-Allow-Origin": "https://gromopo.com",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };

  try {
    console.log("Starting calendar route handler");
    const url = new URL(request.url);
    console.log("Request URL:", url.toString());
    const code = url.searchParams.get("code");
    console.log("Authorization code:", code);
    const baseUrl = process.env.NODE_ENV === 'development' 
      ? 'http://localhost:5002' 
      : 'https://gromopo.com';

    if (!code) {
      console.log("No code provided, generating auth URL");
      const authUrl = getAuthUrl();
      return NextResponse.json({ authUrl }, { headers });
    }
    
    if (!oAuth2Client) {
      console.error("OAuth2 client not initialized");
      return NextResponse.json(
        { error: "OAuth2 client is not initialized" }, 
        { status: 500, headers }
      );
    }

    console.log("Exchanging code for tokens...");
    const { tokens } = await oAuth2Client.getToken(code);
    console.log("Tokens received:", tokens);
    setCredentials(tokens);
    
    const timeMin = new Date(new Date().setDate(new Date().getDate() - 30)).toISOString();
    const timeMax = new Date(new Date().setDate(new Date().getDate() + 30)).toISOString();
    const calendarId = 'primary' //primary calendar of users account
    
    console.log(`Fetching events between ${timeMin} and ${timeMax}`);
    const events = await getEvents(tokens, calendarId, timeMin, timeMax);
    console.log(`Found ${events.length} events`);

    // process events time off events
    const formattedEvents = events.flatMap((event) => {
      const [timeOffType, employeeName] = event.summary?.split(": ").map((part) => part.trim().toUpperCase()) || [];
      const startDate = event.start?.date || event.start?.dateTime?.split('T')[0];
      const endDate = event.end?.date || event.end?.dateTime?.split('T')[0];

      const days = [];
      if (!startDate || !endDate) {
        console.error("Invalid event dates:", { startDate, endDate });
        return [];
      }
      for (let date = new Date(startDate); date < new Date(endDate); date.setDate(date.getDate() + 1)) {
        days.push({
          timeOffType,
          employeeName,
          date: date.toISOString().split("T")[0], // Format as YYYY-MM-DD
        });
      }
      return days;
    });

    const redirectUrl = new URL(`${baseUrl}/dashboard/schedules`);
    redirectUrl.searchParams.set('fetchedDaysOff', JSON.stringify(formattedEvents));
    return NextResponse.redirect(redirectUrl);
  
  } catch (error) {
    console.error("Error in calendar route:", error);
    if (error instanceof Error) {
      console.error("Error stack:", error.stack);
    }
    return NextResponse.json(
      { error: "Failed to process calendar request" },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      headers: {
        "Access-Control-Allow-Origin": "https://gromopo.com",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    }
  );
}