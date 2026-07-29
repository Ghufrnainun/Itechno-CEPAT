import { Task } from "@/types/database";

export const MOCK_TASKS: Task[] = [
  {
    id_task: "task-1",
    id_requester: "req-1",
    title: "Foto Katalog 15 Menu Makanan",
    description: "Waroeng Bu Sri • Butuh foto rapi untuk menu online GoFood/GrabFood. Makanan akan disediakan oleh warung.",
    compensation: 75000,
    latitude: -7.782865,
    longitude: 110.367003,
    status: "open",
    duration_estimate: "2 jam",
    created_at: new Date(Date.now() - 3600000).toISOString(),
    updated_at: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id_task: "task-2",
    id_requester: "req-2",
    title: "Input 50 Data Stok Barang",
    description: "Toko Kelontong Makmur • Memasukkan data stok barang baru dari nota fisik ke spreadsheet Microsoft Excel.",
    compensation: 50000,
    latitude: -7.770012,
    longitude: 110.377854,
    status: "open",
    duration_estimate: "1.5 jam",
    created_at: new Date(Date.now() - 7200000).toISOString(),
    updated_at: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id_task: "task-3",
    id_requester: "req-3",
    title: "Survey Harga Pasar Tradisional",
    description: "Riset Pasar Lokal • Mengunjungi Pasar Kranggan dan mendata harga 10 bahan pokok terupdate untuk riset pasar.",
    compensation: 150000,
    latitude: -7.783011,
    longitude: 110.363123,
    status: "open",
    duration_estimate: "3 jam",
    created_at: new Date(Date.now() - 10800000).toISOString(),
    updated_at: new Date(Date.now() - 10800000).toISOString(),
  },
  {
    id_task: "task-4",
    id_requester: "req-4",
    title: "Jaga Booth Event ITechno",
    description: "ITechno Cup Committee • Membantu menjaga stand pendaftaran di lobi gedung utama selama jeda makan siang.",
    compensation: 80000,
    latitude: -7.774532,
    longitude: 110.372134,
    status: "open",
    duration_estimate: "4 jam",
    created_at: new Date(Date.now() - 18000000).toISOString(),
    updated_at: new Date(Date.now() - 18000000).toISOString(),
  }
];

// Haversine formula to compute distance in km
export function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
}

export async function getNearbyTasks(
  lat: number,
  lng: number,
  radiusKm: number = 2
): Promise<(Task & { distance: number })[]> {
  // Simulate PostGIS ST_DWithin query in client-side mock
  // TODO: Implement actual Supabase RPC get_nearby_tasks using PostGIS ST_DWithin
  const tasksWithDistance = MOCK_TASKS.map((task) => {
    const distance = getDistance(lat, lng, task.latitude, task.longitude);
    return { ...task, distance };
  }).filter((task) => task.distance <= radiusKm);

  return tasksWithDistance.sort((a, b) => a.distance - b.distance);
}
