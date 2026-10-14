import os
import json
from dotenv import load_dotenv
from google import genai

load_dotenv()
api_key = os.environ.get("GEMINI_API_KEY")
client = genai.Client(api_key=api_key)

system_instruction = (
    "You are the Chief Logistics Officer for the Assam State Disaster Management Authority. "
    "Review this spatial routing payload. Write exactly 3 bullet points. "
    "Bullet 1: State the exact loss of healthcare access objectively using the provided mileage. "
    "Bullet 2: Recommend a specific physical intervention based strictly on whether the settlement is 'MODEL_ISOLATED' or 'REROUTED_ALT_FACILITY'. "
    "Bullet 3: Estimate the urgency of action. Do not use filler introductions or conclusions."
)

payload = {
    "village_name": "Binnakandi",
    "status": "REROUTED_ALT_FACILITY",
    "baseline_route": {"distance_km": 1.69, "facility": "Health Facility"},
    "scenario_route": {"distance_km": 13.37, "additional_km": 11.68, "detour_ratio": 7.91, "facility": "Alternative Facility"}
}

candidate_models = ["gemini-1.5-pro", "gemini-3-flash-preview", "gemini-3.8-flash", "gemini-flash-latest"]
for m in candidate_models:
    try:
        r = client.models.generate_content(
            model=m,
            contents=f"Spatial Routing Payload:\n{json.dumps(payload, indent=2)}",
            config=genai.types.GenerateContentConfig(system_instruction=system_instruction, temperature=0.2)
        )
        print(f"Model used: {m}")
        print(r.text)
        break
    except Exception as e:
        continue
