# DropConnect - Track Winners in the University - Water Related Disasters Challenge 3 of the Xylem Global Innovation Challenge 2025, standing out among 4000+ teams from across the globe.

**A Smart Platform for Water Resilience Volunteering & CSR Impact** 

> *To build resilience, we need coordinated disaster risk reduction strategies, including strong water governance, early warning systems, and sustainable, climate-resilient infrastructure at all levels.*  
> — *UN SDG Framework*

---
## 👥 Team Members
- Debshata Choudhury (Team Leader)  
- Abhishek Chaubhey  
- Niranjan Praveen 
- Vaibhav Jain
- Pratham Ranjan  
   
## Overview

**DropConnect** is a digital platform that unites students, NGOs, and corporations to foster collective action for water resilience and climate-smart disaster management. Anchored in India’s Schedule VII CSR mandate, DropConnect empowers verified impact creation through:

- **Volunteer mobilization for water-centric initiatives** (like clean-up drives, rainwater harvesting, awareness campaigns).
- **Geo-based event matching** for students and community members.
- **Corporate dashboards** to monitor CSR, ESG, and BRSR-aligned outcomes.
- **Gamified rewards** to incentivize meaningful participation.

---

## Key Features

- 🎯 **NGO Event Listings:** Schedule and manage local water resilience events with roles, dates, and geo-tags.
- 🔍 **Smart Matching:** AI/ML-based engine aligns volunteers by region, interest, and skill.
- 📈 **Impact Dashboards for Corporates:** Track hours volunteered, trees planted, water conserved, and auto-generate reports for compliance.
- 🏆 **Student Incentives:** Points unlock internships, mentorships, leadership badges like *Green Champion*.
- 📲 **Real-time Participation:** QR and GPS-based event check-ins for transparent verification.
- 🔐 **Secure & Scalable:** AES-256 encrypted, OAuth2-authenticated, and high concurrency support.

---

## Impact Areas

- ✅ Water Conservation
- ✅ Climate Resilience
- ✅ Early Warning Awareness
- ✅ Youth Engagement for SDGs
- ✅ ESG & BRSR Corporate Compliance

---

## User Roles

| User        | Key Needs                                       |
|-------------|-------------------------------------------------|
| Students    | Recognition, internships, mentorship, upskilling|
| NGOs        | Volunteer management, event visibility          |
| Corporates  | Verified CSR metrics, Schedule VII compliance   |
| Admin       | Platform health, analytics, content moderation  |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15 (App Router), React 19, Tailwind CSS 4, shadcn/ui, Framer Motion (dark mode only) |
| Backend / API | Next.js Route Handlers (Node.js), modular `lib/` services |
| Authentication | Clerk 7 (Google + email sign-in, role-based dashboards) |
| Database | MongoDB Atlas (native driver): users, events, volunteers, inbox, activity log, CSR activities, ML results |
| File storage | MongoDB GridFS (PDF reports), pdf-lib for generated reports |
| Maps & charts | Leaflet / React-Leaflet (risk heatmap), Recharts (CSR and NGO impact dashboards) |
| Machine learning | XGBoost risk classifier, scikit-learn pipeline, SHAP drivers (Python, `server/MAP`) |
| AI explanations | Google Gemini API (plain-language reasons for each risk prediction) |
| Research | Jupyter notebook: EDA → feature engineering → model comparison |
| Hosting | Vercel (Next.js app); ML map data baked to static files at build time |


---

## Use Case Scenarios

1. **Student Volunteer Experience**
   - Signup → Get matched to nearby events → Check-in via QR → Earn badges → Unlock internships.
2. **NGO Event Management**
   - Post event (e.g., Bhopal River Clean-up) → Attract matched volunteers → Track turnout + impact reports.
3. **Corporate CSR Compliance**
   - Monitor real-time CSR impact → Auto-generate reports for BRSR/ESG → Plan company-wide CSR Days.

---

## Future Scope

- 🤖 AI-based engagement recommendations
- 🔗 Blockchain for verifiable social impact
- 🎓 Credit-based rewards integrated with universities
- 🗣️ Multilingual voice interfaces for rural communities

---

## Team DropConnect

- **Debshata Choudhury** – Team Leader, ML Engineer  
- **Niranjan Praveen** – Frontend Developer  
- **Vaibhav Jain** – Frontend Developer  
- **Abhishek Chaubey** – Backend Developer
- **Pratham Ranjan** - Backend Developer

---

## Code Execution Instructions:

### 1. Clone the Repository  
```bash
git https://github.com/Niranjan1Praveen/DropConnect.git
```

### 2. Install Frontend Dependencies  
```bash
cd client
npm install
```

### 3. Install Backend Dependencies  
```bash
cd ../server
pip install -r requirements.txt
```

### 4. Start Development Servers  

#### Frontend (Next.js)  
```bash
cd client
npm run dev
```

#### Backend (FastAPI/Flask)

```bash
cd server
cd CSR
python app.py
```

```bash
cd server
cd MAP
python app.py
```

```bash
cd server
cd NGO
python app.py
```

### 5. Access the Application  
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## License

This project is developed as part of a mission-driven hackathon challenge to accelerate disaster resilience and water governance through civic tech collaboration.

---

## Running locally (Clerk + MongoDB edition)

| Part | Stack | Port |
|---|---|---|
| Web app + API | Next.js 15, Clerk auth, MongoDB (native driver, GridFS for PDFs) | 3000 |
| ML risk map | Flask, XGBoost classifier, SHAP drivers, Gemini explanations | 5003 |
| CSR / NGO dashboards | Dash | 9050 / 8050 |

**Env files (not committed)**
- `client/.env.local`: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `MONGODB_URI`, `MONGODB_DB`
- `server/.env`: `GEMINI_API_KEYS`, `GEMINI_MODEL`, `MONGODB_URI`, `MONGODB_DB`

```bash
# 1. Python services
cd server && python -m venv venv && venv/Scripts/pip install -r requirements.txt
venv/Scripts/python seed_mongo.py          # loads CSR data + demo events + indexes
venv/Scripts/python MAP/app.py             # ML map on :5003

# 2. Web app
cd client && npm install && npm run dev    # http://localhost:3000
```

**MongoDB collections:** `users`, `events` (with `skillTags`), `volunteers` (nested `address`), `inbox` (embedded status `history`),
`activity` (free-form audit log), `csr_activities` (per-sponsor `impact` sub-documents), `ml_results` (GeoJSON point + model output),
and the `reports` GridFS bucket (stakeholder reports, ML-result PDFs, impact summaries).

**Dashboard pages:** `/dashboard/map` (ML heatmap + Gemini explanation pane), `/dashboard/reports` (upload/generate/download PDFs).
