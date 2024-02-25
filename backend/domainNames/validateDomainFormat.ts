import fs from 'fs'

const {suffixes} = JSON.parse(fs.readFileSync(__dirname + '/suffixes.json', 'utf8'));

const validateCharacters = (s: string) => /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z]{2,})+$/.test(s)
const validateSuffix = (s: string) => !!suffixes.find((suffix: string) => s.endsWith('.'+suffix))

export const validateDomainFormat = (domain: string) => validateCharacters(domain) && validateSuffix(domain)
