/**
 * Copyright 2015 IBM Corp. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

var express    = require('express'),
  app          = express(),
  watson       = require('watson-developer-cloud'),
  extend       = require('util')._extend,
  i18n         = require('i18next'),
  twitterAPI = require('node-twitter-api');

//i18n settings
require('./config/i18n')(app);

// Bootstrap application settings
require('./config/express')(app);

// Create the service wrapper
var personalityInsights = watson.personality_insights({
  version: 'v2',
  username: '7bb59d9b-6804-4ae9-9ce5-1d916bb8a45b',
  password: 'WGEGou4TDibS'
});

var middleware = require('./routes/middleware');

app.get('/', function(req, res) {
  res.render('index', { ct: req._csrfToken });
});

app.get('/twitter', function(req, res) {
  res.render('twitter', { ct: req._csrfToken });
});

function tweetsAsync(screen_name, options) {
  return new Promise(function(resolve, object) {
    twitter.getTimeline("user", {screen_name: "Oprah", count:options.count}, accessToken, accessTokenSecret, function(error, data, response) {
      if (error) {
        console.error("Something went wrong");
      }
      else {
        resolve(all_tweets.text);
      }
    });
  })
}

function getMaxTweets(data) {
  if (data.length > 0) {
    max_id = data[data.length - 1].id - 1;
    options.max_id = max_id;
    options.count = 100;

    response = response.concat(data);

    if (data.length < 2) {
      // do stuff with your tweets 
     console.log(response);

    } else {
      tweetsAsync("Oprah", options).then( getMaxTweets );
    }
  }
}

app.post('/tweets', middleware.authenticateTwitter, function(req, res) {
  var body = req.body;
  var screen_name = body.screen_name;
  var twitter = req.twitter;
  var accessToken = req.accessToken;
  var accessTokenSecret = req.accessTokenSecret;
  var options = { count: 100 };

  tweetsAsync("Oprah", options).then( getMaxTweets );
});

app.post('/api/profile', function(req, res, next) {
  var parameters = extend(req.body, { acceptLanguage : i18n.lng() });

  personalityInsights.profile(parameters, function(err, profile) {
    if (err)
      return next(err);
    else
      return res.json(profile);
  });
});

// error-handler settings
require('./config/error-handler')(app);

var port = process.env.VCAP_APP_PORT || 3000;
app.listen(port);
console.log('listening at:', port);

module.exports = app; 
