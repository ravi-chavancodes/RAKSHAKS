import { Suspense } from "react";
import { redirect } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { UserDashboard } from "@/features/dashboard/components/user-dashboard";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";
import { createClient } from "@/lib/supabase/server";

async function DashboardContent() {
  const profileResult = await getCurrentProfile();

  if (!profileResult.ok || !profileResult.data) {
    redirect("/login?next=/dashboard");
  }

  const profile = profileResult.data;

  // Strict portal isolation: admins use /admin, not the user dashboard
  if (profile.role === "admin") {
    redirect("/unauthorized");
  }

  const supabase = await createClient();

  const { data: incidents } = await supabase
    .from("incidents")
    .select(
      "id, reference, category, status, description, location_text, created_at",
    )
    .eq("reporter_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(25);

  const incidentIds = (incidents ?? []).map((item) => item.id);
  const { data: history } =
    incidentIds.length > 0
      ? await supabase
          .from("status_history")
          .select("id, incident_id, old_status, new_status, note, created_at")
          .in("incident_id", incidentIds)
          .order("created_at", { ascending: false })
      : { data: [] };

  return (
    <UserDashboard
      profile={profile}
      incidents={incidents ?? []}
      history={history ?? []}
    />
  );
}

function DashboardFallback() {
  return (
    <div className="space-y-6 py-10">
      <Skeleton className="h-12 w-72" />
      <div className="grid gap-8 lg:grid-cols-12">
        <Skeleton className="h-72 lg:col-span-4" />
        <Skeleton className="h-72 lg:col-span-8" />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardFallback />}>
      <DashboardContent />
    </Suspense>
  );
}
