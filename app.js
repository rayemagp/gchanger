var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

////////////// MONGO DB ////////////////////
var mongodb = require('mongodb');
var db = mongodb.MongoClient;
var url = "mongodb://admin:admin@ds053874.mongolab.com:53874/gamechangers";
///////////////////////////////////////////

var routes = require('./routes/index');
var users = require('./routes/users');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'bower_components')));

app.use('/', routes);
app.use('/users', users);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: err
  });
});

/////////////////////////// SOCKET.IO /////////////////////////////
// we use socket.io to push our database queries to the frontend //
// initialise socket.io here                                     //
var http = require('http');
var socketio = require('socket.io');
//Create a socket server at the port
var server = http.createServer(app);
var io = socketio.listen(server);
var port = process.env.PORT || 3000;
server.listen(port, function() {
    console.log(' - listening on ' + port+ ' ' + __dirname);
});


///////////////////////////////// MONGO DB //////////////////////////////////
//We'll use MONGO as our data store. As the server runs, we update our data//
// store with the new data provided with the json file                     //

//connect to the database
db.connect(url, function(err,db){
  if(err){
    console.log(err);
  }
  else {
        //store gamechangers collection to locals
        db.gamechangers = db.collection('gamechangers');

        // Use json as data updating file
        var ReadJson = require("r-json");
        var Scraper = require('google-images-scraper');
        var allfirms, allfirmscount;
        ReadJson(__dirname + "/public/database/gamechangers.json", function (err, data) {

              //count number of firms
              var count=0;
              for(var prop in data) {
                if (data.hasOwnProperty(prop)) {
                  ++count;
                }
              }

              //update the data
              allfirms = data;
              allfirmscount = count;

              var images = [];
              var fi = 1;
              var fillFirms = setInterval(function(){

                  if (fi > allfirmscount)
                  clearInterval(fillFirms);

                  console.log(allfirms[fi].Company);
                  var url = allfirms[fi].Company;

                  var scraper = new Scraper({
                      keyword: url,
                      rlimit: 10	// 10 p second
                  });

                  scraper.list(1).then(function (res) {
                      var link = "";
                      for(var j = 0;j<res.length;j++)
                      {
                          $.ajax({
                              type: 'GET',
                              url: res[j],
                              success: function() {
                                  link = res[j];
                                  console.log(res[j]);
                              },
                              error: function() {
                                  link = "";
                              }
                          });

                          //break if link is empty
                          //clear interval for this emitter
                          if(link!="")
                          {
                              break;
                          }

                      }
                  });

                  fi++;

              },5000);
        });


       /////////////// SOCKET IO CALLS ///////////////////
      //          pass the data to the client           //
      //    jsonChangers contains what we need to pass  //
      //            initialise image array
      var jsonChangers = [];
      var jsonChangersLength = 56;
      io.on('connection', function(client) {
          if (err) {
              console.log(err);
          }
          //no connection problems
          else {
              //store gamechangers collection to locals
              //cycle through all firms if the length is less than max length
              //add them all to the server json object
              if (jsonChangers.length <= (jsonChangersLength - 1))
                  db.gamechangers.find().sort( { _id: 1 } ).forEach(function (firm) {
                      //limit push to max number of gameChangers
                      if (firm) {
                          jsonChangers.push(firm);
                      }

                      //emit to client
                      client.emit('receiveChangers', jsonChangers);
                  });
              else {
                  //straight away emit if the length exceeds required
                  client.emit('receiveChangers', jsonChangers);
              }
          }
      });
  }
});

module.exports = app;
