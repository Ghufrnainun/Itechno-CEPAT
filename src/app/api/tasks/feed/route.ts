import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { checkRateLimit, getClientIP } from '@/lib/rate-limit'
import { z } from 'zod'

const feedSchema = z.object({
  lat: z.coerce.number().min(-90).max(90).nullish(),
  lng: z.coerce.number().min(-180).max(180).nullish(),
  radius: z.coerce.number().min(1).max(20000000).nullish(),
  q: z.string().nullish(),
  id_category: z.string().uuid().nullish(),
  sort: z.enum(['distance_asc', 'price_desc', 'price_asc', 'newest']).default('distance_asc'),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(10),
})

export async function GET(request: NextRequest) {
  try {
    const clientIP = getClientIP(request.headers)
    const rateLimit = checkRateLimit(clientIP, 'api:tasks:feed', {
      maxRequests: 100,
      windowSeconds: 60,
    })

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, message: 'Terlalu banyak request.' },
        { status: 429 }
      )
    }

    const url = new URL(request.url)
    const parsed = feedSchema.safeParse(Object.fromEntries(url.searchParams))
    
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: 'Parameter query tidak valid.', errors: parsed.error.format() },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()
    let userId = null;
    if (authUser?.email) {
      const dbUser = await prisma.user.findUnique({
        where: { email: authUser.email },
        select: { id_user: true }
      });
      if (dbUser) userId = dbUser.id_user;
    }

    const { lat, lng, radius, q, id_category, sort, page, limit } = parsed.data
    const searchString = q ? `%${q.replace(/'/g, "''")}%` : `%`
    const offset = (page - 1) * limit

    const hasLocation = lat != null && lng != null
    let orderByClause = hasLocation ? 'distance ASC' : 't.created_at DESC'
    if (sort === 'price_desc') orderByClause = 't.kompensasi DESC'
    if (sort === 'price_asc') orderByClause = 't.kompensasi ASC'
    if (sort === 'newest') orderByClause = 't.created_at DESC'

    /**
     * Prisma $queryRawUnsafe is required here for dynamic ORDER BY interpolation.
     * SQL injection is mitigated by strictly validating the `sort` parameter via Zod enum,
     * and parameterizing `id_category` as a strict UUID.
     */
    const categoryCondition = id_category 
      ? `AND t.id_category = '${id_category}'` 
      : ''
      
    const distanceSelect = hasLocation 
      ? `(ST_Distance(t.lokasi_geo, ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography) / 1000.0) AS distance`
      : `NULL AS distance`
      
    const distanceCondition = (hasLocation && radius != null)
      ? `AND ST_DWithin(t.lokasi_geo, ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography, ${radius})`
      : ``

    const querySql = `
      SELECT 
        t.id_tasks as id_task, 
        t.id_requester,
        t.judul_tugas as title,
        t.deskripsi_tugas as description,
        t.estimasi_waktu as duration_estimate,
        t.kompensasi as compensation,
        t.is_bidding,
        t.budget_min,
        t.budget_max,
        t.created_at,
        t.scheduled_at,
        t.scheduled_end,
        ST_Y(t.lokasi_geo::geometry) as latitude,
        ST_X(t.lokasi_geo::geometry) as longitude,
        c.nama_kategori as category_name,
        c.icon as category_icon,
        u.nama_lengkap as requester_name,
        u.rating_avg as requester_rating,
        u.total_completed as requester_completed_tasks,
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
        ) as skills,
        ${distanceSelect}
      FROM "Task" t
      JOIN "StatusTask" st ON t.id_status_task = st.id_status_task
      LEFT JOIN "TaskCategory" c ON t.id_category = c.id_category
      LEFT JOIN "User" u ON t.id_requester = u.id_user
      WHERE 
        st.nama_status = 'OPEN'
        ${userId ? `AND t.id_requester != '${userId}'` : ''}
        ${distanceCondition}
        AND (
          ${q ? 'true' : 'false'} = false OR 
          t.judul_tugas ILIKE '${searchString}' OR 
          t.deskripsi_tugas ILIKE '${searchString}' OR
          c.nama_kategori ILIKE '${searchString}' OR
          EXISTS (
            SELECT 1 FROM "TaskRequirements" tr
            JOIN "SkillsMaster" sm ON tr.id_skill_master = sm.id_skill_master
            WHERE tr.id_tasks = t.id_tasks AND sm.nama_skill ILIKE '${searchString}'
          )
        )
        ${categoryCondition}
      ORDER BY ${orderByClause}
      LIMIT ${limit}
      OFFSET ${offset}
    `

    // Execute raw SQL query safely (variables pre-validated by Zod)
    
    const tasks = await prisma.$queryRawUnsafe(querySql)

    return NextResponse.json({
      success: true,
      data: tasks,
      pagination: {
        page,
        limit
      }
    })

  } catch (error) {
    console.error('[GET /api/tasks/feed] Error:', error)
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan internal server.' },
      { status: 500 }
    )
  }
}
