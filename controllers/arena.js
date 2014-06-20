var User = require('../models/User');

/**
 * GET /
 * Arena!!
 */

exports.index = function(req, res) {
  res.render('arena/index', {
    title: 'Arena',
    loadArena: true
  });
};

exports.success = function(req, res) {

  User.findById(req.user.id, function(err, user) {
    if (err) return next(err);
    user.goldenTicket = '12344';

    user.save(function(err) {
      if (err) return next(err);
      res.render('arena/success', {
        title: 'Success'
      });
    });
  });

};
