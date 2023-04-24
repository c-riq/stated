DROP TABLE IF EXISTS ssl_cert_cache;
CREATE TABLE IF NOT EXISTS ssl_cert_cache (
    sha256 TEXT PRIMARY KEY,
    host TEXT,
    subject_o TEXT,
    subject_c TEXT,
    subject_st TEXT,
    subject_l TEXT,
    issuer_o TEXT,
    issuer_c TEXT,
    issuer_cn TEXT,
    valid_from timestamp, 
    valid_to timestamp,
    first_seen timestamp,
    last_seen timestamp,
    _rank int
);
