### Stated
Stated is an p2p network for collective decision making among large groups of organisations.<br />
To achieve a collective decision, participating organisations publish open letter signatures (or other statements) on thier website under a standardized subdomain and path in a standardized text format (such as https://stated.rixdata.net/own/statements.txt). This standardization allows for automated verification and aggregation of signatures.<br/>
The signatures are verified, saved, re-broadcasted and aggregated by each node in the network. This decentralized design makes the system resistant to censorship.<br/>
The identity of the signature authors are established by:
 - SSL Organisation Validation certificates (such as this [certificate](https://crt.sh/?sha256=2884EC1DE425003B57CFECF80CEE32865E6C9351B57F816F5FA7CC43FE5FA99D)) issued by certificate authorities
 - Cross verifications among participating organisations within stated (such as this [verification](https://stated.rixdata.net/statement/FwoLf1njZ3tMAujNh_t6NZy9qV2RDNmDjgqju86yDEo))

## Supported statement publication methods

For publishing a statement, organisations or individuals can:
1. Publish it on their website domain in a text file (such as [https://stated.rixdata.net/own/statements.txt](https://stated.rixdata.net/own/statements.txt))
- Make sure individual statements can be retrieved by the hash of it's contents via the stated API under their domain:
```bash
curl 'https://stated.rixdata.net/api/statement' -H 'Content-Type: application/json' \
--data '{"hash_b64":"NF6irhgDU0F_HEgTRKnhnDlA2R8c9YnjihhiCyNGsQA"}'
```
2. Add the statement's URL-safe-base64 encoded hash as a TXT record for the subdomain  `stated.` in their DNS domain records, such that it can be verified by shell commands such as:
```bash
dig -t txt stated.rixdata.net +short | grep NF6irhgDU0F_HEgTRKnhnDlA2R8c9YnjihhiCyNGsQA
# with DNSSEC
delv @1.1.1.1 TXT stated.rixdata.net +short +trust | grep -e 'fully validated' -e 'NF6irhgDU0F_HEgTRKnhnDlA2R8c9YnjihhiCyNGsQA'
```
and then publish the full text of the statement statement through another organizations stated web app.
3. Ask another organisation to publish statements on their behalf. This would be appropriate for example if the author does not own a domain name.
## Online identities

![visualisatiuon](https://github.com/c-riq/stated/blob/master/documents/diagram.png?raw=true)
<b>Fig.1: Steps for validate a collective decision</b> Any internet user should be able to independently verify collective actions on stated.
<br />
Statements can either contain plain text messages or a strucutured message such as an Organisation Verification, for associating another website domain with an organisation

![visualisatiuon](https://github.com/c-riq/stated/blob/master/documents/example_verification_graph.png?raw=true)<br />
<b>Fig.2: Example of a verification graph</b> Certificate Authority Sectigo issued a SSL OV certificate, validating that Rix Data NL B.V. owns rixdata.net. Rix Data NL B.V. verified that Rix Data UG owns gritapp.info, which published a PDF signature statement using their domain.  Rix Data UG also verified their own identity, represented by the loop, which is useful for reducing naming inconsistencies.


## Statement format
### Plain statement example
```
Publishing domain: rixdata.net
Author: Rix Data NL B.V.
Time: Thu, 15 Jun 2023 20:01:26 GMT
Statement content: hello world
```
This statement can also be viewed under [https://stated.rixdata.net/statement/NF6irhgDU0F_HEgTRKnhnDlA2R8c9YnjihhiCyNGsQA](https://stated.rixdata.net/statement/NF6irhgDU0F_HEgTRKnhnDlA2R8c9YnjihhiCyNGsQA)

## Design principles
#### Everyone should be able to inspect how the system works
- The statement format needs to be understandable by non-technical audience in simple english
- The verification steps should be described in non-technical language where possible
#### Many should be able to contribute
- The code should be easy to read (Use more common programming languages)
- The project should be easy to run (Small number of commands to set it up)
#### Simplicity
- Third party dependency count should be kept small
- Complex applications building on top of the stated system should be in a separate project

### Getting started
- [Server Installation Steps](https://github.com/c-riq/stated/blob/master/backend/README.md)
- [Front end / User Interface development](https://github.com/c-riq/stated/blob/master/frontend/README.md)
- [Domain ownership data analysis](https://github.com/c-riq/stated/blob/master/analysis/README.md)
