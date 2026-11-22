"""Mongo helpers for the MAP service.

- Every analysis is saved to `ml_results` as a free-form document (features,
  probabilities, issues... whatever the model produced).
- On request, a result is rendered as a PDF and saved in GridFS (`reports`
  bucket) so NGOs see it next to their other reports in the dashboard.
"""
import logging
import os
from datetime import datetime, timezone

from bson import ObjectId
from fpdf import FPDF
from gridfs import GridFSBucket
from pymongo import MongoClient

log = logging.getLogger(__name__)
_db = None


def db():
    """Lazily connect once; return None when Mongo isn't configured."""
    global _db
    uri = os.environ.get("MONGODB_URI")
    if _db is None and uri:
        _db = MongoClient(uri, serverSelectionTimeoutMS=5000)[os.environ.get("MONGODB_DB", "dropconnect")]
    return _db


def save_result(result, lat, lon):
    """Store one prediction; returns its id (or None if Mongo is offline)."""
    try:
        doc = {**result, "location": {"type": "Point", "coordinates": [lon, lat]},
               "createdAt": datetime.now(timezone.utc)}
        return str(db().ml_results.insert_one(doc).inserted_id)
    except Exception as e:  # saving is a bonus, never break the API for it
        log.warning(f"ml_results save skipped: {e}")
        return None


def _pdf_bytes(res):
    """Render one prediction as a tidy one-page PDF."""
    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Helvetica", "B", 18)
    pdf.cell(0, 12, "DropConnect - Region Risk Report", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("Helvetica", size=11)
    lon, lat = res["location"]["coordinates"]
    rows = [("Location", f"{lat:.4f}, {lon:.4f}"), ("Risk level", res["risk_level"]),
            ("Confidence", res["risk_confidence"]), ("Suitability score", res["score"]),
            ("Vegetation index", res["vegetation_index"]), ("Water index", res["water_index"]),
            ("Elevation (m)", res["elevation"]), ("Generated", res["createdAt"].strftime("%d %b %Y %H:%M"))]
    for k, v in rows:
        pdf.cell(0, 8, f"{k}: {v}", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(4)
    pdf.set_font("Helvetica", "B", 13)
    pdf.cell(0, 9, "Class probabilities", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("Helvetica", size=11)
    for k, v in res.get("risk_probabilities", {}).items():
        pdf.cell(0, 7, f"- {k}: {v}", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(4)
    pdf.multi_cell(0, 7, f"Recommendation: {res.get('recommendation', '')}", new_x="LMARGIN", new_y="NEXT")
    if res.get("explanation"):  # Gemini's plain-English "why"
        pdf.ln(2)
        pdf.multi_cell(0, 7, ("Why: " + res["explanation"]).encode("latin-1", "replace").decode("latin-1"), new_x="LMARGIN", new_y="NEXT")
    for issue in res.get("issues", []):
        pdf.multi_cell(0, 7, f"- {issue}".encode("latin-1", "replace").decode("latin-1"), new_x="LMARGIN", new_y="NEXT")
    return bytes(pdf.output())


def store_pdf(result_id, owner_id=None):
    """Turn a saved prediction into a PDF in GridFS; returns the report id."""
    res = db().ml_results.find_one({"_id": ObjectId(result_id)})
    if not res:
        return None
    lon, lat = res["location"]["coordinates"]
    meta = {"kind": "ml-results", "title": f"Risk report ({lat:.2f}, {lon:.2f})",
            "ownerId": owner_id, "resultId": result_id, "riskLevel": res["risk_level"],
            "uploadedAt": datetime.now(timezone.utc)}
    bucket = GridFSBucket(db(), bucket_name="reports")
    file_id = bucket.upload_from_stream(f"risk-{result_id}.pdf", _pdf_bytes(res),
                                        metadata={**meta, "contentType": "application/pdf"})
    return str(file_id)
