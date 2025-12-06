# Script to extract cities from Wikidata dump using SPARQL query for subclasses
# This is an optimized version that uses a SPARQL query to get all city subclasses

import gzip
import json
import pandas as pd
import pydash
import os
import requests
from typing import Set, List, Dict, Any

# Path to the Wikidata dump file
wikidata_dump_path = '../data/wikidata/wikidata-20220103-all.json.gz'
# Output directory and file
output_dir = 'data/cities'
output_file = os.path.join(output_dir, 'extracted_cities.json')

# Ensure output directory exists
os.makedirs(output_dir, exist_ok=True)

def get_city_subclasses() -> Set[str]:
    """
    Get all subclasses of city (Q515) using SPARQL query.
    Returns a set of Wikidata IDs for city subclasses.
    If the SPARQL query fails, falls back to a predefined list of city types.
    """
    print("Fetching city subclasses from Wikidata SPARQL endpoint...")
    
    # Fallback list of city types in case the SPARQL query fails
    fallback_city_types = {
        "Q515",       # city
        "Q1549591",   # big city
        "Q60458065",  # city in British Columbia
        "Q1093829",   # city with special status
        "Q1637706",   # provincial city
        "Q1093829",   # city with special status
        "Q174844",    # megacity
        "Q1637706",   # provincial city
        "Q1851856",   # city of regional significance
        "Q1907114",   # district-level city
        "Q2264924",   # port city
        "Q2264924",   # port city
        "Q3957",      # town
        "Q5119",      # capital
        "Q5327684",   # county-level city
        "Q608425",    # charter city
        "Q6784672",   # market town
        "Q702492",    # urban commune
        "Q7930989",   # city
    }
    
    try:
        # Read the fixed SPARQL query from file
        with open('analysis/get_city_subclasses_fixed.sparql', 'r') as f:
            query = f.read()
        
        # Execute the SPARQL query
        url = 'https://query.wikidata.org/sparql'
        headers = {
            'User-Agent': 'CityExtractor/1.0 (https://github.com/yourusername/city-extractor)',
            'Accept': 'application/json'
        }
        params = {
            'query': query,
            'format': 'json'
        }
        
        response = requests.get(url, headers=headers, params=params)
        response.raise_for_status()  # Raise an exception for HTTP errors
        
        data = response.json()
        
        # Extract city subclass IDs from the response
        city_subclasses = set()
        for binding in data['results']['bindings']:
            city_id = binding['citySubclass']['value'].split('/')[-1]
            city_label = binding.get('citySubclassLabel', {}).get('value', 'No label')
            city_subclasses.add(city_id)
            print(f"Found city subclass: {city_id} - {city_label}")
        
        print(f"Found {len(city_subclasses)} city subclasses via SPARQL")
        
        # If we didn't get any results, fall back to the predefined list
        if not city_subclasses:
            print("No city subclasses found via SPARQL, using fallback list")
            return fallback_city_types
            
        return city_subclasses
        
    except Exception as e:
        print(f"Error fetching city subclasses via SPARQL: {e}")
        print("Using fallback list of city types")
        return fallback_city_types

def parse_line(filename: str) -> Dict[str, Any]:
    """Parse each line of the gzipped JSON file."""
    with gzip.open(filename, 'rt') as f:
        f.read(2)  # skip first two bytes: "{\n"
        for line in f:
            try:
                yield json.loads(line.rstrip(',\n'))
            except json.decoder.JSONDecodeError:
                continue

def extract_cities(city_types: Set[str]) -> List[Dict[str, str]]:
    """Extract cities based on the provided city types."""
    print("Extracting cities from Wikidata dump...")
    
    # Initialize counters and data structures
    i = 0
    cities = []
    
    # Process each record in the Wikidata dump
    for record in parse_line(wikidata_dump_path):
        # Check if the record has instance of (P31) and has an English label
        if pydash.has(record, 'claims.P31') and pydash.get(record, 'labels.en.value'):
            for p31 in pydash.get(record, 'claims.P31'):
                # Check if it's one of our target city types
                city_type_id = pydash.get(p31, 'mainsnak.datavalue.value.id')
                if city_type_id in city_types:
                    # Extract required information
                    city_wikidata_id = pydash.get(record, 'id')
                    city_label_english = pydash.get(record, 'labels.en.value')
                    country_wikidata_id = ''
                    
                    # Extract country ID if available (P17 property)
                    if pydash.has(record, 'claims.P17'):
                        country_wikidata_id = pydash.get(record, 'claims.P17[0].mainsnak.datavalue.value.id')
                    
                    # Add to cities list
                    city_data = {
                        "cityWikidataId": city_wikidata_id,
                        "cityLabelEnglish": city_label_english,
                        "countryWikidataId": country_wikidata_id
                    }
                    cities.append(city_data)
                    
                    # Print progress
                    i += 1
                    if i % 1000 == 0:
                        print(f"Processed {i} cities...")
                    
                    # Save intermediate results every 5000 cities
                    if i % 5000 == 0:
                        save_results(cities, f"{output_dir}/cities_intermediate_{i}.json")
                    
                    break  # Only add once if it's a city
    
    return cities

def save_results(cities: List[Dict[str, str]], filename: str) -> None:
    """Save the extracted cities to a JSON file."""
    result = {
        "header": ["cityWikidataId", "cityLabelEnglish", "countryWikidataId"],
        "cities": [[city["cityWikidataId"], city["cityLabelEnglish"], city["countryWikidataId"]] for city in cities]
    }
    
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(result, f, ensure_ascii=False, indent=2)

def main() -> None:
    """Main function to extract cities from Wikidata dump."""
    # First, get all city subclasses using SPARQL
    city_types = get_city_subclasses()
    
    # Then, extract all cities based on those subclasses
    cities = extract_cities(city_types)
    
    # Save final results
    save_results(cities, output_file)
    
    # Also create a CSV version
    df = pd.DataFrame(cities)
    csv_output = output_file.replace('.json', '.csv')
    df.to_csv(csv_output, index=False)
    
    print(f"Extraction complete! Found {len(cities)} cities.")
    print(f"Results saved to {output_file} and {csv_output}")

if __name__ == "__main__":
    main()
