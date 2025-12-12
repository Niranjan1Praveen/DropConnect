from flask import Flask, request, jsonify, render_template
import google.generativeai as genai
import json
import logging
import re
from datetime import datetime
from model import predict_score

app = Flask(__name__)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Gemini
GEMINI_API_KEY = "AIzaSyCoSaL4b0IdwzQ6qRhQp64zLS8w-9tmOAw"  # ← Replace with your actual key
genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel('gemini-1.5-flash')

def extract_json_from_text(text):
    """Extract JSON string from Gemini's response text"""
    try:
        # Try to find JSON between ```json ``` markers
        json_match = re.search(r'```json\n(.*?)\n```', text, re.DOTALL)
        if json_match:
            return json_match.group(1)
        
        # Try to find JSON between ``` markers
        json_match = re.search(r'```(.*?)```', text, re.DOTALL)
        if json_match:
            return json_match.group(1)
        
        # Try to find standalone JSON
        json_match = re.search(r'\{.*\}', text, re.DOTALL)
        if json_match:
            return json_match.group(0)
        
        return text
    except Exception as e:
        logger.error(f"JSON extraction failed: {str(e)}")
        return text

def get_gemini_analysis(lat, lon):
    """Robust analysis with multiple fallback mechanisms"""
    prompt = f"""Analyze this location in India (Lat: {lat}, Lon: {lon}) for NGO suitability.
Return ONLY a valid JSON object with these exact keys:
{{
    "vegetation_index": (0-1),
    "water_index": (0-1),
    "elevation": (meters),
    "urban_proximity": (km),
    "score": (0-1),
    "issues": ["list"],
    "recommendation": "string",
    "sources": ["list"]
}}

Example:
{{
    "vegetation_index": 0.65,
    "water_index": 0.45,
    "elevation": 320,
    "urban_proximity": 18.5,
    "score": 0.68,
    "issues": ["water stress"],
    "recommendation": "Prioritize water conservation",
    "sources": ["CGWB 2023"]
}}

Important:
- Return ONLY the JSON object
- No additional text or explanations
- Values must be properly quoted
- Arrays must use square brackets"""

    try:
        response = model.generate_content(prompt)
        response_text = response.text if hasattr(response, 'text') else ""
        
        # Extract JSON from response
        json_str = extract_json_from_text(response_text)
        logger.info(f"Raw Gemini response: {json_str}")
        
        # Parse with strict validation
        result = json.loads(json_str)
        
        # Validate required fields with type conversion
        required_keys = {
            "vegetation_index": (float, 0, 1),
            "water_index": (float, 0, 1),
            "elevation": (int, 0, 5000),
            "urban_proximity": (float, 0, 100),  # Now accepts string or number
            "score": (float, 0, 1),
            "issues": (list,),
            "recommendation": (str,),
            "sources": (list,)
        }
        
        for key, (val_type, *args) in required_keys.items():
            if key not in result:
                raise ValueError(f"Missing key: {key}")
            
            # Convert value to correct type if possible
            try:
                if val_type == float:
                    result[key] = float(result[key])
                elif val_type == int:
                    result[key] = int(float(result[key]))  # Handle both int strings and float strings
            except (ValueError, TypeError):
                raise ValueError(f"Invalid type for {key}. Could not convert to {val_type.__name__}")
            
            if not isinstance(result[key], val_type):
                raise ValueError(f"Invalid type for {key}. Expected {val_type.__name__}, got {type(result[key]).__name__}")
            
            if val_type in (float, int) and args:
                if not (args[0] <= result[key] <= args[1]):
                    raise ValueError(f"{key} out of range. Expected between {args[0]} and {args[1]}")
        
        return result
        
    except Exception as e:
        logger.error(f"Analysis failed: {str(e)}")
        return generate_smart_fallback(lat, lon)

def generate_smart_fallback(lat, lon):
    """Generate realistic fallback data based on coordinates"""
    # North-South variations (more vegetation in south)
    veg_factor = 0.6 - (lat - 20) * 0.015
    
    # East-West variations (more water in east)
    water_factor = 0.5 + (lon - 78) * 0.01
    
    return {
        "vegetation_index": round(max(0.2, min(0.9, veg_factor)), 2),
        "water_index": round(max(0.1, min(0.8, water_factor)), 2),
        "elevation": int(50 + abs(lat - 20) * 10),  # Rough elevation estimate
        "urban_proximity": round(20 + abs(lon - 77)),  # Proximity estimate
        "score": round(0.5 + (veg_factor + water_factor)/4, 2),  # Weighted score
        "issues": ["used fallback data"],
        "recommendation": "Verify with local sources",
        "sources": ["coordinate-based estimation"]
    }

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/analyze', methods=['POST'])
def analyze():
    try:
        data = request.get_json()
        lat = float(data["latitude"])
        lon = float(data["longitude"])

        # India bounds check
        if not (8.0 <= lat <= 37.0 and 68.0 <= lon <= 97.0):
            return jsonify({"error": "Coordinates outside India"}), 400

        # Step 1: Gemini → feature extraction ONLY
        analysis = get_gemini_analysis(lat, lon)

        # Enforce required features for ML
        features = {
            "vegetation_index": analysis["vegetation_index"],
            "water_index": analysis["water_index"],
            "elevation": analysis["elevation"],
            "urban_proximity": analysis["urban_proximity"]
        }

        # Step 2: XGBoost → score prediction
        score = predict_score(features)
        analysis["score"] = score

        return jsonify(analysis), 200

    except Exception as e:
        logger.error(f"Analyze endpoint failed: {str(e)}")

        # Fallback → still routed through ML
        fallback = generate_smart_fallback(lat, lon)
        fallback_features = {
            "vegetation_index": fallback["vegetation_index"],
            "water_index": fallback["water_index"],
            "elevation": fallback["elevation"],
            "urban_proximity": fallback["urban_proximity"]
        }
        fallback["score"] = predict_score(fallback_features)

        return jsonify(fallback), 200

if __name__ == '__main__':
    app.run(debug=True, port=5003)
