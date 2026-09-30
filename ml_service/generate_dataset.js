
const fs = require('fs');
const path = require('path');

const outputDir = path.join(__dirname, 'data');
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
}

const categories = {
    "Water Supply": {
        dept: "Water Board",
        templates: [
            "No water supply in {area} for {duration}.",
            "Water coming from tap is {quality}.",
            "Pipeline burst at {location}, immense water wastage.",
            "Water pressure is extremely {pressure}.",
            "Scheduled water tanker did not arrive in {area}.",
            "Water meter is broken and showing incorrect reading.",
            "Sewage water mixing with drinking water supply.",
            "Illegal water connection detected near {location}.",
            "Borewell needs repair in {area}.",
            "Requesting new water connection for {building}.",
            "Dirty water supply causing health issues."
        ]
    },
    "Electricity": {
        dept: "Electricity Dept",
        templates: [
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
        dept: "Public Works Dept",
        templates: [
            "Large potholes on {road} making driving difficult.",
            "Road surface is uneven and dangerous at {location}.",
            "Footpath encroached by {encroachers}.",
            "Drainage cover missing on {street}.",
            "Street sign damaged or missing at {location}.",
            "Bridge showing cracks near {landmark}.",
            "Road gets waterlogged after minor rain.",
            "Illegal speed breaker constructed on {road}.",
            "Street lights on {road} are broken.",
            "Manhole cover is open and dangerous."
        ]
    },
    "Sanitation": {
        dept: "Municipal Corp",
        templates: [
            "Garbage pile not cleared for {days} days.",
            "Open drain overflowing onto the road at {location}.",
            "Public toilet is {condition}.",
            "Dead animal lying on road for 2 days.",
            "Mosquito breeding in stagnant water near {location}.",
            "Sweeper does not clean {street} regularly.",
            "Illegal dumping of construction waste.",
            "Dustbins are missing in {area}."
        ]
    },
    "Law & Order": {
        dept: "Police Dept",
        templates: [
            "Frequent theft incidents in {area}.",
            "Suspicious activity observed near {location}.",
            "Loud noise disturbance at night in {area}.",
            "Traffic violation rampant on {road}.",
            "Chain snatching reported at {location}."
        ]
    }
};

const areas = ["Sector 12", "Gandhi Nagar", "Model Town", "Civil Lines", "Main Market", "Block C", "Tech Park", "Old City"];
const locations = ["primary school", "main junction", "bus stand", "market entrance", "post office", "park gate"];
const durations = ["2 hours", "4 hours", "2 days", "a week"];
const qualities = ["muddy", "smelly", "dirty", "unfit for drinking"];
const pressures = ["low", "high", "fluctuating"];
const issues = ["caught fire", "exploded", "sparking", "leaking oil"];
const streets = ["MG Road", "Station Road", "Park Avenue", "Church Street", "Ring Road"];
const appliances = ["AC", "Fridge", "TV", "Computer", "Fan"];
const bill_issues = ["too high", "wrongly calculated", "not received"];
const roads = ["Main Highway", "Link Road", "Bypass Road"];
const encroachers = ["hawkers", "shops", "parked cars"];
const landmarks = ["river bridge", "flyover", "underpass"];
const days = ["3", "5", "7", "10"];
const conditions = ["filthy", "broken", "unusable"];
const buildings = ["Apartment Complex", "House No 12"];

// STRICTER URGENCY RULES
const urgencyKeywords = {
    // LIFE THREATENING only
    critical: ["fire", "exploded", "death", "accident", "emergency", "collapsed", "drowning", "electrocution", "blood", "disaster"],
    // URGENT but not immediately fatal
    high: ["no water", "no power", "blocked", "overflowing", "live wire", "theft", "unsafe", "danger", "burst", "threat", "open manhole", "sewage mixing"],
    // IMPORTANT maintenance
    medium: ["pothole", "broken", "smell", "dirty", "garbage", "delayed", "low pressure", "traffic", "rude", "leak", "damaged road", "cracks"],
    // ROUTINE / FEEDBACK
    low: ["light", "bench", "park", "noise", "dog", "meter", "cleanality", "request", "inquiry", "bill"]
};

const sentimentKeywords = {
    negative: ["angry", "pathethic", "worst", "terrible", "useless", "disappointed", "suffer", "problem", "fail", "pain"],
    neutral: ["inquire", "request", "inform", "reading", "status", "submit", "check"],
    critical: ["dying", "danger", "help", "emergency", "immediately", "urgent"]
};

function choice(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function getWeightedUrgency(text) {
    const textLower = text.toLowerCase();

    // Check critical first (immediate return)
    for (const k of urgencyKeywords.critical) {
        if (textLower.includes(k)) return "critical";
    }

    // Count scores for High/Medium/Low
    const scores = { high: 0, medium: 0, low: 0 };
    for (const k of urgencyKeywords.high) if (textLower.includes(k)) scores.high += 2; // Weight high keywords more
    for (const k of urgencyKeywords.medium) if (textLower.includes(k)) scores.medium += 1;
    for (const k of urgencyKeywords.low) if (textLower.includes(k)) scores.low += 1;

    if (scores.high >= 2) return "high";
    if (scores.high > 0 || scores.medium >= 2) return "medium"; // Demote single 'high' keyword if context weak
    if (scores.medium > 0) return "medium";

    return "low";
}

function getSentiment(text, priority) {
    const textLower = text.toLowerCase();
    if (priority === "critical") return "critical";

    for (const k of sentimentKeywords.negative) {
        if (textLower.includes(k)) return "negative";
    }

    return Math.random() > 0.3 ? "neutral" : "negative";
}

function generateRow() {
    const catKeys = Object.keys(categories);
    const cat = choice(catKeys);
    const dept = categories[cat].dept;
    let text = choice(categories[cat].templates);

    // Replacement logic
    text = text.replace('{area}', choice(areas))
        .replace('{duration}', choice(durations))
        .replace('{location}', choice(locations))
        .replace('{quality}', choice(qualities))
        .replace('{pressure}', choice(pressures))
        .replace('{issue}', choice(issues))
        .replace('{street}', choice(streets))
        .replace('{appliance}', choice(appliances))
        .replace('{bill_issue}', choice(bill_issues))
        .replace('{road}', choice(roads))
        .replace('{encroachers}', choice(encroachers))
        .replace('{landmark}', choice(landmarks))
        .replace('{days}', choice(days))
        .replace('{condition}', choice(conditions))
        .replace('{building}', choice(buildings));

    const prefixes = ["Urgent help needed: ", "Complaint regarding ", "I want to report ", "", "", "Please look into this: "];
    const suffixes = [" Please resolve ASAP.", " This is causing trouble.", " Nobody is listening.", ""];

    const fullText = choice(prefixes) + text + choice(suffixes);

    const priority = getWeightedUrgency(fullText);
    const sentiment = getSentiment(fullText, priority);
    const locationType = choice(["Urban", "Semi-Urban", "Rural"]);

    const scoreBase = { critical: 9, high: 7, medium: 5, low: 2 };
    let urgencyScore = (scoreBase[priority] || 5) + choice([-1, 0, 1]);
    urgencyScore = Math.max(1, Math.min(10, urgencyScore));

    return `"${fullText.replace(/"/g, '""')}","${cat}","${priority}","${dept}","${sentiment}",${urgencyScore},"${locationType}"`;
}

console.log("Generating dataset...");
const header = "text,category,priority,department,sentiment,urgency_score,location_type";
const rows = [header];

for (let i = 0; i < 2000; i++) {
    rows.push(generateRow());
}

fs.writeFileSync(path.join(outputDir, 'fine_tuning_grievances.csv'), rows.join('\n'));
console.log(`Dataset saved to ${path.join(outputDir, 'fine_tuning_grievances.csv')}`);
