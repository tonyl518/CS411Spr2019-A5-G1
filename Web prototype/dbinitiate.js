const mongo = require('mongodb').MongoClient
const url = 'mongodb://localhost:27017'
mongo.connect(url, {useNewUrlParser: true}, (err, client) => {
    if (err) {
      console.error(err)
      return
    }
    const db = client.db('Team1');
    const collection = db.collection("Users");
    // Keep the collection available
    collection.insertOne({name: 'abk'},(err, result) => {})
    client.close()
})

