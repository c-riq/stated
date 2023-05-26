// @ts-nocheck

import { getOVInfo } from './ssl'

import fs from 'fs'

const {domains} = JSON.parse(fs.readFileSync(__dirname + '/OVDomains.json', 'utf8'));

export const fetchOVInfoForMostPopularDomains = async () => {
    for (let domain of domains) {
        console.log('get OV info for ' + domain)
        getOVInfo({domain})
        await new Promise(resolve => setTimeout(resolve, 1000))
    }
}
