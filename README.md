### Stated
Stated is an open source tool for decentral realtime decision making and generating polls.<br/>
It enables groups of organisations to issue joint statements, sign open letters and make collective decisions.<br/>
The core challenge is to enable any internet user to independently verify the authenticity of a joint statement or poll result.<br/>
This requires all participating organisations to have verifiable online identity and that their statements can also be linked to their online identity.<br/>
Stated uses the website domain of organisations as their online identity. <br/>
Evidence for identities is comprised of SSL OV(Organization Validation) certificates issued by certificate authorities and cross verifications among oranizations creating a web of trust.
For publishing statements and enabling independent verification organisations can:
- publish them in full on their domain in a standardized human and machine readable format under a standardized URL path, such as https://stated.rixdata.net/own/statements.txt
- Make sure individual statements can be retrieved by the hash via a stated node running under their domain:
```bash
curl 'https://stated.rixdata.net/api/statement' -H 'Content-Type: application/json' \
--data'{"hash_b64":"ZQBx2ImuMYkL2vwkiOp/1YCWwJxNPUAK6k1ecLXvjBk="}'
```
- Add the statement's hash as a TXT record for the subdomain stated in their DNS domain records and publish the full statement through another organizations stated node:
```bash
dig -t txt stated.rixdata.net +short | grep ZQBx2ImuMYkL2vwkiOp/1YCWwJxNPUAK6k1ecLXvjBk=
```
<br/>
Statements can either be plain text messages or a strucutured message such as:
- Domain Verification: for associating another domain with a organisation (to supplement SSL OV verifications)
- Poll: To define a poll
- Vote: For casting a vote to a referenced poll
- Rating: To rate the trustworthiness of another organization
- Dispute statement: To express the conviction that a referenced statement is not authentic
To allow for fast aggregation of polls and joint statements, all statements are propagated though a peer to peer network of participating organisations. And each node validates the authors intention to publish a statement before relaying them.

![visualisatiuon](https://github.com/c-riq/stated/blob/master/documents/diagram.png?raw=true)

## Publishing statements of other organisations
Currently another verification method is supported to make initial adoption and experimentation easier.<br/>
Organisations can create statements via the stated web app of another organisation instead of hosting an instance of the server application.<br/>
In this case the statement author has to prove domain ownership by creating a TXT entry with the base64 encoded hash of their statement in their DNS Zone file.<br/>
Usually this can be done by logging into the account at the respective domain registrar such as godaddy.com .
This approach is faster and cheaper than installing a stated server instance or hosting static files containg statements. 
However hosting a new stated instances will make the P2P network more resillient.

## Statement format
### Plain statement example
```
Domain: mit.edu
Author: Massachusetts Institute of Technology
Time: Sun, 04 Sep 2022 14:48:50 GMT
Statement: hello world
```

### Domain verification example
The owner of rixdata.net verifying the primary website domain of Walmart along with a few additional data points:
```
Domain: rixdata.net
Time: Sun, 04 Sep 2022 14:48:50 GMT
Content: 
	Type: domain verification
	Description: We verified the following information about an organisation.
	Organisation name: Walmart Inc.
	Headquarter country: United States of America
	Legal entity: limited liability corporation
	Domain of primary website: walmart.com
	Headquarter province or state: Arkansas
	Headquarter city: Bentonville
```

### Vote example
```
Domain: rixdata.net
Time: Thu, 17 Nov 2022 20:13:46 GMT
Content: 
	Type: vote
	Poll id: ia46YWbESPsqPalWu/cAkpH7BVT9lJb5GR1wKRsz9gI=
	Poll: Should tax havens be eliminated?
	Option: Yes
```
See [source code](https://github.com/c-riq/stated/blob/master/frontend/src/constants/statementFormats.js) for more details and examples.

### Design principles
#### Everyone should be able to inspect how the system works
- The statement format needs to be understandable by non-technical audience
- The verification steps should be described in non-technical language where possible
#### Many should be able to contribute
- The code should be easy to read (Use more common programming languages)
- The project should be easy to run (Small number of commands to set it up)

#### Simplicity to increase security
- Third party dependency count should be kept small
- Complex applications building on top of the stated system should be in a separate repository

### Run locally with docker compose
build the frontend files
```sh
cd frontend
DOCKER_BUILDKIT=1 docker build --file frontend/Dockerfile --output frontend/docker_output .
```
copy frontend build files to the file server directory
```sh
rm -rf backend/public && mkdir backend/public
cp -r frontend/docker_output/* backend/public/
```
run the backend and database using docker compose
```sh
docker compose -f docker-compose.yml up 
```
open localhost:7766 in your browser

### Front end 
#### React.js Application for publishing and aggregating statements
check frontend/README.md

### Back end
#### Node.js express PostreSQL 
check backend/README.md

### Generate PDFs
```bash
npm i -g md-to-pdf
md-to-pdf documents/*.md
```

### Analysis 
#### Python scripts extracting domain ownership hints from wikidata and other sources
check analysis/README.md
