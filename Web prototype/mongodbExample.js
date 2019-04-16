const mongo = require('mongodb').MongoClient
const url = 'mongodb://localhost:27017'
// initialize database, be sure you have installed mongodb; also, after installing mongodb, type "npm install mongodb" in terminal.
mongo.connect(url, {useNewUrlParser: true}, (err, client) => {
    if (err) {
      console.error(err)
      return
    }
    // create database "exp"
    const db = client.db('exp');
    // create collection "example"
    const collection = db.collection("example");
    // insert one object
    collection.insertOne({name: 'Tony'},(err, result) => {})
    // insert multiple object by using list
    collection.insertMany([{name:'Peter'},{name:'Peter2'}], (err,result) => {})
    // list all objects in collection "example"
    collection.find().toArray((err, items) => {
        console.log(items)
    })
    // find a specific object
    collection.findOne({name: 'Tony'}, (err, item) => {
        console.log(item)
    })
    // update certain object 
    collection.updateOne({name: 'Tony'}, {'$set': {'name': 'Tony2'}}, (err, item) => {
        console.log(item)
    })
    // end connection
    client.close()
})

