var mongoose = require("mongoose");

var userSchema = mongoose.Schema({
    usr_id: String,
    access_token: String,
    refresh_token: String,
    expiry_time_ms: Number, 
    diets: [String],
    intolerances: [String],
    genres: [String]
});

var User = mongoose.model('User', userSchema);

module.exports = User;
