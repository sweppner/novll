const NovllUtil = require('./NovllUtil')

let context = ""

const role_content = "You are an expert AI author who has the ability to write with the style" +
    "and skill of any known or unknown author.";


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
        "description, and a list of appendices."
    const outline = await NovllUtil.getGptResponse(outlinePrompt, true, messages);

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
        "   \"title\": (string) the title of the chapter," +
        "   \"description\": (array) an array of strings that are the descriptive sentences of the chapter";
    let outlineJSONString = await NovllUtil.getGptResponse(outlineJSONPrompt, true, messages);

    let outlineJSON = await NovllUtil.extractJSONFromString(outlineJSONString)

    console.log('outlineJSON')
    console.log(outlineJSON)

    if(outlineJSON['success']){
        console.log('Returned valid json')
        messages.push({
            role:'user', content: outlineJSONPrompt,
            role: 'assistant', content: outlineJSONString
        });
        outlineJSON = outlineJSON['data']
    }else{
        console.log('Returned invalid json')

        if( outlineJSON.hasOwnProperty('data')){
            let outlineJSONFixPrompt = "Take this text and extract the JSON from it. Your response should " +
                "only include the text representing a valid JSON object." + JSON.stringify(outlineJSON['data']);
            outlineJSON = await NovllUtil.getGptResponse(outlineJSONFixPrompt);
            outlineJSON = await NovllUtil.extractJSONFromString(outlineJSON);
            console.log(outlineJSON)
        }else{
            console.log('Needs work')
        }
    }

    let chapter_list = Object.keys(outlineJSON['chapters']);
    let book = {}
    for(let chapter_index = 1; chapter_index < chapter_list.length; chapter_index ++){
        let chapterString = chapter_index.toString()
        let chapterObject = outlineJSON['chapters'][chapterString]
        let chapterTitle = chapterObject['title']
        let chapterDescription = chapterObject['description']

        let chapterPrompt = "Write chapter "+chapterString+" in its' entirety. The title of the chapter " +
            "is \""+chapterTitle+"\" and the description is: "+chapterDescription;
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

    return book;
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

    const idea = await NovllUtil.getGptResponse(prompt);
    console.log("Ideas fetched.")
    console.log(idea)

    // console.log(idea)
    return idea;
}


//Get book ideas from ChatGPT, by author, title, or both.

//TODO: add option to provide multiple books or authors
//TODO: need a way to validate books/authors
//TODO: idea, something to suggest other books or authors by genre



module.exports = {
    createBook,
    fetchBookIdeasByBookAndAuthor
};

//
// outlineJSON.then(async function(result) {
//
//     if(result['success']){
//         console.log('Returned valid json')
//         messages.push({
//             role:'user', content: outlineJSONPrompt,
//             role: 'assistant', content: outlineJSONString
//         });
//         outlineJSON = result['data']
//     }else{
//         console.log('Returned invalid json')
//
//         if( outlineJSON.hasOwnProperty('data')){
//             let outlineJSONFixPrompt = "Take this text and extract the JSON from it. Your response should " +
//                 "only include the text representing a valid JSON object." + JSON.stringify(outlineJSON['data']);
//             outlineJSON = await NovllUtil.getGptResponse(outlineJSONFixPrompt);
//             outlineJSON = await NovllUtil.extractJSONFromString(outlineJSON);
//             console.log(outlineJSON)
//         }else{
//             console.log('Needs work')
//         }
//     }
//
//     let chapter_list = Object.keys(outlineJSON['chapters']);
//     let book = {}
//     for(let chapter_index = 1; chapter_index < chapter_list.length; chapter_index ++){
//         let chapterString = chapter_index.toString()
//         let chapterObject = outlineJSON['chapters'][chapterString]
//         let chapterTitle = chapterObject['title']
//         let chapterDescription = chapterObject['description']
//
//         let chapterPrompt = "Write chapter "+chapterString+" in its' entirety. The title of the chapter " +
//             "is \""+chapterTitle+"\" and the description is: "+chapterDescription;
//         const chapter = await NovllUtil.getGptResponse(chapterPrompt, true, messages);
//
//         messages.push({
//             role:'user', content: chapterPrompt,
//             role: 'assistant', content: chapter
//         });
//
//         book[chapterString] = {
//             "title": chapterTitle,
//             "description": chapterDescription,
//             "text": chapter
//         }
//     }
//
//     return book;
// }, function(err) {
//     console.log(err); // Error: "It broke"
// });



// async function generateContent(prompt) {
//     const maxTokens = 100;
//     const response = await openai.completions.create({
//         prompt,
//         max_tokens: maxTokens,
//         model: gpt_version
//     });
//     return response.choices[0].text.trim();
// }


