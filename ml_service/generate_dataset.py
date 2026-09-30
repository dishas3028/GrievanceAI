import pandas as pd
import random
import os

# Ensure data directory exists
os.makedirs("data", exist_ok=True)

# Categories and their specific scenarios
categories = {
    "Water Supply": {
        "dept": "Water Board",
        "templates": [
            "No water supply in {area} for {duration}.",
            "Water coming from tap is {quality}.",
            "Pipeline burst at {location}, immense water wastage.",
            "Water pressure is extremely {pressure}.",
            "Scheduled water tanker did not arrive in {area}.",
            "Water meter is broken and showing incorrect reading.",
            "Sewage water mixing with drinking water supply.",
            "Illegal water connection detected near {location}.",
            "Borewell needs repair in {area}.",
            "Requesting new water connection for {building}."
        ]
    },
    "Electricity": {
        "dept": "Electricity Dept",
        "templates": [
            "Power outage in {area} for over {duration}.",
            "Voltage fluctuation damaging {appliance}.",
            "Transformer {issue} at {location}.",
            "Street lights not working on {street}.",
            "Live wire hanging dangerously at {location}.",
            "Electricity bill is {bill_issue}.",
            "Smart meter installation pending.",
            "Frequent power cuts disrupting work in {area}.",
            "Electric pole leaning dangerously.",
            "Sparks seen from transformer near {location}."
        ]
    },
    "Roads & Infrastructure": {
        "dept": "Public Works Dept",
        "templates": [
            "Large potholes on {road} causing accidents.",
            "Road construction abandoned for months at {location}.",
            "Footpath encroached by {encroachers}.",
            "Drainage cover missing on {street}.",
            "Street sign damaged or missing at {location}.",
            "Bridge showing cracks near {landmark}.",
            "Road gets waterlogged after minor rain.",
            "Illegal speed breaker constructed on {road}.",
            "Street dog menace on {street}.",
            "Public park bench broken and unsafe."
        ]
    },
    "Sanitation": {
        "dept": "Municipal Corp",
        "templates": [
            "Garbage pile not cleared for {days} days.",
            "Open drain overflowing onto the road at {location}.",
            "Public toilet is {condition}.",
            "Dead animal lying on road for 2 days.",
            "Mosquito breeding in stagnant water near {location}.",
            "Sweeper does not clean {street} regularly.",
            "Illegal dumping of construction waste.",
            "Dustbins overflowing in {area}.",
            "Sewer blockage causing backflow into houses.",
            "Foul smell emanating from {source}."
        ]
    },
    "Public Transport": {
        "dept": "Transport Authority",
        "templates": [
            "Bus route {route} is always delayed.",
            "Bus driver driving rashly on {road}.",
            "Metro frequency is too low during peak hours.",
            "No bus stop shelter at {location}.",
            "Auto rickshaws refusing to go by meter.",
            "Traffic signal not working at {junction}.",
            "Illegal parking blocking {road}.",
            "Overcrowding in buses on route {route}.",
            "Ticket conductor behavior is rude.",
            "Request for new bus stop at {location}."
        ]
    },
    "Healthcare": {
        "dept": "Health Dept",
        "templates": [
            "No doctor available at {hospital} during OP hours.",
            "Medicines out of stock at government dispensary.",
            "Ambulance took too long to arrive.",
            "Hospital staff demanding bribe.",
            "Unsanitary conditions in ward.",
            "Denied admission in emergency.",
            "Vaccination center closed without notice.",
            "X-ray machine not working for weeks.",
            "Rude behavior by nurse.",
            "Overcharging for simple tests."
        ]
    },
    "Education": {
        "dept": "Education Dept",
        "templates": [
            "Teacher absent frequently at {school}.",
            "Mid-day meal quality is very poor.",
            "School building needs urgent repair.",
            "Lack of toilets for girls in {school}.",
            "Books and uniforms not distributed yet.",
            "Scholarship amount not credited.",
            "Playground encroached by outsiders.",
            "Drinking water not available in school.",
            "Illegal fees demanded for admission.",
            "Computer lab has no working computers."
        ]
    },
    "Law & Order": {
        "dept": "Police Dept",
        "templates": [
            "Frequent theft incidents in {area}.",
            "Police patrol required at night.",
            "Rowdy elements creating nuisance near {location}.",
            "Chain snatching reported on {road}.",
            "Illegal liquor shop operating near school.",
            "Police not registering FIR.",
            "Traffic police asking for bribe.",
            "Loudspeaker noise beyond permissible hours.",
            "Gambling den operating in {area}.",
            "Women safety issue on dark stretch of road."
        ]
    }
}

