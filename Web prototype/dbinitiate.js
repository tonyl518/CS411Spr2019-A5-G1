const mongo = require('mongodb').MongoClient
const url = 'mongodb://localhost:27017'
mongo.connect(url, {useNewUrlParser: true}, (err, client) => {
    if (err) {
      console.error(err)
      return
    }
    // create database "exp"
    const db = client.db('Team1');
    // create collection "example"
    const collection = db.collection("Users");
    // end connection
    client.close()
})

