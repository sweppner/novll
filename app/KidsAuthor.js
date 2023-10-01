const NovllUtil = require('./NovllUtil')

const censor_text = "the contents of this book cannot contain any inappropriate content, " +
    "this book is for a child.";

const role_content = "You are an expert AI children's book author who has the ability to write amazing and illustrative children's books for children of any age.";

async function getBookIdeas(bookConceptPreferences) {

    const bookIdeasPrompt = getBookIdeaPrompt(bookConceptPreferences);
    const num_ideas = bookConceptPreferences['num_ideas'];

    console.log('bookIdeasPrompt')
    console.log(bookIdeasPrompt)

    try{
        console.log("Using openai api version ["+NovllUtil.gpt_version+"] to generate [ " + num_ideas.toString() + " ] book ideas.");
        const bookIdeas = await NovllUtil.getGptResponse(bookIdeasPrompt);
        console.log("["+num_ideas.toString()+"] ideas fetched.")
        return await NovllUtil.extractArrayFromString(bookIdeas);
    }catch(error){
        console.log(error); // Error: "It broke"
        return await getBookIdeas(bookIdeasPrompt);
    }
}

function getBookIdeaPrompt(bookConceptPreferences){

    let child_age = bookConceptPreferences['child_age'];
    let child_interests = bookConceptPreferences['child_interests'];
    let illustration_style = bookConceptPreferences['illustration_style'];
    let characters = bookConceptPreferences['characters'];
    let settings = bookConceptPreferences['settings'];
    let emotions_include = bookConceptPreferences['emotions_include'];
    let lessons = bookConceptPreferences['lessons'];

    console.log("Requesting children's book ideas for children " + child_age + "years old. They are interested in " +
        "[" + child_interests + "]. The book ideas should include the following types of characters: ["
        + characters + "], and be based in one of these settings [" + settings + "]. The book concepts should include " +
        "stories where the characters explore the following types of emotions [" + emotions_include + "], and the " +
        "following lessons [" + lessons + "].");

    const includesDescription = "Each book idea including a title, a brief concept, a synopsis that is 5 " +
        "sentences long, a genre, a hyper specific artistic style (example of a similar artist, medium, and color scheme) " +
        "for book illustrations, and a description of the cover art for the front of the book."

    const responseFormat = " Please provide the response formatted as an array of JSON objects, with an object" +
        " for each book idea. For each object: for the title use the key \"title\", for concept use the key" +
        " \"concept\", for synopsis use the key \"synopsis\", for genre use the key \"genre\", for artistic style " +
        "use the key \"style\", and for the description of the cover art for the front of the book use the " +
        "key \"cover_art\"."

    let prompt = "Provide me with ideas for " + 5 + " children's books for children " + child_age + "years " +
        "old. They are interested in [" + child_interests + "]. The book ideas should include the following types " +
        "of characters: [" + characters + "], and be based in one of these settings [" + settings + "]. The book " +
        "concepts should include stories where the characters explore the following types of emotions [" +
        emotions_include + "], and the following lessons [" + lessons + "].";

    return prompt + '.' + includesDescription + " " + responseFormat;
}

// const messages = [
//     { role: 'system', content: role_content },
// ];

