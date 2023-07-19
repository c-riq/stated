import fs from "fs";

import https from "https";
import http from "http";

import {
  buildBounty,
  buildStatement} from "../statementFormats";

import { sha256 } from "../hash";

/*
DOMAIN=localhost PROTOCOL=http PORT=7766 FILE_NAME=rixdata_nl_b.v._statements.csv ts-node backend/scripts/publishStatementsFromCSV.ts

API_KEY=XXX FILE_NAME=rixdata_nl_b.v._statements.csv ts-node backend/scripts/publishStatementsFromCSV.ts
*/
const domain = process.env.DOMAIN || "rixdata.net";
const useHttps = (process.env.PROTOCOL || "https") === "https";
const author = process.env.AUTHOR || "Rix Data NL B.V."
const port = process.env.PORT || 443;
const apiKey = process.env.API_KEY || "XXX";
const fileName = process.env.FILE_NAME || "rixdata_nl_b.v._statements.csv";

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

var statements = fs
  .readFileSync(
     __dirname + "/../../documents/" + fileName,
    "utf8"
  )
  .toString();

const array = [];

let rows = statements.split("\n");

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
        type, motivation, bounty, reward, judge, judge_pay, superseded_statement, statement 
    } = i;
    if ((!type || !motivation || !bounty || !reward || !judge) && !statement) {
        continue;
    }
    // @ts-ignore
    if (type == "bounty") {
      const bountyContent = buildBounty({
          motivation,
          bounty,
          reward,
          judge,
          judgePay: judge_pay,
      });
      if(!bountyContent){ console.log("no bounty generated"); continue}
      const statement = buildStatement({
          domain,
          author,
          time: new Date(),
          ...(superseded_statement ? {supersededStatement: superseded_statement} : {}),
          content: bountyContent,
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
    } else if (statement) {
      const builtStatement = buildStatement({
        domain,
        author,
        time: new Date(),
        ...(superseded_statement ? {supersededStatement: superseded_statement} : {}),
        content: statement
      })
      const data = {
        statement: builtStatement,
        hash: sha256(builtStatement),
        api_key: apiKey
      }
      submitStatement(data, (res) => {
        console.log(res);
      });
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
}
})();

