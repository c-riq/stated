DROP VIEW statement_with_superseding;
ALTER TABLE statements ALTER COLUMN statement TYPE varchar(3000);
ALTER TABLE statements ALTER COLUMN content TYPE varchar(3000);
ALTER TABLE hidden_statements ALTER COLUMN statement TYPE varchar(3000);
ALTER TABLE hidden_statements ALTER COLUMN content TYPE varchar(3000);
ALTER TABLE unverified_statements ALTER COLUMN statement TYPE varchar(3000);
CREATE VIEW statement_with_superseding AS (
	SELECT s1.*, s2.hash_b64 superseding_statement 
	FROM statements s1 
	LEFT JOIN statements s2 
		ON s1.hash_b64=s2.superseded_statement 
		AND s1.domain=s2.domain AND s1.author=s2.author 
);