async function createBook(bookInfo) {

    let messages = [
        { role: "system", content: role_content },
    ];

    // Meaningful Illustrations: Detailed and relevant illustrations enhance comprehension and attract young readers.

    let outlinePrompt = "Write a full children's book titled \""+bookInfo['your_book_title:']+"\" " +
        "based on the following synopsis: ["+bookInfo['your_book_synopsis:']+"]. This story should: " +
        "   - aid childhood cognitive development for a child "+bookInfo['child_age']+" years old, nurture independent thinking, and foster joy in reading." +
        "   - reflect the children's interests ["+bookInfo['child_interests']+"] " +
        "   - introduce children to age appropriate rich vocabulary while ensuring the story remains readable, engaging and relatable" +
        "   - have relatable characters facing real-world problems" +
        "   - ensure the book aligns with the cognitive level, comprehension, and interests of a child "+bookInfo['child_age']+" years old" +
        "   - impart valuable lessons on emotions, society, identity, and academic topics" +
        "   - have a well-defined beginning, middle, and end in order to facilitate comprehension and storytelling skills" +
        "   - have an engaging storyline to maintain interest through humor or suspense" +
        "   - have vivid descriptions and detailed scenes to help children visualize and immerse themselves in the story" +
        "The book should deal with the following emotions [" + bookInfo['emotions_include'] + "] and teach the following lesson(s) ["+ bookInfo['lessons'] + "]."
        //+ "The story should include a list of settings, a list of characters with detailed descriptions of each character and a page-by-page breakdown, where there is a description of what should happen on each page independently. " +
        // "This book should be exactly " + bookInfo['num_pages'] + " pages long and the outline should be page by page."


    const outline = await NovllUtil.getGptResponse(outlinePrompt, true, messages);

    messages.push({
        role:'user', content: outlinePrompt,
        role: 'assistant', content: outline
    });

    let page_breakdown_prompt = 'Take the following story and break it up into ' + bookInfo['num_pages'] + ' pages of text: [' + outline + '].'

    const pages = await NovllUtil.getGptResponse(page_breakdown_prompt, true, messages);

    messages.push({
        role:'user', content: page_breakdown_prompt,
        role: 'assistant', content: pages
    });

    console.log('outline')
    console.log(outline)

    let outlineJSONPrompt = "Create a JSON object based on these pages ["+pages+"] that contains a key for each page, for the following keys and values:" +
        "\"settings\": (JSON) a JSON object where each key is the name of a setting whose value is a string describing the setting in vivid visual detail," +
        "\"characters\": (JSON) a JSON object where each key is the name of a character whose value is a strings describing in vivid, visual detail of what they look like" +
        "\"pages\": (JSON) a JSON object with a key for each page number, where the value is a JSON object with the following keys and values: " +
        "   \"text\": (text) the narrative story text for the page, which should be eloquent and between " + bookInfo['page_words_length_lowerbound']+ " and " + bookInfo['page_words_length_upperbound']+ " words long. " +
        "   \"setting\": (text) the name of the setting where this part of the story happens " +
        "   \"characters\": (array) an array of strings, containing each characters name that is involved in the part of the story on this page. " +
        "   \"image\": (text) a detailed description of the illustration, which should highlight which characters are featured on this page, what they are doing, and where they are doing it.";

    let outlineJSONString = await NovllUtil.getGptResponse(outlineJSONPrompt, true, messages);

    let outlineJSON = await NovllUtil.extractJSONFromString(outlineJSONString)

    if(outlineJSON['success']){
        console.log('Returned valid json')
        messages.push({
            role:'user', content: outlineJSONPrompt,
            role: 'assistant', content: outlineJSONString
        });
        outlineJSON = outlineJSON['data']
        outlineJSON['preferences'] = bookInfo
        return outlineJSON;

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
}

//Get book ideas from ChatGPT, by author, title, or both.

//TODO: add option to provide multiple books or authors
//TODO: need a way to validate books/authors
//TODO: idea, something to suggest other books or authors by genre



module.exports = {
    createBook,
    getBookIdeas
};


// OLD BOOK WRITING PROMPT
//
// let outlinePrompt = "Write a comprehensive outline for the children's book \""+bookInfo['your_book_title:']+"\" " +
//     "based on the following synopsis: ["+bookInfo['your_book_synopsis:']+"]. This story should: " +
//     "   - aid childhood cognitive development for a child "+bookInfo['child_age']+" years old, nurture independent thinking, and foster joy in reading." +
//     "   - reflect the children's interests ["+bookInfo['child_interests']+"] " +
//     "   - introduce children to age appropriate rich vocabulary while ensuring the story remains readable, engaging and relatable" +
//     "   - have relatable characters facing real-world problems" +
//     "   - ensure the book aligns with the cognitive level, comprehension, and interests of a child "+bookInfo['child_age']+" years old" +
//     "   - impart valuable lessons on emotions, society, identity, and academic topics" +
//     "   - have a well-defined beginning, middle, and end in order to facilitate comprehension and storytelling skills" +
//     "   - have an engaging storyline to maintain interest through humor or suspense" +
//     "   - have vivid descriptions and detailed scenes to help children visualize and immerse themselves in the story" +
//     "The book should deal with the following emotions [" + bookInfo['emotions_include'] + "], and teach the following lesson(s) ["+ bookInfo['lessons'] + "]."+
//     "The story should include a list of settings, a list of characters with detailed descriptions of each character and a page-by-page breakdown, where there is a description of what should happen on each page independently. " +
//     "This book should be exactly " + bookInfo['num_pages'] + " pages long and the outline should be page by page."