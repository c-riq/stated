INSERT INTO public.statements (id, type, domain, author, statement, proclaimed_publication_time, hash_b64, referenced_statement, tags, content, content_hash, source_node_id, first_verification_time, latest_verification_time, verification_method, derived_entity_created, derived_entity_creation_retry_count) VALUES (4853, 'organisation_verification', 'rixdata.net', 'Rix Data NL B.V.', 'Publishing domain: rixdata.net
Author: Rix Data NL B.V.
Time: Wed Jun 28 2023 16:04:14 GMT+0200 (Central European Summer Time)
Statement content: 
	Type: Organisation verification
	Description: We verified the following information about an organisation.
	Name: U.S. Bancorp
	Country: United States of America (the)
	Legal entity: corporation
	Owner of the domain: usbank.com
	Province or state: Minnesota
	Business register number: 41-0255900
	City: Minneapolis
	Employee count: 10,000-100,000
	Reliability policy: https://stated.rixdata.net/statements/rXoVsm2CdF5Ri-SEAr33RNkG3DBuehvFoDBQ_pO9CXE
	Confidence: 0.9
', '2023-06-28 14:04:14', 'PAqLRdXkY5UymL4u6gWIPxqrR9jf5oeStLEnOPkzozE', NULL, NULL, '
	Type: Organisation verification
	Description: We verified the following information about an organisation.
	Name: U.S. Bancorp
	Country: United States of America (the)
	Legal entity: corporation
	Owner of the domain: usbank.com
	Province or state: Minnesota
	Business register number: 41-0255900
	City: Minneapolis
	Employee count: 10,000-100,000
	Reliability policy: https://stated.rixdata.net/statements/rXoVsm2CdF5Ri-SEAr33RNkG3DBuehvFoDBQ_pO9CXE
	Confidence: 0.9
', 's2t1m7D4gsG8xf6AuQ2yiv8xp2uKjzgMZBfcx7avs3c', 1, '2023-06-28 14:04:16.812896', '2023-06-28 14:04:16.812896', 'api', true, 0);
INSERT INTO public.p2p_nodes (id, domain, ip, first_seen, last_seen, reputation, last_received_statement_id, certificate_authority, fingerprint) VALUES (32, 'stated.3.rixdata.net', '34.197.238.43', '2023-05-18 21:47:41.334961', '2023-07-20 08:02:02.844655', NULL, 145, 'http://r3.o.lencr.org', 'C6:08:08:0A:3B:61:7C:50:AF:AE:25:58:09:04:31:B5:7D:CD:8D:42');
INSERT INTO public.organisation_verifications (id, statement_hash, verifier_domain, verified_domain, foreign_domain, name, legal_entity_type, serial_number, country, province, city) VALUES (53070, 'PAqLRdXkY5UymL4u6gWIPxqrR9jf5oeStLEnOPkzozE', 'rixdata.net', 'usbank.com', NULL, 'U.S. Bancorp', 'corporation', '41-0255900', 'United States of America (the)', 'Minnesota', 'Minneapolis');
