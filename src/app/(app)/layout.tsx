import { redirect } from "next/navigation";
import { getCurrentOrg } from "@/lib/current-org";
import { TopNav } from "@/components/ui/TopNav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const orgContext = await getCurrentOrg();

  if (!orgContext) {
    redirect("/login");
  }

  if (!orgContext.current) {
    redirect("/onboarding");
  }

  return (
    <>
      <TopNav
        memberships={orgContext.memberships}
        currentOrgId={orgContext.current.orgId}
        userEmail={orgContext.userEmail}
      />
      <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-8">{children}</main>
    </>
  );
}
