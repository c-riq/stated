### Stated
[Check the intro video](https://www.youtube.com/watch?v=TTRtQjeuIAE)<br/>
Stated enables large groups of organisations to make decisions collectively.<br />
A decision could be for example a set of private sanctions by companies to enforce international laws or to promote peace.<br />
To achieve a collective decision, participating organisations publish digital contract signatures as plain text statements on their website under a standardized subdomain and path in a standardized text format (such as https://stated.rixdata.net/statements.txt). This standardization allows for automated verification and aggregation of signatures.<br/>
The signatures are verified, saved, re-broadcasted and aggregated by each node in the network. This decentralized design makes the system more resillient against censorship and manipulation.<br/>
The identity of the signature authors are established by:
 - SSL Organisation Validation certificates (such as this [certificate](https://crt.sh/?sha256=2884EC1DE425003B57CFECF80CEE32865E6C9351B57F816F5FA7CC43FE5FA99D)) issued by certificate authorities
 - Verifications among participating organisations within Stated (such as this [verification](https://stated.rixdata.net/statement/FwoLf1njZ3tMAujNh_t6NZy9qV2RDNmDjgqju86yDEo))

## Supported statement publication methods

For publishing a statement, organisations or individuals can use the following options:
1. Publish it on their website domain in a text file (such as [https://stated.rixdata.net/statements.txt](https://stated.rixdata.net/statements.txt))
2. Make sure individual statements can be retrieved by the hash of it's contents via the Stated API under their domain:
```bash
curl 'https://stated.rixdata.net/api/statement?hash=NF6irhgDU0F_HEgTRKnhnDlA2R8c9YnjihhiCyNGsQA'
```
3. Add the statement's URL-safe-base64 encoded hash as a TXT record for the subdomain  `stated.` in their DNS domain records, such that it can be verified by shell commands such as:
```bash
dig -t txt stated.rixdata.net +short | grep NF6irhgDU0F_HEgTRKnhnDlA2R8c9YnjihhiCyNGsQA
# with DNSSEC
delv @1.1.1.1 TXT stated.rixdata.net +short +trust | grep -e 'fully validated' -e 'NF6irhgDU0F_HEgTRKnhnDlA2R8c9YnjihhiCyNGsQA'
```
and then publish the full text of the statement statement through another organisations stated web app.
4. Ask another organisation to publish statements on their behalf. This would be appropriate for example if the author does not own a domain name.
## Establishing online identities

![visualisatiuon](https://github.com/c-riq/stated/blob/master/documents/example_verification_graph.png?raw=true)<br />
<b>Fig.1: Example of a verification graph for a associating a domain to an organisation.</b> The Certificate Authority Sectigo issued a SSL OV certificate, validating that Rix Data NL B.V. owns rixdata.net. Rix Data NL B.V. verified that Rix Data UG owns gritapp.info, which published a PDF signature statement using their domain. Rix Data UG also verified their own identity, represented by the loop, which is useful for reducing naming inconsistencies.

## Independant verifiability of decisions

![visualisatiuon](https://github.com/c-riq/stated/blob/master/documents/diagram.png?raw=true)
<b>Fig.2: Steps for validating a collective decision</b> Any internet user should be able to independently verify collective actions on Stated.
<br />
Statements can either contain plain text messages or a strucutured message such as an Organisation Verification, for associating another website domain with an organisation


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

### Join the community
- [Slack channel](https://join.slack.com/t/stated/shared_invite/zt-24r6gz86t-gy9TADMabaA0e1UQ1it~4g)
