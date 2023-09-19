const { MongoClient, ServerApiVersion} = require('mongodb');
const OpenAIApi = require("openai");
const fs = require('fs').promises;
const uuid = require('uuid');
const axios = require('axios');
const gpt_version = 'gpt-3.5-turbo-16k'

require('dotenv').config();
let context = ""

const mongodb_db_name = "NovelDB"
const mongodb_collection = "novels"

const uri = "mongodb+srv://admin:<password>@serverlessinstance0.e8wmahg.mongodb.net/?retryWrites=true&w=majority";

const role_content = "You are an expert AI author who has the ability to write with the style" +
    "and skill of any known or unknown author.";

// { role: 'user', content: 'Who won the world series in 2020?' },
// { role: 'assistant', content: 'The Los Angeles Dodgers won the World Series in 2020.' },
// { role: 'user', content: 'Where was it played?' },

const messages = [
    { role: 'system', content: 'You are an expert AI book editor who has the ability to review a book and identify issues .' },
];


// const role_context_summary = "you are "
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function writeToMongo(fullBook) {
    await client.connect();
    const bookID = uuid.v4();
    const novelCollection = client.db(mongodb_db_name).collection(mongodb_collection);

    const bookDocument = {
        _id: bookID,
        content: fullBook
    };

    await novelCollection.insertOne(bookDocument);

    await client.close();

    return bookID;
}

async function getBookByID(field, value) {

    try {
        // Connect to the MongoDB server
        await client.connect();

        // Get the database and collection
        const db = client.db(mongodb_db_name);
        const collection = db.collection(mongodb_collection);

        // Find one object where the field matches the value
        const result = await collection.findOne({ [field]: value });

        if (result) {
            console.log(`Found a document that matches with ${field}: ${value}`);
            console.log(result);
            return result;
        } else {
            console.log(`No document matches with ${field}: ${value}`);
            return null;
        }

    } catch (err) {
        console.error(err);
    } finally {
        // Close the MongoDB client
        await client.close();
    }
}

function extractJSONFromString(str) {
    const startIndex = str.indexOf('{');
    const endIndex = str.lastIndexOf('}') + 1;

    if (startIndex === -1 || endIndex === -1 || startIndex >= endIndex) {
        return null; // Return null if there are no valid JSON strings
    }

    console.log(str.substring(startIndex, endIndex))
    return JSON.parse(str.substring(startIndex, endIndex));
}

const openai = new OpenAIApi({
    apiKey: process.env.OPENAI_API_KEY // This is also the default, can be omitted
});

