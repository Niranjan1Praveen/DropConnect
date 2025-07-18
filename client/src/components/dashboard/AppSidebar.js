"use client";
import {
  Inbox,
  Calendar,
  User2,
  ChevronUp,
  Plus,
  Projector,
  Handshake,
  BarChart,
  MapIcon,
  Send,
  FormInput,
  Footprints,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import Link from "next/link";
import Image from "next/image";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUser } from "@/hooks/useUser";

const AppSidebar = () => {
  const { user } = useUser();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="py-4 ">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton>
              <Image
                src={user?.profileImage || "https://avatar.windsor.io/john@doe.com"}
                alt="logo"
                width={30}
                height={30}
                className="rounded-full"
              />
              <span>Welcome {user?.firstName}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <hr />
      <SidebarContent>
        {/* Volunteer */}
        {user?.role.toLowerCase() === "volunteer" && <SidebarGroup>
          <SidebarGroupLabel>Volunteer</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href={"/dashboard/volunteer/volunteerForm"}>
                    <FormInput />
                    <span>Volunteer Form</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href={"/dashboard/volunteer/events"}>
                    <Send />
                    <span>Apply Now</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href={"/dashboard/volunteer/inbox"}>
                    <Inbox />
                    <span>Inbox</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href={"http://127.0.0.1:5000"}>
                    <Footprints />
                    <span>Carbon Footprint</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>}
        {/* All Events */}
        {user?.role.toLowerCase() === "organization" && <SidebarGroup>
          <SidebarGroupLabel>Events</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href={"/dashboard/yourevents"}>
                    <Calendar />
                    <span>Your Events</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href="/dashboard/events">
                    <Projector />
                    See All Events
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href="/dashboard/events/new">
                    <Plus />
                    Add Event
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>}
        {/* CSR */}
        {user?.role.toLowerCase() === "corporate" && <SidebarGroup>
          <SidebarGroupLabel>CSR</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href={"https://dropconnect-csr-dashboard.onrender.com/"}>
                    <Handshake />
                    <span>CSR Dashboard</span>
                  </Link>
                  {/* <Link href={"http://127.0.0.1:9050/"}>
                    <Handshake />
                    <span>CSR Dashboard</span>
                  </Link> */}
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>}
        {/* NGO */}
        {user?.role.toLowerCase() === "organization" && <SidebarGroup>
          <SidebarGroupLabel>NGO</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href={"https://dropconnect-impact-assessment-dashboard.onrender.com"}>
                    <BarChart />
                    <span>Impact Dashboard</span>
                  </Link>
                  {/* <Link href={"http://127.0.0.1:8050/"}>
                    <BarChart />
                    <span>Impact Dashboard</span>
                  </Link> */}
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>}
        {/* Region Suitability */}
        {user?.role.toLowerCase() === "organization" && <SidebarGroup>
          <SidebarGroupLabel>Region Suitability</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href={"https://dropconnect-region-suitability-map.onrender.com"}>
                    <MapIcon />
                    <span>View Map</span>
                  </Link>
                  {/* <Link href={"http://127.0.0.1:5000"}>
                    <MapIcon />
                    <span>View Map</span>
                  </Link> */}
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>}
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton>
                  <User2 /> {user?.firstName} <ChevronUp className="ml-auto" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>Account</DropdownMenuItem>
                <DropdownMenuItem>Setting</DropdownMenuItem>
                <DropdownMenuItem>Sign out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;
