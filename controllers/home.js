/**
 * GET /
 * Home page.
 */

exports.index = function(req, res) {
  res.render('home', {
    title: 'Home'
  });
};

exports.doh = function(req, res) {
  res.render('doh', {
    title: 'Oops!!'
  });
};