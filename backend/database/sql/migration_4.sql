ALTER TABLE statements ALTER COLUMN verification_method TYPE verification_method
    USING verification_method::text::verification_method;

CREATE TEMP TABLE to_delete AS (
	SELECT distinct id, hash_b64
	from statements 
	where id not in (
		select min_id from (
			SELECT min(s1.id) min_id FROM statements s1 LEFT JOIN statements s2 
				ON s1.domain=s2.domain 
				AND s1.author=s2.author 
				AND s1.content_hash=s2.content_hash
				AND NOT s1.id=s2.id
			group by s1.domain, s1.author, s1.content_hash
	
		) lowest_ids
	)
);

delete from organisation_verifications 
where statement_hash in (select 
	hash_b64 from to_delete)
or statement_hash not in (select hash_b64 from statements);
delete from person_verifications 
where statement_hash in (select 
    hash_b64 from to_delete)
or statement_hash not in (select hash_b64 from statements);
delete from votes
where statement_hash in (select 
    hash_b64 from to_delete)
or statement_hash not in (select hash_b64 from statements);
delete from polls
where statement_hash in (select 
    hash_b64 from to_delete)
or statement_hash not in (select hash_b64 from statements);
delete from ratings
where statement_hash in (select 
    hash_b64 from to_delete)
or statement_hash not in (select hash_b64 from statements);
delete from disputes
where statement_hash in (select 
    hash_b64 from to_delete)
or statement_hash not in (select hash_b64 from statements);

delete from statements 
where id in (select 
	id from to_delete);


ALTER TABLE statements 
    ADD COLUMN superseded_statement VARCHAR(500) NULL;
ALTER TABLE statements 
    ADD CONSTRAINT no_domain_author_content_duplicates UNIQUE (domain, author, content_hash);
ALTER TABLE organisation_verifications
    ADD CONSTRAINT organisation_verifications_statement_hash_fkey
        FOREIGN KEY (statement_hash) REFERENCES statements (hash_b64)
        ON DELETE CASCADE;
ALTER TABLE person_verifications
    ADD CONSTRAINT person_verifications_statement_hash_fkey
        FOREIGN KEY (statement_hash) REFERENCES statements (hash_b64)
        ON DELETE CASCADE;
ALTER TABLE votes
    ADD CONSTRAINT votes_statement_hash_fkey
        FOREIGN KEY (statement_hash) REFERENCES statements (hash_b64)
        ON DELETE CASCADE;
ALTER TABLE polls
    ADD CONSTRAINT polls_statement_hash_fkey
        FOREIGN KEY (statement_hash) REFERENCES statements (hash_b64)
        ON DELETE CASCADE;
ALTER TABLE ratings
    ADD CONSTRAINT ratings_statement_hash_fkey
        FOREIGN KEY (statement_hash) REFERENCES statements (hash_b64)
        ON DELETE CASCADE;
ALTER TABLE disputes
    ADD CONSTRAINT disputes_statement_hash_fkey
        FOREIGN KEY (statement_hash) REFERENCES statements (hash_b64)
        ON DELETE CASCADE;
CREATE VIEW statement_with_superseding AS (
	SELECT s1.*, s2.hash_b64 superseding_statement 
	FROM statements s1 
	LEFT JOIN statements s2 
		ON s1.hash_b64=s2.superseded_statement 
		AND s1.domain=s2.domain AND s1.author=s2.author 
);
