
/*
HOST=localhost DOMAIN=localhost PROTOCOL=http PORT=7766 ts-node backend/scripts/generateRorIdObservations.ts
HOST=stated.rixdata.net DOMAIN=rixdata.net PROTOCOL=https PORT=443 ts-node backend/scripts/generateRorIdObservations.ts
*/

import fs from "fs";

import https from "https";
import http from "http";

import {
  buildObservation,
  buildStatement} from "../statementFormats";

import { sha256Node as sha256 } from "stated-protocol-parser";

const host = process.env.HOST || "stated.rixdata.net";
const useHttps = (process.env.PROTOCOL || "https") === "https";
const port = process.env.PORT || 443;
const apiKey = process.env.API_KEY || "XXX";

const submitStatement = (data, callback) => {
  console.log(data);
  try {
    var post_options = {
      host: host,
      port: port,
      path: "/api/statements",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    };
    var post_req = (useHttps ? https : http).request(post_options, (res) => {
      let rawData = "";
      res.setEncoding("utf8");
      res.on("data", function (chunk) {
        //console.log('Response: ' + chunk);
        rawData += chunk;
      });
      res.on("end", function () {
        callback && callback(rawData);
      });
      res.on("error", function (e) {
        console.log("Error: " + e.message);
      });
    });
    post_req.on("error", function (e) {
      console.log("Error: " + e.message);
    });

    post_req.write(JSON.stringify(data));
    post_req.end();
  } catch (e) {
    console.log(e);
  }
};

var proxyObservations = fs
  .readFileSync(
    __dirname + "/../../analysis/verifications/universities_list.csv",
    "utf8"
  )
  .toString();

const array = [];

let rows = proxyObservations.split("\n");


const header = rows.splice(0, 1);
const colNames = header[0].split(",");

for (const row of rows) {
  let colCount = 0;
  const parsedRow:any = {};
  row.match(/\s*(\"[^"]*\"|[^,]*)\s*(,|$)/g).map((i) => {
    i = i.replace(/"/g, "").replace(/,$/g, "");
    parsedRow[colNames[colCount]] = i;
    colCount = colCount + 1;
  });
  array.push(parsedRow);
}

(async () => {
for (const i of array) {
    const {
      name,
      english_name,
      confidence,
      ror_id,
      statement_hash
    } = i;
    //console.log(i);
    if (!name || !statement_hash) {
      continue;
    }
    const observationContent = buildObservation({
      subject: name,
      property: 'ROR ID',
      value: ror_id,
      subjectReference: statement_hash, 
      confidence,
      reliabilityPolicy: "https://stated.rixdata.net/statements/MjcqvZJs_CaHw-7Eh_zbUSPFxCLqVY1EeXn9yGm_ads",
    });
    const statement = buildStatement({
        domain: "rixdata.net", // rixdata.net
        author: "Rix Data NL B.V.", // Rix Data NL B.V.
        time: new Date(),
        content: observationContent
    });
    const data = {
        statement,
        hash: sha256(statement),
        api_key: apiKey
    }
    submitStatement(data, (res) => {
        console.log(res);
    });
    await new Promise((resolve) => setTimeout(resolve, 1000));
}

})();
