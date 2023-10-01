const {MongoClient, ServerApiVersion} = require("mongodb");
const uuid = require("uuid");
const mongodb_db_name = "NovelDB"
const mongodb_collection = "novels"
const OpenAIApi = require("openai");
require('dotenv').config();

const gpt_version = 'gpt-3.5-turbo-16k'

const role_content = "You are an expert AI author who has the ability to write with the style" +
    "and skill of any known or unknown author.";

const uri = 'mongodb+srv://admin:<password>@serverlessinstance0.e8wmahg.mongodb.net/?retryWrites=true&w=majority';


const openai = new OpenAIApi({
    apiKey: process.env.OPENAI_API_KEY // This is also the default, can be omitted
});


// const role_context_summary = "you are "
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

// response = openai.Image.create_edit(
//     image=open("sunlit_lounge.png", "rb"),
//     mask=open("mask.png", "rb"),
//     prompt="A sunlit indoor lounge area with a pool containing a flamingo",
//     n=1,
//     size="1024x1024"
// )
// image_url = response['data'][0]['url']


async function getGptResponse(prompt, is_context=false, messages=[]){
    // const prompt = object[]
    console.log('Prompt: '+prompt.substring(0, 75)+'...');

    if(is_context){
        messages.push({
            role: "user", content: prompt
        })
    }else{
        messages = [    { role: "system", content: role_content },
            { role: "user", content: prompt }]
    }

    try {
        const chatCompletion = await openai.chat.completions.create({
            model: gpt_version, // You may need to use the model identifier relevant to you
            messages: messages
        });

        const completionText = chatCompletion.choices[0].message.content;

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


async function extractJSONFromString(str) {
    const startIndex = str.indexOf('{');
    const endIndex = str.lastIndexOf('}') + 1;

    let response = {
        'success': false
    }

    if (startIndex === -1 || endIndex === -1 || startIndex >= endIndex) {
        return response; // Return null if there are no valid JSON strings
    }

    try {
        let data =  JSON.parse(str.substring(startIndex, endIndex));
        response['data'] = data
        response['success'] = true
    } catch {
        console.log("extractJSONFromString - issue parsing JSON from string")
        let outlineJSONFixPrompt = "Take this text and extract the JSON from it. Your response should " +
            "only include the text representing a valid JSON object."+str.substring(startIndex, endIndex);

        let data = await getGptResponse(outlineJSONFixPrompt)

        response['data'] = JSON.parse(data);
    }

    return response;
}


async function extractArrayFromString(str) {
    const startIndex = str.indexOf('[');
    const endIndex = str.lastIndexOf(']') + 1;

    let response = {
        'success': false
    }

    if (startIndex === -1 || endIndex === -1 || startIndex >= endIndex) {
        return response; // Return null if there are no valid JSON strings
    }

    try {
        let data =  JSON.parse('{array:'+str.substring(startIndex, endIndex)+'}');
        response['data'] = data.array;
        response['success'] = true;
    } catch {
        console.log("extractJSONFromString - issue parsing JSON from string")
        let outlineJSONFixPrompt = "Take this text and extract the JSON from it. Your response should " +
            "only include the text representing a valid JSON object."+str.substring(startIndex, endIndex);

        let data = await getGptResponse(outlineJSONFixPrompt);

        response['data'] = JSON.parse(data);
    }

    return response;

    // return processObjectString(startIndex, endIndex, str);
}

function requestHasAllDetails(bookConceptPreferences, properties){
    console.log('NovllUtil - requestHasAllDetails')

    let propertyResponses = []

    let has_details = false;
    let is_first = true;

    properties.forEach(function(property){
        if(is_first){
            has_details = (typeof bookConceptPreferences != "undefined");
            is_first = false;
        }else{
            has_details = (has_details && bookConceptPreferences.hasOwnProperty(property))
        }
    });
    return has_details
}

module.exports = {
    writeToMongo,
    requestHasAllDetails,
    getBookByID,
    getGptResponse,
    extractJSONFromString,
    extractArrayFromString,
    gpt_version
};