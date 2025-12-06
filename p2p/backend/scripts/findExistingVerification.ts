import fs from "fs";

import https from "https";
import http from "http";

import {
  buildOrganisationVerificationContent,
  minPeopleCountToRange} from "../statementFormats";

import { legalForms } from "../constants/legalForms";

const host = process.env.HOST || "stated.rixdata.net";
const useHttps = (process.env.PROTOCOL || "https") === "https";
const port = process.env.PORT || 443;
const apiKey = process.env.API_KEY || "XXX";

const findStatement = ({
    statementContent,
    domainFilter,
    authorFilter, callback}) => {
  console.log(statementContent, domainFilter, authorFilter);
  try {
    var post_options = {
      host: host,
      port: port,
      path: "/api/statements_with_details?search_query=" 
      + encodeURIComponent(statementContent)
      + "&domain=" + domainFilter + "&author=" 
      + encodeURIComponent(authorFilter),
      method: "GET",
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

    post_req.write("");
    post_req.end();
  } catch (e) {
    console.log(e);
  }
};

var verifications = fs
  .readFileSync(
    __dirname + "/../../analysis/verifications/universities_list.csv",
    "utf8"
  )
  .toString();


(async () => {

    const array = [];

    let rows = verifications.split("\n");

    const header = rows.splice(0, 1)[0];
    let result = header + ',statement_hash\n';
    const colNames = header.split(",");

    for (const row of rows) {
    let colCount = 0;
    const parsedRow = {} as any;
    row.match(/\s*(\"[^"]*\"|[^,]*)\s*(,|$)/g).map((i) => {
        i = i.replace(/"/g, "").replace(/,$/g, "");
        parsedRow[colNames[colCount]] = i;
        colCount = colCount + 1;
    });
        let {
            name,
            english_name,
            province,
            country,
            city,
            domain,
            website_domain,
            confidence,
            latitude,
            longitude,
            population,
            skip
        } = parsedRow;
        domain = domain || website_domain
        if (!country || !province || !domain || !confidence) {
            result = result + row + ',\n';
            continue;
        }
        const population_bucket = population ? minPeopleCountToRange(parseFloat(population)) : undefined
        const latitude_number = latitude ? parseFloat(latitude) : undefined
        const longitude_number = longitude ? parseFloat(longitude) : undefined
        // @ts-ignore
        const statementContent = buildOrganisationVerificationContent({
            name,
            englishName: english_name,
            domain: domain,
            country,
            city,
            latitude: latitude_number,
            longitude: longitude_number,
            population: population_bucket,
            province,
            legalForm: legalForms.corporation,
            confidence: confidence,
            reliabilityPolicy: "https://stated.rixdata.net/statements/MjcqvZJs_CaHw-7Eh_zbUSPFxCLqVY1EeXn9yGm_ads",
        });
        const domainFilter = "rixdata.net"//"rixdata.net", // rixdata.net
        const authorFilter = "Rix Data NL B.V." // Rix Data NL B.V.
        const data = {
            statementContent: statementContent.substring(1),
            domainFilter,
            authorFilter,
        }
        findStatement({...data, callback: (res) => {
            const response = JSON.parse(res);
            if (response['statements'].length === 1) {
                const hash = response['statements'][0].hash_b64
                result = result + row + ',' + hash + '\n';
                console.log(name, hash)
            } else {
                result = result + row + ',\n';
            }
        }});
        await new Promise((resolve) => setTimeout(resolve, 500));
    }
    fs.writeFileSync(
        __dirname + "/../../analysis/verifications/universities_list.csv",
        result)
})();
