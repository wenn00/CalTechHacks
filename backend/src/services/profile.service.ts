import { prisma } from "../lib/prisma";
import { UpdateProfileInput } from "../validators/profile";

export async function getOwnProfile(userId: string) {
  return prisma.profiles.findUnique({ where: { id: userId } });
}

export async function updateProfile(userId: string, input: UpdateProfileInput) {
  return prisma.profiles.update({
    where: { id: userId },
    data: input,
  });
}
