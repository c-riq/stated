
import db from './db.js'

const log = false

const updateBasedOnVerifications = async () => {
    let dbResult = {} 
    try {
        dbResult = await db.getHighConfidenceVerifications()
    } catch (error) {
        console.log(error)
        console.trace()
    }

    let highConfidenceVerifications = dbResult.rows
    let domainMap = {}
    for(let v of highConfidenceVerifications ){
        const {verified_domain, verifier_domain, name, legal_entity_type, country, province, city, verifier_domain_confidence, verifier_domain_name} = v
        if(!domainMap[verified_domain]){
            domainMap[verified_domain] = []
        }
        domainMap[verified_domain].append({verified_domain, verifier_domain, name, legal_entity_type, 
            country, province, city, verifier_domain_confidence, verifier_domain_name})
    }
    const insertJobs = Object.entries(domainMap).forEach(([verified_domain, verifications]) => {
        const dataPointMap = {name:{}, legal_entity_type:{}, country:{}, province:{}, city:{}}
        for(let v of verifications) {
            for(let key of Object.keys(dataPointMap)){
                if(!dataPointMap[key][v[key]]){
                    dataPointMap[key][v[key]] = []
                }
                dataPointMap[key][v[key]].append(v.verifier_domain_confidence)
            }
        }
        return( new Promise(async (resolve, reject) => {
            try {
                dbResult = await db.createOrganisationIDBelief({domain1: verified_domain, domain1_confidence: 0})
            } catch (error) {
                console.log(error)
                console.trace()
            }
        }))
    })
    await Promise.all(insertJobs)
}

const setupSchedule = () => {
    setInterval(async () => {
        console.log('updating identity beliefs')
        try {
            await updateBasedOnVerifications()
        } catch (error) {
            console.log(error)
            console.trace()
        }
    }, 40 * 1000)   
}

export default {
    setupSchedule
}
