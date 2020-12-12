const express = require("express");
const ExpressError = require("../expressError");
const router = express.Router();
const db = require("../db");
const slugify = require("slugify");

router.get('/', async (req, res, next) => {
  try {
    const results = await db.query(`SELECT code, industry FROM industries`);

    const industries = results.rows;

    const compCodesResults = await Promise.all(industries.map(r => db.query(`SELECT comp_code FROM companies_industries WHERE ind_code = $1`, [r.code])));
    const compCodes = compCodesResults.map(r => r.rows);

    const finalArr = [];

    for (let i = 0; i < industries.length; i++) {
      industries[i].comp_codes = compCodes[i].map(c => c.comp_code);
      finalArr.push(industries[i]);
    }

    return res.json({ industries: finalArr });
  } catch (e) {
    return next(e);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const rawCode = req.body.code;
    const { industry } = req.body;

    if (!rawCode || !industry) {
      throw new ExpressError("You have to include both 'code' and 'industry' in the request body", 400);
    }

    const code = slugify(rawCode, {lower: true, strict: true});

    const results = await db.query(`INSERT INTO industries VALUES ($1, $2) RETURNING code, industry`, [code, industry]);

    return res.status(201).json({ industry: results.rows[0] });
  } catch (e) {
    return next(e);
  }
});

module.exports = router;