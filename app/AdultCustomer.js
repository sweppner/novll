const Publisher = require('./Publisher');

let chapter_length_lowerbound = 500;
let chapter_length_upperbound = 3000;

//get book ideas by book author and title
async function getBookIdeas(bookConceptPreferences, num_ideas=5){
    bookConceptPreferences['censor_text'] = "this is an adult book, so it may or may not include inappropriate " +
        "content based on direction from the user.";
    const bookIdeasPrompt = getBookIdeaPrompt(bookConceptPreferences)
    bookConceptPreferences['bookIdeasPrompt'] = bookIdeasPrompt
    return await Publisher.getBookIdeas(bookConceptPreferences, num_ideas)
    //TODO: for each chapter generate
}

//build book by selected concept

async function getNewBook(bookDetails) {

    bookDetails['chapter_length_lowerbound'] = chapter_length_lowerbound;
    bookDetails['chapter_length_upperbound'] = chapter_length_upperbound;
    bookDetails['censor_text'] = "this is an adult book, so it may or may not include inappropriate " +
        "content based on direction from the user.";
    bookDetails['by_page'] = false;
    bookDetails['by_chapter'] = true
    bookDetails['illustrated'] = false;

    if (bookDetails && bookDetails.title && bookDetails.genre && bookDetails.num_chapters && bookDetails.synopsis) {
        // Construct and return a string response
        try {
            // Wait for the asynchronous function to complete
            return await Publisher.buildBook(bookDetails);
        } catch (error) {
            console.error('An error occurred:', error);
        }
    } else {
        // res.status(400).send('Invalid JSON object. A "name" property is required.');
    }
    return {};
}

function getBookIdeaPrompt(bookConceptPreferences){
    let bookAuthor = '';
    let bookTitle = '';
    let bookGenre = '';
    let bookConcept = '';
    let bookNumChapters = 10;
    let num_ideas = bookConceptPreferences['num_ideas']

    console.log('bookConceptPreferences')
    console.log(bookConceptPreferences)

    if(bookConceptPreferences.hasOwnProperty('book_author')){
        bookAuthor = bookConceptPreferences['book_author']
    }

    if(bookConceptPreferences.hasOwnProperty('book_title')){
        bookTitle = bookConceptPreferences['book_title']
    }

    if(bookConceptPreferences.hasOwnProperty('book_genre')){
        bookGenre = bookConceptPreferences['book_genre']
    }

    if(bookConceptPreferences.hasOwnProperty('book_concept')){
        bookConcept = bookConceptPreferences['book_concept']
    }

    if(bookConceptPreferences.hasOwnProperty('num_chapters')){
        bookNumChapters = bookConceptPreferences['num_chapters']
    }

    console.log("Requesting book ideas based on Author [ " + bookAuthor + " ], title [ " + bookTitle + " ], " +
        "genre ["+bookGenre+'], and concept ['+bookConcept+']. Make sure that these ideas are inspired by ' +
        'but not measurably derivative of the original work. They cant reference any names, titles, or other' +
        ' concepts used in any of the authors other works');

    return buildBookIdeaQuery(bookAuthor, bookTitle, bookTitle, bookConcept, num_ideas);
}

function buildBookIdeaQuery(author_name, book_title, genre, concept, num_chapters) {
    const includesDescription = "Each book idea including a title, a brief concept, a synopsis that is 5 " +
        "sentences long, a genre, a hyper specific artistic style (example of a similar artist, medium, and color scheme) " +
        "for book illustrations, and a description of the cover art for the front of the book."

    const responseFormat = " Please provide the response formatted as an array of JSON objects, with an object" +
        " for each book idea. For each object: for the title use the key \"title\", for concept use the key" +
        " \"concept\", for synopsis use the key \"synopsis\", for genre use the key \"genre\", for artistic style " +
        "use the key \"style\", and for the description of the cover art for the front of the book use the " +
        "key \"cover_art\"."

    let prompt = "Provide me with ideas for " + 5 + " books that fulfill the " +
        "following requirements:";
    // "similar in writing style, " +
    //     "genre, and themes to the book " + book_title + " by the author "+author_name+". " + includesDescription +
    //     " " + responseFormat;
    if (author_name != '') {
        prompt = prompt + 'match the style of the author ' + author_name + ', ';
    }

    if (book_title != '') {
        prompt = prompt + 'match the style of the book ' + book_title + ', '
    }

    if (genre != '') {
        prompt = prompt + 'are written in the genre ' + genre + ', '
    }

    if (concept != '') {
        prompt = prompt + 'are inspired by the following concept [' + genre + '] '
    }

    if((author_name == '')&&(book_title == '')&&(genre == '')&&(concept == '')){
        prompt = prompt + "any creative ideas that you may have as long as they they are appropriate for "
            + age_setting+'.'
    }

    return prompt + '.' + includesDescription + " " + responseFormat;
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