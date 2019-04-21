var express = require('express');
var router = express.Router();
const config = require('../config.json');
var querystring = require('querystring');
var cookieParser = require('cookie-parser');
const request = require('request');
var stateKey = 'spotify_auth_state';

router.use(express.urlencoded())

//Redirect URI for Spotify login
let redirect_uri = 'http://localhost:3000/callback'

//Spoonacular API Key & Host
key = config.ingredients.key;
host = config.ingredients.host;

//Access token & refresh token global
var access_token = null;
var refresh_token = null;
var user_id = '';

var generateRandomString = function(length) {
  var text = '';
  var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (var i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};



/* TODO:
  -Query database & add models folder and files
  -Format buttons for response
  -Put refresh button on search results page and make global variable that is incremented by 5 every time we do a refresh & if new search it starts from 0 again
  -Display widget
  -Make sure recipe still displayed with widget
  -From recipe page, pass cook time
  -Separate routing
  -Whenever we use spotify, check if the tokens have expired. If so, refresh them
  -Store tokens, expiry time in database with user

  -CREATE PLAYLIST
    FIND UR ISSUES
    -Try API calls for searching
    -Try API calls for adding tracks to playlist

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Emma\'s Example Spotify App!' });
});


//Login with spotify
router.get('/login', function(req, res, next) {

  var state = generateRandomString(16);
  res.cookie(stateKey, state);

  // your application requests authorization
  var scope = 'user-read-private playlist-modify-public playlist-modify-private';
  res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: config.spotify.cli_id,
      scope: scope,
      redirect_uri: redirect_uri,
      state: state
    }));
});

/* GET Callback From login */
router.get('/callback?', function(req, res, next){
  console.log("REQ ", req.query);

  var code = req.query.code || null;
  var state = req.query.state || null;
  var storedState = req.cookies ? req.cookies[stateKey] : null;

  if (state === null || state !== storedState) {
    res.redirect('/#' +
      querystring.stringify({
        error: 'state_mismatch'
      }));
  } else {
    res.clearCookie(stateKey);
    var authOptions = {
      url: 'https://accounts.spotify.com/api/token',
      form: {
        code: code,
        redirect_uri: redirect_uri,
        grant_type: 'authorization_code'
      },
      headers: {
        Authorization: 'Basic ' + (new Buffer(config.spotify.cli_id + ':' + config.spotify.cli_secret).toString('base64'))
      },
      json: true
    };
  
  
    //Exchange access code for token
    request.post(authOptions, function(error, response, body) {
      if (error || response.statusCode != 200) { return console.log(error); }
      //Store the access token, refresh token, and time of expiry in the database with user information
      access_token = body.access_token;
      refresh_token = body.refresh_token;
      const expirationTime = new Date().getTime() + body.expiresIn * 1000;
      console.log('Access Token ', access_token)

      //Get spotify ID profile info & store in DB
      var authParam = 'Bearer ' + access_token;
      console.log(authParam);
      var profOptions = { method: 'GET',
        url: 'https://api.spotify.com/v1/me',
        qs: { '': '' },
        headers: {
          Authorization: authParam
        },
        json: true
      };

      var name = '';
      request(profOptions, function(error, response, body) {
        if (error || response.statusCode != 200) { return console.log(error); }
        console.log(body);
        if(body.display_name != null){
          name = body.display_name;
        }

        user_id = body.id;
        console.log("User ID ",user_id);
        res.render('landingPage', { title: name });
      });

    });

    
    
    
  
  }
});

/* POST ingredients list for search */
router.post('/getRecipes', function(req, response, next) {
  console.log(req.body.ingredients);

  qs = {includeIngredients: req.body.ingredients, limitLicense: false, offset: '0', number: '5'};

  //Query database for diets and intolerances

  //Convert to strings separated by commas

  //If not empty diets, add to query string

  //If not empty intolerances, add to query string

  //Get the recipes from the API
  request.get({headers: {"X-RapidAPI-Key": key, "X-RapidAPI-Host": host },
  url:'https://spoonacular-recipe-food-nutrition-v1.p.rapidapi.com/recipes/searchComplex',
  qs: qs, json: true}, (err, res, body) => {

    if (err) { return console.log(err); }
    console.log(body);

    //Render the results
    response.render('recipeResults', {body: body, title: 'CS411Lab5Group1'});
  });
});


  /*POST View Recipe*/

  router.post('/viewRecipe', function(req, response, next){
    console.log("RECIPE ID: ", req.body.recButton);
    var rec_id = req.body.recButton;
    qs = {"id": rec_id};
    var url = 'https://spoonacular-recipe-food-nutrition-v1.p.rapidapi.com/recipes/' + rec_id;
    url+= '/information';
    console.log(url);

    request.get({headers: {'X-RapidAPI-Key': key, 'X-RapidAPI-Host': 'spoonacular-recipe-food-nutrition-v1.p.rapidapi.com'},
    url: url,
    qs: qs, json: true}, (err, res, body) => {

      if (err) { return console.log(err); }
      console.log(body);

      response.render('recipeInformation', {recTitle: body.title, recTime: body.readyInMinutes, recInstructions: body.instructions, recIngredients: body.extendedIngredients, title: 'CS411Lab5Group1'});

    });
  /*
  setTimeout(function() {
    console.log(response);
  }, 5000);*/
  
  //obj = JSON.parse(response);

  //Send the results to be rendered with the object

  });

//Create playlist 
router.post('/createPlaylist', function(req, response, next) {
  //See if Spotify token expired, if so, refresh!
  //Query database for genres they like
    //Pick random genre
    let selectedGenre = "jazz";
    let RecipeName = 'ThisRecipeFire';
    let url = 'https://api.spotify.com/v1/users/' + user_id + '/playlists';
    console.log(url);
    var trackResults = [];
  //If no genres, reply with need to fill out profile message
  //Make playlist on their account with name of recipe
  var options = { method: 'POST',
  url: url,
  qs: { '': '' },
  body: { 'name': RecipeName },
  headers: 
   { 'Content-Type': 'application/json',
     Authorization: 'Bearer ' + access_token },
  json: true };

  request(options, function (error, response, body) {
    if (error) { return console.log(error); }

    console.log(body);

    //New playlist ID
    let newPlaylistID = body.id;

    //Get playlist ID
    //Do a search by selected genre for 250 songs, shuffle. 
    var i = 0;
    var counter = 0;
    for (i = 0; i <= 250; i +=50){
      console.log("I === " + i);
      var offset = i.toString();
      var options = { method: 'GET',
      url: 'https://api.spotify.com/v1/search',
      qs: {q: "genre: " + selectedGenre, limit: '50', offset: offset, type: 'track'},
      headers: 
      {
        Authorization: 'Bearer ' + access_token },
        json: true };
      request(options, function (error, response, body) {
        if (error) throw new Error(error);
      
        console.log(body);
        var arrayLength = body.tracks["items"].length;
        for(i = 0; i < arrayLength; i++){
              trackResults.push(body.tracks["items"][i]);
        }


        //If we have finished our final call
        if(counter === 5){
          trackIDs = [];
          //While time <= cook time of recipe, keep adding songs from this list to track IDs to add to playlist
          i = 0;
          var totalTime = 0;
          //TODO: GET RID OF HARD CODE
          var cookTime = 30; 
          while(totalTime <= cookTime){
            console.log("RESULT ID:", trackResults[i]["uri"]);
            //Append song to list of track IDs
              trackIDs.push(trackResults[i]["uri"]);
            //Add time of song to total time & convert to minutes
              var trackLength = trackResults[i].duration_ms / 60000;
              totalTime += trackLength;
            //Next item on list
              i++;

          }

          //Make request to add these track IDs to new playlist
          
          options = { method: 'POST',
          url: 'https://api.spotify.com/v1/playlists/' + newPlaylistID + '/tracks',
          body: {'uris': trackIDs},
          headers: 
          {
            Authorization: 'Bearer ' + access_token, 'Content-Type': 'application/json', Accept: "application/json" },
          json: true };
          request(options, function (error, response, body) {
            if (error) throw new Error(error);
          
            console.log(body);

          //Send ID back to display widget

          });
        }


        counter++;
      });
        
        
    }
        

        //Shuffle track results
        //np.random.shuffle(trackResults)
        //np.random.shuffle(trackResults)
          
        //Get track IDs
          //for i intrackResults)):
            //trackIDs.push(trackResults[i]['id'])
        /*
        //While time <= cook time of recipe, keep adding songs from this list to track IDs to add to playlist
        i = 0;
        var totalTime = 0;
        //TODO: GET RID OF HARD CODE
        var cookTime = 30; 
        while(totalTime <= cookTime){
          console.log("RESULT ID:", trackResults[i]["id"]);
          //Append song to list of track IDs
            trackIDs.push(trackResults[i]["id"]);
          //Add time of song to total time & convert to minutes
            var trackLength = trackResults[i].duration_ms * 60000;
            totalTime += trackLength;
          //Next item on list
            i++;
        }*/


        
     
    
    

    

  });
});

 module.exports = router;
/*
 async function refreshToken(){
   // requesting access token from refresh token
  var refresh_token = req.query.refresh_token;
  var authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    headers: { 'Authorization': 'Basic ' + (new Buffer(config.spotify.cli_id + ':' + config.spotify.cli_secret).toString('base64')) },
    form: {
      grant_type: 'refresh_token',
      refresh_token: refresh_token
    },
    json: true
  };

  await request.post(authOptions, function(error, response, body) {
    if (!error && response.statusCode === 200) {
      access_token = body.access_token;
      res.send({
        'access_token': access_token
      });
    }
  });
  
 };
/* Check if the token has expired yet -- if so, refresh tokens, if not, we're fine
 async componentDidMount() {
  const tokenExpirationTime = await getUserData('expirationTime');
  if (!tokenExpirationTime || new Date().getTime() > tokenExpirationTime) {
    await refreshToken();
  } else {
    this.setState({ accessTokenAvailable: true });
  }
}*/
