import fs from 'fs'

const {suffixes} = JSON.parse(fs.readFileSync('./suffixes.json', 'utf8'));

export const validateDomainFormat = (domain) => suffixes.find(suffix => domain.endsWith('.'+suffix))
