import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { checkRateLimit, getClientIP } from '@/lib/rate-limit'
import { z } from 'zod'

const searchSchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  radius: z.coerce.number().min(1).max(50000).default(2000), // Default 2km
  q: z.string().nullish(),
})

export async function GET(request: NextRequest) {
  try {
    const clientIP = getClientIP(request.headers)
    const rateLimit = checkRateLimit(clientIP, 'api:tasks:nearby', {
      maxRequests: 60,
      windowSeconds: 60,
    })

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, message: 'Terlalu banyak request.' },
        { status: 429 }
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

    // Validate and parse incoming query parameters
    const url = new URL(request.url)
    const lat = url.searchParams.get('lat')
    const lng = url.searchParams.get('lng')
    const radius = url.searchParams.get('radius')
    const q = url.searchParams.get('q')

    const parsed = searchSchema.safeParse({ lat, lng, radius, q })
    
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: 'Parameter lokasi tidak valid.', errors: parsed.error.format() },
        { status: 400 }
      )
    }

    const { lat: latitude, lng: longitude, radius: radiusMeters, q: query } = parsed.data
    const userCondition = userId 
      ? Prisma.sql`AND t.id_requester != ${userId}` 
      : Prisma.empty

    const searchCondition = query
      ? Prisma.sql`AND (t.judul_tugas ILIKE ${`%${query}%`} OR t.deskripsi_tugas ILIKE ${`%${query}%`})`
      : Prisma.empty

    /**
     * Execute PostGIS spatial query for radius-based filtering.
     * Uses SRID 4326 (WGS 84) to cast coordinates into geography points.
     * Only returns lightweight marker data (coordinates & icons) for 'OPEN' tasks.
     */
    const nearbyTasks = await prisma.$queryRaw`
      SELECT 
        t.id_tasks as id_task, 
        ST_Y(t.lokasi_geo::geometry) as latitude,
        ST_X(t.lokasi_geo::geometry) as longitude,
        c.icon as category_icon,
        c.id_category
      FROM "Task" t
      JOIN "StatusTask" st ON t.id_status_task = st.id_status_task
      LEFT JOIN "TaskCategory" c ON t.id_category = c.id_category
      WHERE 
        st.nama_status ILIKE 'OPEN'
        ${userCondition}
        AND ST_DWithin(
          t.lokasi_geo, 
          ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography, 
          ${radiusMeters}
        )
        ${searchCondition}
    `

    return NextResponse.json({
      success: true,
      data: nearbyTasks
    })

  } catch (error) {
    console.error('[GET /api/tasks/nearby] Error:', error)
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan internal server.' },
      { status: 500 }
    )
  }
}
