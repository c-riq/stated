// ["country_code","wikidata_id", "name"],
export const legalForms = 
{
  'legalForms':
  [ 
      ['all', 'Q5', 'person'],
      ['all', 'Q6501447', 'local government'],
      ['all', 'Q1802419', 'state government'],
      ['all', 'Q10926884', 'national government'],
      ['all', '', 'limited liability corporation'],
  ]
}

/* 
type of business entity in the USA (Q57653825) //Q1269299
// Q56427813 france
P31 instance of 
wikidata query:

SELECT ?item ?itemLabel 
WHERE 
{
  ?item wdt:P31 wd:Q57653825.
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
}

*/