# based on wikidata dump from Oct 2022, compressed size ~100GB

import gzip

import json
import pandas as pd
import pydash

import numpy as np

# from urllib.parse import urlparse
# domain = urlparse('http://www.example.co.uk/foo/bar').netloc
# domain = domain.replace('www.', '')

wikidata_dump_path = '/Users/c/Desktop/project/jupyter_20191230/data/wikidata/wikidata-20220103-all.json.gz'
result_path = '/Users/c/Desktop/project/jupyter_20191230/data/wikidata/extract_city_urls'

i = 0

rows = []


def parseLine(filename):
    with gzip.open(filename, 'rt') as f:
        f.read(2) # skip first two bytes: "{\n"
        for line in f:
            try:
                yield json.loads(line.rstrip(',\n'))
            except json.decoder.JSONDecodeError:
                continue
for record in parseLine(wikidata_dump_path):
    # instance of https://www.wikidata.org/wiki/Property:P31
    # official website https://www.wikidata.org/wiki/Property:P856
    if pydash.has(record, 'claims.P31') and pydash.has(record, 'claims.P856') and pydash.get(record, 'labels.en.value'):
        for p31 in pydash.get(record, 'claims.P31'):
            # city
            if (pydash.get(p31, 'mainsnak.datavalue.value.id') == "Q515"):
                english_label = pydash.get(record, 'labels.en.value')
                official_website = pydash.get(record, 'claims.P856[0].mainsnak.datavalue.value')
                item_id = pydash.get(record, 'id')
                print(item_id)

                lat = ''
                lon = ''
                population = ''
                twitter_name = ''
                twitter_id = ''
                facebook_id = ''
                linkedin_id = ''
                country_id = ''

                if pydash.has(record, 'claims.P625'): # coordinates
                    lat = pydash.get(record, 'claims.P625[0].mainsnak.datavalue.value.latitude')
                    lon = pydash.get(record, 'claims.P625[0].mainsnak.datavalue.value.latitude')

                latest_record_time = np.datetime64('+1000-01-01T00:00:00Z')
                if pydash.has(record, 'claims.P1082'): # Population with timestamp qualifier
                    for P1082 in pydash.get(record, 'claims.P1082'): 
                        if pydash.has(P1082, 'qualifiers.P585'):
                            P585 = pydash.get(P1082, 'qualifiers.P585[0].datavalue.value.time')
                            if P585 is None: # unknown time
                                population = pydash.get(P1082, 'mainsnak.datavalue.value.amount')
                                population = population.replace('+','')
                                population = int(population)
                                continue
                            P585 = P585.replace('-00', '-01')
                            t = np.datetime64(P585)
                            if t > latest_record_time:
                                latest_record_time = t
                                population = pydash.get(P1082, 'mainsnak.datavalue.value.amount')
                                population = employees.replace('+','')
                                population = int(population)
                        else: # unknown time
                            population = pydash.get(P1082, 'mainsnak.datavalue.value.amount')
                            population = population.replace('+','')
                            population = int(population)
                
                if pydash.has(record, 'claims.P2002'): # twitter id
                    twitter_name = pydash.get(record, 'claims.P2002[0].mainsnak.datavalue.value')
                    if pydash.has(record, 'claims.P2002[0].qualifiers.P6552'):
                        twitter_id = pydash.get(record, 'claims.P2002[0].qualifiers.P6552[0].datavalue.value')
                if pydash.has(record, 'claims.P2088'): # crunchbase id
                    crunchbase_id = pydash.get(record, 'claims.P2088[0].mainsnak.datavalue.value')
                if pydash.has(record, 'claims.P2013'): # facebook id
                    facebook_id = pydash.get(record, 'claims.P2013[0].mainsnak.datavalue.value')
                if pydash.has(record, 'claims.P4264'): # linkedin id
                    linkedin_id = pydash.get(record, 'claims.P4264[0].mainsnak.datavalue.value')
                
                if pydash.has(record, 'claims.P17'): # linkedin id
                    country_id = pydash.get(record, 'claims.P17[0].mainsnak.datavalue.value.id')
                if pydash.has(record, 'claims.P1454'): # legal form id
                    country_id = pydash.get(record, 'claims.P1454[0].mainsnak.datavalue.value.id')
                if pydash.has(record, 'claims.P2427'): # legal form id
                    grid_id = pydash.get(record, 'claims.P2427[0].mainsnak.datavalue.value')

                type_id = pydash.get(p31, 'mainsnak.datavalue.value.id')

                row = {'id': item_id, 'type_id': type_id, 'english_label': english_label, 'official_website': official_website, 'lat': lat, 'lon': lon, 'country_id': country_id, 'city_id': city_id, 
                    'population': population, 'twitter_id': twitter_id, 'twitter_name': twitter_name, 'crunchbase_id': crunchbase_id, 'facebook_id': facebook_id, 
                    'linkedin_id': linkedin_id, 'linkedin_id': linkedin_id, 'grid_id': grid_id}
                print('i = '+str(i), row)
                rows.append(row)
                i += 1
                if (i % 5000 == 0):
                    df = pd.DataFrame(rows)
                    pd.DataFrame.to_csv(df, path_or_buf=result_path + '/till_'+record['id']+'_item.csv')
                    print('i = '+str(i)+' item '+record['id']+'  Done!')
                    print('CSV exported')
                    rows = []
                else:
                    continue
                break # only add once if its both university and business
pd.DataFrame.to_csv(df_record_all, path_or_buf=result_path +'/till_'+record['id']+'_item.csv')
print('All items finished, final CSV exported!')
