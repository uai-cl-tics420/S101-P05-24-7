import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Disable TOTP so the user will be forced to re-setup on next login or can just leave it disabled if not enforced (though proxy.ts enforces it).
  await prisma.user.update({
    where: { email: session.user.email },
    data: { 
      totpEnabled: false,
      totpSecret: null,
      otpSessions: { deleteMany: {} } // Clear all active sessions
    },
  });

  return NextResponse.json({ success: true });
}
