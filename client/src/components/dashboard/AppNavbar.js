"use client";

import { UserButton } from "@clerk/nextjs";
import { SidebarTrigger } from "@/components/ui/sidebar";

// Dashboard top bar: sidebar toggle on the left, Clerk account menu on the right
const AppNavbar = () => (
  <nav className="p-4 flex items-center justify-between z-10">
    <SidebarTrigger />
    <UserButton />
  </nav>
);

export default AppNavbar;
