import { col } from "@/lib/db/mongo";

// What each sponsor's programme measures (their `impact` fields differ, so we describe them here)
export const PROGRAMMES = {
  "Trionyx Systems Worldwide": {
    focus: "Emergency water supply & drought relief, Maharashtra",
    kpis: [["WaterDeliveredLiters", "Water delivered", "litres"], ["HouseholdsReached", "Households reached"],
      ["HygieneKitsDistributed", "Hygiene kits"], ["TankersSupplied", "Tankers supplied"]],
    charts: [["WaterDeliveredLiters", "Water delivered per drive"], ["HouseholdsReached", "Households reached per drive"]],
  },
  "Zentara Dynamics Corporation": {
    focus: "Rainwater harvesting pits, Tamil Nadu",
    kpis: [["PitsInstalled", "Pits installed"], ["EstimatedStorageLitersPerMonth", "Storage / month", "litres"]],
    charts: [["PitsInstalled", "Pits installed per drive"], ["EstimatedStorageLitersPerMonth", "Storage per drive (L/month)"]],
  },
  "Aurevia International Holdings": {
    focus: "Tree plantation drives, Rajasthan",
    kpis: [["TreesPlanted", "Trees planted"], ["SpeciesDiversityCount", "Species planted"]],
    charts: [["TreesPlanted", "Trees planted per drive"], ["SaplingSurvivalRatePercent", "Sapling survival (%)"]],
  },
  "Noventra Technologies Inc.": {
    focus: "Riverbank & wetland restoration, West Bengal",
    kpis: [["AreaRestoredSqM", "Area restored", "m²"], ["NativeFloraPlanted", "Native flora planted"], ["WasteRemovedKg", "Waste removed", "kg"]],
    charts: [["AreaRestoredSqM", "Area restored per drive (m²)"], ["NativeFloraPlanted", "Native flora per drive"]],
  },
  "Veltrix Global Solutions": {
    focus: "Flood preparedness & early warning, Assam",
    kpis: [["HouseholdsCovered", "Households covered"], ["AwarenessKitsDistributed", "Awareness kits"], ["MockDrillsConducted", "Mock drills"]],
    charts: [["HouseholdsCovered", "Households covered per drive"], ["AwarenessKitsDistributed", "Awareness kits per drive"]],
  },
};

// Pull every activity for the known sponsors, oldest first, trimmed to what the charts need
export async function csrOverview() {
  const docs = await (await col("csr_activities"))
    .find({ sponsor: { $in: Object.keys(PROGRAMMES) } })
    .sort({ date: 1 })
    .project({ sponsor: 1, ngo: 1, date: 1, place: 1, volunteers: 1, budget: 1, beneficiaries: 1, scores: 1, impact: 1 })
    .toArray();

  return Object.fromEntries(Object.keys(PROGRAMMES).map((name) => {
    const rows = docs.filter((d) => d.sponsor === name).map((d) => ({
      id: d._id, ngo: d.ngo, date: d.date?.toISOString().slice(0, 10), district: d.place?.district,
      volunteers: d.volunteers?.count ?? 0, hours: d.volunteers?.hours ?? 0,
      allocated: d.budget?.allocated ?? 0, utilized: d.budget?.utilized ?? 0,
      beneficiaries: d.beneficiaries ?? 0, satisfaction: d.scores?.community ?? 0, ...d.impact,
    }));
    return [name, rows];
  }));
}
