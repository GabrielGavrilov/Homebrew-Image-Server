////////////////////////////////////////////////////////
//                   REQUIREMENTS                    //
//////////////////////////////////////////////////////

const settings = require('./ServerSettings.json')

const express = require('express')
const mongoose = require('mongoose')
const multer = require('multer')
const bodyParser = require('body-parser')
const fs = require('fs')
const path = require('path')

const server = express()
const fileDB = require('./Models/FileUpload.js')
const folderDB = require('./Models/Folders.js')

////////////////////////////////////////////////////////
//              DATABASE & MULTER SETTINGS           //
//////////////////////////////////////////////////////

//Connects the server to the database using the DBURI
mongoose.connect(settings.DBURI, {useNewUrlParser: true, useUnifiedTopology: true}, (err)=> {
    if(err) {
        throw err
    } else {
        console.log(`> Server successfully connected to the database.`)
    }
})

//Creates the storage for uploading files
const fileStorage = multer.diskStorage({
    destination: (req, file, cb)=> {
        cb(null, './Uploads/')
    },
    filename: (req, file, cb)=> {
        cb(null, Date.now() + ' - ' + file.originalname)
    }
})

//Creates the upload for the files
const fileUpload = multer({
    storage: fileStorage
})

////////////////////////////////////////////////////////
//                     MIDDLEWARE                    //
//////////////////////////////////////////////////////

server.set('view engine', 'ejs')
server.use(bodyParser.json())
server.use(bodyParser.urlencoded({extended: true}))

server.use(express.static('CSS'))

////////////////////////////////////////////////////////
//                       ROUTES                      //
//////////////////////////////////////////////////////

// @ROUTE: Homepage Route
// @DESCRIPTION: Renders the homepage
server.get('/', (req, res)=> {
    folderDB.find({}, (err, data)=> {
        if(err) {
            throw err
        } else {
            res.render('home.ejs', {
                pageTitle: "Home :: Image Server",
                serverVersion: settings.SERVER_VERSION,
                folders: data
            })
        }
    })
})

// @ROUTE: Add Route
// @DESCRIPTION: Renders the "Add file" page
server.get('/add', (req, res)=> {
    res.render('add.ejs', {
        pageTitle: "Add new folder :: Image Server",
        serverVersion: settings.SERVER_VERSION
    })
})

// @ROUTE: Add Post
// @DESCRIPTION: Creates a new folder & saves it onto the database
server.post('/api/add', (req, res)=> {
    const folderName = req.body.createFolderInput
    
    const newFolder = new folderDB({
        name: folderName
    })

    newFolder.save((err, data)=> {
        if(err) {
            throw err
        } else {
            console.log(`> ${req.ip} has created a new folder.`)
            res.redirect('/')
        }
    })
})

// @ROUTE: Folder Route
// @DESCRIPTION: Renders the selected folder and the images that are inside
server.get('/folder/:name', (req, res)=> {
    const folderName = req.params.name

    fileDB.find({"folder": folderName}, (err, data)=> {
        if(err) {
            throw err;
        } else {
            res.render('folder.ejs', {
                pageTitle: "Folder :: Image Server",
                serverVersion: settings.SERVER_VERSION,
                images: data
            })
        }
    })

})

// @ROUTE: Delete Route
// @DESCRIPTION: Renders the "delete folder" page
server.get('/delete', (req, res)=> {
    folderDB.find({}, (err, data)=> {
        if(err) {
            throw err;
        } else {
            res.render('delete.ejs', {
                pageTitle: "Delete :: Image Server",
                serverVersion: settings.SERVER_VERSION,
                folders: data
            })
        }
    })
})

// @ROUTE: Delete Post
// @DESCRIPTION: Deletes the folder & and the images inside of it from the database
server.get('/delete/:name', (req, res)=> {
    const folderName = req.params.name

    folderDB.deleteOne({"name": folderName}, (err)=> {
        if(err) {
            throw err
        } else {
            fileDB.deleteMany({"folder": folderName}, (err)=> {
                if(err) {
                    throw err;
                } else {
                    res.redirect('/')
                }
            })
        }
    })
})

// @ROUTE: Image Route
// @DESCRIPTION: Renders the image from the database
server.get('/image/:id', (req, res)=> {
    const id = req.params.id

    fileDB.findById(id, (err, data)=> {
        if(err) {
            throw err;
        } else {
            res.render('image.ejs', {
                pageTitle: "Image :: Image Server",
                serverVersion: settings.SERVER_VERSION,
                image: [data]
            })
        }
    })
})

// @ROUTE: Upload Route
// @DESCRIPTION: Renders the upload page
server.get('/upload', (req, res)=> {
    res.render('upload.ejs', {
        pageTitle: "Upload new photo :: Image Server",
        serverVersion: settings.SERVER_VERSION
    })
})

// @ROUTE: Upload Error Route
// @DESCRIPTION: Renders the upload page but with an error message
server.get('/upload-error', (req, res)=> {
    res.render('upload-error.ejs', {
        pageTitle: "Upload new photo :: Image Server",
        serverVersion: settings.SERVER_VERSION
    })
})

// @POST: Upload Post
// @DESCRIPTION: Uploads & saves the file onto the database
server.post('/api/upload', fileUpload.single('fileInput'), (req, res)=> {
    const folder = req.body.folderInput

    folderDB.findOne({'name': folder}, (err, data)=> {
        if(err) {
            throw err
        } 

        if(!data) {
            res.redirect('/upload-error')
        } else if(data) {
            const newFile = new fileDB({
                img: {
                    data: fs.readFileSync(path.join(__dirname + '/Uploads/' + req.file.filename)),
                    contentType: 'image/png'
                },
                folder: folder
            })
        
            newFile.save((err, data)=> {
                if(err) {
                    throw err;
                } else {
                    console.log(`> ${req.ip} has uploaded ${req.file.filename}`)
                    res.redirect('/')
                }
            })
        }
    })
})

server.get('*', (req, res)=> {
    res.render('404.ejs', {
        pageTitle: "Error 404 :: Image Server",
        serverVersion: settings.SERVER_VERSION
    })
})

////////////////////////////////////////////////////////
//                       OTHER                       //
//////////////////////////////////////////////////////

//Starts the web server
server.listen(settings.PORT, settings.HOST, (err)=> {
    if(err) {
        throw err
    } else {
        console.log(`\nHomebrew Image Server - ${settings.SERVER_VERSION}`)
        console.log(`----------------------------------------------------`)
        console.log(`> Server is up and running.`)
    }
})