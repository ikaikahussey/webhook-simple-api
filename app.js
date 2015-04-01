var Firebase=require('firebase');
var config=require('./config.json');
var _ = require('lodash');
var restify = require('restify');

// Setup Firebase
var FB = new Firebase(config.webhook.firebase + '/buckets/' + config.webhook.siteName + '/' + config.webhook.secretKey + '/dev');

// Content types
var contentTypes = [];

// Login to Firebase
FB.authWithPassword({
  email: config.webhook.username,
  password: config.webhook.password
},fbAuthHandler);

// Setup server
var server = restify.createServer( {
  name: config.server.name,
  version: config.server.version
});

// Middleware
//server.use(restify.CORS());
server.use(restify.fullResponse());
server.use(restify.acceptParser(server.acceptable));
server.use(restify.queryParser());
server.use(restify.bodyParser());

// Setup routes
// ------------

// Return all content types as array
server.get('/content-types', function(req, res, next) {
  res.send(200,contentTypes);
  return next();
});

// Get all content type entries as array: /content-type/foo
// Get a content type entry as object by slug /content-type/foo?slug=bar
server.get('/content-type/:type', function(req,res,next) {

  var contentType = req.params.type;
  var slug = req.query.slug || false;

  // Get current content-types
  FB.child('contentType').once('value', function(s) {
    contentTypes = s.val();
    if(_.keys(contentTypes).indexOf(contentType) == -1) {
      res.send(404,'Not Found: ' + contentType );
    } else {
      FB.child('data/' + contentType).once('value', function(s) {
        if(slug) {

          // TODO - Setup contingency for finding page in case Webhook doesn't implement slug storage
          var page={};
          _.forEach(s.val(), function(n, i) {
            if(n.slug === slug) {
              page[i] = n;
            }
          });
          if(typeof page !== 'undefined' && Object.keys(page).length) {
            res.send(200,page);
          } else {
            res.send(404,'Page Not Found: ' + slug)
          }
        } else if (req.query.something_else) {
          // Filter on something_else
        }
        else {
          res.send(200, s.val());
        }
      }, function(e) {
        return(500,'Error accessing "' + contentType + '".');
      });
    }


  }, function(e) {
    // Catch error
  });


  return next();
});

// Listen
server.listen(config.server.port, function() {
  console.log('%s listening at %s', server.name, server.url);
});


// Utils
//
function fbAuthHandler(err,authData) {
  console.log('Connecting to: ' + config.webhook.firebase + '/buckets/' + config.webhook.siteName + '/' + config.webhook.secretKey + '/dev');
  if(err) {
    console.log(err);
    exit;
  } else {    
    console.log('Connected. Firebase authentication successful as ' + config.webhook.username);
  }
}