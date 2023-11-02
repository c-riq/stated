export const legalForms = // Wikidata ID: Q10541491
{
    // person: 'person', //'Q5'
    local_government: 'local government', //'Q6501447'
    state_government: 'state government', //'Q1802419'
    foreign_affairs_ministry: 'foreign affairs ministry', //'Q20901295'
    corporation: 'corporation', //'Q167037'
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