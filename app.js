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
  twitter      = require('twitter'),
  mysql        = require('mysql'),
  Promise = require('bluebird');
  
var connection = mysql.createConnection({
  host: 'us-cdbr-iron-east-04.cleardb.net',
  user: 'b7e2ec6a14ff9f',
  password: '9a6a9a08',
  database: 'ad_66f146c0c6550bb'
});

connection.connect(function(err) {
  if (err) {
    console.log('Error connecting to mysql database');
  }
});


var config = {
  consumer_key: '5NXUL76IBoU2Q0bQv8MOxqh1f',
  consumer_secret: 'YR1LUWr4CQTZe3XtpS4zuyG8d0z25T7NCg1Z4Yurj1kphElBEw',
  access_token_key: '2655600362-fdV9HNpKROZFbKb2L5VzF7kF7InI6pNCQhriJ7I',
  access_token_secret: 'Ypj8ciY1aYl9fYfx1bxChAhteiXmXuylGxNRu4OfmGcKe'
};

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

app.post('/tweets', function(req, res) {
  var body = req.body;
  var screen_name = body.screen_name;

  var options = {count: 100, screen_name: screen_name};
  var results = [];
  var count = 0;
  var tweets = [];

  function twitterSearchAsync(options) {
    var twitterClient = new twitter(config);

    return new Promise(function(resolve,reject){
      twitterClient.get('statuses/user_timeline', options, function(error, data){
        // console.log("success twitter", data);
        resolve(data);
      });
    });
  }

  function getMaxHistory (data) {
    var max_id, options, oldest, newest;
    if (data.length > 0) {
      // get oldest tweet
      max_id = data[data.length - 1].id - 1;
      options = {};
      options.count = 100;
      options.max_id = max_id;
      options.screen_name = screen_name;
      newest = data[0].created_at;
      oldest = data[data.length - 1].created_at;

      tweets = tweets.concat(data);
    }

   // if theres no more tweets being returned, break recursion
    if (data.length < 2) { 
      var tweets_text = "";
      for (var index in tweets) {
        tweets_text = tweets_text.concat(tweets[index].text);
      }

      personalityInsights.profile({text: tweets_text}, function(err, profile) {
        if (err)
          return res.status(500).send(err);
        else
          var traits = profile.tree.children[0].children[0].children;
          var personality = {};

          for (var index in traits) {
            var trait_name = traits[index].id;
            if (trait_name == 'Conscientiousness') {
              personality['Orderliness'] = traits[index].children[3].percentage;
            }
            if (trait_name == 'Openness') {
              personality['Adventurousness'] = traits[index].children[0].percentage;
              personality['Authority-challenging'] = traits[index].children[5].percentage;
            }
            if (trait_name == 'Extraversion') {
              personality['Excitement-seeking'] = traits[index].children[3].percentage;
            }
            var percentage = traits[index].percentage;
            personality[trait_name] = percentage;
          }

          var car_analysis = {};

          if (((personality.Conscientiousness + personality.Agreeableness + personality.Neuroticism) / 3) > 
            (personality.Openness + personality.Extraversion) / 2) {
              car_analysis.cheaper = true;
          } else {
              car_analysis.cheaper = false;
          }

          if (((personality.Conscientiousness + personality.Orderliness) / 2) > personality.Openness) {
            car_analysis.traditional = true;
          } else {
            car_analysis.traditional = false;
          }

          if (((personality.Adventurousness + personality['Excitement-seeking'] + personality['Authority-challenging']) / 3) > personality.Agreeableness) {
            car_analysis.powerful = true;
          } else {
            car_analysis.powerful = false;
          }

          var expensive_cars = [];
          var cheap_cars = [];
          var powerful_cars = [];
          var weak_cars = [];
          var trad_cars = [];
          var conver_cars = [];
          var query = connection.query("select * from car_ad_tags where tag='Expensive'", function(err, rows){
            if (err){
              throw err;
            }
            for(var i=0; i < rows.length; i++) {
              expensive_cars.push(rows[i].filename);
            }
            // console.log(expensive_cars);
            var query = connection.query("select * from car_ad_tags where tag='Cheap'", function(err, rows){
            if (err){
              throw err;
            }
            for(var i=0; i < rows.length; i++) {
              cheap_cars.push(rows[i].filename);
            }
            // console.log(cheap_cars);
                     var query = connection.query("select * from car_ad_tags where tag='Powerful'", function(err, rows){
            if (err){
              throw err;
            }
            for(var i=0; i < rows.length; i++) {
              powerful_cars.push(rows[i].filename);
            }
            // console.log(powerful_cars);
                     var query = connection.query("select * from car_ad_tags where tag='Weak'", function(err, rows){
            if (err){
              throw err;
            }
            for(var i=0; i < rows.length; i++) {
              weak_cars.push(rows[i].filename);
            }
            // console.log(weak_cars);
                     var query = connection.query("select * from car_ad_tags where tag='Traditional'", function(err, rows){
            if (err){
              throw err;
            }
            for(var i=0; i < rows.length; i++) {
              trad_cars.push(rows[i].filename);
            }
            // console.log(trad_cars);
                     var query = connection.query("select * from car_ad_tags where tag='Convertible'", function(err, rows){
            if (err){
              throw err;
            }
            for(var i=0; i < rows.length; i++) {
              conver_cars.push(rows[i].filename);
            }
            // console.log(conver_cars);

            var big_array = [];

            if (car_analysis.cheaper){
              big_array = big_array.concat(cheap_cars);
            } else{
              big_array = big_array.concat(expensive_cars);
            }
            if(car_analysis.powerful){
              big_array = big_array.concat(powerful_cars);
            } else{
              big_array = big_array.concat(weak_cars);
            }
            if(car_analysis.traditional){
              big_array = big_array.concat(trad_cars);
            } else{
              big_array = big_array.concat(conver_cars);
            }

            var temp_arr = [];
            var count_arr = [];
            for(var i=0; i<big_array.length; i++){
              if(temp_arr.indexOf(big_array[i])){
                if(count_arr[big_array[i]]){
                  count_arr[big_array[i]].count++;
                } else{
                  var obj = {};
                  obj = {count: 1, filename: big_array[i]};
                  count_arr.push(obj);
                }
              } else{
                temp_arr.push(big_array[i]);
              }
            }
            var max = 0;
            var sugg;
            for(var i=0; i<count_arr.length; i++){
              if(max < count_arr[i].count){
                max = count_arr[i].count;
                sugg = count_arr[i].filename;
              }
            }

            var traits_list = [];
            var tags = [];
            
            if (car_analysis.cheaper) {
              traits_list.push('Conscientiousness', 'Neuroticism', 'Agreeableness');
              tags.push('Cheap');
            } else {
              traits_list.push('Openness', 'Extraversion');
              tags.push('Expensive');
            }

            if (car_analysis.powerful) {
              traits_list.push('Adventurousness', 'Excitement-Seeking', 'Authority-challenging');
              tags.push('Powerful');
            } else {
              traits_list.push('Agreeableness');
              tags.push('Weak');
            }

            if (car_analysis.traditional) {
              traits_list.push('Conscientiousness', 'Orderliness');
              tags.push('Traditional');
            } else {
              traits_list.push('Openness');
              tags.push('Convertible');
            }
            
            var return_obj = {sugg: sugg, traits_list:traits_list, tags:tags}

            connection.end(function(err) {
              
            });

            console.log(return_obj);

            res.send(return_obj)
          });
 
          });
 
          });
 
          });
 
          });
 
          });
        });
    } else {
      twitterSearchAsync(options).then( getMaxHistory );
    }
  }

  twitterSearchAsync(options).then( getMaxHistory );
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
