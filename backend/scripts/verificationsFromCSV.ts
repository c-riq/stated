import fs from "fs";

import http from "http";

import {
  buildOrganisationVerificationContent,
  buildStatement} from "../statementFormats";

import { sha256 } from "../hash";

import { legalForms } from "../constants/legalForms";

const submitStatement = (data, callback) => {
  console.log(data);
  try {
    var post_options = {
      host: "localhost",
      port: 7766,
      path: "/api/submit_statement",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    };
    var post_req = http.request(post_options, (res) => {
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
    __dirname + "/../../analysis/verifications/dax_index_companies.csv",
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

for (const i of array) {
    // company,instrument,trading_symbol,isin,index,date,website,ssl_ov_verification,ov_of_subsidiary,country,province,city,serial_number,vat_id
    const {
        company,
        website,
        country,
        province,
        city,
        serial_number,
        //isin,
        //vat_id,
    } = i;
    if (!company || !website || !country || !province || !city || !serial_number) {
        continue;
    }
    // @ts-ignore
    const verification = buildOrganisationVerificationContent({
        verifyName: company,
        verifyDomain: website,
        country,
        province,
        city,
        serialNumber: serial_number,
        legalEntity: legalForms.legalForms.find((i) => i[2] === "limited liability corporation")[2],
    });
    const statement = buildStatement({
        domain: "localhost",
        author: "localhost",
        time: new Date(),
        content: verification,
    })
    const data = {
        statement,
        hash_b64: sha256(statement),
        api_key: "XXX"
    }
    submitStatement(data, (res) => {
        console.log(res);
    });
}

console.log(array.filter((i) => i.website));
