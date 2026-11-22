import AppSidebar from "@/components/dashboard/AppSidebar";
import AppNavbar from "@/components/dashboard/AppNavbar";
import { ClientThemeProvider } from "@/components/providers/ClientThemeProvider";
import { SidebarProvider } from "@/components/ui/sidebar";
import { cookies } from "next/headers";

export default async function DashboardLayout({ children }) {
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get("sidebar_state")?.value !== "false"; // open unless the user collapsed it

  return (
    <div className="min-h-screen">
      <ClientThemeProvider>
        <SidebarProvider defaultOpen={defaultOpen}>
          <AppSidebar />
          <main className="w-full">
            <AppNavbar />
            <div className="px-4">{children}</div>
          </main>
        </SidebarProvider>
      </ClientThemeProvider>
    </div>
  );
}
