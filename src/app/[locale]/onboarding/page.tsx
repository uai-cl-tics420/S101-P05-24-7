import { prisma } from "@/lib/prisma";
import OnboardingClient from "./OnboardingClient";

export const dynamic = 'force-dynamic';

export default async function OnboardingPage() {
  const apartments = await prisma.apartment.findMany({
    orderBy: { number: 'asc' }
  });

  return <OnboardingClient apartments={apartments} />;
}
