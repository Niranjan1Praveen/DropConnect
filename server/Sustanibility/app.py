from flask import Flask, request, jsonify, render_template, send_from_directory
import json
import os
from datetime import datetime
import google.generativeai as genai
from werkzeug.utils import secure_filename
import PyPDF2
import re

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = 'Uploads'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

# Configure Gemini API
genai.configure(api_key="AIzaSyA2E4qIs7s_ut6Q95SkCrNObKWMi6QjLjE")

# Initialize Gemini model
model = genai.GenerativeModel('gemini-1.5-flash')

# Ensure upload directory exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Load or create data file
DATA_FILE = 'sustainability_data.json'

def load_data():
    """Load data from JSON file or create default data"""
    if os.path.exists(DATA_FILE):
        with open(DATA_FILE, 'r') as f:
            data = json.load(f)
            # Recalculate scores to ensure consistency
            data = recalculate_scores(data)
            return data
    return get_default_data()

def save_data(data):
    """Save data to JSON file"""
    with open(DATA_FILE, 'w') as f:
        json.dump(data, f, indent=2)

def get_default_data():
    """Return default data structure with zeroed-out scores"""
    data = {
        "user_profile": {
            "name": "Alex Johnson",
            "sustainability_score": 0,
            "green_base": 0,
            "target_score": 100,
            "member_since": datetime.now().strftime('%Y-%m-%d'),
            "level": "Eco Beginner"
        },
        "carbon_footprint": {
            "current_score": 0,
            "monthly_target": 85,
            "electricity_usage": {
                "current_month": 0,
                "previous_month": 0,
                "unit": "kWh",
                "co2_emissions": 0,
                "billing_period": "N/A"
            },
            "water_usage": {
                "current_month": 0,
                "previous_month": 0,
                "unit": "Liters",
                "co2_emissions": 0,
                "billing_period": "N/A"
            },
            "historical_data": []
        },
        "sustainability_activities": [],
        "skills": [
            {
                "name": "Environmental Data Analysis",
                "level": 85,
                "acquired_date": "2024-03-15",
                "source": "Tree Plantation Program"
            },
            {
                "name": "Community Leadership",
                "level": 78,
                "acquired_date": "2024-04-01",
                "source": "Volunteer Coordination"
            }
        ],
        "certifications": [
            {
                "name": "Veltrix Sustainability Certification",
                "issued_date": "2024-04-15",
                "validity": "2026-04-15",
                "level": "Advanced"
            }
        ],
        "opportunities": [
            {
                "id": 1,
                "title": "Green Tech Internship",
                "company": "EcoTech Solutions",
                "type": "Internship",
                "duration": "3 months",
                "eligibility_score": 75,
                "required_skills": ["Environmental Data Analysis"],
                "status": "eligible",
                "application_deadline": "2024-07-30"
            }
        ]
    }
    # Calculate initial scores based on default usage (assumed low or zero)
    return recalculate_scores(data)

def recalculate_scores(data):
    """Recalculate carbon and sustainability scores based on current data"""
    electricity_usage = data['carbon_footprint']['electricity_usage']['current_month']
    water_usage = data['carbon_footprint']['water_usage']['current_month']
    num_people = 1  # Default for calculations; updated during upload

    # Calculate carbon footprint and green base
    carbon_score, green_base = calculate_carbon_footprint(electricity_usage, water_usage, num_people)
    data['carbon_footprint']['current_score'] = carbon_score
    data['user_profile']['green_base'] = green_base

    # Recalculate sustainability score with activity bonuses
    green_bonus = sum(a.get('co2_offset', 0) * 0.05 for a in data.get('sustainability_activities', []))
    green_score = min(100, round(green_base + green_bonus))

    # Ensure green_score > carbon_score unless capped at 100
    if green_score <= carbon_score and green_score < 100:
        green_score = min(100, carbon_score + 1)

    data['user_profile']['sustainability_score'] = green_score

    # Update level based on score
    if green_score >= 80:
        data['user_profile']['level'] = "Eco Warrior"
    elif green_score >= 50:
        data['user_profile']['level'] = "Eco Enthusiast"
    else:
        data['user_profile']['level'] = "Eco Beginner"

    return data

