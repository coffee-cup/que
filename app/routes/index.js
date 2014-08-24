var log = require('../../config/log');
var shortId = require('shortId');

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
      } else {
        res.redirect('/');
      }
    });
  });

  app.post('/createPage', function(req, res) {
    var page_id = shortId.generate();
    log.info('created page with id ' + page_id);
    // add an empty item to the page
    // so the link can be shared right away
    client.zadd(page_id, '1', {});

    // send back the page_id the client should redirect to
    res.json({
      page_id: page_id
    });
  });
}
