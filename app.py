import passiogo
from flask import Flask, jsonify

app = Flask(__name__)

# NYU system id (replace with the correct one for NYU!)
NYU_SYSTEM_ID = 1007  # Example, change if needed
system = passiogo.getSystemFromID(NYU_SYSTEM_ID)

@app.route('/stations')
def stations():
    stops = system.getStops()
    # You probably want id, name, lat/lon, and which shuttles come here
    stops_json = []
    for stop in stops:
        stops_json.append({
            "id": stop.id,
            "name": stop.name,
            "latitude": stop.latitude,
            "longitude": stop.longitude,
            "routes": list(stop.routesAndPositions.keys()),
        })
    return jsonify(stops_json)

@app.route('/shuttles')
def shuttles():
    routes = system.getRoutes()
    # You probably want id, name, color, etc.
    routes_json = []
    for route in routes:
        routes_json.append({
            "id": route.id,
            "name": route.name,
            "shortName": route.shortName,
            "color": route.groupColor,
        })
    return jsonify(routes_json)

@app.route('/alerts')
def alerts():
    alerts = system.getSystemAlerts()
    alerts_json = []
    for alert in alerts:
        alerts_json.append({
            "id": alert.id,
            "name": alert.name,
            "description": alert.gtfsAlertDescriptionText,
            "important": alert.important,
        })
    return jsonify(alerts_json)

if __name__ == '__main__':
    app.run(debug=True)