import fs from "fs";

import https from "https";
import http from "http";

import {
  buildOrganisationVerificationContent,
  buildStatement,
  minPeopleCountToRange} from "../statementFormats";

import { sha256Node as sha256 } from "stated-protocol-parser";

import { legalForms } from "../constants/legalForms";

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

var daxCompanies = fs
  .readFileSync(
    __dirname + "/../../analysis/verifications/cities_list.csv",
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

(async () => {
for (const i of array) {
    // country,code,government_website_domain,source_domain,confidence_domain,ssl_ov_subject_org,google_search_term_first_result,
    // foreign_affairs_ministry_domain,source_fa_domain,confidence_fa_domain,Population_2022_million,gdp_2022_billion_usd,source_population_gdp
    const {
        name,
        english_name,
        province,
        country,
        domain,
        confidence,
        latitude,
        longitude,
        population,
        skip
    } = i;
    if(skip) {
      console.log('skip: ', name)
      continue
    }
    if (!country || !province || !domain || !confidence) {
        continue;
    }
    const population_bucket = population ? minPeopleCountToRange(parseFloat(population)) : undefined
    const latitude_number = latitude ? parseFloat(latitude) : undefined
    const longitude_number = longitude ? parseFloat(longitude) : undefined
    // @ts-ignore
    const verification = buildOrganisationVerificationContent({
        name,
        englishName: english_name,
        domain: domain,
        country,
        latitude: latitude_number,
        longitude: longitude_number,
        population: population_bucket,
        province,
        legalForm: legalForms.local_government,
        confidence: confidence,
        reliabilityPolicy: "https://stated.rixdata.net/statements/MjcqvZJs_CaHw-7Eh_zbUSPFxCLqVY1EeXn9yGm_ads",
    });
    const statement = buildStatement({
      domain: "rixdata.net",//"rixdata.net", // rixdata.net
      author: "Rix Data NL B.V.", // Rix Data NL B.V.
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

console.log(array.filter((i) => i.domain));
