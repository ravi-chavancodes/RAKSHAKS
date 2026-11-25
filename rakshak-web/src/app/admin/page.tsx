import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminDashboard } from "@/features/admin/components/admin-dashboard";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";
import { createClient } from "@/lib/supabase/server";

async function AdminContent() {
  await connection();
  const profileResult = await getCurrentProfile();

  if (!profileResult.ok || !profileResult.data) {
    redirect("/admin/login?next=/admin");
  }

  const profile = profileResult.data;

  if (profile.role !== "admin") {
    redirect("/unauthorized");
  }

  const supabase = await createClient();

  const [
    { data: incidents },
    { data: responders },
    { data: profiles },
    { data: auditLogs },
  ] = await Promise.all([
    supabase
      .from("incidents")
      .select(
        "id, reference, category, status, description, location_text, ai_suggested_priority, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(40),
    supabase
      .from("responders")
      .select(
        "id, organisation_name, category, contact_channel, radius_m, is_active, verified",
      )
      .order("organisation_name", { ascending: true }),
    supabase
      .from("profiles")
      .select("id, full_name, phone, role, created_at")
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("audit_logs")
      .select("id, actor_id, action, entity, entity_id, metadata, created_at")
      .order("created_at", { ascending: false })
      .limit(60),
  ]);

  return (
    <AdminDashboard
      adminName={profile.full_name ?? "Operations Admin"}
      incidents={incidents ?? []}
      responders={responders ?? []}
      profiles={profiles ?? []}
      auditLogs={auditLogs ?? []}
    />
  );
}

function AdminFallback() {
  return (
    <div className="space-y-6 pt-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

export default function AdminPage() {
  return (
    <div className="py-10">
      <div className="space-y-1.5 border-b border-border-default pb-6">
        <h1 className="text-h1 font-bold tracking-tight text-strong">
          Operations Admin Panel
        </h1>
        <p className="text-body-lg text-muted-ink">
          All status updates invoke{" "}
          <code className="font-mono text-caption text-strong">
            transition_case_status
          </code>{" "}
          and log to{" "}
          <code className="font-mono text-caption text-strong">
            status_history
          </code>
          .
        </p>
      </div>

      <Suspense fallback={<AdminFallback />}>
        <AdminContent />
      </Suspense>
    </div>
  );
}
