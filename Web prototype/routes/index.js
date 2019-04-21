var express = require('express');
var router = express.Router();
const config = require('../config.json');

router.use(express.urlencoded())

const request = require('request');

key = config.ingredients.key;

var authorizationCode = '<insert authorization code>';


/* TODO:
  -Add spotify credentials to config file
  -Connect with login on this page
  -Query database
  -Shuffle results of search
  -Make sure track IDs in array works
  -Make sure for loop works
  -Display widget
  -Make sure recipe still displayed with widget
  -From recipe page, pass cook time
  
var spotifyApi = new SpotifyWebApi({
  clientId: '<insert client id>',
  clientSecret: '<insert client secret>',
  redirectUri: '<insert redirect URI>'
});*/

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'CS411Lab5Group1' });
});

/* POST ingredients list for search */
router.post('/', function(req, response, next) {
  console.log(req.body.ingredients)
  //response = getRecipe(req.body.ingredients);

  qs = {"ingredients": req.body.ingredients};

  request.get({headers: {"X-RapidAPI-Key": key},
  url:"https://spoonacular-recipe-food-nutrition-v1.p.rapidapi.com/recipes/findByIngredients?",
  qs: qs, json: true}, (err, res, body) => {

    if (err) { return console.log(err); }
    console.log(body);

    response.render('results', {body: body, title: 'CS411Lab5Group1'});
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
  //Query database for genres they like
    //Pick random genre
    let selectedGenre = 'jazz';
  //If no genres, reply with need to fill out profile message
  //Make playlist on their account with name of recipe
  var options = { method: 'POST',
  url: 'https://api.spotify.com/v1/playlists',
  qs: { name: RecipeName },
  headers: 
   { 'Content-Type': 'application/json',
     Authorization: 'BQB0oJRkO28fG7Zs_EfJZ_Bc6oplTFwfzwMz6dm38LQs7KVMahxoFQZbdPr_ukaoX8k3foSWRfaMSt9itKPVB_Ixn0m-AQJIQQ7OmrtuE0MORMaLRssIgilpSW99E2BmW8uU2rfTP5Xh5hzAtg' } };

  request(options, function (error, response, body) {
    if (error) throw new Error(error);

    console.log(body);

    //New playlist ID
    let newPlaylistID = body['id'];

    //Get playlist ID
    //Do a search by selected genre for 250 songs, shuffle. 
    for i in range(0, 250, 50):
      var options = { method: 'POST',
      url: 'https://api.spotify.com/v1/search',
      qs: {q: 'genre: ' + selectedGenre, limit = 50, offset = i, type = 'track', market = None},
      headers: 
      {
        Authorization: 'BQB0oJRkO28fG7Zs_EfJZ_Bc6oplTFwfzwMz6dm38LQs7KVMahxoFQZbdPr_ukaoX8k3foSWRfaMSt9itKPVB_Ixn0m-AQJIQQ7OmrtuE0MORMaLRssIgilpSW99E2BmW8uU2rfTP5Xh5hzAtg' } };
      request(options, function (error, response, body) {
        if (error) throw new Error(error);
      
        console.log(body);
        for items in body['tracks']['items']:
              trackResults.append(items)
            
        trackIDs = []

        //Shuffle track results
        //np.random.shuffle(trackResults)
        //np.random.shuffle(trackResults)
          
        //Get track IDs
          //for i in range(len(trackResults)):
            //trackIDs.append(trackResults[i]['id'])

    //While time <= cook time of recipe, keep adding songs from this list to track IDs to add to playlist
    var i = 0;
    var totalTime = 0;
    while(totalTime <= cookTime){
      //Append song to list of track IDs
        trackIDs.append(trackResults[i]['id']);
      //Add time of song to total time & convert to minutes
        var trackLength = trackResults[i]['duration_ms'] * 60000;
        totalTime += trackLength;
      //Next item on list
        i++;
    }
    //Make request to add these track IDs to new playlist
    options = { method: 'POST',
    url: 'https://api.spotify.com/v1/playlists/' + newPlaylistID + '/tracks',
    qs: {uris: trackIDs},
    headers: 
    {
      Authorization: 'BQB0oJRkO28fG7Zs_EfJZ_Bc6oplTFwfzwMz6dm38LQs7KVMahxoFQZbdPr_ukaoX8k3foSWRfaMSt9itKPVB_Ixn0m-AQJIQQ7OmrtuE0MORMaLRssIgilpSW99E2BmW8uU2rfTP5Xh5hzAtg', 'Content-Type': 'application/json' } };
    request(options, function (error, response, body) {
      if (error) throw new Error(error);
    
      console.log(body);

    //Send ID back to display widget

  });

    

  });

  module.exports = router;


  //Get a recipe
  function getRecipe(ingredientList){

    //Query string
    qs = {"ingredients": ingredientList};
    
    //Request
    request.get({headers: {"X-RapidAPI-Key": key},
    url:"https://spoonacular-recipe-food-nutrition-v1.p.rapidapi.com/recipes/findByIngredients?",
    qs: qs, json: true}, (err, res, body) => {

      if (err) { return console.log(err); }
      console.log(body);
      return body;
});
}