# Values for placeholders
areas = ["Sector 12", "Gandhi Nagar", "Model Town", "Civil Lines", "Main Market", "Block C", "Nehru Colony", "Old City", "Industrial Area", "Housing Board"]
locations = ["primary school", "main junction", "bus stand", "market entrance", "post office", "community center", "temple road", "railway station"]
durations = ["2 hours", "4 hours", "2 days", "a week", "10 days"]
qualities = ["muddy", "smelly", "dirty", "unfit for drinking", "brown colored"]
pressures = ["low", "high", "fluctuating"]
issues = ["caught fire", "exploded", "sparking", "leaking oil"]
streets = ["MG Road", "Station Road", "Park Avenue", "Church Street", "Ring Road"]
appliances = ["AC", "Fridge", "TV", "Computer", "Fan"]
bill_issues = ["too high", "wrongly calculated", "not received"]
roads = ["Main Highway", "Link Road", "Bypass Road", "Service Lane"]
encroachers = ["hawkers", "shops", "parked cars", "construction material"]
landmarks = ["river bridge", "flyover", "underpass"]
days = ["3", "5", "7", "10"]
conditions = ["filthy", "broken", "unusable", "locked"]
sources = ["drain", "garbage dump", "factory", "sewer"]
routes = ["42", "101", "205", "300", "55"]
junctions = ["Clock Tower", "Teen Batti", "Red Light", "Main Circle"]
hospitals = ["City Hospital", "District Hospital", "PHC", "CHC"]
schools = ["Govt High School", "Primary School", "Girls School"]

urgency_keywords = {
    "critical": ["fire", "exploded", "death", "accident", "emergency", "collapsed", "drowning", "electrocution", "attack", "blood"],
    "high": ["no water", "no power", "blocked", "overflowing", "bribe", "theft", "unsafe", "danger", "burst", "threat"],
    "medium": ["delayed", "low pressure", "broken", "smell", "dirty", "traffic", "rude", "leak"],
    "low": ["light", "bench", "park", "noise", "dog", "meter", "cleanality"]
}

sentiment_keywords = {
    "negative": ["angry", "pathethic", "worst", "terrible", "useless", "disappointed", "suffer", "problem", "fail"],
    "neutral": ["inquire", "request", "inform", "reading", "status", "submit"],
    "critical": ["dying", "danger", "help", "emergency", "immediately", "urgent"]
}

def get_weighted_urgency(text):
    text_lower = text.lower()
    scores = {"critical": 0, "high": 0, "medium": 0, "low": 0}
    for level, keywords in urgency_keywords.items():
        for k in keywords:
            if k in text_lower:
                scores[level] += 1
    
    if scores["critical"] > 0: return "critical"
    if scores["high"] > 0: return "high"
    if scores["medium"] > 0: return "medium"
    return "low"

def get_sentiment(text, priority):
    text_lower = text.lower()
    if priority == "critical": return "critical"
    
    for k in sentiment_keywords["negative"]:
        if k in text_lower: return "negative"
        
    return "neutral" if random.random() > 0.3 else "negative"

def generate_row():
    cat = random.choice(list(categories.keys()))
    dept = categories[cat]["dept"]
    template = random.choice(categories[cat]["templates"])
    
    # Fill template
    text = template.format(
        area=random.choice(areas),
        duration=random.choice(durations),
        location=random.choice(locations),
        quality=random.choice(qualities),
        pressure=random.choice(pressures),
        issue=random.choice(issues),
        street=random.choice(streets),
        appliance=random.choice(appliances),
        bill_issue=random.choice(bill_issues),
        road=random.choice(roads),
        encroachers=random.choice(encroachers),
        landmark=random.choice(landmarks),
        days=random.choice(days),
        condition=random.choice(conditions),
        source=random.choice(sources),
        route=random.choice(routes),
        junction=random.choice(junctions),
        hospital=random.choice(hospitals),
        school=random.choice(schools),
        building="Apartment Complex"
    )
    
    # Add variations and emotion
    prefixes = [
        "Urgent help needed: ", "Complaint regarding ", "I want to report ", 
        "Serious issue: ", "", "", "", "Please look into this: ", "To the authorities: "
    ]
    suffixes = [
        " Please resolve ASAP.", " This is causing lot of trouble.", " Nobody is listening.", 
        " We are suffering.", " Action needed immediately.", "", ""
    ]
    
    full_text = random.choice(prefixes) + text + random.choice(suffixes)
    
    # Determine metadata
    priority = get_weighted_urgency(full_text)
    sentiment = get_sentiment(full_text, priority)
    location_type = random.choice(["Urban", "Semi-Urban", "Rural"])
    
    # Add noise to priority
    if random.random() < 0.1:
        priority = random.choice(["low", "medium", "high", "critical"])

    # Calculate Urgency Score (1-10) based on priority with jitter
    score_base = {"critical": 9, "high": 7, "medium": 5, "low": 2}
    urgency_score = score_base.get(priority, 5) + random.choice([-1, 0, 1])
    # Clamp between 1 and 10
    urgency_score = max(1, min(10, urgency_score))
        
    return [full_text, cat, priority, dept, sentiment, urgency_score, location_type]

print("Generating 15,000 fine-tuning grievance records...")
data = [generate_row() for _ in range(15000)]

columns = ["text", "category", "priority", "department", "sentiment", "urgency_score", "location_type"]
df = pd.DataFrame(data, columns=columns)

output_path = "data/fine_tuning_grievances.csv"
df.to_csv(output_path, index=False)
print(f"Dataset saved to {output_path}")
print(df.head())
print(df["urgency_score"].value_counts().sort_index())
