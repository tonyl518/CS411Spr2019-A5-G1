var express = require('express');
var expressSession = require('express-session');
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


var generateRandomString = function(length) {
  var text = '';
  var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (var i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};


/*------------------------------ REQUESTS -------------------------------------------*/
/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Home Chef Inspiration' });
});


/* GET login */
router.get('/login', function(req, res, next) {

  var state = generateRandomString(16);
  res.cookie(stateKey, state);

  //Application requests authorization
  //Scopes we ask the User for
  var scope = 'user-read-private playlist-modify-public playlist-modify-private';
  res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: config.spotify.cli_id,
      scope: scope,
      redirect_uri: redirect_uri,
      state: state,
      show_dialog: true
    }));
});

/* GET Callback From login */
router.get('/callback?', async function(req, res, next){
  console.log("REQ ", req.query);


  if(req.query.error){
    res.render('index', { title: 'Home Chef Inspiration' });
  }else{
    var code = req.query.code || null;

    //Handle exchanging code for token, storing new user in database or updating old user's tokens
    const userInfo = await loginHandler(config.spotify.cli_id, config.spotify.cli_secret, redirect_uri, code);

    //Store current user globally
    req.session.currentUser = userInfo.id;
    console.log("CURR USER : ", req.session.currentUser);
    req.session.currentUserName = userInfo.name;
    
    //Redirect to the landing page
    res.redirect('/home');

  }


});

/*------- GET Edit Profile---------*/
router.get('/editProfile', async function(req, res, next){

  let profile = await searchForUser(req.session.currentUser);

  let profObj = {intolerance: profile.intolerances, diet: profile.diets, genre: profile.genres};

  res.render('checkbox', {msg: null, prof: profObj});

});

/*--------------Get Home Page--------*/
router.get('/home', function(req, res, next){

  res.render('landingPage', { name: req.session.currentUserName, title: 'Home Chef Inspiration' });

});

/*---------- POST Update profile ---------- */
router.post('/updateProfile', async function(req, res, next){
  var intolerancesArr = [];
  var dietsArr = [];
  var genresArr = [];
  console.log("Postupdate: ", req.body)

  //Check if there are values for all of the profile options
  if(req.body.Intolerance){
    intolerancesArr = req.body.Intolerance;
  }

  if(req.body.Diet){
    dietsArr = req.body.Diet;
  }

  if(req.body.Genre_preference){
    genresArr = req.body.Genre_preference
  }

  //Build the tokens key value pairs to update
  var tokens = {intolerances: intolerancesArr, diets: dietsArr, genres: genresArr};

  //Update profile in database
  const updatedProfile = await updateUser(req.session.currentUser, tokens);
  const profObj = {intolerance:tokens.intolerances , diet: tokens.diets, genre: tokens.genres}
  res.render('checkbox', {msg: 1, title: 'Home Chef Inspiration', prof:profObj});

});

/* GET Logout*/

router.get('/logout', function (req, res){
  req.session.destroy(function (err) {
    res.render('logoutMsg'); //Inside a callback… bulletproof!
  });
});

/* POST ingredients list for search */
router.post('/getRecipes', async function(req, response, next) {

  const recipeResults = await recipeSearchHandler(req.body.ingredients, req.session.currentUser, key, host);

  response.render('recipeResults', {body: recipeResults, title: 'HomeChefInspiration'});
});


  /*POST View Recipe*/
  router.post('/viewRecipe', function(req, response, next){
    console.log("RECIPE ID: ", req.body.recButton);
    //Recipe ID
    var rec_id = req.body.recButton;

    //Form query string
    qs = {"id": rec_id};
    var url = 'https://spoonacular-recipe-food-nutrition-v1.p.rapidapi.com/recipes/' + rec_id;
    url+= '/information';
    console.log(url);

    //Make request for recipe information
    request.get({headers: {'X-RapidAPI-Key': key, 'X-RapidAPI-Host': 'spoonacular-recipe-food-nutrition-v1.p.rapidapi.com'},
    url: url,
    qs: qs, json: true}, (err, res, body) => {

      if (err) { return console.log(err); }
      console.log(body);

      response.render('recipeInformation', {recipe: body, msg: null, generated: null, title: 'Home Chef Inspiration'});

    });

  });

