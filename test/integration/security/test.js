// send n statements to different nodes

var http = require("http");

const request = (method, data, path, callback) => {
  console.log(method, data, path);
  try {
    var post_options = {
      host: "localhost",
      port: 7766,
      path: "/api/" + path,
      method: method,
      headers: {
        "Content-Type": "application/json",
      },
    };
    var post_req = http.request(post_options, (res) => {
      console.log("STATUS: " + res.statusCode);
      let rawData = "";
      res.setEncoding("utf8");
      res.on("data", function (chunk) {
        //console.log('Response: ' + chunk);
        rawData += chunk;
      });
      res.on("end", function (info) {
        callback && callback(rawData, res.statusCode);
      });
      res.on("error", function (e) {
        console.log("Error: " + e.message);
      });
    });
    post_req.on("error", function (e) {
      console.log("Error: " + e.message);
    });

    method === "POST" && post_req.write(JSON.stringify(data));
    post_req.end();
  } catch (e) {
    console.log(e);
  }
};

const test = (path, queryField) => {
  const timoutID = setTimeout(() => {
    throw ('timeout 200 ms')
  }, 200)
  request(
    "GET",
    undefined,
    `${path}?${queryField}=a;(select%201%20from%20pg_sleep(5000))`,
    (res, status) => {
      console.log(res, status);
      if (/^Server Error/g.test('' + res)) {
        clearTimeout(timoutID)
        process.stdout.write('success');
      } else {
        throw ('failure')
      }
    }
  );
};

const healthTestInterval = setInterval(() => {
  try {
    request("GET", {}, "health", (res) => {
      try {
        const r = JSON.parse(res);
        console.log("healthTest response: ", r);
        if (r.application == "stated") {
          clearInterval(healthTestInterval);
          test('organisation_verifications', 'hash');
        }
      } catch (e) {
        console.log(e);
      }
    });
  } catch (e) {
    console.log(e);
  }
}, 5000);
