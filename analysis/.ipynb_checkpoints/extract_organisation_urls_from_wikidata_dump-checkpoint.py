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
result_path = '/Users/c/Desktop/project/jupyter_20191230/data/wikidata/extract_org_urls'

i = 0
j = 0
item_id = None

rows = []


def parseLine(filename):
    with gzip.open(filename, 'rt') as f:
        f.read(2)
        for line in f:
            try:
                yield json.loads(line.rstrip(',\n'))
            except json.decoder.JSONDecodeError:
                continue

for record in parseLine(wikidata_dump_path):
    j = j + 1
    if (j % (100*1000)) == 0:
        print(j)
    # instance of https://www.wikidata.org/wiki/Property:P31
    # official website https://www.wikidata.org/wiki/Property:P856
    if pydash.has(record, 'claims.P31') and pydash.has(record, 'claims.P856') and pydash.get(record, 'labels.en.value'):
        try:
            for p31 in pydash.get(record, 'claims.P31'):
                # business https://www.wikidata.org/wiki/Q4830453
                # public research university
                # university
                if (pydash.get(p31, 'mainsnak.datavalue.value.id') == "Q4830453") or (pydash.get(p31, 'mainsnak.datavalue.value.id') == "Q62078547") or (pydash.get(p31, 'mainsnak.datavalue.value.id') == "Q3918"):
                    english_label = pydash.get(record, 'labels.en.value')
                    official_website = pydash.get(record, 'claims.P856[0].mainsnak.datavalue.value')
                    item_id = pydash.get(record, 'id')
                    print(item_id)

                    lat = ''
                    lon = ''
                    employees = ''
                    twitter_name = ''
                    twitter_id = ''
                    crunchbase_id = ''
                    facebook_id = ''
                    linkedin_id = ''
                    country_id = ''
                    city_id = ''
                    legal_form_id = ''
                    grid_id = ''

                    if pydash.has(record, 'claims.P159'): # headquarter city
                        city_id = pydash.get(record, 'claims.P159[0].mainsnak.datavalue.value.id')
                        for P159 in pydash.get(record, 'claims.P159'):
                            if pydash.has(P159, 'qualifiers.P625'):
                                lat = pydash.get(P159, 'qualifiers.P625[0].datavalue.value.latitude')
                                lon = pydash.get(P159, 'qualifiers.P625[0].datavalue.value.longitude')

                    latest_record_time = np.datetime64('+1000-01-01T00:00:00Z')
                    if pydash.has(record, 'claims.P1128'): # Employees with timestamp qualifier
                        for P1128 in pydash.get(record, 'claims.P1128'): 
                            if pydash.has(P1128, 'qualifiers.P585'):
                                P585 = pydash.get(P1128, 'qualifiers.P585[0].datavalue.value.time')
                                if P585 is None: # unknown time
                                    employees = pydash.get(P1128, 'mainsnak.datavalue.value.amount')
                                    employees = employees.replace('+','')
                                    employees = employees.replace('.','')
                                    employees = employees.replace(',','')
                                    employees = int(employees)
                                    continue
                                P585 = P585.replace('-00', '-01')
                                t = np.datetime64(P585)
                                if t > latest_record_time:
                                    latest_record_time = t
                                    employees = pydash.get(P1128, 'mainsnak.datavalue.value.amount')
                                    employees = employees.replace('+','')
                                    employees = employees.replace('.','')
                                    employees = employees.replace(',','')
                                    employees = int(employees)
                            else:
                                if pydash.get(P1128, 'mainsnak.datavalue.value.amount') is not None: # unknown time
                                    employees = pydash.get(P1128, 'mainsnak.datavalue.value.amount')
                                    employees = employees.replace('+','')
                                    employees = employees.replace('.','')
                                    employees = employees.replace(',','')
                                    employees = int(employees)
                    
                    if pydash.has(record, 'claims.P2002'): # twitter id
                        twitter_name = pydash.get(record, 'claims.P2002[0].mainsnak.datavalue.value')
                        if pydash.has(record, 'claims.P2002[0].qualifiers.P6552'):
                            # convert to string to keep big integers precise
                            twitter_id = str(pydash.get(record, 'claims.P2002[0].qualifiers.P6552[0].datavalue.value'))
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
                        'employees': employees, 'twitter_id': twitter_id, 'twitter_name': twitter_name, 'crunchbase_id': crunchbase_id, 'facebook_id': facebook_id, 
                        'linkedin_id': linkedin_id, 'linkedin_id': linkedin_id, 'grid_id': grid_id}
                    rows.append(row)
                    i += 1
                    if (i % 5000 == 0):
                        df = pd.DataFrame(rows)
                        pd.DataFrame.to_csv(df, path_or_buf=result_path + '/i_'+i+'.csv')
                        print('i = '+str(i)+' item '+record['id']+'  Done!')
                        print('CSV exported')
                        rows = []
                    else:
                        continue
                    break # only add once if its both university and business
        except:
            print('error', item_id)
df = pd.DataFrame(rows)
pd.DataFrame.to_csv(df, path_or_buf=result_path + '/i_'+i+'.csv')
print('finished')
