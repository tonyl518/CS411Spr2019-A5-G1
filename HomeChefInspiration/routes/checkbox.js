var express = require('express');
var router = express.Router();
const config = require('../config.json');

router.use(express.urlencoded({ extended: true }));

const request = require('request');

const mongo = require('mongodb').MongoClient
const url = 'mongodb://localhost:27017'

function insertUser (userProfile){
    mongo.connect(url, {useNewUrlParser: true}, (err, client) => {
        if (err) {
            console.error(err)
            return
        }
        var id = userProfile.spotifyid

        const db = client.db('Team1');
        const collection = db.collection("Users");
        // Keep the collection available
        collection.deleteOne({'spotifyid':id})
        collection.insertOne(userProfile)


        client.close()
        return
    })
}

function indexUser (id){
    mongo.connect(url, {useNewUrlParser: true}, (err, client) => {
        if (err) {
            console.error(err)
            return
        }


        const db = client.db('Team1');
        const collection = db.collection("Users");
        // Keep the collection available
        collection.findOne({'spotifyid':id}, (err, result)=>{
            if (err) {
                return false
            }
            else {
                console.log(result)
                return result
            }
        })

        client.close()
    })
}



router.post('/free', function(req, response, next) {
    console.log(req)
    profile =
        {
            'Intolerance': req.body.Intolerance,
            'Diet': req.body.Diet,
            'Genre_preference': req.body.Genre_preference

        }
    tempuser = indexUser(id)
    tempuser.Intolerance = req.body.Intolerance
    tempuser.Diet = req.body.Diet
    tempuser.Genre_preference = req.body.Genre_preference
    insertUser(tempuser)




    });

module.exports = router;
