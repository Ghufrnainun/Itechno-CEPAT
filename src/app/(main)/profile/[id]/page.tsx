import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import ProfileClient from "./ProfileClient";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();

  let targetUserId = id;

  if (id === "me") {
    if (!authUser) {
      targetUserId = ""; 
    } else {
      const meUser = await prisma.user.findFirst({
        where: {
          OR: [
            { id_user: authUser.id },
            { auth_id: authUser.id },
            ...(authUser.email ? [{ email: authUser.email }] : []),
          ],
        },
      });
      targetUserId = meUser ? meUser.id_user : authUser.id;
    }
  }

  let initialData = null;

  if (targetUserId) {
    const dbUser = await prisma.user.findFirst({
      where: {
        OR: [
          { id_user: targetUserId },
          { auth_id: targetUserId },
        ],
      },
      include: {
        role: true,
        skills_user: {
          include: {
            skills_master: true,
          },
        },
        user_badges: {
          include: {
            badge: true,
          },
        },
        user_streak: true,
      },
    });

    if (dbUser) {
      // PII Protection
      // Hide PII only if the user is completely unauthenticated (not logged in)
      if (!authUser) {
        dbUser.email = "[Disembunyikan]";
        dbUser.no_telpon = "[Disembunyikan]";
        dbUser.alamat = "[Disembunyikan]";
      }
      
      initialData = dbUser;
    } else if (id !== "me") {
      notFound();
    }
  }

  return <ProfileClient key={targetUserId || id} initialData={initialData} />;
}
