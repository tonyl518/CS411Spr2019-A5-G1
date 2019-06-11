var express = require('express');
var router = express.Router();
const config = require('../config.json');

router.use(express.urlencoded())

const request = require('request');

key = config.ingredients.key;

var authorizationCode = '<insert authorization code>';


/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'CS411Lab5Group1' });
});

/* POST ingredients list for search */
router.post('/', async function(req, response, next) {
  console.log(req.body.ingredients)
  //response = getRecipe(req.body.ingredients);


  let body = await getRecipe(req.body.ingredients);

  response.render('results', {body: body, title: 'CS411Lab5Group1'});

  /*
  setTimeout(function() {
    console.log(response);
  }, 5000);*/
  
  //obj = JSON.parse(response);

  //Send the results to be rendered with the object

});



  module.exports = router;


  //Get a recipe
function getRecipe(ingredientList){
  return new Promise((resolve, reject) => {
    //Query string
    qs = {"ingredients": ingredientList};
    
    //Request
    request.get({headers: {"X-RapidAPI-Key": key},
    url:"https://spoonacular-recipe-food-nutrition-v1.p.rapidapi.com/recipes/findByIngredients?",
    qs: qs, json: true}, (err, res, body) => {

      if (err) { reject(err); }
      console.log(body);
      resolve(body);
    });
  });
}