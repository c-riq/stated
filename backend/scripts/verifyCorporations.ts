import fs from "fs";

import https from "https";
import http from "http";

import {
  buildOrganisationVerificationContent,
  buildStatement, minEmployeeCountToRange} from "../statementFormats";

import { sha256 } from "../hash";

import { legalForms } from "../constants/legalForms";
/*
HOST=localhost PORT=7766 FILE_NAME=organisations_list.csv ts-node backend/scripts/verifyCorporations.ts

API_KEY=XXX FILE_NAME=company_list.csv ts-node backend/scripts/verifyCorporations.ts
company_list_ukraine.csv
dax_index_companies.csv
organisations_list.csv
*/
const domain = process.env.DOMAIN || "rixdata.net";
const useHttps = (process.env.PROTOCOL || "https") === "https";
const author = process.env.AUTHOR || "Rix Data NL B.V."
const port = process.env.PORT || 443;
const apiKey = process.env.API_KEY || "XXX";
const fileName = process.env.FILE_NAME || "company_list.csv";

const submitStatement = (data, callback) => {
  console.log(data);
  try {
    var post_options = {
      host: domain === "localhost" ? "localhost" : "stated." + domain,
      port: port,
      path: "/api/submit_statement",
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

var daxCompanies = fs
  .readFileSync(
     __dirname + "/../../analysis/verifications/" + fileName,
    "utf8"
  )
  .toString();

const array = [];

let rows = daxCompanies.split("\n");


const header = rows.splice(0, 1);
const colNames = header[0].split(",");

for (const row of rows) {
  let colCount = 0;
  const parsedRow = {};
  row.match(/\s*(\"[^"]*\"|[^,]*)\s*(,|$)/g).map((i) => {
    i = i.replace(/"/g, "").replace(/,$/g, "");
    parsedRow[colNames[colCount]] = i;
    colCount = colCount + 1;
  });
  array.push(parsedRow);
}
console.log(array);
( async () => {
for (const i of array) {
    // company,instrument,trading_symbol,isin,index,date,website,ssl_ov_verification,
    // ov_of_subsidiary,country,province,city,serial_number,vat_id,confidence
    const {
        skip,
        name,
        english_name,
        website_domain,
        country,
        province,
        city,
        serial_number,
        employees_min,
        confidence,
        employer_identification_number
    } = i;
    if (!(name) || !website_domain || !country || !province || !city) {
        continue;
    }
    if (city.match(/\|/g)){
        continue;
    }
    if (skip){
        console.log('skip, ', skip + ': ' + name)
        continue;
    }
    console.log('add')
    // @ts-ignore
    const verification = buildOrganisationVerificationContent({
        name,
        englishName: english_name,
        domain: website_domain,
        country,
        province,
        city,
        serialNumber: serial_number || employer_identification_number,
        legalForm: legalForms.corporation,
        confidence: confidence,
        employeeCount: employees_min && minEmployeeCountToRange(employees_min),
        reliabilityPolicy: "https://stated.rixdata.net/statement/rXoVsm2CdF5Ri-SEAr33RNkG3DBuehvFoDBQ_pO9CXE",
    });
    if(!verification){ console.log("no verification generated"); continue}
    const statement = buildStatement({
        domain,
        author,
        time: new Date(),
        content: verification,
    })
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
console.log(array.filter((i) => i.website));
