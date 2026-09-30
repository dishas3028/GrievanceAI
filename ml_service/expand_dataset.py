import pandas as pd
import os

DATA_PATH = "e:/Grievancee-master/Grievancee-master/ml_service/data/fine_tuning_grievances.csv"

# Load existing data
df = pd.read_csv(DATA_PATH)

# New entries for better domain coverage
new_data = [
    # Sanitation
    ["Garbage collection is irregular in my street.", "Sanitation", "low", "Municipal Corp", "negative", 3, "Urban"],
    ["Garbage dump near school is attracting flies and stinks.", "Sanitation", "medium", "Municipal Corp", "negative", 5, "Urban"],
    ["Huge pile of garbage spreading foul smell in the locality.", "Sanitation", "medium", "Municipal Corp", "negative", 6, "Urban"],
    ["Garbage not picked up for a week, causing health concerns.", "Sanitation", "high", "Municipal Corp", "negative", 7, "Urban"],
    ["Overflowing trash bins at the main market entrance.", "Sanitation", "medium", "Municipal Corp", "negative", 5, "Urban"],
    
    # Roads & Infrastructure
    ["Small crack appearing on the neighborhood bridge.", "Roads & Infrastructure", "medium", "Public Works Dept", "negative", 5, "Urban"],
    ["Loose gravel on the road is causing bikes to skid.", "Roads & Infrastructure", "medium", "Public Works Dept", "negative", 6, "Urban"],
    ["Street sign fallen down near the park.", "Roads & Infrastructure", "low", "Public Works Dept", "neutral", 2, "Urban"],
    ["Potholes filled with water during rain, impossible to see.", "Roads & Infrastructure", "high", "Public Works Dept", "negative", 8, "Urban"],
    
    # Electricity
    ["Minor spark in the electric pole outside house.", "Electricity", "medium", "Electricity Dept", "negative", 6, "Urban"],
    ["Street light blinking constantly, very annoying.", "Electricity", "low", "Electricity Dept", "negative", 3, "Urban"],
    ["Application for new meter pending for 3 weeks.", "Electricity", "low", "Electricity Dept", "neutral", 2, "Urban"],
    
    # Water Supply
    ["Water supply timing has changed without notice.", "Water Supply", "low", "Water Board", "negative", 3, "Urban"],
    ["Persistent low water pressure in the mornings.", "Water Supply", "medium", "Water Board", "negative", 5, "Urban"],
    ["Water meter is faulty and shows high reading.", "Water Supply", "low", "Water Board", "negative", 3, "Urban"],
    
    # Education
    ["School compound wall is broken, anyone can enter.", "Education", "medium", "Education Dept", "negative", 5, "Rural"],
    ["No electricity in classrooms for 3 days.", "Education", "medium", "Education Dept", "negative", 6, "Rural"],
    ["Shortage of drinking water in the primary school.", "Education", "high", "Education Dept", "negative", 7, "Rural"],
    
    # Healthcare
    ["Long queues and only one counter open at PHC.", "Healthcare", "medium", "Health Dept", "negative", 4, "Rural"],
    ["Hospital floors are very dirty and unhygienic.", "Healthcare", "medium", "Health Dept", "negative", 5, "Urban"],
    ["Medical staff arriving late for duty.", "Healthcare", "medium", "Health Dept", "negative", 5, "Rural"],
    
    # Law & Order
    ["Street gambling happening near the temple.", "Law & Order", "medium", "Police Dept", "negative", 5, "Urban"],
    ["Illegal double parking on the main road causing jams.", "Law & Order", "low", "Police Dept", "negative", 4, "Urban"],
    ["Noise from late night parties in the residential area.", "Law & Order", "low", "Police Dept", "negative", 4, "Urban"],
    
    # Public Transport
    ["Metro escalator not working for a month.", "Public Transport", "low", "Transport Authority", "negative", 3, "Urban"],
    ["Bus stop bench is missing.", "Public Transport", "low", "Transport Authority", "neutral", 2, "Urban"],
    ["Overloading of students in private school vans.", "Public Transport", "high", "Transport Authority", "negative", 8, "Urban"],
    # Explicit "Garbage + Disease" cases for high-but-not-critical teaching
    ["Garbage dump in my area is spreading disease and affecting daily life.", "Sanitation", "high", "Municipal Corp", "negative", 8, "Urban"],
    ["Waste collection is so bad that people are falling sick in our locality.", "Sanitation", "high", "Municipal Corp", "negative", 7, "Urban"],
    ["Stagnant garbage piles are the reason for many infections here.", "Sanitation", "high", "Municipal Corp", "negative", 7, "Urban"],
    ["The foul smell from the dump is unbearable and causing health issues.", "Sanitation", "medium", "Municipal Corp", "negative", 6, "Urban"],
]

new_df = pd.DataFrame(new_data, columns=df.columns)
final_df = pd.concat([df, new_df], ignore_index=True)

# Save updated dataset
final_df.to_csv(DATA_PATH, index=False)
print(f"Dataset updated. New size: {len(final_df)}")
