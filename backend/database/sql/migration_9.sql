ALTER TABLE statements
    ADD COLUMN archived BOOLEAN DEFAULT FALSE;
DROP VIEW IF EXISTS statement_with_superseding;
CREATE VIEW statement_with_superseding AS (
	SELECT s1.*, s2.hash_b64 superseding_statement 
	FROM statements s1 
	LEFT JOIN statements s2 
		ON s1.hash_b64=s2.superseded_statement 
		AND s1.domain=s2.domain AND s1.author=s2.author
    WHERE s1.archived<>TRUE
);
