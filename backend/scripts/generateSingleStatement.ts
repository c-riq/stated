import {
  parsePDFSigning,
  parseStatement,
} from "../statementFormats";

import { sha256 } from "../hash";

import { submitStatement } from "./shared";

const apiKey = process.env.API_KEY || "XXX";

(async () => {
    const statement = 
`Publishing domain: rixdata.net
Author: Rix Data NL B.V.
Authorized signing representative: Christopher Rieckmann (CEO)
Time: Wed, 06 Sep 2023 10:08:08 GMT
Tags: Pause Giant AI Experiments: An Open Letter, Future of Life Institute
Statement content: 
	Type: Sign PDF
	Description: We hereby digitally sign the referenced PDF file.
	PDF file hash: LVA-iM5OERcktqK09KhOwcOCIY6LF-Nk3L7WvJdut40
`

  const statementObj = parseStatement(statement);
  console.log(statementObj);
  const PDFSigningObj = parsePDFSigning(statementObj.content);
  console.log(PDFSigningObj);

    const data = {
      statement,
      hash: sha256(statement),
      api_key: apiKey,
    };
    submitStatement({data, host: 'stated.rixdata.net', useHttps: true, callback: ((res) => console.log(res))});
})();