//POST Create playlist 
router.post('/createPlaylist', async function(req, response, next) {
 //Refresh token
 //Make the playlist
 var chosenRecipe = JSON.parse(req.body.playlistBtn);
 console.log("BODY OF RECIPE:", chosenRecipe);
 console.log("CURR USER", req.session.currentUser);

 //Default genre in case they have not yet chosen a genre
 var genre = 'pop';
 //Check if the user input genres
 const userDoc = await searchForUser(req.session.currentUser);
 if(userDoc.genres.length){
    //If so, choose a random one
    genre = await chooseRandomGenre(userDoc.genres);
 }
 //Continue to create playlist
 var cookTime = chosenRecipe.readyInMinutes;
 var recipeName = chosenRecipe.title;
 var success = await createPlaylistHandler(genre, cookTime, recipeName, req.session.currentUser);

 var msg = null;
 var generated = null;
 if(success.success){
  generated = 1;
  msg = "Success! The playlist is now on your account.";
 }else{
   generated = 555;
   msg = "Error. Please contact support or come back later";
 }
 //Render recipe page with success message
 response.render('recipeInformation', {recipe: chosenRecipe, msg: msg, generated: generated,title: 'Home Chef Inspiration', url: success.url});
});

 module.exports = router;

/*---------------------------------------- HANDLER FUNCTIONS, API CALL FUNCTIONS, DATABASE FUNCTIONS ---------------------------------------------------*/
/*-------------------RECIPE SEARCH---------------------------------*/
async function recipeSearchHandler(ingredients, id, key, host){
  const userDoc = await searchForUser(id);
  const restrictions = await checkForDietsAndIntolerances(userDoc);
  const recipeList = await searchRecipes(ingredients, restrictions, key, host);

  return recipeList;

}

function checkForDietsAndIntolerances(doc){
  return new Promise((resolve, reject) => {
    var intolerances;
    var diets;

    if(doc.intolerances.length){
      intolerances = doc.intolerances
    }else{
      intolerances = null;
    }

    if(doc.diets.length){
      diets = doc.diets
    }else{
      diets = null;
    }

    resolve({diets: diets, intolerances: intolerances});
  });

}

function searchRecipes(ingredients, restrictions, key, host){
  //Add diets and intolerances to query string and then search
  return new Promise((resolve, reject) => {
    var qs = {includeIngredients: ingredients, limitLicense: false, offset: '0', number: '10'};

    var diets = restrictions.diets;
    var intolerances = restrictions.intolerances;

    //Convert to strings separated by commas
    var i;
    var dietsString = '';
    var intolerancesString = ''

    //If diets is not null
    if(diets){
      //Add all diets to the query string
      for(i = 0; i < (diets.length) - 1; i++){
        dietsString += diets[i];
        dietsString += ',';
      }

      //Add last one
      dietsString += diets[(diets.length)-1];

      console.log("DIETS STRING: ", dietsString);

      //Add to query string
      qs.diet = dietsString;

    }

    //If intolerances aren't null
    if(intolerances){
      //Add all intolerances to the query string
      for(i = 0; i < (intolerances.length) - 1; i++){
        intolerancesString += intolerances[i];
        intolerancesString += ',';
      }

      //Add last one
      intolerancesString += intolerances[(intolerances.length)-1];
      console.log("INTOLERANCES STRING: ", intolerancesString);

      //Add to query string
      qs.intolerances = intolerancesString;
      
    }


    //Get the recipes from the API
    request.get({headers: {"X-RapidAPI-Key": key, "X-RapidAPI-Host": host },
    url:'https://spoonacular-recipe-food-nutrition-v1.p.rapidapi.com/recipes/searchComplex',
    qs: qs, json: true}, (err, res, body) => {

      if (err) { return console.log(err); }
      console.log(body);

      //Resolve with recipe list
      resolve(body);
    });
  });

}
/*-------------------CREATE A NEW PLAYLIST-------------------------------*/
async function createPlaylistHandler(genre, cookTime, recipeName, user_id){
  //Search database for user
  const userDoc = await searchForUser(user_id);
  console.log("USER DOC ", userDoc.access_token);
  const access_token = userDoc.access_token;

  const playlistInfo = await createNewPlaylist(recipeName, access_token, user_id);
  console.log("PROMISE 1 RESOLVED");
  const searchResults = await searchSongs(genre, access_token);
  console.log("PROMISE 2 RESOLVED");
  //console.log("SEARCH RESULTS: ", searchResults);
  const idArray = await narrowDownSongs(searchResults, cookTime);
  console.log("NEXT PROMISE RESOLVED");
  const addSongsResults = await addSongsToPlaylist(idArray, playlistInfo.id, access_token);
  return {success: addSongsResults, url: playlistInfo.url};
}

