const NovllAuthor = require('./NovllAuthor');
const express = require('express');
const app = express();
const port = 3000;
const http = require('http');
const cors = require('cors');
const path = require('path');
const directory = "../web/html-landing-page/landing.html"



//get book ideas by book title
app.get('/ideas/title', async (req, res) => {
    const bookName = req.query.name;
    res.setHeader('Content-Type', 'application/json');
    if (!bookName) {
        res.status(400).send('Please provide a book name');
        return;
    }

    try {
        // Wait for the asynchronous function to complete
        const bookIdeas = await NovllAuthor.fetchBookIdeasByBook(bookName);

        // Send the response back to the client
        res.status(200).send(bookIdeas);
    } catch (error) {
        console.error('An error occurred:', error);
        res.status(500).send('Internal Server Error');
    }
});

//get book ideas by book author
app.get('/ideas/author', async (req, res) => {
    const authorName = req.query.name;

    if (!authorName) {
        res.status(400).send('Please provide a book name');
        return;
    }

    try {
        // Wait for the asynchronous function to complete
        const bookIdeas = await NovllAuthor.fetchBookIdeasByAuthor(authorName);

        // Send the response back to the client
        res.status(200).send(bookIdeas);
    } catch (error) {
        console.error('An error occurred:', error);
        res.status(500).send('Internal Server Error');
    }
});

//get book ideas by book author and title
app.get('/ideas/author_title', async (req, res) => {
    const authorName = req.query.author_name;
    const bookTitle = req.query.book_title;
    res.setHeader('Content-Type', 'application/json');
    console.log("Requesting ideas based on author [ " + authorName + " ] and book title [ " + bookTitle + " ].")
    if (!authorName || !bookTitle) {
        res.status(400).send('Please provide a book name or author');
        return;
    }

    try {
        // Wait for the asynchronous function to complete
        console.log("Fetching book ideas.")
        const bookIdeas = await NovllAuthor.fetchBookIdeasByBookAndAuthor(authorName, bookTitle);
        // console.log(bookIdeas)
        console.log("Obtained ideas.")
        console.log("Obtained ideas.")

        const obj = {}
        try {
            const obj = JSON.parse(bookIdeas);  // Malformed JSON
            // Send the response back to the client
            res.status(200).send(JSON.stringify(obj));
        } catch (error) {
            console.error(error);
        }

    } catch (error) {
        console.error('An error occurred:', error);
        res.status(500).send('Internal Server Error');
    }
});

//get book ideas by genre and concept
app.get('/ideas/genre_concept', async (req, res) => {
    const book_genre = req.query.genre;
    const book_concept = req.query.concept;

    if (!book_genre || !book_concept) {
        res.status(400).send('Please provide a book name');
        return;
    }

    try {
        // Wait for the asynchronous function to complete
        const bookIdeas = await NovllAuthor.fetchBookIdeasByGenreAndConcept(book_genre, book_concept)
        console.log(bookIdeas)
        // Send the response back to the client
        res.status(200).send(bookIdeas);
    } catch (error) {
        console.error('An error occurred:', error);
        res.status(500).send('Internal Server Error');
    }
});

//build book by selected concept
app.post('/build/book', async (req, res) => {
    const jsonInput = req.body; // Get JSON payload

    if(jsonInput && jsonInput.name){
        // Construct and return a string response
        const response = `Hello, ${jsonInput.name}! Your JSON object has been processed.`;
        try {
            // Wait for the asynchronous function to complete
            const bookIdeas = await NovllAuthor.createBook(jsonInput);

            // Send the response back to the client
            res.status(200).send(bookIdeas);
        } catch (error) {
            console.error('An error occurred:', error);
            res.status(500).send('Internal Server Error');
        }

        res.status(200).send(response);
    } else {
        res.status(400).send('Invalid JSON object. A "name" property is required.');
    }
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
        const bookObject = await NovllAuthor.getBookByID(book_id)

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
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*"); // Replace '*' with specific origins if needed
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
