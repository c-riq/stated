// send n 400 statements to different nodes

var http = require('http');

const crypto = require('node:crypto');

function sha256(content) {  
    return crypto.createHash('sha256').update(content).digest('base64')
  }
  

console.log(crypto)
console.log(sha256('d')) //.update().digest('base64')

const post = (data, node) => {

  var post_options = {
      host: 'localhost',
      port: 7000 + node,
      path: '/api/submit_statement',
      method: 'POST',
      headers: {
          'Content-Type': 'application/json'
      }
  }
  var post_req = http.request(post_options, (res) => {
      res.setEncoding('utf8');
      res.on('data', function (chunk) {
          console.log('Response: ' + chunk);
      });
  });

  post_req.write(JSON.stringify(data))
  post_req.end()
}

const generateContent = (node) => {
    return `Domain: stated_${node}:${7000+node}
Author: test
Time: Thu, 30 Mar 2023 09:18:04 GMT
Content: hi2 ${new Date()} ${Math.random()}`
}


const generateStatement = (node) => {
    const statement = generateContent(node)
    const hash_b64 = sha256(statement)
    return({statement, hash_b64, api_key: "XXX" })
}


let i = 0
while (i <= 400){
    const node = (i % 6) + 1
    const json = generateStatement(node)
    console.log(json)
    post(json, node)
    i = i+1
}
