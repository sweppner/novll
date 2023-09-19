const Util = require('Util')
const OpenAIApi = require("openai");
const fs = require('fs').promises;
const uuid = require('uuid');
const {book} = require("../TestBook");

require('dotenv').config();
let context = ""


const role_content = "You are an expert AI author who has the ability to write with the style" +
    "and skill of any known or unknown author.";

const messages = [
    { role: 'system', content: role_content },
];


async function getImageFromText(bookText) {

    const prompt = 'Summarize this text in a single sentence to identify the most interesting and ' +
        'best moment to articulate in an illustration: ['+bookText+']'
    let summaryText = getGpt3Response(prompt)


    const response = await openai.createImage({
        prompt: summaryText,
        n: 1,
        size: "1024x1024",
    });

    return response.data.data[0].url;
}


module.exports = {
    getImageFromText
};