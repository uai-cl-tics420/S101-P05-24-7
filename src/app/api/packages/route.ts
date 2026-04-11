import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    let whereClause = {};

    // If resident, only show packages for their apartment
    if (token.role === "RESIDENTE") {
      // We need to fetch the user's apartmentId from the DB
      const user = await prisma.user.findUnique({
        where: { id: token.id as string },
        select: { apartmentId: true }
      });

      if (!user?.apartmentId) {
        return NextResponse.json([]); // No packages if no apartment assigned
      }

      whereClause = { apartmentId: user.apartmentId };
    }

    const packages = await prisma.package.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      include: {
        apartment: true,
      },
      take: 50,
    });

    return NextResponse.json(packages);
  } catch (error) {
    console.error("Error fetching packages:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
