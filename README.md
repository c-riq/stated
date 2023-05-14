### Stated
Stated is an open source tool for collective decision making among large groups of organisations.<br />
To achieve a collective decision, participating organisations publish open letter signatures (or other statements) on thier website under a standardized subdomain and path in a standardized text format (such as https://stated.rixdata.net/own/statements.txt). This standardization allows for automated verification and aggregation of signatures.<br/>
The signatures are verified, saved, re-broadcasted and aggregated by each pariticipating organisation. This decentralized design makes the system resistant to censorship.<br/>
The identity of the signature authors are transparently established by:
 - SSL Organisation Validation certificates (such as https://crt.sh/?sha256=2884EC1DE425003B57CFECF80CEE32865E6C9351B57F816F5FA7CC43FE5FA99D) issued by certificate authorities
 - Cross verifications among participating organisations within stated (such as https://stated.rixdata.net/statement/4llEn48YnhUBjvcUnF1dDX1aV98KPqwdQShSNAcHY2s)

## Supported statement publication methods

For publishing a statement, organisations or individuals can:
- Publish it on their website domain in a text file (such as https://stated.rixdata.net/own/statements.txt)
- Make sure individual statements can be retrieved by the hash via the stated API under their domain:
```bash
curl 'https://stated.rixdata.net/api/statement' -H 'Content-Type: application/json' \
--data'{"hash_b64":"ZQBx2ImuMYkL2vwkiOp/1YCWwJxNPUAK6k1ecLXvjBk="}'
```
- Add the statement's URL safe base64 encoded hash as a TXT record for the subdomain  `stated.` in their DNS domain records, such that it can be verified by the following shell commands
```bash
dig -t txt stated.rixdata.net +short | grep E9-x4ItecIitBJ69QapiwyVVpv1tK0sWMVuIuzc5uus
# with DNSSEC
delv @1.1.1.1 TXT stated.rixdata.net +short +trust | grep -e 'fully validated' -e 'E9-x4ItecIitBJ69QapiwyVVpv1tK0sWMVuIuzc5uus'
```
and then publish the full text of the statement statement through another organizations stated web app.
- Ask another organisation to publish statements on their behalf. This would be appropriate for example if the author does not own a domain name.
<br/>
Statements can either contain plain text messages as content or a strucutured message such as:
- Organisation Verification: for associating another domain with an organisation
- Dispute statement: To express the conviction that a referenced statement is not authentic

![visualisatiuon](https://github.com/c-riq/stated/blob/master/documents/diagram.png?raw=true)


## Statement format
### Plain statement example
```
Domain: rixdata.net
Author: Rix Data NL B.V.
Time: Sat, 22 Apr 2023 18:52:40 GMT
Content: hello world
```
This statement can also be viewed under [https://stated.rixdata.net/statement/rQ4vsAVjQWfrb2WXYtgE4weBXAFe5qbJPvVlnrN_y-8](https://stated.rixdata.net/statement/rQ4vsAVjQWfrb2WXYtgE4weBXAFe5qbJPvVlnrN_y-8)

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
