import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { UpdateProfileInput } from "../validators/profile";

export async function getOwnProfile(userId: string) {
  return prisma.profiles.findUnique({ where: { id: userId } });
}

export async function updateProfile(userId: string, input: UpdateProfileInput) {
  // Prisma's nullable JSON columns reject raw `null` from the type system —
  // it wants `Prisma.JsonNull` as the explicit null sentinel. The validator
  // allows null (user explicitly clearing the field) so we translate here.
  const { availability, ...rest } = input;
  return prisma.profiles.update({
    where: { id: userId },
    data: {
      ...rest,
      ...(availability !== undefined && {
        availability:
          availability === null
            ? Prisma.JsonNull
            : (availability as Prisma.InputJsonValue),
      }),
    },
  });
}
