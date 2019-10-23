var express = require("express");
var logger = require("morgan");
var mongoose = require("mongoose");

// Our scraping tools
// Axios is a promised-based http library, similar to jQuery's Ajax method
// It works on the client and on the server
var axios = require("axios");
var cheerio = require("cheerio");

var PORT = 9001;

// Require all models
var db = require("./models");

// Initialize Express
var app = express();

// Configure middleware

// Use morgan logger for logging requests
app.use(logger("dev"));
// Parse request body as JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// Make public a static folder
app.use(express.static("public"));

//connect mongoose to your remote mongolab database if deployed, otherwise will connect to the local database on your computer
var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/bonappetit";

mongoose.connect(MONGODB_URI, { useNewUrlParser: true });


// A GET route for scraping the echoJS website
app.get("/scrape", function (req, res) {
    // console.log("triggered");

    // First, we grab the body of the html with axios
    axios.get("https://arstechnica.com/").then(function (response) {
        // Then, we load that into cheerio and save it to $ for a shorthand selector
        var $ = cheerio.load(response.data);

        // Now, we grab every h2 within an article tag, and do the following:
        $(".tease.article").each(function (i, element) {
            // Save an empty result object
            var result = {};

            // Add the text and href of every link, and save them as properties of the result object
            result.title = $(this).children("header").children("h2").text();
            result.summary = $(this).children("header").children("p.excerpt").text();
            result.link = $(this).children("a").attr("href");
            // console.log("title: " + title, "summary: " + summary, "link: " + link);

            // Create a new Article using the `result` object built from scraping
            console.log(result);

            db.Article.create(result)
                .then(function (dbArticles) {
                    // View the added result in the console
                    console.log(dbArticles);
                })
                .catch(function (err) {
                    // If an error occurred, log it
                    console.log(err);
                });
        });

        // Send a message to the client
        res.send("Scrape Complete");
    });
});


// Start the server
app.listen(PORT, function () {
    console.log("App running on port " + PORT + "!");
});