//
// async function writeWithGPT3(messages) {
//     try {
//         const response = await axios.post(
//             'https://api.openai.com/v1/chat/completions',
//             {
//                 model: 'gpt-3.5-turbo', // or 'davinci-codex' or any other available model
//                 messages: messages,
//             },
//             {
//                 headers: {
//                     'Content-Type': 'application/json',
//                     'OpenAI-API-Key': 'YOUR_OPENAI_API_KEY',
//                 },
//             }
//         );
//
//         // console.log(response.data.choices[0].message.content.trim());
//     } catch (error) {
//         console.error(error);
//     }
// }



// async function fetchBookIdeasByGenreAndConcept(genre, concept, num_ideas=5){
//     const prompt = "Provide me with ideas for " + num_ideas.toString() + " books of the "+genre+" genre " +
//         " inspired by the following idea [ " + concept + " ]. " + includesDescription + " " + responseFormat;
//
//     // const idea =
//     return await getGpt3Response(prompt);;
// }

// async function fetchBookIdeasByBook(book_title, num_ideas=5){
//     const prompt = "Provide me with ideas for " + num_ideas.toString() + " books similar in writing style, genre," +
//         " and themes to the book " + book_title + ". " + includesDescription + " " + responseFormat;
//
//     // const idea = await getGpt3Response(prompt);
//     return await getGpt3Response(prompt);;
// }

// async function fetchBookIdeasByAuthor(author_name, num_ideas=5){
//     const prompt = "Provide me with ideas for " + num_ideas.toString() + " books similar in writing style, genre," +
//         " and themes as books written by the author " + author_name + ". " + includesDescription + " " + responseFormat;
//
//     // const idea = await getGpt3Response(prompt);
//
//     return await getGpt3Response(prompt);;
// }


