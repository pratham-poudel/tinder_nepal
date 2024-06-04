require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MongoDbDatabase).then(()=>{
    console.log("Connected to MongoDB");
});


const userSchema = new mongoose.Schema({
    fullName: String,
    email: {
        type: String,
        unique: true    
    },
    password: String,
    verified: {
        type: Boolean,
        default: false
    },
    profilePicture:{
        type: String,
    },
    carouselPicture: {
        type: String,
    },
    username: {
        type: String,
    },
    bio: {
        type: String,
    },
    jobTitle: String,
    age: Number,
    requests: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: 'User',
        default: []
    },
    matched: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: 'User',
        default: []
    },
    notification:{
        type:String,
        default: ""
    },
});
const User = mongoose.model('User', userSchema);

module.exports = User;