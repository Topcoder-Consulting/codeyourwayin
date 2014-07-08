/**
 * GET /
 * Home page.
 */

 var verification = require("../lib/verification.js");

exports.index = function(req, res) {

verification.login(req.cookies.tcsso);

  res.render('home', {
    title: 'Home'
  });
};
