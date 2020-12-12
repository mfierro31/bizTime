\c biztime

DROP TABLE IF EXISTS invoices;
DROP TABLE IF EXISTS companies_industries;
DROP TABLE IF EXISTS industries;
DROP TABLE IF EXISTS companies;

CREATE TABLE companies (
    code text PRIMARY KEY,
    name text NOT NULL UNIQUE,
    description text
);

CREATE TABLE invoices (
    id serial PRIMARY KEY,
    comp_code text NOT NULL REFERENCES companies ON DELETE CASCADE,
    amt float NOT NULL,
    paid boolean DEFAULT false NOT NULL,
    add_date date DEFAULT CURRENT_DATE NOT NULL,
    paid_date date,
    CONSTRAINT invoices_amt_check CHECK ((amt > (0)::double precision))
);

CREATE TABLE industries (
  code text PRIMARY KEY,
  industry text NOT NULL
);

CREATE TABLE companies_industries (
  comp_code text NOT NULL REFERENCES companies,
  ind_code text NOT NULL REFERENCES industries,
  PRIMARY KEY (comp_code, ind_code)
);

INSERT INTO companies
  VALUES ('apple', 'Apple Computer', 'Maker of OSX.'),
         ('ibm', 'IBM', 'Big blue.'),
         ('google', 'Google', 'Maker of Google Search Engine and Google Chrome.');

INSERT INTO invoices (comp_code, amt, paid, paid_date)
  VALUES ('apple', 100, false, null),
         ('apple', 200, false, null),
         ('apple', 300, true, '2018-01-01'),
         ('ibm', 400, false, null),
         ('google', 500, false, null);

INSERT INTO industries
  VALUES ('tech', 'Tech'),
         ('comp', 'Computer'),
         ('search', 'Search Engine'),
         ('data', 'Data');

INSERT INTO companies_industries
  VALUES ('apple', 'tech'),
         ('ibm', 'tech'),
         ('google', 'tech'),
         ('apple', 'comp'),
         ('ibm', 'comp'),
         ('google', 'search'),
         ('apple', 'data'),
         ('ibm', 'data'),
         ('google', 'data');