import requests

try:
    response = requests.post(
        "http://[::1]:8000/login",
        json={"email": "test@gmail.com", "password": "test"},
        timeout=5
    )
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
    print(f"Headers: {response.headers}")
except requests.exceptions.RequestException as e:
    print(f"Connection Error: {e}")
