curl 'http://localhost:7766/api/submit_statement' \
  -H 'Accept-Language: en-GB,en-US;q=0.9,en;q=0.8' \
  -H 'Connection: keep-alive' \
  -H 'Content-Type: application/json' \
  -H 'Origin: https://stated.rixdata.net' \
  -H 'Referer: https://stated.rixdata.net/create-statement' \
  -H 'Sec-Fetch-Dest: empty' \
  -H 'Sec-Fetch-Mode: cors' \
  -H 'Sec-Fetch-Site: same-origin' \
  -H 'User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Safari/537.36' \
  -H 'accept: application/json' \
  -H 'sec-ch-ua: "Google Chrome";v="107", "Chromium";v="107", "Not=A?Brand";v="24"' \
  -H 'sec-ch-ua-mobile: ?0' \
  -H 'sec-ch-ua-platform: "macOS"' \
  --data-raw '{"statement":"Domain: rixdata.net\nTime: Sat, 26 Nov 2022 17:29:46 GMT\nTags: test\nContent: hello world","hash_b64":"xhtNpoo8fmX9kus2NlfAJKbh+//IuWetczWEO5AcTh4="}' \
  --compressed

curl 'http://localhost:7766/api/submit_statement' \
  -H 'Accept-Language: en-GB,en-US;q=0.9,en;q=0.8' \
  -H 'Connection: keep-alive' \
  -H 'Content-Type: application/json' \
  -H 'Origin: http://localhost:3000' \
  -H 'Referer: http://localhost:3000/' \
  -H 'Sec-Fetch-Dest: empty' \
  -H 'Sec-Fetch-Mode: cors' \
  -H 'Sec-Fetch-Site: same-site' \
  -H 'User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Safari/537.36' \
  -H 'accept: application/json' \
  -H 'sec-ch-ua: "Google Chrome";v="107", "Chromium";v="107", "Not=A?Brand";v="24"' \
  -H 'sec-ch-ua-mobile: ?0' \
  -H 'sec-ch-ua-platform: "macOS"' \
  --data-raw '{"statement":"Domain: rixdata.net\nTime: Sat, 26 Nov 2022 17:53:34 GMT\nContent: \n\tType: domain verification\n\tDescription: We verified the following information about an organisation.\n\tOrganisation name: Rix Data UG (haftungsbeschränkt)\n\tHeadquarter country: Germany\n\tLegal entity: limited liability corporation\n\tDomain of primary website: rixdata.net\n\tHeadquarter city: Bamberg\n","hash_b64":"xRXZ6Xk3MOgGFmQYoi5v9rBYV2x61g5clQv+e1snD48="}' \
  --compressed

curl 'http://localhost:7766/api/submit_statement' \
  -H 'Accept-Language: en-GB,en-US;q=0.9,en;q=0.8' \
  -H 'Connection: keep-alive' \
  -H 'Content-Type: application/json' \
  -H 'Origin: http://localhost:3000' \
  -H 'Referer: http://localhost:3000/' \
  -H 'Sec-Fetch-Dest: empty' \
  -H 'Sec-Fetch-Mode: cors' \
  -H 'Sec-Fetch-Site: same-site' \
  -H 'User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Safari/537.36' \
  -H 'accept: application/json' \
  -H 'sec-ch-ua: "Google Chrome";v="107", "Chromium";v="107", "Not=A?Brand";v="24"' \
  -H 'sec-ch-ua-mobile: ?0' \
  -H 'sec-ch-ua-platform: "macOS"' \
  --data-raw '{"statement":"Domain: rixdata.net\nTime: Sun, 27 Nov 2022 15:02:27 GMT\nContent: \n\tType: poll\n\tPoll type: majority vote wins\n\tCountry scope: Germany\n\tCity scope: Bamberg\n\tLegal entity scope: limited liability corporation\n\tThe decision is finalized when the following nodes agree: rixdata.net\n\tVoting deadline: Wed, 30 Nov 2022 15:02:30 GMT\n\tPoll: Which feature should be built first?\n\tOption 1: Feature A\n\tOption 2: Feature B\n","hash_b64":"b7ldTjr8gP6wNy8NXMs6l+1pOnfxHAykNF1E/I/1vmQ="}' \
  --compressed

curl 'http://localhost:7766/api/submit_statement' \
  -H 'Accept-Language: en-GB,en-US;q=0.9,en;q=0.8' \
  -H 'Connection: keep-alive' \
  -H 'Content-Type: application/json' \
  -H 'Origin: http://localhost:3000' \
  -H 'Referer: http://localhost:3000/' \
  -H 'Sec-Fetch-Dest: empty' \
  -H 'Sec-Fetch-Mode: cors' \
  -H 'Sec-Fetch-Site: same-site' \
  -H 'User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Safari/537.36' \
  -H 'accept: application/json' \
  -H 'sec-ch-ua: "Google Chrome";v="107", "Chromium";v="107", "Not=A?Brand";v="24"' \
  -H 'sec-ch-ua-mobile: ?0' \
  -H 'sec-ch-ua-platform: "macOS"' \
  --data-raw '{"statement":"Domain: rixdata.net\nTime: Sun, 27 Nov 2022 15:03:58 GMT\nContent: \n\ttype: vote\n\tpoll id: b7ldTjr8gP6wNy8NXMs6l+1pOnfxHAykNF1E/I/1vmQ=\n\tpoll: Which feature should be built first?\n\tvote: Feature A\n","hash_b64":"wq9TJlg7LBzLM4IZrU2DdBI/65Bdi7d6lFV/w+VdVFU="}' \
  --compressed