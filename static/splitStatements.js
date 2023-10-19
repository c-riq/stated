// read statements.txt file and split by new line and save into separate files

const fs = require('fs');
const crypto = require('crypto')

const sha256 = strOrBuffer => {
    const base64 = crypto.createHash('sha256').update(strOrBuffer).digest('base64')
    const urlSafe = base64.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
    return urlSafe
}

var allStatements = fs
  .readFileSync(
     __dirname + "/public/statements.txt",
    "utf8"
  )
  .toString();


var statements = allStatements.replace("\n\n\n", "\n\n").split("\n\n");

statements.forEach((statement, index) => {
    let statementWithTrailingNewline = statement
    if (!statement.endsWith('\n')) {
        statementWithTrailingNewline += '\n'
    }
    statementWithTrailingNewline = statementWithTrailingNewline.replace(/^\n/, '')
    const hash = sha256(statementWithTrailingNewline)
    fs.writeFileSync(
        __dirname + "/public/statement/" + hash + ".txt",
        statementWithTrailingNewline
    );
});
