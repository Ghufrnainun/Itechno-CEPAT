// Light tactile haptic feedback for mobile web & PWA
export function triggerHaptic(type: "light" | "medium" | "heavy" | "success" = "light") {
  if (typeof window === "undefined" || !("vibrate" in navigator)) return;

  try {
    switch (type) {
      case "light":
        navigator.vibrate(10);
        break;
      case "medium":
        navigator.vibrate(18);
        break;
      case "heavy":
        navigator.vibrate(28);
        break;
      case "success":
        navigator.vibrate([10, 30, 15]);
        break;
    }
  } catch {
    // Ignore if vibration is restricted by browser policy
  }
}
