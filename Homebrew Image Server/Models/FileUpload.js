//Requires mongoose
const mongoose = require('mongoose')

//Creates the file schema for the database
const fileSchema = mongoose.Schema({
    img: {
        data: Buffer,
        contentType: String
    },
    folder: String
}, {timestamps: true})

//Creates a "files" collection for the database ~ Puts the schema into the model 
const fileModel = mongoose.model('file', fileSchema)
//Exports the file model
module.exports = fileModel