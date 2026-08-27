ROUTE_WEIGHTS = {
    "DEL-BOM": 0.26,
    "BOM-DEL": 0.24,
    "BLR-DEL": 0.20,
    "DEL-CCU": 0.14,
    "DEL-PAT": 0.09,
    "BOM-GOI": 0.07,
    "DEL-BLR": 0.12,
    "CCU-DEL": 0.07,
    "DEL-HYD": 0.06,
    "HYD-DEL": 0.05,
    "DEL-MAA": 0.05,
    "MAA-DEL": 0.04,
    "BOM-BLR": 0.03,
    "BLR-BOM": 0.03
}

HORIZON_ALPHA = {
    30: 0.35,
    7: 0.45,
    1: 0.20
}

ALL_CORRIDORS = [
    ("DEL", "BOM"),
    ("BOM", "DEL"),
    ("BLR", "DEL"),
    ("DEL", "BLR"),
    ("DEL", "CCU"),
    ("CCU", "DEL"),
    ("DEL", "HYD"),
    ("HYD", "DEL"),
    ("DEL", "MAA"),
    ("MAA", "DEL"),
    ("BOM", "BLR"),
    ("BLR", "BOM"),
    ("BOM", "HYD"),
    ("HYD", "BOM"),
    ("BOM", "MAA"),
    ("MAA", "BOM"),
    ("BLR", "HYD"),
    ("HYD", "BLR"),
    ("BLR", "MAA"),
    ("MAA", "BLR"),
    ("DEL", "PAT"),
    ("BOM", "GOI")
]

INDIAN_AIRPORTS = {
    "DEL": {"code": "DEL", "name": "Indira Gandhi International", "city": "Delhi", "lat": 28.5562, "lon": 77.1000, "x": 38, "y": 28},
    "BOM": {"code": "BOM", "name": "Chhatrapati Shivaji Maharaj International", "city": "Mumbai", "lat": 19.0896, "lon": 72.8656, "x": 26, "y": 58},
    "BLR": {"code": "BLR", "name": "Kempegowda International", "city": "Bengaluru", "lat": 13.1986, "lon": 77.7066, "x": 38, "y": 76},
    "CCU": {"code": "CCU", "name": "Netaji Subhash Chandra Bose International", "city": "Kolkata", "lat": 22.6547, "lon": 88.4467, "x": 74, "y": 46},
    "HYD": {"code": "HYD", "name": "Rajiv Gandhi International", "city": "Hyderabad", "lat": 17.2403, "lon": 78.4294, "x": 42, "y": 64},
    "MAA": {"code": "MAA", "name": "Chennai International", "city": "Chennai", "lat": 12.9941, "lon": 80.1709, "x": 44, "y": 78},
    "AMD": {"code": "AMD", "name": "Sardar Vallabhbhai Patel International", "city": "Ahmedabad", "lat": 23.0772, "lon": 72.6347, "x": 24, "y": 44},
    "PNQ": {"code": "PNQ", "name": "Pune International", "city": "Pune", "lat": 18.5822, "lon": 73.9197, "x": 28, "y": 60},
    "GOI": {"code": "GOI", "name": "Dabolim / Mopa Airport", "city": "Goa", "lat": 15.3808, "lon": 73.8314, "x": 27, "y": 68},
    "PAT": {"code": "PAT", "name": "Jay Prakash Narayan Airport", "city": "Patna", "lat": 25.5913, "lon": 85.0880, "x": 64, "y": 38},
    "COK": {"code": "COK", "name": "Cochin International", "city": "Kochi", "lat": 10.1520, "lon": 76.4019, "x": 36, "y": 85},
    "TRV": {"code": "TRV", "name": "Trivandrum International", "city": "Thiruvananthapuram", "lat": 8.4821, "lon": 76.9200, "x": 37, "y": 91},
    "JAI": {"code": "JAI", "name": "Jaipur International", "city": "Jaipur", "lat": 26.8242, "lon": 75.8122, "x": 34, "y": 34},
    "LKO": {"code": "LKO", "name": "Chaudhary Charan Singh International", "city": "Lucknow", "lat": 26.7606, "lon": 80.8893, "x": 48, "y": 34},
    "GAU": {"code": "GAU", "name": "Lokpriya Gopinath Bordoloi International", "city": "Guwahati", "lat": 26.1061, "lon": 91.5859, "x": 88, "y": 36},
    "IXC": {"code": "IXC", "name": "Chandigarh International", "city": "Chandigarh", "lat": 30.6735, "lon": 76.7885, "x": 36, "y": 22},
    "ATQ": {"code": "ATQ", "name": "Sri Guru Ram Dass Jee International", "city": "Amritsar", "lat": 31.7096, "lon": 74.7973, "x": 32, "y": 20},
    "VTZ": {"code": "VTZ", "name": "Visakhapatnam International", "city": "Visakhapatnam", "lat": 17.7219, "lon": 83.2245, "x": 55, "y": 62},
    "NAG": {"code": "NAG", "name": "Dr. Babasaheb Ambedkar International", "city": "Nagpur", "lat": 21.0922, "lon": 79.0472, "x": 44, "y": 50},
    "IDR": {"code": "IDR", "name": "Devi Ahilya Bai Holkar Airport", "city": "Indore", "lat": 22.7217, "lon": 75.8011, "x": 34, "y": 48},
    "BBI": {"code": "BBI", "name": "Biju Patnaik International", "city": "Bhubaneswar", "lat": 20.2444, "lon": 85.8178, "x": 66, "y": 54},
    "RPR": {"code": "RPR", "name": "Swami Vivekananda Airport", "city": "Raipur", "lat": 21.1804, "lon": 81.7388, "x": 54, "y": 50},
    "SXR": {"code": "SXR", "name": "Sheikh ul-Alam International", "city": "Srinagar", "lat": 33.9872, "lon": 74.7741, "x": 32, "y": 12},
    "IXB": {"code": "IXB", "name": "Bagdogra Airport", "city": "Siliguri / Bagdogra", "lat": 26.6812, "lon": 88.3286, "x": 76, "y": 35},
    "DED": {"code": "DED", "name": "Dehradun Airport", "city": "Dehradun", "lat": 30.1897, "lon": 78.1803, "x": 40, "y": 24},
    "VNS": {"code": "VNS", "name": "Lal Bahadur Shastri International", "city": "Varanasi", "lat": 25.4523, "lon": 82.8593, "x": 56, "y": 38},
    "IXZ": {"code": "IXZ", "name": "Veer Savarkar International", "city": "Port Blair", "lat": 11.6410, "lon": 92.7297, "x": 92, "y": 82},
    "IXJ": {"code": "IXJ", "name": "Jammu Airport", "city": "Jammu", "lat": 32.6891, "lon": 74.8375, "x": 32, "y": 16},
    "IXR": {"code": "IXR", "name": "Birsa Munda Airport", "city": "Ranchi", "lat": 23.3143, "lon": 85.3217, "x": 63, "y": 46},
    "IMF": {"code": "IMF", "name": "Imphal International", "city": "Imphal", "lat": 24.7600, "lon": 93.8967, "x": 93, "y": 40}
}

def get_route_weight(origin: str, dest: str) -> float:
    return ROUTE_WEIGHTS.get(f"{origin}-{dest}", 0.02)

def get_horizon_alpha(horizon_days: int) -> float:
    return HORIZON_ALPHA.get(horizon_days, 0.33)

