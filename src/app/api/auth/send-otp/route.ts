import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { generateOTP, sendOTPEmail, storeOTP } from "@/lib/otp";

// Basic in-memory rate limiting map (addressing "max 3 requests per 5 minutes")
// In production with multiple instances, this ideally moves to Redis or Supabase.
const rateLimitMap = new Map<string, number[]>();

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const email = session.user.email;
    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000;

    const timestamps = rateLimitMap.get(email) || [];
    const validTimestamps = timestamps.filter(t => now - t < fiveMinutes);
    
    if (validTimestamps.length >= 3) {
      return NextResponse.json({ error: "Too many requests. Please wait." }, { status: 429 });
    }
    
    validTimestamps.push(now);
    rateLimitMap.set(email, validTimestamps);

    const cookieHeader = req.headers.get('cookie') || '';
    const localeMatch = cookieHeader.match(/NEXT_LOCALE=(.*?)(;|$)/);
    const locale = localeMatch ? localeMatch[1] : 'en';

    // 1. Generate 6-digit OTP
    const otp = generateOTP();
    
    // 2. Clear old ones and save hashed new OTP
    await storeOTP(email, otp);

    // 3. Send out email utilizing our locale
    await sendOTPEmail(email, otp, locale);

    return NextResponse.json({ success: true, expiresIn: 600 });
  } catch (error) {
    console.error("OTP send error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
