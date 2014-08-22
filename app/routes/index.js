/* GET home page. */
module.exports = function(app, client) {
  app.get('/', function(req, res) {
    res.render('index');
  });

  app.get('/:key', function(req, res) {
    client.exists(req.params.key, function(err, isThere) {
      if (err) console.log(err);

      if (isThere) {
        res.render('index');
      }else {
        res.redirect('/');
      }
    });
  });
}
