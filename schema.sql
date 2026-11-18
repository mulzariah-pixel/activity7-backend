-- schema.sql
-- Database table definition for Campus Maintenance Requests

CREATE TABLE IF NOT EXISTS records (
  id SERIAL PRIMARY KEY,
  title VARCHAR(80) NOT NULL,
  category VARCHAR(40) NOT NULL,
  description VARCHAR(300) NOT NULL,
  status VARCHAR(20) NOT NULL
);
