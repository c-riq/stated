import http from "http";
import https from "https";
import fs from "fs";

const port = process.env.PORT || 80;

export const submitStatement = ({data, host = 'localhost', useHttps = true, callback}) => {
  console.log(data, host);
  try {
    var post_options = {
      host: host,
      port: useHttps ? 443 : port,
      path: "/api/statement",
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

export const readCSV = (fileName) => {
  var fileContents = fs
    .readFileSync(
      __dirname + "/../../analysis/verifications/" + fileName,
      "utf8"
    )
    .toString();

  const result = [];

  let rows = fileContents.split("\n");

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
    result.push(parsedRow);
  }
  return result;
};
