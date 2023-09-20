const Author = require('./Author');
const NovllUtil = require('./NovllUtil')

//get book ideas by book author and title
async function getBookIdeas(author_name='', book_title='', genre='', concept='', num_ideas=5){

    return await Author.getBookIdeas(author_name, book_title, genre, concept, num_ideas)
    //TODO: for each chapter generate
}

//build book by selected concept
// app.post('/build/book', async (req, res) => {
//     const jsonInput = req.body; // Get JSON payload
//     // console.log(req.body);
//     // res.setHeader('Content-Type', 'application/json');
//
//     if (jsonInput && jsonInput.title && jsonInput.genre && jsonInput.num_chapters && jsonInput.synopsis) {
//         // Construct and return a string response
//         let response = `Your JSON object has been processed.`;
//         try {
//             // Wait for the asynchronous function to complete
//             const book = await Author.createBook(jsonInput);
//             response = JSON.stringify(book)
//
//             // Send the response back to the client
//             res.status(200).send(book);
//         } catch (error) {
//             console.error('An error occurred:', error);
//             res.status(500).send('Internal Server Error');
//         }
//
//         res.status(200).send(response);
//     } else {
//         res.status(400).send('Invalid JSON object. A "name" property is required.');
//     }
// });
//
// //get book ideas by genre and concept
// app.get('/book/get/id', async (req, res) => {
//     const book_id = req.query.book_id;
//
//     if (!book_id) {
//         res.status(400).send('Please provide a book name');
//         return;
//     }
//
//     try {
//         // Wait for the asynchronous function to complete
//         const bookObject = await NovllUtil.getBookByID(book_id)
//
//         // Send the response back to the client
//         res.status(200).send(bookObject);
//     } catch (error) {
//         console.error('An error occurred:', error);
//         res.status(500).send('Internal Server Error');
//     }
// });
//
//
// // Use public directory to serve static files
// app.use(express.static(path.join(__dirname, 'public')));
//
// // Serve index.html as the home page
// app.get('/', (req, res) => {
//     console.log("Starting up web server...")
//     res.sendFile(path.join(__dirname, 'public', 'index.html'));
// });
// // res.setHeader('Access-Control-Allow-Headers', 'Content-Type'); // Add other headers here
//
//
// app.use((req, res, next) => {
//     res.header(
//         "Access-Control-Allow-Origin",
//         "*"
//     ); // Replace '*' with specific origins if needed
//     res.header(
//         "Access-Control-Allow-Headers",
//         "Origin, X-Requested-With, Content-Type, Accept"
//     );
//     next();
// });

module.exports = {
    getBookIdeas
};