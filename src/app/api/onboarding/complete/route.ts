import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const onboardingSchema = z.object({
  role: z.enum(["CONSERJE", "RESIDENTE"]),
  apartmentId: z.string().optional().nullable(),
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const result = onboardingSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid data", details: result.error.format() },
        { status: 400 }
      );
    }

    const { role, apartmentId } = result.data;

    // Validate residency scenario
    if (role === "RESIDENTE" && !apartmentId) {
      return NextResponse.json(
        { error: "Apartment selection is required for residents" },
        { status: 400 }
      );
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { email: session.user.email },
      data: {
        role,
        apartmentId: role === "RESIDENTE" ? apartmentId : null,
        onboardingComplete: true,
      },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        role: updatedUser.role,
        apartmentId: updatedUser.apartmentId,
        onboardingComplete: updatedUser.onboardingComplete,
      },
    });
  } catch (error: any) {
    console.error("Error completing onboarding:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
