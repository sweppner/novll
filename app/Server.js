const KidCustomer = require('./KidCustomer');
const AdultCustomer = require('./AdultCustomer');
const Publisher = require('./Publisher');
const NovllUtil = require('./NovllUtil');
const fs = require('fs');
const express = require('express');
const app = express();
const port = 3000;
const path = require('path');
const morgan = require('morgan');
const passport = require("passport");
const MongoStore = require("connect-mongo");
const session = require("express-session");

// Enable logging
app.use(morgan('dev'));
app.use(express.json());


// Grab all the models
fs.readdirSync(__dirname + '/models').forEach(function(filename){
    if (~filename.indexOf('.js')) require(__dirname + '/models/' + filename);
})

const db = "mongodb+srv://mongoose:xCnuM2AVG4RxYZyA@serverlessinstance0.e8wmahg.mongodb.net/NovelDB?retryWrites=true&w=majority";

app.use(
    session({
      secret: 'novllsecret-REPLACE-ME-LATER',
      resave: false,
      saveUninitialized: true,
      cookie: {
        // secure: true,
        httpOnly: true,
      },
      store: MongoStore.create({
        mongoUrl: db,
      }),
    })
);

//for passportjs authentication
app.use(passport.initialize());
app.use(passport.session());
require("./middleware/passport.js");
fs.readdirSync(__dirname + '/routes').forEach(function(filename){
    filename = filename.slice(0, -3);
    filename = require('./routes/' + filename + '.js');
    app.use('/api', filename);
});
app.post('/api/register', (req, res, next)=>{res.send('hi')})


//get book ideas by book author and title
app.get('/book/ideas', async (req, res) => {
    res.setHeader('Content-Type', 'application/json');

    try{
        const bookIdeas = await AdultCustomer.getBookIdeas(req.query);
        res.status(200).send(JSON.stringify(bookIdeas));
    }catch(error){
        console.error('An error occurred:', error);
        res.status(500).send('Internal Server Error');
    }

});

//get book ideas by book author and title
app.get('/kids/book/ideas', async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    NovllUtil.printLog('Server.js', 'get(\'/kids/book/ideas\'')

    try {
        const bookIdeas = await KidCustomer.getBookIdeas(req.query);
        res.status(200).send(JSON.stringify(bookIdeas));
    } catch (error) {
        console.error('An error occurred:', error);
        res.status(500).send('Internal Server Error');
    }
});

//build book by selected concept
app.post('/book/build', async (req, res) => {
    const jsonInput = req.body; // Get JSON payload
    // console.log(req.body);
    // res.setHeader('Content-Type', 'application/json');

    if (jsonInput && jsonInput.title && jsonInput.genre && jsonInput.num_chapters && jsonInput.synopsis) {
        // Construct and return a string response
        let response = {'message':'Your JSON object has been processed.'};
        try {
            // Wait for the asynchronous function to complete
            const book = await AdultCustomer.getNewBook(jsonInput);

            // Send the response back to the client
            res.status(200).send(book);
        } catch (error) {
            console.error('An error occurred:', error);
            res.status(500).send('Internal Server Error');
        }
        response = JSON.stringify(response);

        NovllUtil.printLog('Server.js', 'app.post(\'/book/build\'', true,'response',response);

        res.status(200).send();
    } else {
        res.status(400).send('Invalid JSON object. A "name" property is required.');
    }
});

app.post('/kids/book/build', async (req, res) => {
    const jsonInput = req.body; // Get JSON payload

    // if (jsonInput && jsonInput['child_age'] && jsonInput['child_interests'] && jsonInput['illustration_style']
    //     && jsonInput['characters'] && jsonInput['settings'] && jsonInput['emotions_include'] && jsonInput['lessons']) {
        // Construct and return a string response
        let response = {'message':'Your JSON object has been processed.'};
        try {
            // Wait for the asynchronous function to complete
            const book = await KidCustomer.getNewBook(jsonInput);

            // Send the response back to the client
            res.status(200).send(book);
        } catch (error) {
            console.error('An error occurred:', error);
            res.status(500).send('Internal Server Error');
        }
        response = JSON.stringify(response);

        NovllUtil.printLog('Server.js', 'app.post(\'/kids/book/build\'', true,'response',response);

        res.status(200).send();
    // } else {
    //     res.status(400).send('Invalid JSON object. A "name" property is required.');
    // }
});

//get book ideas by genre and concept
app.get('/book/get/id', async (req, res) => {

    const book_id = req.query.book_id;

    if (!book_id) {
        res.status(400).send('Please provide a book name');
        return;
    }

    try {
        // Wait for the asynchronous function to complete
        const bookObject = await Publisher.getBook(book_id)

        // Send the response back to the client
        res.status(200).send(bookObject);
    } catch (error) {
        console.error('An error occurred:', error);
        res.status(500).send('Internal Server Error');
    }
});


// Use public directory to serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Serve index.html as the home page
app.get('/', (req, res) => {
    console.log("Starting up web server")
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
// res.setHeader('Access-Control-Allow-Headers', 'Content-Type'); // Add other headers here


app.use((req, res, next) => {
    res.header(
        "Access-Control-Allow-Origin",
        "*"
    ); // Replace '*' with specific origins if needed
    res.header(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept"
    );
    next();
});


// rest listener
app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
});
