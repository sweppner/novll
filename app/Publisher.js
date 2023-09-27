const Author = require('./Author');
// const Illustrator = require('./Illustrator');
const NovllUtil = require('./NovllUtil')

let chapter_length_lowerbound = 500;
let chapter_length_upperbound = 3000;

//get book ideas by book author and title
async function getBookIdeas(bookConceptPreferences, num_ideas=5){
    bookConceptPreferences['num_ideas'] = num_ideas

    return await Author.getBookIdeas(bookConceptPreferences)
    //TODO: for each chapter generate
}

//build book by selected concept

async function buildBook(bookDetails) {

    bookDetails['chapter_length_lowerbound'] = chapter_length_lowerbound;
    bookDetails['chapter_length_upperbound'] = chapter_length_upperbound;

    if (bookDetails && bookDetails.title && bookDetails.genre && bookDetails.num_chapters && bookDetails.synopsis) {
        // Construct and return a string response
        try {
            // Wait for the asynchronous function to complete
            return await Author.createBook(bookDetails);
        } catch (error) {
            console.error('An error occurred:', error);
        }
    } else {
        // res.status(400).send('Invalid JSON object. A "name" property is required.');
    }
    return {};
}

async function getBook(id) {

    try {
        // Connect to the MongoDB server
        return await NovllUtil.getBookByID(id);
    } catch (err) {
        console.error(err);
    }
    return {}
}

async function getChildrensBook(bookDetails){
    let childrensBook = await buildBook(bookDetails);
    let paginatedBook = paginate(childrensBook);
    // let illustratedPaginatedBook = Illustrator.illustrateBookPages(childrensBook)
}

function paginate(book){
    let paginatedBook = {};
    let chapter_numbers = Object.keys(book);

    console.log('book')
    console.log(book)

    return paginatedBook;
}

module.exports = {
    getBookIdeas,
    buildBook,
    getBook,
    getChildrensBook
};