def extract_text_from_pdf(file_path):
    """Extract text from PDF file"""
    text = ""
    try:
        with open(file_path, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            for page in pdf_reader.pages:
                extracted = page.extract_text()
                if extracted:
                    text += extracted + "\n"
    except Exception as e:
        print(f"Error extracting text from PDF: {e}")
    return text

def extract_pdf_data_with_gemini(file_path, bill_type):
    """Extract bill data using Gemini API"""
    try:
        pdf_text = extract_text_from_pdf(file_path)
        if not pdf_text.strip():
            return None

        if bill_type == "electricity":
            prompt = f"""
            Analyze this electricity bill and extract the following information in JSON format:
            Text from bill:
            {pdf_text}
            Please extract and return ONLY a JSON object with these fields:
            {{
                "consumption": <numeric value of kWh consumed>,
                "unit": "kWh",
                "billing_period": "<month year>",
                "total_amount": <bill amount>,
                "previous_reading": <previous meter reading>,
                "current_reading": <current meter reading>,
                "due_date": "<due date if available>",
                "co2_emissions": <calculate CO2 emissions: consumption * 0.82>
            }}
            If any field is not available, use null. Focus on finding the main electricity consumption value.
            """
        else:
            prompt = f"""
            Analyze this water bill and extract the following information in JSON format:
            Text from bill:
            {pdf_text}
            Please extract and return ONLY a JSON object with these fields:
            {{
                "consumption": <numeric value of water consumed in liters or convert to liters>,
                "unit": "Liters",
                "billing_period": "<month year>",
                "total_amount": <bill amount>,
                "previous_reading": <previous meter reading>,
                "current_reading": <current meter reading>,
                "due_date": "<due date if available>",
                "co2_emissions": <calculate CO2 emissions: consumption * 0.003>
            }}
            If any field is not available, use null. Focus on finding the main water consumption value.
            Convert gallons to liters if needed (1 gallon = 3.78541 liters).
            """

        response = model.generate_content(prompt)
        response_text = response.text.strip()
        start_idx = response_text.find('{')
        end_idx = response_text.rfind('}') + 1

        if start_idx != -1 and end_idx != -1:
            json_str = response_text[start_idx:end_idx]
            extracted_data = json.loads(json_str)

            if 'consumption' in extracted_data and extracted_data['consumption']:
                consumption = extracted_data['consumption']
                if isinstance(consumption, str):
                    consumption = float(re.sub(r'[^\d.]', '', consumption))

                unit = extracted_data.get('unit', '').lower()
                if 'kl' in unit:
                    consumption *= 1000
                    extracted_data['unit'] = 'Liters'

                extracted_data['consumption'] = consumption

                if not extracted_data.get('co2_emissions'):
                    if bill_type == "electricity":
                        extracted_data['co2_emissions'] = round(consumption * 0.82, 2)
                    else:
                        extracted_data['co2_emissions'] = round(consumption * 0.003, 2)

                return extracted_data

        return None

    except Exception as e:
        print(f"Error extracting data with Gemini: {e}")
        return None

def calculate_carbon_footprint(electricity_usage, water_usage, num_people=1):
    """Returns carbon score and base green score"""
    electricity_per = electricity_usage / max(1, num_people)
    water_per = water_usage / max(1, num_people)

    # Carbon score: Heavier penalty for usage
    electricity_score = max(0, 100 - (electricity_per * 0.08))
    water_score = max(0, 100 - (water_per * 0.005))
    carbon_score = round(electricity_score * 0.7 + water_score * 0.3)

    # Green base: Lighter penalty + small offset to push it above carbon_score
    green_electricity_score = max(0, 100 - (electricity_per * 0.045))  # Reduced penalty
    green_water_score = max(0, 100 - (water_per * 0.0025))  # Reduced penalty
    green_base = round(green_electricity_score * 0.6 + green_water_score * 0.4 + 2)  # Small boost

    return carbon_score, min(100, green_base)  # Keep max at 100

def calculate_score_from_upload(extracted_data):
    """Calculate score based on extracted bill data"""
    consumption = extracted_data.get('consumption', 0)
    bill_type = 'electricity' if extracted_data.get('unit') == 'kWh' else 'water'

    if bill_type == 'electricity':
        score = max(0, 100 - (consumption * 0.08))
    else:
        score = max(0, 100 - (consumption * 0.005))

    return round(score)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/data')
def get_data():
    """Get all dashboard data"""
    data = load_data()
    return jsonify(data)

@app.route('/api/upload', methods=['POST'])
def upload_file():
    """Handle PDF file upload and extraction"""
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400

    if file and file.filename.lower().endswith('.pdf'):
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)

        bill_type = request.form.get('bill_type', 'electricity')
        if 'water' in filename.lower():
            bill_type = 'water'
        elif 'electric' in filename.lower():
            bill_type = 'electricity'

        extracted_data = extract_pdf_data_with_gemini(filepath, bill_type)

        if extracted_data:
            data = load_data()

            if bill_type == 'electricity':
                data['carbon_footprint']['electricity_usage']['previous_month'] = \
                    data['carbon_footprint']['electricity_usage']['current_month']
                data['carbon_footprint']['electricity_usage']['current_month'] = extracted_data['consumption']
                data['carbon_footprint']['electricity_usage']['co2_emissions'] = extracted_data['co2_emissions']
                data['carbon_footprint']['electricity_usage']['billing_period'] = extracted_data.get('billing_period', datetime.now().strftime('%b %Y'))
            else:
                data['carbon_footprint']['water_usage']['previous_month'] = \
                    data['carbon_footprint']['water_usage']['current_month']
                data['carbon_footprint']['water_usage']['current_month'] = extracted_data['consumption']
                data['carbon_footprint']['water_usage']['co2_emissions'] = extracted_data['co2_emissions']
                data['carbon_footprint']['water_usage']['billing_period'] = extracted_data.get('billing_period', datetime.now().strftime('%b %Y'))

            num_people = int(request.form.get('num_people', 1))
            data = recalculate_scores(data)

            current_month = datetime.now().strftime('%b')
            historical_data = data['carbon_footprint']['historical_data']
            new_score = calculate_score_from_upload(extracted_data)

            month_found = False
            for entry in historical_data:
                if entry['month'] == current_month:
                    entry['score'] = data['carbon_footprint']['current_score']
                    month_found = True
                    break

            if not month_found:
                historical_data.append({'month': current_month, 'score': data['carbon_footprint']['current_score']})
                if len(historical_data) > 12:
                    historical_data.pop(0)

            save_data(data)

            return jsonify({
                'message': f'Successfully processed {bill_type} bill',
                'extracted_data': extracted_data,
                'new_score': data['carbon_footprint']['current_score'],
                'bill_type': bill_type
            })
        else:
            return jsonify({'error': 'Could not extract data from the PDF. Please ensure it\'s a valid utility bill.'}), 400

    return jsonify({'error': 'Invalid file format. Please upload a PDF file.'}), 400

@app.route('/api/activity', methods=['POST'])
def add_activity():
    """Add new sustainability activity"""
    activity_data = request.json
    data = load_data()

    new_activity = {
        "id": len(data['sustainability_activities']) + 1,
        "type": activity_data.get('type'),
        "date": activity_data.get('date', datetime.now().strftime('%Y-%m-%d')),
        "trees_planted": activity_data.get('trees_planted', 0),
        "co2_offset": activity_data.get('co2_offset', 0),
        "location": activity_data.get('location'),
        "participants": activity_data.get('participants', 1),
        "waste_collected": activity_data.get('waste_collected', 0)
    }

    data['sustainability_activities'].append(new_activity)
    data = recalculate_scores(data)
    save_data(data)

    return jsonify({
        'message': 'Activity added successfully',
        'activity': new_activity,
        'new_score': data['user_profile']['sustainability_score']
    })

if __name__ == '__main__':
    app.run(debug=True)