import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { apartmentNumber, tower } = await req.json();

    if (!apartmentNumber) {
      return NextResponse.json({ error: "Apartment number is required" }, { status: 400 });
    }

    // 1. Find or create the apartment
    const apartment = await prisma.apartment.upsert({
      where: {
        number_tower: {
          number: apartmentNumber,
          tower: tower || "",
        },
      },
      update: {},
      create: {
        number: apartmentNumber,
        tower: tower || "",
      },
    });

    // 2. Link the user to the apartment
    await prisma.user.update({
      where: { id: session.user.id },
      data: { apartmentId: apartment.id },
    });

    return NextResponse.json({ success: true, apartment });
  } catch (error) {
    console.error("Error updating resident apartment:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
