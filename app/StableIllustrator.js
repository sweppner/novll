const Replicate = require("replicate");
const NovllUtil = require('./NovllUtil')
// const OpenAIApi = require("openai");
// const {book} = require("../TestBook");

const censor_text = "the contents of this book cannot contain any inappropriate content, " +
    "this book is for a child.";

require('dotenv').config();
let context = ""


const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN,
});


async function illustrateBook(book){
    console.log('Illustrator - illustrateBook - book')
    console.log(book)
    await testTrainingModel(book);
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

        const finalScenePrompt = "A children's book illustration in the style of [" + illustrationStyle + "] that are fun and hyper realistic artwork of that style. " +
            "This is what is happening in the illustration [" + image_text + "]. " +
            "The characters in the scene must match these descriptions: [" + pageCharactersDescription.toString() + "]." +
            "No text in image.";


        const illustrationUrl = await getImageFromText(finalScenePrompt)
        book['pages'][pageNumber]['image_url'] = illustrationUrl;
        book['pages'][pageNumber]['image_dalle_prompt'] = finalScenePrompt;
    }

    return book;
}

async function illustrateBookWithTraining(book){
    console.log('Illustrator - illustrateBook - book')
    console.log(book)
    const bookDetails = book['preferences'];
    const illustrationStyle = bookDetails['illustration_style'];
    let charactersDescriptions = book['characters'];

    // create the page-by-page descriptions,
    let pages = book['pages'];
    let pageNumbers = Object.keys(pages);
    let all_characters = book['characters'];
    let all_settings = book['settings'];

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

        const finalScenePrompt = "A children's book illustration in the style of [" + illustrationStyle + "] that are fun and hyper realistic artwork of that style. " +
            "This is what is happening in the illustration [" + image_text + "]. " +
            "The characters in the scene must match these descriptions: [" + pageCharactersDescription.toString() + "]." +
            "No text in image.";


        const illustrationUrl = await getImageFromText(finalScenePrompt)
        book['pages'][pageNumber]['image_url'] = illustrationUrl;
        book['pages'][pageNumber]['image_dalle_prompt'] = finalScenePrompt;
    }

    return book;
}

function parseName(name, description){
    return description.replace(name+", ", "");
}

async function testTrainingModel(book){
    console.log('testing training model');
    let characters = book['characters'];
    let settings = book['settings'];
    let style = book['preferences']['illustration_style'];
    let model;

    // let characterImages = {};
    const characterList = Object.keys(characters);
    const characterName = characterList[0];
    const characterDescription = parseName(characterName, characters[characterName]);
    const characterPrompt = "Create a new cartoon character that looks like this ["+characterDescription+"]"
        + "and give me multiple headshots from different angles, make sure its the same character with the same " +
        "face. The artwork should be in the style of : [" + style+ "]";
    const characterHeadshotsImageUrl = await getImageFromText(characterPrompt);
    const characterImageLocation = await NovllUtil.downloadImagesAndUpload([characterHeadshotsImageUrl]);
    const modelName = 'test/'+book['preferences']['your_book_title'];
    const hashedModelName = NovllUtil.hashString(modelName)
    let training = await trainModelOnImage(characterName, characterImageLocation, hashedModelName);

    console.log('training')
    console.log(training)
    console.log('Function executed!');
    console.log('training.status')
    console.log(training.status)
    // console.log("\n".join(training.logs.split("\n")[-10]))
    // executeEvery5SecondsFor2Minutes(training);
}

async function trainModel(book){
    let characters = book['characters'];
    let settings = book['settings'];
    let style = book['preferences']['illustration_style'];
    let model;

    let characterImages = {};
    const characterList = Object.keys(characters);
    for(let character_index =0;  character_index < characterList.length; character_index++){
        const characterName = characterList[character_index];
        const characterDescription = parseName(characterName, characters[characterName]);
        const characterPrompt = "Create a new cartoon character that looks like this ["+characterDescription+"]"
           + "and give me multiple headshots from different angles, make sure its the same character with the same " +
            "face. The artwork should be in the style of : [" + style+ "]";
        const characterHeadshotsImageUrl = getImageFromText(characterPrompt);
        const characterImageLocation = await NovllUtil.downloadImagesAndUpload([characterHeadshotsImageUrl])
        characterImages[characterName] = characterImageLocation;
    }

    let sceneImages = {};
    const settingsList = Object.keys(settings);
    for(let setting_index =0;  setting_index < settingsList.length; setting_index++){
        const settingName = characterList[setting_index];
        const settingDescription = parseName(settingName, characters[settingName]);
        const settingPrompt = "Create a new setting character that looks like this ["+settingDescription+"]"
            + "and show the setting from different angles, make sure its the same setting with the same layout. " +
            ". The artwork should be in the style of : [" + style+ "]\";";
        const settingHeadshotsImageUrl = getImageFromText(settingPrompt);
        const settingImageLocation = await NovllUtil.downloadImagesAndUpload(settingHeadshotsImageUrl)
        sceneImages[settingName] = settingImageLocation;
    }



    return model;
}

async function getImageFromText(text) {


    return await replicate.run(
        "stability-ai/sdxl:1bfb924045802467cf8869d96b231a12e6aa994abfe37e337c63a4e49a8c6c41",
        {
            input: {
                prompt:text
            }
        }
    );
}

async function trainModelOnImage(text, zipLocation, model) {
    model = model.replace(' ', '_')
    model =
    console.log('text');
    console.log(text);

    console.log('zipLocation');
    console.log(zipLocation);

    console.log('model');
    console.log(model);

    return await replicate.trainings.create(
        "stability-ai/sdxl:af1a68a271597604546c09c64aabcd7782c114a63539a4a8d14d1eeda5630c33",
        {
            use_face_detection_instead: true,
            input: {
                input_images: zipLocation,
                use_face_detection_instead: true,
            },
            destination: model
        }
    );
}


function executeEvery5SecondsFor2Minutes(training) {
    const interval = 5 * 1000; // 5 seconds in milliseconds
    const duration = 2 * 60 * 1000; // 2 minutes in milliseconds

    // Define the function you want to execute
    const task = () => {
        console.log('Function executed!');
        console.log(training.status)
        console.log("\n".join(training.logs.split("\n")[-10]))
    };

    // Start the repeated execution
    const intervalId = setInterval(task, interval);

    // Stop the repeated execution after 2 minutes
    setTimeout(() => {
        clearInterval(intervalId);
        console.log('Finished executing after 2 minutes.');
    }, duration);
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