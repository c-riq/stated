import fs from 'fs'

import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const {suffixes} = JSON.parse(fs.readFileSync(__dirname + '/suffixes.json', 'utf8'));

export const validateDomainFormat = (domain) => suffixes.find(suffix => domain.endsWith('.'+suffix))
