process.env.NODE_ENV = 'test';

const request = require('supertest');
const app = require('../app');
const db = require('../db');

let invResults;

beforeEach(async () => {
  await db.query(`DELETE FROM companies`);
  await db.query(`INSERT INTO companies VALUES ('apple', 'Apple', 'Maker of the MacOS')`);
  invResults = await db.query(`INSERT INTO invoices (comp_code, amt) VALUES ('apple', 500) RETURNING *`);
});

afterAll(async () => {
  await db.end();
});

describe("GET /companies", () => {
  test("Get a list of all companies", async () => {
    const res = await request(app).get('/companies');
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ companies: [{code: 'apple', name: 'Apple'}] });
  });
});

describe("GET /companies/:code", () => {
  test("Get a company by company code", async () => {
    const res = await request(app).get(`/companies/apple`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ company: { code: 'apple', name: 'Apple', description: 'Maker of the MacOS', invoices: [{ id: invResults.rows[0].id }] }});
  });

  test("Responds with 404 if company code invalid", async () => {
    const res = await request(app).get(`/companies/fadfasd`);
    expect(res.statusCode).toBe(404);
    expect(res.body).toEqual({ error: { message: "Can't find company with code of fadfasd", status: 404 } });
  });
});

describe("POST /companies", () => {
  test("Create a company", async () => {
    const res = await request(app).post('/companies').send({ code: 'google', name: 'Google', description: 'Creators of the greatest search engine of all time.' });
    expect(res.statusCode).toBe(201);
    expect(res.body).toEqual({ company: { code: 'google', name: 'Google', description: 'Creators of the greatest search engine of all time.' } });
  });

  test("Responds with 400 if we send no data", async () => {
    const res = await request(app).post('/companies');
    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ error: { message: "'code', 'name', and 'description' are all required in the request body", status: 400 } });
  });

  test("Responds with 400 if we send only two pieces of data", async () => {
    const res = await request(app).post('/companies').send({ code: 'google', name: 'Google' });
    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ error: { message: "'code', 'name', and 'description' are all required in the request body", status: 400 } });
  });
});

describe("PUT /companies/:code", () => {
  test("Update a company", async () => {
    const res = await request(app).put(`/companies/apple`).send({ name: 'Apple, Inc.', description: 'Maker of Macs and iPhones.' });
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ company: { code: 'apple', name: 'Apple, Inc.', description: 'Maker of Macs and iPhones.' } });
  });

  test("Respond with 404 if cannot find company code", async () => {
    const res = await request(app).put(`/companies/bbb`).send({ name: 'Apple, Inc.', description: 'Maker of Macs and iPhones.' });
    expect(res.statusCode).toBe(404);
    expect(res.body).toEqual({ error: { message: "Can't find company with code of bbb", status: 404 } });
  });

  test("Respond with 400 if no request body", async () => {
    const res = await request(app).put(`/companies/apple`);
    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ error: { message: "You need to include both 'name' and 'description' in the request body", status: 400 } });
  });

  test("Respond with 400 if only 1 piece of data sent", async () => {
    const res = await request(app).put(`/companies/apple`).send({ name: 'Apple, Inc.' });
    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ error: { message: "You need to include both 'name' and 'description' in the request body", status: 400 } });
  });
});

describe("DELETE /companies/:code", () => {
  test("Deletes a single company", async () => {
    const res = await request(app).delete(`/companies/apple`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ status: 'deleted' });
  });

  test("Responds with 404 if company code is invalid", async () => {
    const res = await request(app).delete('/companies/bbb');
    expect(res.statusCode).toBe(404);
    expect(res.body).toEqual({ error: { message: "Can't find company with code of bbb", status: 404 } });
  });
});