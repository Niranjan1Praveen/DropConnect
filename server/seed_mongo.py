"""Load the CSR CSVs into MongoDB.

Each sponsor tracks *different* impact metrics (trees planted vs. tankers
supplied vs. pits installed...). Instead of six rigid tables, every activity
becomes one document in `csr_activities` with a free-form `impact` object.
A handful of activities are also published as demo volunteer `events`.

Run:  venv/Scripts/python seed_mongo.py
"""
import os
from datetime import datetime, timezone
from pathlib import Path

import pandas as pd
from dotenv import load_dotenv
from pymongo import MongoClient, UpdateOne

HERE = Path(__file__).parent
load_dotenv(HERE / ".env")
db = MongoClient(os.environ["MONGODB_URI"])[os.environ.get("MONGODB_DB", "dropconnect")]

SPONSOR_FILES = ["Veltrix Global Solutions", "Noventra Technologies Inc", "Aurevia International Holdings",
                 "Zentara Dynamics Corporation", "Trionyx Systems Worldwide"]


def impact_by_event():
    """EventID -> {metric: value} gathered from every sponsor file."""
    out = {}
    for name in SPONSOR_FILES:
        df = pd.read_csv(HERE / "data" / f"{name.replace(' ', '')}.csv")
        for row in df.to_dict("records"):
            out[row.pop("EventID")] = row
    return out


def main():
    main_df = pd.read_csv(HERE / "data" / "CSR_Main_Table.csv", parse_dates=["DateOfImplementation"])
    impact = impact_by_event()

    # Upsert so the script is safe to run again
    ops = []
    for r in main_df.to_dict("records"):
        doc = {
            "activity": r["ActivityName"],
            "place": {"village": r["LocationVillageCity"], "district": r["District"], "state": r["State"]},
            "date": r["DateOfImplementation"].to_pydatetime(),
            "sponsor": r["CorporateSponsor"], "ngo": r["NGOPartner"],
            "volunteers": {"count": int(r["NumberOfVolunteers"]), "hours": float(r["VolunteerHoursLogged"]),
                           "gender": r["GenderDistribution"]},
            "budget": {"allocated": float(r["CSRBudgetAllocated"]), "utilized": float(r["CSRBudgetUtilized"])},
            "scores": {"volunteer": int(r["VolunteerFeedbackScore"]), "community": int(r["CommunitySatisfactionScore"])},
            "beneficiaries": int(r["CommunityBeneficiaries"]),
            "remarks": r["RemarksChallenges"],
            "impact": impact.get(r["EventID"], {}),  # shape differs per sponsor
        }
        ops.append(UpdateOne({"_id": r["EventID"]}, {"$set": doc}, upsert=True))
    db.csr_activities.bulk_write(ops)

    # Publish one demo event per sponsor if the events collection is empty
    if db.events.count_documents({}) == 0:
        now = datetime.now(timezone.utc)
        demo = main_df.drop_duplicates("CorporateSponsor").head(5)
        db.events.insert_many([{
            "eventName": r["ActivityName"], "eventDescription": f"{r['ActivityName']} in {r['District']}, {r['State']}.",
            "organizerName": r["CorporateSponsor"], "email": "volunteer@dropconnect.demo", "contact": "9000000000",
            "eventLocation": r["State"], "volunteerCapacity": int(r["NumberOfVolunteers"]),
            "SkillsRequired": "Teamwork, Communication", "skillTags": ["teamwork", "communication"],
            "userId": "seed", "createdAt": now, "updatedAt": now,
        } for r in demo.to_dict("records")])

    # Indexes for the queries the app actually runs
    db.events.create_index([("createdAt", -1)])
    db.events.create_index("userId")
    db.inbox.create_index([("userId", 1), ("eventId", 1)], unique=True)
    db.volunteers.create_index("userId", unique=True)
    db.activity.create_index([("userId", 1), ("at", -1)])
    db.csr_activities.create_index("sponsor")
    db.ml_results.create_index([("location", "2dsphere")])
    print(f"csr_activities: {db.csr_activities.count_documents({})}, events: {db.events.count_documents({})}")


if __name__ == "__main__":
    main()
