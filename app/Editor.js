const NovllUtil = require('NovllUtil.js')

const role_content = "You are an expert AI author who has the ability to write with the style" +
    "and skill of any known or unknown author.";

const messages = [
    { role: 'system', content: 'You are an expert AI book editor who has the ability to review a book and identify issues .' },
];

async function editBook(book) {

    const messages = [
        { role: "system", content: role_content },
    ];
    // const conceptValidation = await getGpt3Response('Validate the concept for the novel:'+bookInfo['concept'];
    let outlinePrompt = "Write a comprehensive outline for the book \""+bookInfo['title']+"\" based on" +
        " the following synopsis: ["+bookInfo["synopsis"]+"]. This should include a genre, a list of settings, a " +
        "list of characters with descriptions of each character, a chapter-by-chapter breakdown, an epilogue " +
        "description, and a list of appendices."
    const outline = await NovllUtil.getGptResponse(outlinePrompt, true, messages);

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
    const outlineJSONString = await NovllUtil.getGptResponse(outlineJSONPrompt, true, messages);

    messages.push({
        role:'user', content: outlineJSONPrompt,
        role: 'assistant', content: outlineJSONString
    });

    const outlineJSON = NovllUtil.extractJSONFromString(outlineJSONString)

    let chapter_list = Object.keys(outlineJSON['chapters'])
    // let book = {}
    // for(let chapter_index = 1; chapter_index < chapter_list.length; chapter_index ++){
    //     let chapterString = chapter_index.toString()
    //     let chapterObject = outlineJSON['chapters'][chapterString]
    //     let chapterTitle = chapterObject['title']
    //     let chapterDescription = chapterObject['description']
    //
    //     let chapterPrompt = "Write chapter "+chapterString+" in its' entirety. The title of the chapter " +
    //         "is \""+chapterTitle+"\" and the description is: "+chapterDescription;
    //     const chapter = await Util.getGptResponse(chapterPrompt, true, messages);
    //
    //     // console.log('outline')
    //     // console.log(outline)
    //
    //     messages.push({
    //         role:'user', content: chapterPrompt,
    //         role: 'assistant', content: chapter
    //     });
    //
    //     book[chapterString] = {
    //         "title": chapterTitle,
    //         "description": chapterDescription,
    //         "text": chapter
    //     }
    // }

    return book;
}

module.exports = {
    editBook
};
