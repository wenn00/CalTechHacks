import { prisma } from "../lib/prisma";

// Auth (login/register) is handled by Supabase on the frontend.
// The backend just looks up the profile for the authenticated user.
export async function getMe(userId: string) {
  return prisma.profiles.findUnique({ where: { id: userId } });
}
