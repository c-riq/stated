[![visualisatiuon](https://github.com/c-riq/stated/blob/master/documents/images/video_preview.jpg?raw=true)](https://www.youtube.com/watch?v=TTRtQjeuIAE)</br>
[Check the intro video](https://www.youtube.com/watch?v=TTRtQjeuIAE)<br/>
Stated enables large groups of organisations to make decisions collectively.<br />
A decision could be for example a set of private sanctions by companies to enforce international laws or to promote peace.<br />
To achieve a collective decision, participating organisations publish digital contract signatures as plain text statements on their website under a standardized subdomain and path in a standardized text format. This standardization enables automated verification and aggregation of signatures.<br/>
The signatures are verified, saved, re-broadcasted and aggregated by each node in the network. This decentralized design makes the system more resillient against censorship and manipulation.<br/>

## Supported statement publication methods

For publishing a statement, organisations or individuals can use the following options:
1. Publish it on their website domain in a text file. Curently therer are 3 supported URI schemes:
    - [https://stated.rixdata.net/statements/NF6irhgDU0F_HEgTRKnhnDlA2R8c9YnjihhiCyNGsQA](https://stated.rixdata.net/statements/NF6irhgDU0F_HEgTRKnhnDlA2R8c9YnjihhiCyNGsQA)
    - [https://static.stated.rixdata.net/statements/YTIhylbTsXvJZN8og3LvusdfjjjnnVudocw1mki11Vs.txt](https://static.stated.rixdata.net/statements/YTIhylbTsXvJZN8og3LvusdfjjjnnVudocw1mki11Vs.txt)
    - [https://www.rixdata.net/.well-known/statements.txt](https://www.rixdata.net/.well-known/statements.txt)
    If you don't know how to host static text files, check our [instructions](https://github.com/c-riq/stated/blob/master/static/README.md)
2. [Using DNS records](https://github.com/c-riq/stated/blob/master/documents/dns_authentication/README.md)
3. Ask another organisation to publish statements on their behalf. This would be appropriate for example if the author does not own a domain name.
4. [Run a stated instance and publish](https://github.com/c-riq/stated/blob/master/backend/README.md)

## Online identities

The identity of the signature authors are established by:
 - SSL Organisation Validation certificates (such as this [certificate](https://crt.sh/?sha256=2884EC1DE425003B57CFECF80CEE32865E6C9351B57F816F5FA7CC43FE5FA99D)) issued by certificate authorities
 - Verifications among participating organisations within Stated (such as this [verification](https://stated.rixdata.net/statements/FwoLf1njZ3tMAujNh_t6NZy9qV2RDNmDjgqju86yDEo))

![visualisatiuon](https://github.com/c-riq/stated/blob/master/documents/images/example_verification_graph.png?raw=true)<br />
<b>Fig.1: Example of a verification graph for a associating a domain to an organisation.</b><br />The Certificate Authority Sectigo issued a SSL OV certificate, validating that Rix Data NL B.V. owns rixdata.net. Rix Data NL B.V. verified that Rix Data UG owns gritapp.info, which published a PDF signature statement using their domain. Rix Data UG also verified their own identity, represented by the loop, which is useful for reducing naming inconsistencies.

## Independant verifiability of decisions

![visualisatiuon](https://github.com/c-riq/stated/blob/master/documents/images/diagram.png?raw=true)
<b>Fig.2: Steps for validating a collective decision</b><br />Any internet user should be able to independently verify collective actions on Stated.<br />
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
This statement can also be viewed under [https://stated.rixdata.net/statements/NF6irhgDU0F_HEgTRKnhnDlA2R8c9YnjihhiCyNGsQA](https://stated.rixdata.net/statements/NF6irhgDU0F_HEgTRKnhnDlA2R8c9YnjihhiCyNGsQA)

## Design principles
#### Everyone should be able to inspect how the system works
- The statement format needs to be understandable by non-technical audience in simple english
- The verification steps should be described in non-technical language where possible
- The code should be easy to read (More common programming languages)
- The project should be easy to run (Small number of commands to set it up)
#### Simplicity
- Third party dependency count should be kept small
- Complex applications building on top of the stated system should be in a separate project

## Getting started
- [Server Installation Steps](https://github.com/c-riq/stated/blob/master/backend/README.md)
- [Front end / User Interface development](https://github.com/c-riq/stated/blob/master/frontend/README.md)
- [Domain ownership data analysis](https://github.com/c-riq/stated/blob/master/analysis/README.md)

## Applications
- [NGO coordination for AI safety](https://github.com/c-riq/stated/blob/master/documents/ai_safety/README.md)

## Join the community
- [Slack channel](https://join.slack.com/t/stated/shared_invite/zt-24r6gz86t-gy9TADMabaA0e1UQ1it~4g)
