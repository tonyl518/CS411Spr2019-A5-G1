var express = require('express');
var router = express.Router();
const config = require('../config.json');

router.use(express.urlencoded())

const request = require('request');

key = config.ingredients.key;

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'CS411Lab5Group1' });
});

/* POST ingredients list for search */
router.post('/', (req, res) => {
  console.log(req.body.ingredients)
  response = getRecipe(req.body.ingredients)
  res.send(response);

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