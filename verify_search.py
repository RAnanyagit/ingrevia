import requests
import json

def verify_search():
    base_url = "http://localhost:8000"
    
    print("Testing /search-products?allergy=SLS")
    try:
        response = requests.get(f"{base_url}/search-products?allergy=SLS")
        if response.status_code == 200:
            data = response.json()
            print(f"Received {len(data)} products.")
            
            # Check if Hydrating Face Wash is High Risk (it contains SLS)
            face_wash = next((p for p in data if "Face Wash" in p["name"]), None)
            if face_wash and face_wash["risk"] == "High":
                print("✅ Face Wash correctly flagged as High Risk for SLS.")
            else:
                print("❌ Face Wash risk check failed.")
                if face_wash: print(f"Risk: {face_wash['risk']}")

            # Check if Daily Moisturizer is Low Risk (it doesn't contain SLS)
            moisturizer = next((p for p in data if "Moisturizer" in p["name"]), None)
            if moisturizer and moisturizer["risk"] == "Low":
                print("✅ Moisturizer correctly flagged as Low Risk for SLS.")
            else:
                print("❌ Moisturizer risk check failed.")

        else:
            print(f"❌ API Error: {response.status_code}")
    except Exception as e:
        print(f"❌ Connection Error: {e}")

if __name__ == "__main__":
    verify_search()
