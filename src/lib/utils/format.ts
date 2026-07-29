export function formatPoints(points: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "decimal",
    minimumFractionDigits: 0,
  }).format(points) + " pts";
}

export function formatCurrency(amount: number): string {
  return "Rp" + new Intl.NumberFormat("id-ID", {
    style: "decimal",
    minimumFractionDigits: 0,
  }).format(amount);
}

export function formatDistance(distanceKm: number): string {
  return distanceKm.toFixed(1) + " km";
}

export function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(date);
  } catch (e) {
    return dateString;
  }
}
