process.env.NODE_ENV = 'test';

const request = require('supertest');
const app = require('../app');
const db = require('../db');

let invResults;

beforeEach(async () => {
  await db.query(`DELETE FROM companies`);
  await db.query(`DELETE FROM invoices`);
  await db.query(`INSERT INTO companies VALUES ('apple', 'Apple', 'Maker of the MacOS')`);
  invResults = await db.query(`INSERT INTO invoices (comp_code, amt) VALUES ('apple', 500) RETURNING *`);
});

afterAll(async () => {
  await db.end();
});

describe("GET /invoices", () => {
  test("Get a list of all invoices", async () => {
    const res = await request(app).get('/invoices');
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ invoices: [{id: invResults.rows[0].id, comp_code: 'apple'}] });
  });
});

describe("GET /invoices/:id", () => {
  test("Get an invoice by id", async () => {
    const res = await request(app).get(`/invoices/${invResults.rows[0].id}`);
    const resObj = {
      invoice: {
        id: invResults.rows[0].id,
        amt: 500,
        paid: false,
        // Couldn't figure out how to test the actual date.  Getting the date straight from invResults.rows[0].add_date didn't work
        // and neither did putting expect.any(Date).  The test result was showing the date in quotes, so I tried expect.any(String)
        // and that worked.  Does this mean SQL dates aren't really JavaScript Date data types, but JavaScript String data types?
        add_date: expect.any(String),
        paid_date: null,
        company: {
          code: 'apple',
          name: 'Apple',
          description: 'Maker of the MacOS'
        }
      }
    };

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual(resObj);
  });

  test("Responds with 404 if invoice id invalid", async () => {
    const res = await request(app).get(`/invoices/0`);
    expect(res.statusCode).toBe(404);
    expect(res.body).toEqual({ error: { message: "Can't find invoice with id of 0", status: 404 } });
  });
});

describe("POST /invoices", () => {
  test("Create an invoice", async () => {
    const res = await request(app).post('/invoices').send({ comp_code: 'apple', amt: 1000 });
    const resObj = {
      invoice: {
        id: expect.any(Number),
        comp_code: 'apple',
        amt: 1000,
        paid: false,
        add_date: expect.any(String),
        paid_date: null
      }
    };

    expect(res.statusCode).toBe(201);
    expect(res.body).toEqual(resObj);
  });

  test("Responds with 400 if we send no data", async () => {
    const res = await request(app).post('/invoices');
    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ error: { message: "'comp_code' and 'amt' are both required in the request body", status: 400 } });
  });

  test("Responds with 400 if we send 1 piece of data", async () => {
    const res = await request(app).post('/invoices').send({ comp_code: 'apple' });
    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ error: { message: "'comp_code' and 'amt' are both required in the request body", status: 400 } });
  });

  test("Responds with 400 if comp_code doesn't exist", async () => {
    const res = await request(app).post('/invoices').send({ comp_code: 'ibm', amt: 5000 });
    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ error: { message: "ibm is not a valid comp_code", status: 400 } });
  });
});

describe("PUT /invoices/:id", () => {
  test("Update an invoice", async () => {
    const res = await request(app).put(`/invoices/${invResults.rows[0].id}`).send({ amt: 5000 });
    const resObj = {
      invoice: {
        id: invResults.rows[0].id,
        comp_code: 'apple',
        amt: 5000,
        paid: false,
        add_date: expect.any(String),
        paid_date: null
      }
    };

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual(resObj);
  });

  test("Respond with 404 if cannot find invoice id", async () => {
    const res = await request(app).put(`/invoices/0`).send({ amt: 5000 });
    expect(res.statusCode).toBe(404);
    expect(res.body).toEqual({ error: { message: "Can't find invoice with id of 0", status: 404 } });
  });

  test("Respond with 400 if no request body", async () => {
    const res = await request(app).put(`/invoices/${invResults.rows[0].id}`);
    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ error: { message: "You need to include 'amt' in the request body", status: 400 } });
  });
});

describe("DELETE /invoices/:id", () => {
  test("Deletes a single invoice", async () => {
    const res = await request(app).delete(`/invoices/${invResults.rows[0].id}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ status: 'deleted' });
  });

  test("Responds with 404 if invoice id is invalid", async () => {
    const res = await request(app).delete('/invoices/0');
    expect(res.statusCode).toBe(404);
    expect(res.body).toEqual({ error: { message: "Can't find invoice with id of 0", status: 404 } });
  });
});