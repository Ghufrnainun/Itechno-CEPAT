import { Suspense } from "react";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { ProfileSkeleton } from "@/components/ui/Skeleton";
import ProfileClient from "./ProfileClient";

const userProfileIncludes = {
  role: true,
  skills_user: {
    select: {
      id_skills_user: true,
      id_user: true,
      id_skills_master: true,
      skills_master: true,
    },
  },
  user_badges: {
    include: {
      badge: true,
    },
  },
  user_streak: true,
  portfolio_items: {
    orderBy: {
      created_at: "desc" as const,
    },
  },
  reviews_received: {
    take: 10,
    orderBy: {
      created_at: "desc" as const,
    },
    include: {
      rater: {
        select: {
          id_user: true,
          nama_lengkap: true,
          avatar_url: true,
        },
      },
      task: {
        select: {
          id_tasks: true,
          judul_tugas: true,
        },
      },
    },
  },
};

async function ProfilePageContent({ id }: { id: string }) {
  const headersList = await headers();
  const dbUserIdHeader = headersList.get("x-user-db-id");
  const authUserIdHeader = headersList.get("x-auth-user-id");
  const authUserEmailHeader = headersList.get("x-auth-user-email");

  let targetId = id;
  let authUserId = authUserIdHeader;
  let authUserEmail = authUserEmailHeader;
  let currentDbUserId = dbUserIdHeader;

  // Handle "me" alias
  if (targetId === "me") {
    if (currentDbUserId) {
      targetId = currentDbUserId;
    } else if (!authUserId) {
      // Fallback: check supabase server client if middleware header was missing
      const supabase = await createClient();
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!authUser) {
        return <ProfileClient key="me" initialData={null} />;
      }
      authUserId = authUser.id;
      authUserEmail = authUser.email ?? null;
    }
  }

  let dbUser: any = null;

  // Optimized query: If targetId is resolved to a known ID, query directly
  if (targetId !== "me") {
    dbUser = await prisma.user.findFirst({
      where: {
        OR: [
          { id_user: targetId },
          { auth_id: targetId },
        ],
      },
      include: userProfileIncludes,
    });
  } else if (authUserId) {
    dbUser = await prisma.user.findFirst({
      where: {
        OR: [
          { auth_id: authUserId },
          ...(authUserEmail ? [{ email: authUserEmail }] : []),
          { id_user: authUserId },
        ],
      },
      include: userProfileIncludes,
    });
  }

  if (!dbUser) {
    if (targetId === "me" || id === "me") {
      return <ProfileClient key="me" initialData={null} />;
    }
    notFound();
  }

  // PII Protection: Hide PII if the viewer is not the profile owner
  const isOwner = Boolean(
    (currentDbUserId && currentDbUserId === dbUser.id_user) ||
    (authUserId && (authUserId === dbUser.auth_id || authUserId === dbUser.id_user)) ||
    (authUserEmail && authUserEmail === dbUser.email)
  );

  if (!isOwner) {
    dbUser.email = "[Disembunyikan]";
    dbUser.no_telpon = "[Disembunyikan]";
    dbUser.alamat = "[Disembunyikan]";
    dbUser.total_balance = 0;
    dbUser.held_balance = 0;
  }

  const initialData = JSON.parse(JSON.stringify(dbUser));
  return <ProfileClient key={dbUser.id_user || targetId} initialData={initialData} />;
}

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <Suspense fallback={<ProfileSkeleton />}>
      <ProfilePageContent id={id} />
    </Suspense>
  );
}