// async function createBook(bookInfo) {
//     const characterData = {};
//     const draft = [];
//
//     console.log(bookInfo)
//     const messages = [
//         { role: "system", content: role_content },
//     ];
//
//     // const conceptValidation = await getGpt3Response('Validate the concept for the novel:'+bookInfo['concept'];
//     let themeExplorationPrompt = "Identify themes that the novel \""+bookInfo['title']+"\" will explore based on the following synopsis: ["+bookInfo["synopsis"]+"]"
//     const themeExploration = await getGpt3Response(themeExplorationPrompt, true, messages);
//
//     console.log('themeExploration')
//     console.log(themeExploration)
//
//     messages.push({
//         role:'user', content: themeExplorationPrompt,
//         role: 'assistant', content: themeExploration
//     });
//
//     let outlinePrompt = "Create a detailed outline, chapter by chapter, for the novel for a book " +
//         "containing "+bookInfo['num_chapters']+" chapters based on the synopsis ["+bookInfo['synopsis']+"] and " +
//         "literary themes ["+themeExploration+"]. Structure the outline as a JSON object, where the keys are " +
//         "the chapter numbers and the values are the detailed chapter descriptions.";
//
//     const outline = await getGpt3Response(outlinePrompt, true, messages);
//     const outline_json = extractJSONFromString(outline)
//
//     console.log('outline')
//     console.log(outline)
//
//     messages.push({
//         role:'user', content: outlinePrompt,
//         role: 'assistant', content: outline
//     });
//
//     // const outlineObject = JSON.parse(outline)
//
//
//     let characterPrompt = "Based on the outline  determine the " +
//         "number of characters the story should include and respond to this prompt with a JSON object where they key " +
//         "is the character name and the value is a JSON object where the first key is \'description\' and the " +
//         "corresponding value is the character description, and the second key is \'introduced\' and the value is a " +
//         "JSON object where the first key is \'chapter\' with a corresponding value that is the chapter the character " +
//         "is introduced and the second key is \'scenario\' with a value of a description of the scenario in which the " +
//         "character is introduced .";
//     const characters_string = await getGpt3Response(characterPrompt, true, messages)
//
//     messages.push({
//         role:'user', content: characterPrompt,
//         role: 'assistant', content: characters_string
//     });
//
//     console.log('characters_string')
//     console.log(characters_string)
//
//     let characters = extractJSONFromString(characters_string)
//
//     let char_names = Object.keys(characters)
//     // const numCharacters = 4;
//     for (let i = 1; i <= char_names.length; i++) {
//         let current_character_name = char_names[i]
//         let current_character_object = characters[current_character_name]
//
//         const characterConceptPrompt = `Describe the type and role of character ${current_character_name} in the novel.`;
//         const characterConcept = await getGpt3Response(characterConceptPrompt, true, messages);
//
//         messages.push({
//             role:'user', content: characterConceptPrompt,
//             role: 'assistant', content: characterConcept
//         });
//
//         // const characterBackstoryPrompt = `Generate a backstory for character ${current_character_name}.`;
//         // const characterBackstory = await getGpt3Response(characterBackstoryPrompt, true, messages);
//         //
//         // messages.push({
//         //     role:'user', content: characterBackstoryPrompt,
//         //     role: 'assistant', content: characterBackstory
//         // });
//         // const characterTraitsPrompt = `List the physical features, personality traits, strengths, and weaknesses for character ${current_character_name}.`
//         // const characterTraits = await getGpt3Response(characterTraitsPrompt, true, messages);
//         //
//         // messages.push({
//         //     role:'user', content: characterTraitsPrompt,
//         //     role: 'assistant', content: characterTraits
//         // });
//
//         const characterArcPrompt = `Outline the character arc for character ${current_character_name}.`
//         const characterArc = await getGpt3Response(characterArcPrompt, true, messages);
//
//         messages.push({
//             role:'user', content: characterArcPrompt,
//             role: 'assistant', content: characterArc
//         });
//
//         characterData[`Character_${current_character_name}`] = {
//             Concept: characterConcept,
//             // Backstory: characterBackstory,
//             // Traits: characterTraits,
//             Arc: characterArc
//         };
//     }
//
//     const conflictsPrompt = "Describe the primary and secondary conflicts in the novel given the outline ["+outline+"], characters ["+characterData+"].";
//     const conflicts = await getGpt3Response(conflictsPrompt, true, messages);
//
//     messages.push({
//         role:'user', content: conflictsPrompt,
//         role: 'assistant', content: conflicts
//     });
//
//     const pacingTimingPrompt = "Determine the pacing for the novel."
//     const pacingTiming = await getGpt3Response(pacingTimingPrompt, true, messages);
//
//     messages.push({
//         role:'user', content: pacingTimingPrompt,
//         role: 'assistant', content: pacingTiming
//     });
//
//     const subplotsPrompt = "Outline any subplots in the novel."
//     const subplots = await getGpt3Response(subplotsPrompt, true, messages);
//
//     messages.push({
//         role:'user', content: subplotsPrompt,
//         role: 'assistant', content: subplots
//     });
//
//     // let numChaptersPrompt = "Based on the book's outline, conflicts," +
//     //     " pacing timing, and subplots, how many chapters should the" +
//     //     " book have? The response to this prompt should only be the number representing the number of chapters, " +
//     //     "nothing else."
//     // let numChapters = await getGpt3Response(numChaptersPrompt, true, messages);
//     //
//     // messages.push({
//     //     role:'user', content: numChaptersPrompt,
//     //     role: 'assistant', content: numChapters
//     // });
//
//     // TODO: Figure out how to integrate this. add a toggle to allow the user to add or not add this value.
//     // if(!bookInfo.exists('num_chapters')){
//     //     numChapters = bookInfo['num_chapters']
//     // }
//     const climaxPrompt = "Describe the climax of the novel."
//     const climax = await getGpt3Response(climaxPrompt, true, messages);
//
//     messages.push({
//         role:'user', content: climaxPrompt,
//         role: 'assistant', content: climax
//     });
//
//     const resolutionPrompt = "Explain how the novel will conclude."
//     const resolution = await getGpt3Response(resolutionPrompt, true, messages);
//
//     messages.push({
//         role:'user', content: resolutionPrompt,
//         role: 'assistant', content: resolution
//     });
//
//     const chapters = Object.keys(outline_json)
//
//     for (let i = 1; i <= chapters.length; i++) {
//
//
//         const chapterDraftPrompt = `Write Chapter ${i} based on all of the prior work including outline, conflicts," +
//         " pacing timing, and subplots, characters, character back-stories, and character arcs.`;
//         const chapterDraft = await getGpt3Response(chapterDraftPrompt, true, messages);
//
//         messages.push({
//             role:'user', content: chapterDraftPrompt,
//             role: 'assistant', content: chapterDraft
//         });
//
//         draft.push(chapterDraft);
//     }
//
//
//
//
//     let fullBook = `Title: ${bookInfo.title}\n\nSynopsis: ${bookInfo.synopsis}\n\n=== Characters ===\n`;
//
//     for (const char in characterData) {
//         fullBook += `\n${char}\nConcept: ${characterData[char].Concept}\nBackstory: ${characterData[char].Backstory}\nTraits: ${characterData[char].Traits}\nArc: ${characterData[char].Arc}\n`;
//     }
//
//     fullBook += `\n=== Outline ===\n${outline}\n\n=== Conflicts ===\n${conflicts}\n\n=== Pacing ===\n${pacingTiming}\n\n=== Subplots ===\n${subplots}\n\n=== Chapters ===\n`;
//
//     for (let i = 0; i < draft.length; i++) {
//         fullBook += `\nChapter ${i + 1}\n${draft[i]}\n`;
//     }
//
//     fullBook += `\n=== Climax ===\n${climax}\n\n=== Resolution ===\n${resolution}`;
//
//     let bookObject = {
//         'bookInfo': bookInfo,
//         'fullBook': fullBook
//     }
//
//     let bookID = await writeToMongo(bookObject)
//     await fs.writeFile(`${bookInfo.title}.txt`, fullBook);
//
//     return bookObject;
// }