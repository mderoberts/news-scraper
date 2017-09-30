// Dependencies
var express = require("express");
var bodyParser = require("body-parser");
var logger = require("morgan");
var mongoose = require("mongoose");
var Comment = require("./models/comment.js");
var Article = require("./models/article.js");
var request = require("request");
var cheerio = require("cheerio");

mongoose.Promise = Promise;

var app = express();

// Morgan and body parser 
app.use(logger("dev"));
app.use(bodyParser.urlencoded({
  extended: false
}));

// Make public a static dir
app.use(express.static("public"));

// Database configuration with mongoose
mongoose.connect("mongodb://heroku_gqh51d5m:bua7nrkm0kqtbmt04lu0uqc2md@ds149124.mlab.com:49124/heroku_gqh51d5m");
var db = mongoose.connection;

// Show any mongoose errors
db.on("error", function(error) {
  console.log("Mongoose Error: ", error);
});

// Once logged in to the db through mongoose, log a success message
db.once("open", function() {
  console.log("Mongoose connection successful.");
});


// Routes

// GET request to scrape website and save to db
app.get("/scrape", function(req, res) {
  request("http://www.nytimes.com/", function(error, response, html) {
    var $ = cheerio.load(html);
    $("h2.story-heading").each(function(i, element) {

      var result = {};

      result.title = $(this).children("a").text();
      result.link = $(this).children("a").attr("href");

      var entry = new Article(result);

      entry.save(function(err, doc) {
        if (err) {
          console.log(err);
        }
        else {
          console.log(doc);
        }
      });

    });
  });
  res.send("Scrape Complete");
});

// GET scraped articles from db

app.get("/articles", function(req, res) {
  Article.find({}, function(error, doc) {
    if (error) {
      console.log(error);
    }
    else {
      res.json(doc);
    }
  });
});


// GET articles by objectId
app.get("/articles/:id", function(req, res) {
  Article.findOne({ "_id": req.params.id })
  .populate("comment")
  .exec(function(error, doc) {
    if (error) {
      console.log(error);
    }
    else {
      res.json(doc);
    }
  });
});


// Create and remove comments
app.post("/articles/:id", function(req, res) {
  var newComment = new Comment(req.body);

  newComment.save(function(error, doc) {
    if (error) {
      console.log(error);
    }
    else {
      Article.findOneAndUpdate({ "_id": req.params.id }, { "comment": doc._id })
      .exec(function(err, doc) {
        if (err) {
          console.log(err);
        }
        else {
          res.send(doc);
        }
      });
    }
  });
});



// Listen on port 3000
app.listen(3000, function() {
    console.log("App running on port 3000!");
  });
  