function createNewPlaylist(recipeName, access_token, user_id){
  //Creates a new playlist on the user's account and returns the playlist ID
  let url = 'https://api.spotify.com/v1/users/' + user_id + '/playlists';
  console.log(url);

  //If no genres, reply with need to fill out profile message
  //Make playlist on their account with name of recipe
  var options = { method: 'POST',
  url: url,
  qs: { '': '' },
  body: { 'name': recipeName },
  headers: 
   { 'Content-Type': 'application/json',
     Authorization: 'Bearer ' + access_token },
  json: true };

  return new Promise((resolve, reject) => {

    request(options, function (error, response, body) {
      if (error) { reject(error); };


      //New playlist ID
      let newPlaylistID = body.id;
      let newPlaylistURL = body.external_urls.spotify;

      let playlistInfo = {id: newPlaylistID, url: newPlaylistURL};
      resolve(playlistInfo);

    });
  })

}

function searchSongs(genre, access_token){
  //Searches songs based on a genre the user prefers
  //Do a search by selected genre for 350 songs. 
  var i;
  var j;
  var counter = 0;
  return new Promise((resolve, reject) => {
    var searchResultsArray = new Array();
    for(i = 0; i <=250; i += 50){
      var offset = i.toString()
      //console.log("OFFSET: ", offset);
      var options = { method: 'GET',
      url: 'https://api.spotify.com/v1/search',
      qs: {q: "genre: " + genre, limit: '50', offset: offset, type: 'track'},
      headers: 
      {
        Authorization: 'Bearer ' + access_token },
        json: true };
  

      request(options, function (error, response, body) {
        if (error) {reject(error);};
          

        var searchResults = body.tracks["items"];
        console.log(body);
        //return(searchResultsArray);

        for(j = 0; j < 50; j++){
          searchResultsArray.push(searchResults[j]);
        } 

        if(counter === 5){
          console.log("finishing...");
          resolve(searchResultsArray);
        }
        
        counter++;
      });
    }
  });
  
  
}

function narrowDownSongs(songList, cookTime){
  //Take search results and narrow down to playlist of length of cook time
  return new Promise((resolve, reject) => {
    var totalTime = 0;
    
    var i = 0;
    var j = 0;
    var trackListArray = new Array();
    console.log(songList.length);
    
      while((totalTime <= cookTime) && (i < songList.length)){
        j = 0;
        var trackIDs = [];
          while (j < 50 && (i < songList.length) && (totalTime <= cookTime)){
            console.log("RESULT ID:", songList[i]["uri"]);
            //Append song to list of track IDs
            trackIDs.push(songList[i]["uri"]);
            //Add time of song to total time & convert to minutes
            var trackLength = songList[i].duration_ms / 60000;
            totalTime += trackLength;
            //Next item on list
            i++;
            j++;
          }
          trackListArray.push(trackIDs);
    }
      console.log("ARRAY OF TRACK LISTS TO PUSH: ", trackListArray)
    resolve(trackListArray);
  });

}

