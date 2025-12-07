/*
HOST=stated.rixdata.net ts-node backend/scripts/statementVersionMigration/migrateStatements.ts
*/
import * as v2 from "./2";
import * as v1 from "./1";

import { sha256 } from "stated-protocol-parser/node";

import { submitStatement, fetchStatements } from "../shared";

const apiKey = process.env.API_KEY || "XXX";
const host = process.env.HOST || "localhost";

const result = [];
let cnt = 0;

fetchStatements({
  host,
  useHttps: true,
  publishingDomain: "stated.rixdata.net",
  callback: async (res) => {
    console.log(res);
    const statementsObj = JSON.parse(res || "{}");
    for (const { statement, hash_b64 } of statementsObj.statements) {
      if (['rXoVsm2CdF5Ri-SEAr33RNkG3DBuehvFoDBQ_pO9CXE','_70PmCtgGaQJNxIhc0lgW9OpGMUjfk3KNEXA21bhN-M'].includes(hash_b64)) continue;
      if (cnt > 5) {
        //break;
      }
      cnt = cnt + 1;
      try {
        v2.parseStatement(statement);
      } catch (e) {
        console.log(e);
        try {
          let v2Statement = v1.v1toV2(statement, hash_b64);
          v2Statement = v2Statement.replace('https://stated.rixdata.net/statements/rXoVsm2CdF5Ri-SEAr33RNkG3DBuehvFoDBQ_pO9CXE',
            'https://stated.rixdata.net/statements/MjcqvZJs_CaHw-7Eh_zbUSPFxCLqVY1EeXn9yGm_ads')
          const data = {
            statement: v2Statement,
            hash: sha256(v2Statement),
            api_key: apiKey,
          };
          console.log("old: " + statement, "new: " + v2Statement);
          result.push({ old: statement, new: v2Statement });
          await new Promise((resolve) => setTimeout(resolve, 200));
          submitStatement({
            data,
            host,
            useHttps: true,
            callback: (res) => console.log(res),
          });
        } catch (e) {
          console.log(e);
        }
      }
    }
    console.log(result, result.length);
  },
});
