import { eq } from "drizzle-orm";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { verifySession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const userId = await verifySession();
  // From the database rather than the session token, so a new name or photo
  // shows up after router.refresh() without signing in again
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { name: true, email: true, image: true },
  });

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <MobileNav />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header user={user ?? null} />
        <main className="flex-1 overflow-auto bg-gray-50 p-6">{children}</main>
      </div>
    </div>
  );
}
