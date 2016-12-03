var twitterAPI = require('node-twitter-api');

module.exports = {
    authenticateTwitter: function(req, res, next) {
        var twitter = new twitterAPI({
            consumerKey: '5NXUL76IBoU2Q0bQv8MOxqh1f',
            consumerSecret: 'YR1LUWr4CQTZe3XtpS4zuyG8d0z25T7NCg1Z4Yurj1kphElBEw',
            callback: '/twitter'
        });

        var accessToken = "2655600362-fdV9HNpKROZFbKb2L5VzF7kF7InI6pNCQhriJ7I";
        var accessTokenSecret = "Ypj8ciY1aYl9fYfx1bxChAhteiXmXuylGxNRu4OfmGcKe";

        twitter.verifyCredentials(accessToken, accessTokenSecret, function(error, data, response) {
            if (error) {
                //something was wrong with either accessToken or accessTokenSecret 
                //start over with Step 1 
            } else {
                //accessToken and accessTokenSecret can now be used to make api-calls (not yet implemented) 
                //data contains the user-data described in the official Twitter-API-docs 
                //you could e.g. display his screen_name 
                console.log("Logged in as " + data["screen_name"]);
            }
        });

        req.twitter = twitter;
        req.accessToken = accessToken;
        req.accessTokenSecret = accessTokenSecret;

        next();
    }
}