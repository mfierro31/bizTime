/** BizTime express application. */
const express = require("express");
const app = express();
const ExpressError = require("./expressError")

app.use(express.json());

const cRoutes = require('./routes/companies');
const iRoutes = require('./routes/invoices');
const indRoutes = require('./routes/industries');
const ciRoutes = require('./routes/companies_industries');

app.use('/companies', cRoutes);
app.use('/invoices', iRoutes);
app.use('/industries', indRoutes);
app.use('/ci', ciRoutes);

/** 404 handler */

app.use(function(req, res, next) {
  const err = new ExpressError("Not Found", 404);
  return next(err);
});

/** general error handler */

app.use((err, req, res, next) => {
  res.status(err.status || 500);

  return res.json({
    error: [err, err.message]
  });
});

module.exports = app;