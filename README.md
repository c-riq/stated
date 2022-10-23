### Stated
Stated is an open source tool set for decentral realtime decision making.<br/>
In the initial focus is to enable organisations to issue joint statements.<br/>
The core challenge is to make sure any internet user can independently verify the authenticity of a joint statement.<br/>
This requires all participating organisations to have an independently verifiable online identity and that their statements can also be linked to their online identity.<br/>
We will use the primary website domain of organisations as an online identity. <br/>
Existing links to the organisations website from ofther sites such as wikipedia, linkedin, twitter, news websites and government websites already provide a hard to manipulate online identity for larger organisations. <br/>
To further solidify the online identities, organisations can verify the links between other organisations and their primary domain, creating a web of trust.
For publishing statements organisations make them accessible on their domain under the standardized URL stated.example.com/statements.txt in a standardized human readable format.<br/>
Verifications made by one organisation to associate another organisation with their domain are also included in the list of statements.
To allow for fast aggregation of joint statements, they are propagated though the peer to peer network of participating organisations.

![visualisatiuon](https://github.com/c-riq/stated/blob/master/diagram.png?raw=true)

## Publishing statements of other organisations
The current implementation includes another aproach to make initial adoption and experimentation easier.<br/>
Organisations can create statements via the stated web app of another organisation which runs an instance of stated.<br/>
The organisation has to prove domain ownership by creating a TXT entry with the base64 encoded hash of their statement in their DNS Zone file.<br/>
Usually this can be done by logging into the account at the respective domain registrar such as godaddy.com .
This approach is faster and cheaper than installing a stated server instance. 
However installing new stated instances will make the P2P network more resillient and it will also make the verification of statements easier.

## Statement format
# Example
domain: mit.edu<br/>
time: Sun, 04 Sep 2022 14:48:50 GMT<br/>
statement: hello world<br/>

# Verification example
domain: walmart.com<br/>
time: Wed, 07 Sep 2022 16:50:10 GMT<br/>
type: domain_verification<br/>
statement: We confirm that the organisations main domain is in accordance with the listed source, which we regard as trustworthy and authentic.<br/>
verify organisation domain: mit.edu<br/>
verify organisation name: Massachusetts Institute of Technology<br/>
verify organisation country: United States of America<br/>
verify organisation source: https://www.neche.org/institution/massachusetts-institute-of-technology/<br/>

### Front end 
#### React.js Application for publishing and aggregating statements
check frontend/README.md

### Back end
#### Node.js express PostreSQL 
check backend/README.md

### Analysis 
#### Python scripts extracting organisations official website domains from wikidata and twitter
check analysis/README.md
