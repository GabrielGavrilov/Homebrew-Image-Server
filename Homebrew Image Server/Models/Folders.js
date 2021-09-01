const mongoose = require('mongoose')

const folderSchema = mongoose.Schema({
    name: String
})

const folderModel = mongoose.model("folder", folderSchema)
module.exports = folderModel