const express = require("express");
const ExpressError = require("../expressError");
const router = express.Router();
const db = require("../db");

router.get('/', async (req, res, next) => {
  try {
    const results = await db.query(`SELECT id, comp_code FROM invoices`);
    return res.json({ invoices: results.rows });
  } catch (e) {
    return next(e);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const compCodeResults = await db.query(`SELECT comp_code FROM invoices WHERE id = $1`, [id]);
    // Tried nested SELECT statements and JOINs to try and get company, but it just wouldn't work.  How do I do that??
    const results = await db.query(`SELECT id, amt, paid, add_date, paid_date FROM invoices WHERE id = $1`, [id]);

    if (results.rows.length === 0) {
      throw new ExpressError(`Can't find invoice with id of ${id}`, 404);
    }
    
    const compCode = compCodeResults.rows[0].comp_code;
    const companyResults = await db.query(`SELECT * FROM companies WHERE code = $1`, [compCode]);
    const invoiceCompany = companyResults.rows[0];
    let invoice = results.rows[0];
    invoice.company = invoiceCompany;

    return res.json({ invoice });
  } catch (e) {
    return next(e);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { comp_code, amt } = req.body;

    if (!comp_code || !amt) {
      throw new ExpressError("'comp_code' and 'amt' are both required in the request body", 400);
    }

    const compCodeResults = await db.query(`SELECT * FROM companies WHERE code = $1`, [comp_code]);

    if (compCodeResults.rows.length === 0) {
      throw new ExpressError(`${comp_code} is not a valid comp_code`, 400);
    }

    const results = await db.query(`INSERT INTO invoices (comp_code, amt) VALUES ($1, $2) RETURNING *`, [comp_code, amt]);

    return res.status(201).json({ invoice: results.rows[0] });
  } catch (e) {
    return next(e);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { amt, paid } = req.body;

    if (!amt && (!paid && paid !== false)) {
      throw new ExpressError("You need to include either 'amt' or 'paid' in the request body", 400);
    }

    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    const fullDate = `${yyyy}-${mm}-${dd}`;
    let results;

    if (amt && paid) {
      if (typeof(amt) !== 'number') {
        throw new ExpressError("'amt' needs to be a number", 400);
      }

      if (typeof(paid) !== 'boolean') {
        throw new ExpressError("'paid' needs to be a boolean", 400);
      }

      results = await db.query(`UPDATE invoices SET amt = $1, paid = $2, paid_date = $3 WHERE id = $4 RETURNING *`, [amt, paid, fullDate, id]);
    } else if (amt && paid === false) {
      if (typeof(amt) !== 'number') {
        throw new ExpressError("'amt' needs to be a number", 400);
      }

      results = await db.query(`UPDATE invoices SET amt = $1, paid = $2, paid_date = $3 WHERE id = $4 RETURNING *`, [amt, paid, null, id]);
    } else if (amt) {
      if (typeof(amt) !== 'number') {
        throw new ExpressError("'amt' needs to be a number", 400);
      }

      results = await db.query(`UPDATE invoices SET amt = $1 WHERE id = $2 RETURNING *`, [amt, id]);
    } else if (paid) {
      if (typeof(paid) !== 'boolean') {
        throw new ExpressError("'paid' needs to be a boolean", 400);
      }

      results = await db.query(`UPDATE invoices SET paid = $1, paid_date = $2 WHERE id = $3 RETURNING *`, [paid, fullDate, id]);
    } else if (paid === false) {
      results = await db.query(`UPDATE invoices SET paid = $1, paid_date = $2 WHERE id = $3 RETURNING *`, [paid, null, id]);
    }

    if (results.rows.length === 0) {
      throw new ExpressError(`Can't find invoice with id of ${id}`, 404);
    }

    return res.json({ invoice: results.rows[0] });
  } catch (e) {
    return next(e);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const results = await db.query(`DELETE FROM invoices WHERE id = $1 RETURNING *`, [id]);

    if (results.rows.length === 0) {
      throw new ExpressError(`Can't find invoice with id of ${id}`, 404);
    }

    return res.json({ status: "deleted" });
  } catch (e) {
    return next(e);
  }
});

module.exports = router;