/*
HOST=localhost PORT=7766 ts-node backend/scripts/generateSingleStatement.ts
*/
import {
  parseStatement,
} from "../statementFormats";

import { sha256Node as sha256 } from "stated-protocol-parser";

import { submitStatement } from "./shared";

const apiKey = process.env.API_KEY || "XXX";
const host = process.env.HOST || "localhost";

(async () => {
    const statements = [
`Publishing domain: a.com
Author: Company A Inc.
Authorized signing representative: John Doe (CEO)
Time: Wed, 06 Sep 2023 10:08:08 GMT
Statement content: 
	Type: Sign PDF
	Description: We hereby digitally sign the referenced PDF file.
	PDF file hash: LVA-iM5OERcktqK09KhOwcOCIY6LF-Nk3L7WvJdut40
`
,
`Publishing domain: a.com
Author: Company A Inc.
Time: Wed, 06 Sep 2023 10:08:08 GMT
Statement content: 
	Type: Organisation verification
	Description: We verified the following information about an organisation.
	Name: Company B Inc.
	Country: United States of America (the)
	Legal entity: corporation
	Owner of the domain: b.com
	Province or state: Illinois
	Business register number: 41-9929150
	City: Chicago
	Employee count: 10,000-100,000
	Reliability policy: https://stated.a.com/statements/rXoVsm2CdF5Ri-SEAr33RNkG3DBuehvFoDBQ_pO9CXE
	Confidence: 0.9
`,
`Publishing domain: y.com
Author: City of Y
Authorized signing representative: Jane Doe (Mayor)
Time: Wed, 06 Sep 2023 10:08:08 GMT
Statement content: 
	Type: Vote
	Poll id: gaZr2sir_dOqzaJ61Ic18AyW33zE3So0xzX3L7KBJsM
	Poll: Should a bridge be built over river X?
	Option: Yes
`
];
for (const statement of statements) {
  parseStatement({statement});

    const data = {
      statement,
      hash: sha256(statement),
      api_key: apiKey,
    };
    submitStatement({data, host, useHttps: true, callback: ((res) => console.log(res))});
  }
})();