function addSongsToPlaylist(idArray, newPlaylistID, access_token){
  //Adds songs to the new playlist created
  return new Promise((resolve, reject) => {
    var i = 0;
    var counter = 0;
    for(i = 0; i < idArray.length; i++){
      options = { method: 'POST',
      url: 'https://api.spotify.com/v1/playlists/' + newPlaylistID + '/tracks',
      body: {'uris': idArray[i]},
      headers: 
      {
        Authorization: 'Bearer ' + access_token, 'Content-Type': 'application/json', Accept: "application/json" },
      json: true };
      request(options, function (error, response, body) {
        if (error) {reject(error);};
      
        //console.log(body);

        if(counter === (idArray.length-1)){
          resolve(1);
        }
        
        counter++;
      });

    }

  });

}

function chooseRandomGenre(genres){
  var index = Math.floor(Math.random() * (genres.length))
  return genres[index];
}

/*-------------------------------- LOGIN ---------------------------------------------*/
async function loginHandler(cli_id, cli_secret, redirect_uri, code){
  //Exchange access code for token
  const tokens = await exchangeForToken(code, redirect_uri, cli_id, cli_secret);
  //Get user profile information
  const userInfo = await getUserProfile(tokens.access_token);
  //Search for user ID 
  const userFound = await searchForUser(userInfo.usr_id);
  console.log("USER FOUND? ", userFound);
  //If new user, store in DB
  if(userFound){
    const userUpdate = await updateUser(userInfo.usr_id, {usr_id: userInfo.usr_id, access_token: tokens.access_token, expiry_time_ms: tokens.expirationTime, refresh_token: tokens.refresh_token});
  }else{
  //If not new user, update refresh token, access token, and expiry_time
    const userCreate = await createUser(userInfo.usr_id, {usr_id: userInfo.usr_id, access_token: tokens.access_token, expiry_time_ms: tokens.expirationTime, refresh_token: tokens.refresh_token});
  }
  

  return {id: userInfo.usr_id, name: userInfo.name};

}

function exchangeForToken(code, redirect_uri, cli_id, cli_secret){
  return new Promise((resolve, reject) => {
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
      var access_token = body.access_token;
      var refresh_token = body.refresh_token;
      var expirationTime = new Date().getTime() + (body.expires_in * 1000);
      console.log('Access Token ', access_token)

      resolve({access_token: access_token, refresh_token: refresh_token, expirationTime: expirationTime});
    });
  });

}

function getUserProfile(access_token){
  //Get spotify ID profile info
  return new Promise((resolve, reject) => {
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

      resolve({name: name, usr_id: body.id});
    });
  });
}


/*---------------------------------DATABASE FUNCTIONS -----------------------------------*/
//Search for user -- based on current user id
function searchForUser(id){
  return new Promise((resolve, reject) => {
    let UserModel = require('../models/user_model');
    UserModel
    .findOne({
      usr_id: id  // search query
    })
    .then(doc => {
      if(!doc){
        console.log("NOT FOUND");
        resolve(null);
      }else{
        console.log("FOUND");
        resolve(doc);
      }
      
    })
    .catch(err => {
      console.error(err)
      reject(err);
    })
  });

}
//Update user -- based on current user id, object of key value pairs to update
function updateUser(id, tokens){
  return new Promise((resolve, reject) => {
    let UserModel = require('../models/user_model');
    UserModel
    .updateOne({
      usr_id: id  // search query
    },
    tokens,    //values to update
    {
      new: true,                       // return updated doc
      runValidators: true              // validate before update
    })
    .then(doc => {
      console.log("UPDATED", doc);
      resolve(1);
    })
    .catch(err => {
      console.error(err)
      reject(err);
    })
  });
}

//Save new user -- object of key value pairs & id
function createUser(id, tokens){
  return new Promise((resolve, reject) => {
    let UserModel = require('../models/user_model');
    let usr = new UserModel(tokens);
    usr.save()
      .then(doc => {
        console.log("CREATED: ", doc);
        resolve(1);
      })
      .catch(err => {
        console.error(err)
        reject(err);
      })
  });
  
}