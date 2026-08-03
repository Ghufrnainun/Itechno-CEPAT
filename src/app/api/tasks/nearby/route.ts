import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
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

    // --- 1. Cek session Supabase Auth ---
    const supabase = await createClient()
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()

    if (authError || !authUser) {
      return NextResponse.json(
        { success: false, message: 'Tidak terautentikasi. Silakan login terlebih dahulu.' },
        { status: 401 }
      )
    }

    // --- 2. Validasi Query Params ---
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
    const searchString = query ? `%${query}%` : `%`

    // --- 3. PostGIS Query Menggunakan prisma.$queryRaw ---
    // Karena Prisma $queryRaw akan memproses template literal secara aman, 
    // kita bisa menyuntikkan variabel langsung ke dalam query.
    // Kita gunakan tipe data Point (4326) untuk koordinat GPS dan membandingkannya menggunakan geografi (meter).
    
    // Note: status_task 'open' assumed mapped to finding tasks (Sedang Mencari)
    const nearbyTasks = await prisma.$queryRaw`
      SELECT 
        t.id_tasks as id_task, 
        t.id_requester,
        t.judul_tugas as title,
        t.deskripsi_tugas as description,
        t.estimasi_waktu as duration_estimate,
        t.kompensasi as compensation,
        t.created_at,
        st.nama_status as status,
        ST_Y(t.lokasi_geo::geometry) as latitude,
        ST_X(t.lokasi_geo::geometry) as longitude,
        (ST_Distance(t.lokasi_geo, ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography) / 1000.0) AS distance
      FROM "Task" t
      JOIN "StatusTask" st ON t.id_status_task = st.id_status_task
      WHERE 
        ST_DWithin(
          t.lokasi_geo, 
          ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography, 
          ${radiusMeters}
        )
        AND (
          ${query ? true : false} = false OR 
          t.judul_tugas ILIKE ${searchString} OR 
          t.deskripsi_tugas ILIKE ${searchString}
        )
      ORDER BY distance ASC
    `;

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
