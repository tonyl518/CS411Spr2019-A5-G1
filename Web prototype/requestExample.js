const request = require('request');

key = 'c848a51cfbmshd7d4d51371ba1bdp1c8e25jsnae2227b6fc1b'
ingredientList = "apples,flour,sugar"

// Get recipe function
function getRecipe(ingredientList){

    //Query string
    qs = {"ingredients": ingredientList};
    
    //Request
	request.get({headers: {"X-RapidAPI-Key": key},
		url:"https://spoonacular-recipe-food-nutrition-v1.p.rapidapi.com/recipes/findByIngredients?",
		qs: qs, json: true}, (err, res, body) => {
	
	if (err) { return console.log(err); }
	  console.log(body);
	});

}

function parseResults(results){

}

//Run function
getRecipe(ingredientList)
