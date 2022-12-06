SELECT 'CREATE DATABASE dev'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'dev')\gexec


