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
      // Allow client side to handle redirect or error
      targetUserId = ""; 
    } else {
      targetUserId = authUser.id;
    }
  }

  let initialData = null;

  if (targetUserId) {
    const dbUser = await prisma.user.findUnique({
      where: { id_user: targetUserId },
      include: {
        role: true,
        skills_user: {
          include: {
            skills_master: true,
          },
        },
      },
    });

    if (dbUser) {
      // PII Protection
      const isOwner = authUser?.id === dbUser.id_user || authUser?.email === dbUser.email;
      
      if (!isOwner) {
        dbUser.email = "[Disembunyikan]";
        dbUser.no_telpon = "[Disembunyikan]";
        dbUser.alamat = "[Disembunyikan]";
      }
      
      initialData = dbUser;
    } else if (id !== "me") {
      notFound();
    }
  }

  return <ProfileClient initialData={initialData} />;
}
