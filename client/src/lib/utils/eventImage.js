import veltrix from "@/assets/images/eventImg/1.svg";
import noventra from "@/assets/images/eventImg/2.svg";
import aurevia from "@/assets/images/eventImg/3.svg";
import zentara from "@/assets/images/eventImg/4.svg";
import trionyx from "@/assets/images/eventImg/5.svg";

const FALLBACK = "/assets/images/ngo.png";
const BRANDS = { trionyx, aurevia, noventra, veltrix, zentara };

// Match a sponsor's name to its banner image, else show the NGO placeholder
export function eventImage(organizer) {
  const name = typeof organizer === "string" ? organizer.toLowerCase() : "";
  const hit = Object.keys(BRANDS).find((key) => name.includes(key));
  return hit ? BRANDS[hit] : FALLBACK;
}