async function editBook(book) {

    const messages = [
        { role: "system", content: role_content },
    ];
    // const conceptValidation = await getGpt3Response('Validate the concept for the novel:'+bookInfo['concept'];
    let outlinePrompt = "Write a comprehensive outline for the book \""+bookInfo['title']+"\" based on" +
        " the following synopsis: ["+bookInfo["synopsis"]+"]. This should include a genre, a list of settings, a " +
        "list of characters with descriptions of each character, a chapter-by-chapter breakdown, an epilogue " +
        "description, and a list of appendices."
    const outline = await getGpt3Response(outlinePrompt, true, messages);

    // console.log('outline')
    // console.log(outline)

    messages.push({
        role:'user', content: outlinePrompt,
        role: 'assistant', content: outline
    });

    let outlineJSONPrompt = "Create a JSON object based on this outline ["+outline+"] that contains a key for each chapter, for the following" +
        "keys and values:" +
        "\"genre\": (string) the genre," +
        "\"settings\": (array) an array of strings, each string describing one of the settings in detail," +
        "\"characters\": (JSON) a JSON object where each key is the name of a main character who's values are strings descriptions," +
        "\"epilogue\": (string) a detailed description of the epilogue," +
        "\"appendices\": (array) an array of strings with a description of each member of the appendix," +
        "\"chapters\": (JSON) a JSON object with a key for each chapter number, where the value is a JSON object with the following keys and values: " +
        "\"title\": (string) the title of the chapter," +
        "\"description\": (array) an array of strings that are the descriptive sentences of the chapter";
    const outlineJSONString = await getGpt3Response(outlineJSONPrompt, true, messages);

    messages.push({
        role:'user', content: outlineJSONPrompt,
        role: 'assistant', content: outlineJSONString
    });

    const outlineJSON = extractJSONFromString(outlineJSONString)

    let chapter_list = Object.keys(outlineJSON['chapters'])
    let book = {}
    for(let chapter_index = 1; chapter_index < chapter_list.length; chapter_index ++){
        let chapterString = chapter_index.toString()
        let chapterObject = outlineJSON['chapters'][chapterString]
        let chapterTitle = chapterObject['title']
        let chapterDescription = chapterObject['description']

        let chapterPrompt = "Write chapter "+chapterString+" in its' entirety. The title of the chapter " +
            "is \""+chapterTitle+"\" and the description is: "+chapterDescription;
        const chapter = await getGpt3Response(chapterPrompt, true, messages);

        // console.log('outline')
        // console.log(outline)

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

    return book;
}


//TODO: add option to provide multiple books or authors
//TODO: need a way to validate books/authors
//TODO: idea, something to suggest other books or authors by genre

const includesDescription = "Each book idea including a title, a brief concept, a synopsis that is 5 " +
    "sentences long, a genre, and a description of the cover art for the front of the book."
const responseFormat = "Please provide the response formatted as a JSON object. For title use the key " +
    "\"title\", for concept use the key \"concept\", for synopsis use the key \"synopsis\", for genre use the" +
    " key \"genre\", and for the description of the cover art for the front of the book use the key \"cover_art\"."

async function fetchBookIdeasByBook(book_title, num_ideas=5){
    const prompt = "Provide me with ideas for " + num_ideas.toString() + " books similar in writing style, genre," +
        " and themes to the book " + book_title + ". " + includesDescription + " " + responseFormat;

    // const idea = await getGpt3Response(prompt);
    return await getGpt3Response(prompt);;
}

async function fetchBookIdeasByAuthor(author_name, num_ideas=5){
    const prompt = "Provide me with ideas for " + num_ideas.toString() + " books similar in writing style, genre," +
        " and themes as books written by the author " + author_name + ". " + includesDescription + " " + responseFormat;

    // const idea = await getGpt3Response(prompt);

    return await getGpt3Response(prompt);;
}

async function fetchBookIdeasByBookAndAuthor(book_title, author_name, num_ideas=5){
    const prompt = "Provide me with ideas for " + num_ideas.toString() + " books similar in writing style, genre," +
        " and themes to the book " + book_title + " by the author "+author_name+". " + includesDescription + " " + responseFormat;
    console.log("Using openai api (GPT3) to generate [ " + num_ideas.toString() + " ] book ideas.")

    const idea = await getGpt3Response(prompt);
    console.log("Ideas fetched.")

    // console.log(idea)
    return idea;
}

async function fetchBookIdeasByGenreAndConcept(genre, concept, num_ideas=5){
    const prompt = "Provide me with ideas for " + num_ideas.toString() + " books of the "+genre+" genre " +
        " inspired by the following idea [ " + concept + " ]. " + includesDescription + " " + responseFormat;

    // const idea =
    return await getGpt3Response(prompt);;
}

async function getGpt3Response(prompt, is_context=false, messages=[]){
    console.log('Prompt: '+prompt.substring(0, 50)+'...');

    if(is_context){
        messages.push({
            role: "user", content: prompt
        })
    }else{
        messages = [    { role: "system", content: role_content },
            { role: "user", content: prompt }]
    }

    console.log('messages')
    console.log(messages)

    try {
        const chatCompletion = await openai.chat.completions.create({
            model: gpt_version, // You may need to use the model identifier relevant to you
            messages: messages
        });

        const completionText = chatCompletion.choices[0].message.content;

        console.log('completionText')
        console.log(completionText)

        // This line is just for demonstration, you can remove it
        // console.log(`Prompt: ${prompt}\nResponse: ${completionText}`);

        return completionText;
    } catch (error) {
        if (error.response) {
            console.error(error.response.status);
            console.error(error.response.data);
        } else {
            console.error(error.message);
        }
        return null; // or return a default message
    }
};

module.exports = {
    createBook,
    fetchBookIdeasByBook,
    fetchBookIdeasByAuthor,
    fetchBookIdeasByBookAndAuthor,
    fetchBookIdeasByGenreAndConcept,
    getBookByID
};
