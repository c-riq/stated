// experimental 

import fs from "fs";

import https from "https";

import {
  buildObservation,
  buildQuotationContent,
  buildStatement} from "../statementFormats";

import { sha256 } from "../hash";

const host = process.env.HOST || "stated.rixdata.net";
const port = process.env.PORT || 443;
const apiKey = process.env.API_KEY || "XXX";

const submitStatement = (data, callback) => {
  console.log(data);
  try {
    var post_options = {
      host: host,
      port: port,
      path: "/api/statement",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    };
    var post_req = https.request(post_options, (res) => {
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
    __dirname + "/../../documents/proxy_observations.csv",
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

for (const i of array) {
    const {
      subject,
      observation,
      subject_identity_reference,
      observation_reference,
      original_author,
      confidence,
      approach,
      tags
    } = i;
    //console.log(i);
    if (!subject || !observation) {
      continue;
    }
    const observationContent = buildObservation({
      subject,
      observation,
      subjectReference: subject_identity_reference,
      observationReference: observation_reference,
      approach,      
      confidence
    });
    //console.log(observationContent);
    const quotation = buildQuotationContent({
      originalAuthor: original_author,
      confidence: '0.8',
      source: 'https://www.yalerussianbusinessretreat.com/',
      originalTime: '2022-2023',
      authorVerification: 'https://stated.rixdata.net/statements/u8mL8-6sRUkhBSMR0JPTorMatYUg8WOQwHw3AYaBbbg',
      paraphrasedStatement: observationContent.replace(/\n\t([^\t])/g, '\n\t\t$1')
    });
     // console.log(quotation);
    const statement = buildStatement({
      domain: "rixdata.net", // rixdata.net
      author: "Rix Data NL B.V.", // Rix Data NL B.V.
        time: new Date(),
        content: quotation.replace(/\n$/, ''),
        ...(tags ? {tags: tags.split(",")}: {})
    });
    console.log(statement);
    const data = {
        statement,
        hash_b64: sha256(statement),
        api_key: apiKey
    }
    submitStatement(data, (res) => {
        console.log(res);
    });
}

console.log(array);
