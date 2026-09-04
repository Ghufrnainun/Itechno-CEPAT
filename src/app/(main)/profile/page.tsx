import { redirect } from "next/navigation";
import { headers } from "next/headers";

export default async function ProfileRedirect() {
  const headersList = await headers();
  const dbUserId = headersList.get("x-user-db-id");
  if (dbUserId) {
    redirect(`/profile/${dbUserId}`);
  }
  redirect("/profile/me");
}
