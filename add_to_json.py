import requests
import json

API_KEY = "AIzaSyAQyi7YRX9QBbJvUsblduaoh2DBdIVarc4"
BASE_URL = "https://maps.googleapis.com/maps/api/geocode/json"

output = {}

with open("addy.txt", "r") as f:
    for line in f:
        if ":" not in line.strip():
            continue
        name, address = line.strip().split(":", 1)
        params = {"address": address, "key": API_KEY}
        res = requests.get(BASE_URL, params=params).json()
        
        if res["status"] == "OK":
            loc = res["results"][0]["geometry"]["location"]
            output[name] = {"lat": loc["lat"], "lng": loc["lng"]}
        else:
            output[name] = {"lat": None, "lng": None}

with open("building.json", "w") as f:
    json.dump(output, f, indent=4)

print("Done! Results in building.json")
