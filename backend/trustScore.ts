// used for qualifying votes and ratings
// other approaches will be needed once the network grows

const updateTrustScores = async () => {
    // get all authors of statements
    // insert into trust_scores

    // trust_iteration (X)
        // trusted entities = verified by X AND 5 start ratings on honest platform use by X
        // for all trusted entities, set trust = (last_updated > 10 min ago) ? 1 * verification_confidence : max(existing trust, 1 * verification_confidence) 
        // return trusted entities

    // trusted_entities_for_iteration = [Self]
    // depth = 0
    // while (trusted_entities_for_iteration.length > 0) {
        // if depth > 5 { break }
        // trusted_entities_for_iteration = trust_iteration(trusted_entities_for_iteration)
        // depth++
    // }

    return
}

const setupSchedule = (retryIntervalSeconds: number) => {
    setInterval(async () => {
        try {
            await updateTrustScores()
        } catch (error) {
            console.log(error)
            console.trace()
        }
    }, retryIntervalSeconds * 1000)   
}

export default {
    setupSchedule
}
