import fs from "fs";

import http from 'http';
import { parse } from "path";

const request = (method, data, node, path, callback) => {
    console.log(method, data, node, path)
    try {
        var post_options = {
            host: 'localhost',
            port: 7000 + node,
            path: '/api/' + path,
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        }
        var post_req = http.request(post_options, (res) => {
            let rawData = '';
            res.setEncoding('utf8');
            res.on('data', function (chunk) {
                //console.log('Response: ' + chunk);
                rawData += chunk;
            });
            res.on('end', function () {
                callback && callback(rawData)
            });
            res.on('error', function (e) {
                console.log('Error: ' + e.message);
            });
        });
        post_req.on('error', function (e) {
            console.log('Error: ' + e.message);
        });

        method === 'POST' && post_req.write(JSON.stringify(data))
        post_req.end()


    } catch (e) {
        console.log(e)
    }
}

var daxCompanies = fs
  .readFileSync(__dirname + "/../../analysis/verifications/dax_index_companies.csv", "utf8")
  .toString();

const array = []

const rows = daxCompanies.split('\n')

const headers = rows[0].split(',')

for (const row of rows) {
    let colCount = 0
    const parsedRow = {}
    row.match( /\s*(\"[^"]*\"|[^,]*)\s*(,|$)/g ).map(i => {
        i = i.replace(/"/g, '');
        parsedRow[headers[colCount]] = i
        colCount = colCount + 1
    })
    array.push(parsedRow)
}

for (const company of array) {
    request('POST', company, 1, 'company', (res) => {
        console.log(res)
    })
}

console.log(array)