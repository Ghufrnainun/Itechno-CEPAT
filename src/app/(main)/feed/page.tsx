import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import FeedClient from "./FeedClient";

export default async function FeedPage() {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();

  let userId = null;
  if (authUser?.email) {
    const dbUser = await prisma.user.findUnique({
      where: { email: authUser.email },
      select: { id_user: true }
    });
    if (dbUser) userId = dbUser.id_user;
  }

  // Fetch initial categories
  const categories = await prisma.taskCategory.findMany({
    select: {
      id_category: true,
      nama_kategori: true,
    },
    orderBy: {
      nama_kategori: "asc",
    },
  });

  // Fetch initial newest tasks (without geolocation)
  // Geolocation-based sorting will be handled by the client when it hydrates
  const initialTasksData = await prisma.$queryRawUnsafe(`
      SELECT 
        t.id_tasks as id_task, 
        t.id_requester,
        t.judul_tugas as title,
        t.deskripsi_tugas as description,
        t.estimasi_waktu as duration_estimate,
        t.kompensasi as compensation,
        t.created_at,
        t.is_bidding,
        t.budget_min,
        t.budget_max,
        c.nama_kategori as category_name,
        u.nama_lengkap as requester_name,
        u.avatar_url as requester_avatar,
        (
          SELECT COALESCE(
            json_agg(
              json_build_object(
                'id_skill', sm.id_skill_master,
                'nama_skill', sm.nama_skill,
                'icon', sm.icon
              )
            ), 
            '[]'::json
          )
          FROM "TaskRequirements" tr
          JOIN "SkillsMaster" sm ON tr.id_skill_master = sm.id_skill_master
          WHERE tr.id_tasks = t.id_tasks
        ) as skills
      FROM "Task" t
      JOIN "StatusTask" st ON t.id_status_task = st.id_status_task
      LEFT JOIN "TaskCategory" c ON t.id_category = c.id_category
      LEFT JOIN "User" u ON t.id_requester = u.id_user
      WHERE 
        st.nama_status = 'OPEN'
        ${userId ? `AND t.id_requester != '${userId}'` : ''}
      ORDER BY t.created_at DESC
      LIMIT 10
  `);

  // Transform raw data to match the expected Task format in client
  const initialTasks = (initialTasksData as any[]).map(t => ({
    id_task: t.id_task,
    id_requester: t.id_requester,
    title: t.title,
    description: t.description,
    compensation: t.compensation,
    is_bidding: t.is_bidding === true,
    budget_min: t.budget_min ?? null,
    budget_max: t.budget_max ?? null,
    status: "open",
    duration_estimate: t.duration_estimate,
    created_at: t.created_at,
    distance: 0, // Default distance before client hydration
    skills: t.skills,
    requester: {
      id_user: t.id_requester,
      nama_lengkap: t.requester_name,
      avatar_url: t.requester_avatar
    },
    category: {
      nama_kategori: t.category_name
    }
  }));

  return (
    <FeedClient 
      initialTasks={initialTasks} 
      initialCategories={categories}
    />
  );
}
