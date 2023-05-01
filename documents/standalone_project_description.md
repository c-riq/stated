
# Stated 
Real time collective decision making on a global scale

Realized via a decentralized P2P network of nodes which belong to identified organisations and individuals. Each node validates, distributes and aggregates statements which constitute collective contract signatures, polls and P2P verifications. 
Participating organisations run a node, reachable under the `stated.` subdomain of a domain which they demonstrably own. The identity of an organisation and their domain ownership is established through SSL Organisation Validations certificates and/or P2P verifications within the stated network.
Statements are text messages in a human- and machine-readable format and they are the basic building blocks of collective actions. They look as follows:
```
Domain: rixdata.net
Author: Rix Data NL B.V.
Time: Sat, 22 Apr 2023 18:52:40 GMT
Content: hello world
```
This statement can also be viewed under [https://stated.rixdata.net/statement/rQ4vsAVjQWfrb2WXYtgE4weBXAFe5qbJPvVlnrN_y-8](https://stated.rixdata.net/statement/rQ4vsAVjQWfrb2WXYtgE4weBXAFe5qbJPvVlnrN_y-8)

Organisations publish statements by distributing them to the P2P network. Each node saves the statement and retransmits it, if publication on the authors domain has been verified.
Each node forms beliefs on the identities of domains/nodes based on SSL OV certificates and P2P verifications (i.e. who owns a domain). Nodes also form beliefs concerning the credibility of other nodes. According to these beliefs, nodes aggregated and publish statistics of statements (i.e. poll results, open letter signature lists, collective contracts...).

P2P verifications are a special type of statement and look as follows:
```
Domain: rixdata.net
Author: Rix Data NL B.V.
Time: Sun, 30 Apr 2023 00:05:53 GMT
Content: 
	Type: Organisation verification
	Description: We verified the following information about an organisation.
	Name: Rix Data UG (haftungsbeschränkt)
	Country: Germany
	Legal entity: limited liability corporation
	Owner of the domain: gritapp.info
	Province or state: Bayern
	Business register number: HRB 10832
	City: Bamberg
```
Other statement types include: 
- `Dispute statement`: for revoking previous statements and expressing strong convictions about false identity claims
- `Sign PDF`: for signing open letters or binding contracts
- `Poll` and `Vote`: for generating polls. However defining the rules for qualifying votes, weighting votes and establishing consensus about the outcome of a poll may require a lot of work. Therefore opt-in decisions (vote-yes-or-ignore) via collective contract signing / open letters may often be more practical.

Participating entities are currently classified into limited liability corporations (companies, universities, NGOs…), local governments, national governments and individual people.

![visualisatiuon](https://github.com/c-riq/stated/blob/add-project-descpription-and-baseline-contract/documents/example_verification_graph.png?raw=true)<br />
<b>Fig.1: Example of a verification graph</b> Certificate Authority Sectigo issued a SSL OV certificate, validating that Rix Data NL B.V. owns rixdata.net. Rix Data NL B.V. verified that Rix Data UG owns gritapp.info, which published a PDF signature statement using their domain.  Rix Data UG also verified their own identity, represented by the loop, which is useful for reducing naming inconsistencies.

### Simplified statement publishing

Installing and configuring the open source software to run a stated node in the network should require little effort and resources. However there are alternatives to this for making participation possible with less effort:

1. One can ask an organisation/person to publish statements on behalf of them. In this case the representing entity needs to publish a verification statement for the represented entity and fill in the representing entities domain name in the field Foreign domain used for publishing statements.
2. One can also use the DNS based verification method for each statement publication. In this case a TXT entry needs to be added under the `stated.` subdomain. Where the TXT entry contains the URL safe base64 representation of the SHA256 hash of the statement to be published and then the full statement needs to be submitted in the user interface of a stated node, which then forwards the statement to the network after the DNS entry has been checked. DNSSEC compliance may be required to reduce impersonation risk.


### Applications and benefits

- Any internet user should be able to independently verify all the signatures/votes which constitute a decision and thereby gain trust in the system. A universally trusted collective decision making process removes the need for representation. This could help in situations of abuse of power and mismanagement by representatives.
- Decisions can also be made much faster than through conventional election and representation processes. 
- Matters which are not restricted to national boundaries, such as international wars, pollution and existential risks might be more effectively addressed through such a system rather than through multiple layers of representation.
