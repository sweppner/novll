const NovllUtil = require('./NovllUtil')


let context = "";

const role_content = "You are an expert AI author who has the ability to write with the style" +
    "and skill of any known or unknown author.";

const age_setting = 'Adults'

async function getBookIdeas(bookConceptPreferences) {

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

    const bookIdeasPrompt = buildBookIdeaQuery(bookAuthor, bookTitle, bookTitle, bookConcept, num_ideas);

    try{
        console.log("Using openai api version ["+NovllUtil.gpt_version+"] to generate [ " + num_ideas.toString() + " ] book ideas.");
        const bookIdeas = await NovllUtil.getGptResponse(bookIdeasPrompt);
        console.log("["+num_ideas.toString()+"] ideas fetched.")
        return await NovllUtil.extractArrayFromString(bookIdeas);
    }catch(error){
        console.log(error); // Error: "It broke"
        return await getBookIdeas(bookConcept);
    }
}

// const messages = [
//     { role: 'system', content: role_content },
// ];

async function createBook(bookInfo) {

    let messages = [
        { role: "system", content: role_content },
    ];

    let outlinePrompt = "Write a comprehensive outline for the book \""+bookInfo['title']+"\" based on" +
        " the following synopsis: ["+bookInfo["synopsis"]+"]. This should include a genre, a list of settings, a " +
        "list of characters with descriptions of each character, a chapter-by-chapter breakdown, an epilogue " +
        "description, and a list of appendices. This book should be exactly " + bookInfo['num_chapters'] + " chapters long."

    const outline = await NovllUtil.getGptResponse(outlinePrompt, true, messages);

    messages.push({
        role:'user', content: outlinePrompt,
        role: 'assistant', content: outline
    });

    console.log('outline')
    console.log(outline)

    let outlineJSONPrompt = "Create a JSON object based on this outline ["+outline+"] that contains a key for each chapter, for the following" +
        "keys and values:" +
        "\"genre\": (string) the genre," +
        "\"settings\": (array) an array of strings, each string describing one of the settings in detail," +
        "\"characters\": (JSON) a JSON object where each key is the name of a main character who's values are strings descriptions," +
        "\"epilogue\": (string) a detailed description of the epilogue," +
        "\"appendices\": (array) an array of strings with a description of each member of the appendix," +
        "\"chapters\": (JSON) a JSON object with a key for each chapter number, where the value is a JSON object with the following keys and values: " +
        "   \"title\": (string) the title of the chapter," +
        "   \"description\": (array) an array of strings that are the descriptive sentences of the chapter";
    let outlineJSONString = await NovllUtil.getGptResponse(outlineJSONPrompt, true, messages);

    let outlineJSON = await NovllUtil.extractJSONFromString(outlineJSONString)

    if(outlineJSON['success']){
        console.log('Returned valid json')
        messages.push({
            role:'user', content: outlineJSONPrompt,
            role: 'assistant', content: outlineJSONString
        });
        outlineJSON = outlineJSON['data']

        if(Object.keys(outlineJSON['chapters']).length != bookInfo['num_chapters']){
            return createBook(bookInfo);
        }
    }else{
        console.log('Returned invalid json')

        if( outlineJSON.hasOwnProperty('data')){
            let outlineJSONFixPrompt = "Take this text and extract the JSON from it. Your response should " +
                "only include the text representing a valid JSON object." + JSON.stringify(outlineJSON['data']);
            outlineJSON = await NovllUtil.getGptResponse(outlineJSONFixPrompt);
            outlineJSON = await NovllUtil.extractJSONFromString(outlineJSON);
        }else{
            console.log('Needs work')
        }
    }

    let chapter_list = Object.keys(outlineJSON['chapters']);
    let book = {}

    console.log("outlineJSON['chapters']")
    console.log(outlineJSON['chapters'])

    for(let chapter_index = 1; chapter_index < chapter_list.length+1; chapter_index ++){
        let chapterString = chapter_index.toString()
        let chapterObject = outlineJSON['chapters'][chapterString]

        let chapterTitle = chapterObject['title']
        let chapterDescription = chapterObject['description']

        let chapterPrompt = "Write chapter "+chapterString+" in its' entirety, titled " +
            "is \""+chapterTitle+"\", based on the description: "+chapterDescription+". The response " +
            "should only include the text of the chapter. The chapter should be "
            +bookInfo['chapter_length_lowerbound']+" to " + bookInfo['chapter_length_upperbound'] + " words in length," +
            "and do not include any other text other than the chapter and no other comments from the prompt.";
        const chapter = await NovllUtil.getGptResponse(chapterPrompt, true, messages);

        messages.push({
            role:'user', content: chapterPrompt,
            role: 'assistant', content: chapter
        });

        book[chapterString] = {
            "title": chapterTitle,
            "description": chapterDescription,
            "text": chapter
        }
    }
    book['details'] = bookInfo;

    return book;
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


async function fetchBookIdeasByBookAndAuthor(book_title, author_name, num_ideas=5){

    const includesDescription = "Each book idea including a title, a brief concept, a synopsis that is 5 " +
        "sentences long, a genre, a hyper specific artistic style (example of a similar artist, medium, and color scheme) " +
        "for book illustrations, and a description of the cover art for the front of the book."

    const responseFormat = "Please provide the response formatted as a JSON object. For title use the key " +
        "\"title\", for concept use the key \"concept\", for synopsis use the key \"synopsis\", for genre use the" +
        " key \"genre\", for artistic style use the key \"style\", and for the description of the cover art for the " +
        "front of the book use the key \"cover_art\"."

    const prompt = "Provide me with ideas for " + num_ideas.toString() + " books similar in writing style, " +
        "genre, and themes to the book " + book_title + " by the author "+author_name+". " + includesDescription +
        " " + responseFormat;

    console.log("Using openai api (GPT3) to generate [ " + num_ideas.toString() + " ] book ideas.")

    const ideas = await NovllUtil.getGptResponse(prompt);
    console.log("Ideas fetched.")

    // console.log(idea)
    return ideas;
}


//Get book ideas from ChatGPT, by author, title, or both.

//TODO: add option to provide multiple books or authors
//TODO: need a way to validate books/authors
//TODO: idea, something to suggest other books or authors by genre



module.exports = {
    createBook,
    fetchBookIdeasByBookAndAuthor,
    getBookIdeas
};
