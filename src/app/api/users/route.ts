import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "CONSERJE") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      onboardingComplete: true,
      createdAt: true,
      apartment: { select: { number: true, tower: true } }
    },
    orderBy: { createdAt: 'desc' }
  });

  return NextResponse.json(users);
}

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "CONSERJE") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { userId, role } = await request.json();
  
  if (!userId || !role) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  // Basic guard so they don't demote themselves accidentally
  if (userId === session.user.id) {
    return NextResponse.json({ error: "Cannot change your own role here" }, { status: 400 });
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { role }
  });

  return NextResponse.json({ success: true, user: updatedUser });
}
