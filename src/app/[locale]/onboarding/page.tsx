import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import OnboardingClient from "./OnboardingClient";

export const dynamic = 'force-dynamic';

export default async function OnboardingPage() {
  const [apartments, session] = await Promise.all([
    prisma.apartment.findMany({ orderBy: { number: 'asc' } }),
    getServerSession(authOptions),
  ]);

  const initialRole = (session?.user?.role as string) || "RESIDENTE";

  return <OnboardingClient apartments={apartments} initialRole={initialRole} />;
}
