var User = require('../models/User');

/**
 * GET /
 * Arena!!
 */

exports.index = function(req, res) {
  if (typeof req.user.goldenTicket === 'undefined') {
    res.render('arena/index', {
      title: 'Arena',
      loadArena: true,
      roomId: 321513,
      componentId: 39763,
      seed: req.user._id
    });
  } else {
    req.flash('info', { msg: "You've already coded your way into TCO14. Your code is below." });
    res.redirect('/account');
  }
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
