import fs from 'fs'

fs.readFile('./public_suffix_list.txt', "utf8", (err, data) => {
   fs.writeFile('suffixes.json', JSON.stringify({'suffixes': data.split('\n').filter(s=>s.match(/^[{a-z1-9}]+$/))}, null, 2), (err) => {
      if (err) throw err;
   })
})
