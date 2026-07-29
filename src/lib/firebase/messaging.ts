export async function requestNotificationPermission(): Promise<string | null> {
  console.log("Mock: Requesting notification permission...");
  return "mock-fcm-token-12345";
}

export function onMessageListener(): Promise<any> {
  return new Promise((resolve) => {
    // Return mock notification after 10s or when triggered
  });
}
