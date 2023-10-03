const Author = require('./Author');
const KidsAuthor = require('./KidsAuthor');
const Illustrator = require('./Illustrator');
const NovllUtil = require('./NovllUtil')


//get book ideas by book author and title
async function getBookIdeas(bookConceptPreferences){
    console.log('Publisher - getBookIdeas')
    if(bookConceptPreferences['reading_level']=='kids'){
        console.log('Publisher - getBookIdeas - Kids book')
        return await KidsAuthor.getBookIdeas(bookConceptPreferences);
    }else{
        console.log('Publisher - getBookIdeas - Adults book')
        return await Author.getBookIdeas(bookConceptPreferences)
    }
}

//build book by selected concept

async function buildBook(bookDetails) {

    console.log("bookDetails['reading_level']=='kids'")
    console.log(bookDetails['reading_level']=='kids')

    let book = {}
    if(bookDetails['reading_level']=='kids') {
        console.log('kids book')
        try {
            // Wait for the asynchronous function to complete
            book['data'] = await KidsAuthor.createBook(bookDetails);

        }catch (error) {
            console.error('An error occurred:', error);
        }

        console.log('Publisher - buildBook - book[\'data\']')
        console.log(book['data'])

        let illustratedBook = await Illustrator.illustrateBook(book['data']);
        return illustratedBook;

    }else{
        console.log('adults book')
        try {
            // Wait for the asynchronous function to complete
            return await Author.createBook(bookDetails);
        } catch (error) {
            console.error('An error occurred:', error);
        }
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

module.exports = {
    getBookIdeas,
    buildBook,
    getBook
};