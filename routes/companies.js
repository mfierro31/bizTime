const express = require("express");
const ExpressError = require("../expressError");
const router = express.Router();
const db = require("../db");
const slugify = require("slugify");

router.get('/', async (req, res, next) => {
  try {
    const results = await db.query(`SELECT code, name FROM companies`);
    return res.json({ companies: results.rows });
  } catch (e) {
    return next(e);
  }
});

router.get('/:code', async (req, res, next) => {
  try {
    const rawCode = req.params.code;
    const code = slugify(rawCode, {lower: true, strict: true});

    const results = await db.query(`
    SELECT c.code, c.name, c.description, inv.id, ind.industry FROM companies AS c
      LEFT JOIN invoices AS inv ON c.code = inv.comp_code
      LEFT JOIN companies_industries AS ci ON c.code = ci.comp_code
      LEFT JOIN industries AS ind ON ci.ind_code = ind.code
    WHERE c.code = $1
    `, [code]);

    if (results.rows.length === 0) {
      throw new ExpressError(`Can't find company with code of ${code}`, 404);
    }

    const { name, description } = results.rows[0];
    const invoicesFirstRound = results.rows.map(r => r.id);
    // gets rid of any duplicates with Set and then spread the results of Set into an array
    const invoices = [...new Set(invoicesFirstRound)];
    const industriesFirstRound = results.rows.map(r => r.industry);
    const industries = [...new Set(industriesFirstRound)];
    
    return res.json({ company: { code, name, description, invoices, industries } });
  } catch (e) {
    return next(e);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const rawCode = req.body.code;
    const { name, description } = req.body;

    if (!rawCode || !name || !description) {
      throw new ExpressError("'code', 'name', and 'description' are all required in the request body", 400);
    }

    const code = slugify(rawCode, {lower: true, strict: true});

    const results = await db.query(`INSERT INTO companies (code, name, description) VALUES ($1, $2, $3) RETURNING *`, [code, name, description]);
    return res.status(201).json({ company: results.rows[0] });
  } catch (e) {
    return next(e);
  }
});

router.put('/:code', async (req, res, next) => {
  try {
    const rawCode = req.params.code;
    const code = slugify(rawCode, {lower: true, strict: true});

    const { name, description } = req.body;
    let results;

    if (!name || !description) {
      throw new ExpressError("You need to include both 'name' and 'description' in the request body", 400);
    } else {
      results = await db.query(`UPDATE companies SET name = $1, description = $2 WHERE code = $3 RETURNING *`, [name, description, code]);
    }

    if (results.rows.length === 0) {
      throw new ExpressError(`Can't find company with code of ${code}`, 404);
    }

    return res.json({ company: results.rows[0] });
  } catch (e) {
    return next(e);
  }
});

// We could do the route above like that, but a better way would be to make it so that you could only update one thing if you
// want to, and not have to send both 'name' and 'description' every request:

// router.put('/:code', async (req, res, next) => {
//   try {
//     const rawCode = req.params.code;
//     const code = slugify(rawCode, {lower: true, strict: true});
//     const { name, description } = req.body;
//     let results;

//     if (!name && !description) {
//       throw new ExpressError("You need to include either 'name' or 'description' in the request body", 400);
//     } else if (name && description) {
//       results = await db.query(`UPDATE companies SET name = $1, description = $2 WHERE code = $3 RETURNING *`, [name, description, code]);
//     } else if (name) {
//       results = await db.query(`UPDATE companies SET name = $1 WHERE code = $2 RETURNING *`, [name, code])
//     } else {
//       results = await db.query(`UPDATE companies SET description = $1 WHERE code = $2 RETURNING *`, [description, code])
//     }

//     if (results.rows.length === 0) {
//       throw new ExpressError(`Can't find company with code of ${code}`, 404);
//     }

//     return res.json({ company: results.rows[0] });
//   } catch (e) {
//     return next(e);
//   }
// });

router.delete('/:code', async (req, res, next) => {
  try {
    const rawCode = req.params.code;
    const code = slugify(rawCode, {lower: true, strict: true});

    const results = await db.query(`DELETE FROM companies WHERE code = $1 RETURNING *`, [code]);

    if (results.rows.length === 0) {
      throw new ExpressError(`Can't find company with code of ${code}`, 404);
    }

    return res.json({ status: "deleted" });
  } catch (e) {
    return next(e);
  }
});

module.exports = router;