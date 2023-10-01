const Publisher = require('./Publisher');
const Util = require('./NovllUtil');

let page_words_length_lowerbound = 25;
let page_words_length_upperbound = 40;
let num_pages = 25

//get book ideas by book author and title
async function getBookIdeas(bookConceptPreferences, num_ideas=5){
    console.log('KidCustomer - getBookIdeas')
    const ideas_properties = ['child_age','child_interests','illustration_style','characters','settings',
        'emotions_include','lessons']

    if (Util.requestHasAllDetails(bookConceptPreferences, ideas_properties)) {
        console.log('KidCustomer - callingPublisher')

        bookConceptPreferences['num_ideas'] = num_ideas;
        bookConceptPreferences['reading_level'] = 'kids';

        return await Publisher.getBookIdeas(bookConceptPreferences)
    }else{
        return {
            'message': "Error: issue with bookConcept object"
        }
    }

    //TODO: for each chapter generate
}

//build book by selected concept
async function getNewBook(bookDetails) {
    console.log('KidCustomer - getNewBook')
    bookDetails['reading_level'] = 'kids';

    console.log('bookDetails')
    console.log(bookDetails)

    const new_book_properties = ['child_age','child_interests','illustration_style','characters','settings',
        'emotions_include','lessons','your_book_title','your_book_synopsis','num_pages']

    console.log('Util.requestHasAllDetails(bookDetails, new_book_properties)')
    console.log(Util.requestHasAllDetails(bookDetails, new_book_properties))


    if(Util.requestHasAllDetails(bookDetails, new_book_properties)){
        // bookDetails['num_pages'] = num_pages;
        console.log("here")
        bookDetails['page_words_length_lowerbound'] = page_words_length_lowerbound;
        bookDetails['page_words_length_upperbound'] = page_words_length_upperbound;
        bookDetails['censor_text'] = "the contents of this book cannot contain any inappropriate content, " +
            "this book is for a child.";
        // bookDetails['by_page'] = true
        // bookDetails['illustrated'] = true


        // Construct and return a string response
        try {
            // Wait for the asynchronous function to complete
            return await Publisher.buildBook(bookDetails);
        } catch (error) {
            console.error('An error occurred:', error);
        }
    }else{

    }

    return {};
}

async function getPublishedBook(id) {

    try {
        // Connect to the MongoDB server
        return await Publisher.getBook(id);
    } catch (err) {
        console.error(err);
    }
    return {}
}

module.exports = {
    getBookIdeas,
    getPublishedBook,
    getNewBook
};