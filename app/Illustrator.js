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

const role_content = "You are an expert AI children's book illustrator who has the ability to imagine and " +
    "create beautiful illustrations for children's books for children of any age.";

const messages = [
    { role: 'system', content: role_content },
];

async function illustrateBook(book){
    console.log('Illustrator - illustrateBook - book')
    console.log(book)
    const bookDetails = book['preferences'];
    const illustrationStyle = bookDetails['illustration_style'];
    let charactersDescriptions = book['characters'];

    // create the page-by-page descriptions,
    let pages = book['pages'];
    let pageNumbers = Object.keys(pages);


    let prompt = "";
    for (const pageNumber of pageNumbers){
        let page = pages[pageNumber];
        let image_text = page['image'];
        let characters = page['characters'];
        let scene = page['scene'];
        let action = page['action'];
        let pageCharactersDescription = []
        for(const character of characters){
            let characterDescription = charactersDescriptions[character];
            pageCharactersDescription.push(character + "'s description: " + characterDescription + ". ");
        }

        // Old prompt
        // const finalScenePrompt = image_text + ". The image should be an illustration in the following style [" + illustrationStyle + " ]"

        const finalScenePrompt = "A children's book illustration in the style of [" + illustrationStyle + "]. " +
            "This is what is happening in the illustration [" + image_text + "]. " +
            "The characters in the scene must match these descriptions: [" + pageCharactersDescription.toString() + "]." +
            "The picture shouldn't contain any text.";


        const illustrationUrl = await getImageFromText(finalScenePrompt)
        book['pages'][pageNumber]['image_url'] = illustrationUrl;
        book['pages'][pageNumber]['image_dalle_prompt'] = finalScenePrompt;
    }

    return book;
}

async function getImageFromText(text) {

    const image = await openai.images.generate({ prompt: text, n: 1});
    return image['data'][0]['url'];
}


module.exports = {
    illustrateBook
};



//
//
// async function illustrateBook(book){
//     console.log('Illustrator - illustrateBook - book')
//     console.log(book)
//     const bookDetails = book['preferences'];
//     const illustrationStyle = bookDetails['illustration_style'];
//
//     // Create character descriptions in the desired style for consistency
//     let charactersDescriptions = book['characters'];
//     const charactersNamesList = Object.keys(charactersDescriptions);
//     for (const characterName of charactersNamesList) {
//         let characterDescription = charactersDescriptions[characterName];
//         charactersDescriptions[characterName]['illustrationDescription'] = await imagineDescription('character', characterName, JSON.stringify(characterDescription), illustrationStyle);
//     }
//
//     // Create setting descriptions in the desired style for consistency
//     let settingsDescriptions = book['settings'];
//     const settingNamesList = Object.keys(settingsDescriptions);
//     for (const settingName of settingNamesList) {
//         let settingDescription = settingsDescriptions[settingName];
//         settingsDescriptions[settingName]['illustrationDescription'] = await imagineDescription('setting',settingName, JSON.stringify(settingDescription), illustrationStyle);
//     }
//
//     // create the page-by-page descriptions,
//     let pages = book['pages'];
//     let pageNumbers = Object.keys(pages)
//     for (const pageNumber of pageNumbers){
//         let page = pages[pageNumber];
//         //text, setting, characters, image
//         const finalSceneDescription = await rewriteSceneDescription(page, JSON.stringify(settingsDescriptions), charactersDescriptions, illustrationStyle)
//         const illustrationUrl = await getImageFromText(finalSceneDescription)
//         book['pages'][pageNumber]['image_url'] = illustrationUrl;
//     }
//
//     return book;
// }

//
// async function rewriteSceneDescription(page, settingsDescriptions, charactersDescriptions, illustrationStyle){
//
//     const pageSetting = page['setting']
//     const settingDetails = settingsDescriptions[pageSetting]
//     const illustrationDescription = page['image']
//
//     console.log('page')
//     console.log(page)
//
//     console.log('illustrationDescription')
//     console.log(illustrationDescription)
//
//     console.log('settingDetails')
//     console.log(settingDetails)
//
//
//     const pageCharactersList = page['characters']
//     const pageCharactersDetails = {}
//     for(const characterName of pageCharactersList){
//         const characterDetails = charactersDescriptions[characterName]
//         pageCharactersDetails[characterName] = characterDetails
//     }
//
//     console.log('pageCharactersDetails')
//     console.log(pageCharactersDetails)
//
//     let illustrationDescriptionPrompt = "Create an description of a children's book " +
//         "illustration depicting [" + illustrationDescription + "] " +
//         // "where the setting is described as [" + settingDetails + "] " +
//         "and the applicable characters are described in the following JSON " +
//         JSON.stringify(pageCharactersDetails) + ". The style of the artwork illustration should match [" + illustrationStyle + "]. " +
//         "The description must be less than 800 characters and optimized for a DALLE prompt."
//
//
//     const illustrationDescriptionFromGPT = await NovllUtil.getGptResponse(illustrationDescriptionPrompt);
//
//     const shortenedResponse = await returnShortenedPrompt(illustrationDescriptionFromGPT, 1000)
//
//
//     console.log('shortenedResponse')
//     console.log(shortenedResponse)
//
//     // messages.push({
//     //     role:'user', content: illustrationDescriptionPrompt,
//     //     role: 'assistant', content: illustrationDescriptionFromGPT
//     // });
//
//     return shortenedResponse;
// }


//
// async function returnShortenedPrompt(prompt, length) {
//     let shortenPrompt = "Shorten the following prompt to be less than " + length.toString() + " 1000 " +
//         "characters [ " + prompt + "]. The prompt should be optimized to be a DALLE prompt to create an image for " +
//         "a children's book illustration.";
//
//
//     const shortenedPrompt = await NovllUtil.getGptResponse(shortenPrompt);
//     if (!(prompt.length <= length)) {
//         return returnShortenedPrompt(shortenedPrompt, length)
//     } else {
//         return shortenedPrompt;
//     }
// }

//
// async function imagineDescription(type,name, description, style){
//
//     const descriptionPrompt = "Create an extremely detailed description of an illustrated " + type +
//         " called " + name + " that looks like " + description + " in the style of " + style + ". This should " +
//         "include specific colors, textures, shapes, a full description of clothing, and other details for the " +
//         "purpose of illustration."
//     const descriptionFromGPT = await NovllUtil.getGptResponse(descriptionPrompt, true, messages);
//
//     messages.push({
//         role:'user', content: descriptionPrompt,
//         role: 'assistant', content: descriptionFromGPT
//     });
//
//     console.log('Illustrator - imagineDescription - descriptionFromGPT');
//     console.log(descriptionFromGPT);
//
//     return descriptionFromGPT;
// }