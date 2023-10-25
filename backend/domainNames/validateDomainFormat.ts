import fs from 'fs'

const {suffixes} = JSON.parse(fs.readFileSync(__dirname + '/suffixes.json', 'utf8'));

const validateCharacters = (s: string) => /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z]{2,})+$/.test(s)
const validateSuffix = (s: string) => !!suffixes.find(suffix => s.endsWith('.'+suffix))

export const validateDomainFormat = (domain) => validateCharacters(domain) && validateSuffix(domain)
