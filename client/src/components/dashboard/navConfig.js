import { Inbox, Calendar, Plus, Projector, Handshake, BarChart, MapIcon, Send, FormInput, FileText } from "lucide-react";

// Sidebar menu per role. Adding a link = adding one line here.
export const NAV = [
  { label: "Volunteer", roles: ["VOLUNTEER"], links: [
    { href: "/dashboard/volunteer/volunteerForm", text: "Volunteer Form", icon: FormInput },
    { href: "/dashboard/volunteer/events", text: "Apply Now", icon: Send },
    { href: "/dashboard/volunteer/inbox", text: "Inbox", icon: Inbox },
  ] },
  { label: "Events", roles: ["ORGANIZATION"], links: [
    { href: "/dashboard/yourevents", text: "Your Events", icon: Calendar },
    { href: "/dashboard/events", text: "See All Events", icon: Projector },
    { href: "/dashboard/events/new", text: "Add Event", icon: Plus },
  ] },
  { label: "Reports", roles: ["ORGANIZATION", "CORPORATE", "VOLUNTEER"], links: [
    { href: "/dashboard/reports", text: "Reports (PDF)", icon: FileText },
  ] },
  { label: "CSR", roles: ["CORPORATE"], links: [
    { href: "/dashboard/csr", text: "CSR Dashboard", icon: Handshake },
  ] },
  { label: "NGO", roles: ["ORGANIZATION"], links: [
    { href: "/dashboard/impact", text: "Impact Dashboard", icon: BarChart },
  ] },
  { label: "Region Risk (ML)", roles: ["ORGANIZATION"], links: [
    { href: "/dashboard/map", text: "Risk Map", icon: MapIcon },
  ] },
];
