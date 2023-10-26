import fs from "fs";

import https from "https";

import {
  buildOrganisationVerificationContent,
  buildStatement} from "../statementFormats";

import { sha256 } from "../hash";

import { legalForms } from "../constants/legalForms";

const host = process.env.HOST || "stated.rixdata.net";
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

var daxCompanies = fs
  .readFileSync(
    __dirname + "/../../analysis/verifications/national_governments.csv",
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
    // country,code,government_website_domain,source_domain,confidence_domain,ssl_ov_subject_org,google_search_term_first_result,
    // foreign_affairs_ministry_domain,source_fa_domain,confidence_fa_domain,Population_2022_million,gdp_2022_billion_usd,source_population_gdp
    const {
        mfa_name,
        country,
        foreign_affairs_ministry_domain,
        confidence_fa_domain
        //isin,
        //vat_id,
    } = i;
    if (Number.parseFloat(confidence_fa_domain) < 0.8 || !country || !mfa_name || !foreign_affairs_ministry_domain) {
        continue;
    }
    // @ts-ignore
    const verification = buildOrganisationVerificationContent({
        name: mfa_name,
        domain: foreign_affairs_ministry_domain,
        country,
        legalForm: legalForms.foreign_affairs_ministry,
        confidence: confidence_fa_domain,
    });
    const statement = buildStatement({
      domain: "rixdata.net", // rixdata.net
      author: "Rix Data NL B.V.", // Rix Data NL B.V.
        time: new Date().toUTCString(),
        content: verification,
    })
    const data = {
        statement,
        hash_b64: sha256(statement),
        api_key: apiKey
    }
    submitStatement(data, (res) => {
        console.log(res);
    });
}

console.log(array.filter((i) => i.website));
