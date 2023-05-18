import fs from 'fs'

const {suffixes} = JSON.parse(fs.readFileSync(__dirname + '/suffixes.json', 'utf8'));

export const validateDomainFormat = (domain) => suffixes.find(suffix => domain.endsWith('.'+suffix))