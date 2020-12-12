const express = require("express");
const ExpressError = require("../expressError");
const router = express.Router();
const db = require("../db");
const slugify = require("slugify");

router.post('/', async (req, res, next) => {
  try {
    const { comp_code, ind_code } = req.body;

    if (!comp_code || !ind_code) {
      throw new ExpressError("You need to include both 'comp_code' and 'ind_code' in the request body.", 400);
    }

    // check to see if the combination of comp_code and ind_code are already a primary key in companies_industries
    // and if they even exist at all in companies and industries

    const checkOne = await db.query(`SELECT comp_code, ind_code FROM companies_industries WHERE comp_code = $1 AND ind_code = $2`, [comp_code, ind_code]);
    const checkTwo = await db.query(`SELECT code FROM companies WHERE code = $1`, [comp_code]);
    const checkThree = await db.query(`SELECT code FROM industries WHERE code = $1`, [ind_code]);

    if (checkOne.rows.length === 0 && checkTwo.rows.length > 0 && checkThree.rows.length > 0) {
      const result = await db.query(`INSERT INTO companies_industries VALUES ($1, $2) RETURNING comp_code, ind_code`, [comp_code, ind_code]);

      return res.status(201).json({ company_industry: result.rows[0] });
    } else if (checkOne.rows.length > 0) {
      throw new ExpressError(`Combination of comp_code: ${comp_code} and ind_code: ${ind_code} already exists.  Try another combination.`, 400);
    } else if (checkTwo.rows.length === 0) {
      throw new ExpressError(`${comp_code} is not a valid comp_code`, 400);
    } else if (checkThree.rows.length === 0) {
      throw new ExpressError(`${ind_code} is not a valid ind_code`, 400);
    }
  } catch (e) {
    return next(e);
  }
});

module.exports = router;