const Author = require('./Author');
const KidsAuthor = require('./KidsAuthor');
// const Illustrator = require('./Illustrator');
const StableIllustrator = require('./StableIllustrator');
const NovllUtil = require('./NovllUtil')


//get book ideas by book author and title
async function getBookIdeas(bookConceptPreferences){

    NovllUtil.printLog('Publisher.js', 'getBookIdeas(bookConceptPreferences)');

    if(bookConceptPreferences['reading_level']=='kids'){

        NovllUtil.printLog('Publisher.js', 'getBookIdeas(bookConceptPreferences)', false, '','',true,'Kids book');

        return await KidsAuthor.getBookIdeas(bookConceptPreferences);
    }else{

        NovllUtil.printLog('Publisher.js', 'getBookIdeas(bookConceptPreferences)', false, '','',true,'Adults book');

        return await Author.getBookIdeas(bookConceptPreferences)
    }
}

//build book by selected concept

async function buildBook(bookDetails) {

    NovllUtil.printLog('Publisher.js', 'buildBook(bookDetails)', true,'bookDetails[\'reading_level\']==\'kids\'',bookDetails['reading_level']=='kids');

    let book = {}
    if(bookDetails['reading_level']=='kids') {
        NovllUtil.printLog('Publisher.js', 'buildBook(bookDetails)', false,'', '',true,'kids book');

        try {
            // Wait for the asynchronous function to complete
            book['data'] = await KidsAuthor.createBook(bookDetails);

        }catch (error) {
            console.error('An error occurred:', error);
        }

        NovllUtil.printLog('Publisher.js', 'buildBook(bookDetails)', true,'variable: book[\'data\']', book['data']);

        // let illustratedBook = await Illustrator.illustrateBook(book['data']);
        let illustratedBook = await StableIllustrator.illustrateBook(book['data']);
        return illustratedBook;

    }else{

        NovllUtil.printLog('Publisher.js', 'buildBook(bookDetails)', false,'', '',true,'adults book');

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