const NovllUtil = require('./NovllUtil')
const OpenAIApi = require("openai");
const {book} = require("../TestBook");

const censor_text = "the contents of this book cannot contain any inappropriate content, " +
    "this book is for a child.";

require('dotenv').config();
let context = ""

const gpt_version = 'gpt-3.5-turbo-16k'

const openai = new OpenAIApi({
    apiKey: process.env.OPENAI_API_KEY // This is also the default, can be omitted
});

const role_content = "You are an expert AI children's book author who has the ability to write amazing and illustrative children's books for children of any age.";

const messages = [
    { role: 'system', content: role_content },
];

async function illustrateBook(book){
    const bookDetails = book['preferences'];
    const illustrationStyle = bookDetails['illustration_style'];

    // Create character descriptions in the desired style for consistency
    let charactersDescriptions = book['characters'];
    const charactersNamesList = Object.keys(charactersDescriptions);
    for (const characterName of charactersNamesList) {
        let characterDescription = charactersDescriptions[characterName];
        charactersDescriptions[characterName]['illustrationDescription'] = await imagineDescription('character', characterName, characterDescription, illustrationStyle);
    }

    // Create setting descriptions in the desired style for consistency
    let settingsDescriptions = book['settings'];
    const settingNamesList = Object.keys(settingsDescriptions);
    for (const settingName of settingNamesList) {
        let settingDescription = settingsDescriptions[settingName];
        settingsDescriptions[settingName]['illustrationDescription'] = await imagineDescription('setting',settingName, settingDescription, illustrationStyle);
    }

    // create the page-by-page descriptions,
    let pages = book['pages'];
    let pageNumbers = Object.keys(pages)
    for (const pageNumber of pageNumbers){
        let page = pages[pageNumber];
        //text, setting, characters, image
        const finalSceneDescription = await rewriteSceneDescription(page, settingsDescriptions, charactersDescriptions, illustrationStyle)
        const illustrationUrl = await getImageFromText(finalSceneDescription)
        book['pages'][pageNumber]['image_url'] = illustrationUrl;
    }

    return book;
}

async function getImageFromText(text) {

    const response = await openai.createImage({
        prompt: text,
        n: 1,
        size: "1024x1024",
    });
    return response.data.data[0].url;
}

async function imagineDescription(type,name, description, style){

    const descriptionPrompt = "Create an extremely detailed description of an illustrated " + type +
        " called " + name + " that looks like " + description + " in the style of " + style + "."
    const descriptionFromGPT = await NovllUtil.getGptResponse(descriptionPrompt, true, messages);

    messages.push({
        role:'user', content: descriptionPrompt,
        role: 'assistant', content: descriptionFromGPT
    });

    return descriptionFromGPT;
}


async function rewriteSceneDescription(page, settingsDescriptions, charactersDescriptions, illustrationStyle){

    const pageSetting = page['setting']
    const settingDetails = settingsDescriptions[pageSetting]
    const illustrationDescription = page['image']

    const pageCharactersList = page['characters']
    const pageCharactersDetails = {}
    for(const characterName of pageCharactersList){
        const characterDetails = charactersDescriptions[characterName]
        pageCharactersDetails[characterName] = characterDetails
    }

    let illustrationDescriptionPrompt = "Create an extremely detailed description of a children's book " +
        "illustration depicting [" + illustrationDescription + "] where the setting is described as [" +
        settingDetails + "] and the applicable characters are described in the following JSON [" +
        pageCharactersDetails + "]. The style of the artwork illustration should match [" + illustrationStyle + "]."
    const illustrationDescriptionFromGPT = await NovllUtil.getGptResponse(illustrationDescriptionPrompt, true, messages);

    messages.push({
        role:'user', content: illustrationDescriptionPrompt,
        role: 'assistant', content: illustrationDescriptionFromGPT
    });

    return illustrationDescriptionFromGPT;
}

module.exports = {
    illustrateBook
};