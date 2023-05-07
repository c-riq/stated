SELECT 'CREATE DATABASE stated'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'stated')\gexec
