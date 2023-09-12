const { MongoClient, ServerApiVersion} = require('mongodb');
const OpenAIApi = require("openai");
const fs = require('fs').promises;
const uuid = require('uuid');
require('dotenv').config();

const mongodb_db_name = "NovelDB"
const mongodb_collection = "novels"

const uri = "mongodb+srv://admin:<password>@serverlessinstance0.e8wmahg.mongodb.net/?retryWrites=true&w=majority";

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


const openai = new OpenAIApi({
    apiKey: process.env.OPENAI_API_KEY // This is also the default, can be omitted
});


async function generateContent(prompt) {
    const maxTokens = 100;
    const response = await openai.completions.create({
        prompt,
        max_tokens: maxTokens,
        model: "gpt-3.5-turbo"
    });
    return response.choices[0].text.trim();
}

async function createBook(bookInfo) {
    const characterData = {};
    const draft = [];

    const conceptValidation = await getGpt3Response(`Validate the concept for the novel: ${bookInfo.concept}`);
    const themeExploration = await getGpt3Response("Identify themes that the novel will explore.");
    const outline = await getGpt3Response("Create an outline for the novel based on the synopsis.");
    const numCharString = await getGpt3Response("Based on the outline [ " + outline + " ] determine the number of characters the story should include and respond to this prompt with just the number, and nothing else.")
    let numChar = parseInt(numCharString)

    // const numCharacters = 4;
    for (let i = 1; i <= numChar; i++) {
        const charConcept = await getGpt3Response(`Describe the type and role of character ${i} in the novel.`);
        const charBackstory = await getGpt3Response(`Generate a backstory for character ${i}.`);
        const charTraits = await getGpt3Response(`List the physical features, personality traits, strengths, and weaknesses for character ${i}.`);
        const charArc = await getGpt3Response(`Outline the character arc for character ${i}.`);

        characterData[`Character_${i}`] = {
            Concept: charConcept,
            Backstory: charBackstory,
            Traits: charTraits,
            Arc: charArc
        };
    }

    const conflicts = await getGpt3Response("Describe the primary and secondary conflicts in the novel.");
    const pacingTiming = await getGpt3Response("Determine the pacing for the novel.");
    const subplots = await getGpt3Response("Outline any subplots in the novel.");
    let numChapters = await getGpt3Response("Based on the book's outline [ " + outline + " ], conflicts [ " + conflicts + " ], pacing timing [ " + pacingTiming + " ], and subplots [ " + subplots + " ], how many chapters should the book have? The response to this prompt should only be the number representing the number of chapters, nothing else.");



    if(!bookInfo.exists('num_chapters')){
        numChapters = bookInfo['num_chapters']
    }

    for (let i = 1; i <= numChapters; i++) {
        const chapterDraft = await getGpt3Response(`Write the draft for Chapter ${i} based on the outline.`);
        draft.push(chapterDraft);
    }

    const climax = await getGpt3Response("Describe the climax of the novel.");
    const resolution = await getGpt3Response("Explain how the novel will conclude.");

    let fullBook = `Title: ${bookInfo.title}\n\nSynopsis: ${bookInfo.synopsis}\n\n=== Characters ===\n`;

    for (const char in characterData) {
        fullBook += `\n${char}\nConcept: ${characterData[char].Concept}\nBackstory: ${characterData[char].Backstory}\nTraits: ${characterData[char].Traits}\nArc: ${characterData[char].Arc}\n`;
    }

    fullBook += `\n=== Outline ===\n${outline}\n\n=== Conflicts ===\n${conflicts}\n\n=== Pacing ===\n${pacingTiming}\n\n=== Subplots ===\n${subplots}\n\n=== Chapters ===\n`;

    for (let i = 0; i < draft.length; i++) {
        fullBook += `\nChapter ${i + 1}\n${draft[i]}\n`;
    }

    fullBook += `\n=== Climax ===\n${climax}\n\n=== Resolution ===\n${resolution}`;

    let bookObject = {
        'bookInfo': bookInfo,
        'fullBook': fullBook
    }

    let bookID = await writeToMongo(bookObject)
    await fs.writeFile(`${bookInfo.title}.txt`, fullBook);

    return bookID;
}

//Get book ideas from ChatGPT, by author, title, or both.

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


async function getGpt3Response(prompt){

    try {
        const messages = [
            { role: "system", content: "You are an expert AI author who has the ability to write with the style" +
                    "and skill of any known or unknown author." },
            { role: "user", content: prompt }
        ];

        const chatCompletion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo", // You may need to use the model identifier relevant to you
            messages: messages
        });

        const completionText = chatCompletion.choices[0].message.content;

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
