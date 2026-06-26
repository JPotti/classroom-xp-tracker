import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import XPTrackerDashboard from "./xp-dashboard";

export default async function HomePage() {
  const supabase = await createClient();

  const { data, error } =
    await supabase.auth.getClaims();

  const user = data?.claims;

  if (error || !user) {
    redirect("/login");
  }

  return <XPTrackerDashboard />;
}