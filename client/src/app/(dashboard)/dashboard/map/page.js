import MapView from "@/components/map/MapView";
import { requireRole } from "@/lib/auth/roles";

// Region risk ML is an NGO tool; volunteers and CSR users are sent home
export default async function MapPage() {
  await requireRole("ORGANIZATION");
  return <MapView />;
}
