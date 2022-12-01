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
# Plain statement example
```
Domain: mit.edu
Time: Sun, 04 Sep 2022 14:48:50 GMT
Statement: hello world
```

# Domain verification example
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

# Vote example
The owner of rixdata.net verifying the primary website domain of Walmart along with a few additional data points:
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

### Front end 
#### React.js Application for publishing and aggregating statements
check frontend/README.md

### Back end
#### Node.js express PostreSQL 
check backend/README.md

### Analysis 
#### Python scripts extracting organisations official website domains from wikidata and twitter
check analysis/README.md
