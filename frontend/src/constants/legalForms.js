// ["country_code","wikidata_id", "name"]
export const legalForms = 
[
    ['US', 'Q149789', 'limited liability company']
    ['US', 'Q240625', '501(c) organization']
    ['US', 'Q7451779', 'separate legal entity']
    ['US', 'Q16972978', 'Nevada corporation']
    ['US', 'Q25048281', 'social purpose corporation']
    ['US', 'Q57655560', 'U.S. corporation']
    ['US', 'Q88537331', 'Delaware corporation']
    ['US', 'Q98927546', 'Washington corporation']
    ['US', 'Q112149813', 'California corporation']

    ['DE', 'Q29270', 'AG & Co. KGaA']
    ['DE', 'Q42206', 'Aktiengesellschaft']
    ['DE', 'Q44486', 'Altrechtlicher Verein']
    ['DE', 'Q46017', 'Gesellschaft mit beschränkter Haftung']
    ['DE', 'Q82011', 'Bergrechtliche Gewerkschaft']
    ['DE', 'Q89710', 'GmbH & Co. KG']
    ['DE', 'Q130304', 'Eigenbetrieb']
    ['DE', 'Q130753', 'eingetragener Kaufmann']
    ['DE', 'Q138517', 'Extrahaushalt']
    ['DE', 'Q144382', 'Kommunalunternehmen']
    ['DE', 'Q150084', 'gemeinnützige Aktiengesellschaft']
    ['DE', 'Q150085', 'gemeinnützige GmbH']
    ['DE', 'Q153288', 'GmbH & Still']
    ['DE', 'Q153288', 'GmbH & Co. KGaA']
    ['DE', 'Q158202', 'Partnerschaftsgesellschaft']
    ['DE', 'Q167177', 'Investmentaktiengesellschaft']
    ['DE', 'Q174640', 'Kleine Aktiengesellschaft']
    ['DE', 'Q178002', 'Kommanditgesellschaft']
    ['DE', 'Q182548', 'Limited & Co. KG']
    ['DE', 'Q205437', 'Partenreederei']
    ['DE', 'Q213754', 'Regiebetrieb']
    ['DE', 'Q234885', 'Stiftung & Co. KG']
    ['DE', 'Q234886', 'Stiftung & Co. KGaA']
    ['DE', 'Q234899', 'Stiftung GmbH & Co. KG']
    ['DE', 'Q249852', 'Unternehmergesellschaft (haftungsbeschränkt)']
    ['DE', 'Q249853', 'Unternehmergesellschaft (haftungsbeschränkt) & Co. KG']
    ['DE', 'Q251518', 'Vereinsrecht']
    ['DE', 'Q253198', 'Volkseigener Betrieb']
    ['DE', 'Q534974', 'eingetragene Genossenschaft']
    ['DE', 'Q929923', 'eingetragener Verein']
    ['DE', 'Q1573468', 'Körperschaft des öffentlichen Rechts in Deutschland']
    ['DE', 'Q1583959', 'Partnerschaftsgesellschaft mit beschränkter Berufshaftung']
    ['DE', 'Q1863122', 'Stiftung']
    ['DE', 'Q1927898', 'Einzelunternehmen']
    ['DE', 'Q1934099', 'Offene Handelsgesellschaft']
    ['DE', 'Q1962886', 'rechtsfähige Stiftung']
    ['DE', 'Q1982328', 'Kommanditgesellschaft auf Aktien']
    ['DE', 'Q2005066', 'Stiftung des öffentlichen Rechts']
    ['DE', 'Q2065838', 'SE & Co. KG']
    ['DE', 'Q2065838', 'SE & Co. KGaA']
    ['DE', 'Q2065990', 'AG & Co. KG']
    ['DE', 'Q2066584', 'GmbH & Co. OHG']
    ['DE', 'Q2705869', 'kirchliche Stiftung']
    ['DE', 'Q3313415', 'Gesellschaft bürgerlichen Rechts']
    ['DE', 'Q5385811', 'Deutsche Kolonialgesellschaft']
    ['DE', 'Q5624213', 'rechtsfähige Stiftung bürgerlichen Rechts']
    ['DE', 'Q5628467', 'wirtschaftlicher Verein']
    ['DE', 'Q5659764', 'Bundesstiftung']
    ['DE', 'Q6720711', 'Anstalt des öffentlichen Rechts']
    ['DE', 'Q9427951', 'Genossenschaft']
    ['DE', 'Q9870236', 'B.V. & Co. KG']
    ['DE', 'Q10581608', 'rechtsfähige kirchliche Stiftung privaten Rechts']
    ['DE', 'Q10581609', 'kirchliche Stiftung öffentlichen Rechts']
    ['DE', 'Q11078136', 'gemeinnütziger Verein']
    ['DE', 'Q11108565', 'Versicherungsverein auf Gegenseitigkeit']
    ['DE', 'Q11108568', 'Nicht eingetragener Verein']
    ['DE', 'Q11108571', 'Landesinnungsverband']
    ['DE', 'Q11108573', 'REIT-Aktiengesellschaft']
    ['DE', 'Q11108577', 'Europäische wirtschaftliche Interessenvereinigung']
    ['DE', 'Q11108579', 'Europäische Aktiengesellschaft']
    ['DE', 'Q11108581', 'Europäische Genossenschaft']


    ['all', 'Q5', 'human']
    ['all', 'Q6501447', 'local government']
    ['all', 'Q1802419', 'state government']
    ['all', 'Q10926884', 'national government']

]

/* 
type of business entity in the USA (Q57653825) //Q1269299
P31 instance of 
wikidata query:

SELECT ?item ?itemLabel 
WHERE 
{
  ?item wdt:P31 wd:Q57653825.
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
}

*/