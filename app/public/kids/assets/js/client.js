let base_url = 'http://localhost';
let port = '3000';
let full_base_url = base_url+':'+port;
var currentBook = {};

document.addEventListener("DOMContentLoaded", () => {
    addEventListenerById("book_idea_preferences_submit", handleIdeasRequest, "click");
    addEventListenerById("more_concepts_submit", handleIdeasRequest, "click");
    addEventListenerById("create_kids_book_submit", handleCreateBook, "click");


});

function addEventListenerById(id, handler, type) {
    const element = document.getElementById(id);
    if (element) {
        element.addEventListener(type, handler);
    }
}


function handleIdeasRequest() {
    const child_age = document.getElementById("child_age").value;
    const child_interests = document.getElementById("child_interests").value;
    const illustration_style = document.getElementById("illustration_style").value;
    const characters = document.getElementById("characters").value;
    const settings = document.getElementById("settings").value;
    const emotions_include = document.getElementById("emotions_include").value;
    const lessons = document.getElementById("lessons").value;

    document.getElementById('book-ideas-list').innerHTML = '<h2>Loading...</h2>'
    fetchBookIdeas(child_age, child_interests, illustration_style, characters, settings, emotions_include, lessons)
        .then(books => {
            let booksHtml = generateHTMLList(books[1]);

            document.getElementById("book-ideas-list").innerHTML = booksHtml;
            addEventListenerById("create_book", handleCreateBook, "click");
            addEventListenerById("more_concepts_submit", handleIdeasRequest, "click");

            addRadioButtonListeners()
        })
        .catch(error => console.error(`There was a problem with the fetch: ${error}`));
}

function addRadioButtonListeners(){
    const radioButtons = document.querySelectorAll('input[type="radio"][name="book"]');

    // <input type="radio" name="book" title="${title}" genre="${genre}" synopsis="${synopsis}" value="${title}">
    const your_book_title = document.getElementById('your_book_title');
    const your_book_genre = document.getElementById('your_book_genre');
    const your_book_chapters = document.getElementById('your_book_chapters');
    const your_book_synopsis = document.getElementById('your_book_synopsis');
    radioButtons.forEach(radioButton => {
        radioButton.addEventListener('change', () => {
            your_book_title.textContent = radioButton.getAttribute('title');
            // your_book_genre.textContent = radioButton.getAttribute('genre');
            // your_book_chapters.textContent = document.getElementById("num_chapters").value;
            your_book_synopsis.textContent = radioButton.getAttribute('synopsis');
        });
    });
}


async function handleCreateBook() {
    console.log('Creating book!')

    const book_object = {
        "child_age": document.getElementById("child_age").value,
        "child_interests": document.getElementById("child_interests").value,
        "illustration_style": document.getElementById("illustration_style").value,
        "characters": document.getElementById("characters").value,
        "settings": document.getElementById("settings").value,
        "emotions_include": document.getElementById("emotions_include").value,
        "lessons": document.getElementById("lessons").value,
        "num_pages": document.getElementById("num_pages").value,
        "your_book_title": document.getElementById("your_book_title").innerHTML,
        "your_book_synopsis": document.getElementById("your_book_synopsis").innerHTML
    }

    console.log('book_object')
    console.log(book_object)

    await fetch(full_base_url + '/kids/book/build', {
        // mode: 'no-cors',
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(book_object)
    })
        .then(response => response.json())
        .then(data => {
            console.log('Success:', data);
            // let view_book_button = document.getElementById('open_book')
            // view_book_button.innerHTML = '<input id="view_book" type="button" name="view_book" value="View my kids book!" />'
            // view_book_button.addEventListener('click', openBookView(data))
            currentBook = data;
            currentBook['currentPage'] = 1;
            let currentPageObject = currentBook['pages']['1'];
            currentPageObject['pageNumber'] = 1
            setPageView(currentPageObject)
            addEventListenerById("next_page", nextPage, "click");
            addEventListenerById("prev_page", prevPage, "click");
        })
        .catch(error => console.error('Error:', error));
}

function setPageView(page){
    let img_url = page['image_url'];
    let page_text = page['text'];
    let page_number = page['pageNumber'];

    document.getElementById("page_illustration").src = img_url;
    document.getElementById("page_text").innerHTML = page_text;
    document.getElementById("page_number").innerHTML = page_number.toString();
}

function prevPage(){
    console.log('prevPage')
    const currentPage = currentBook['currentPage'];
    if(currentPage!=1){
        const prevPageNumber = currentPage - 1;
        const prevPage = currentBook['pages'][prevPageNumber.toString()];
        prevPage['pageNumber'] = prevPageNumber;
        setPageView(prevPage);
        currentBook['currentPage'] = prevPageNumber;
    }
}

function nextPage(){
    console.log('nextPage')
    const currentPage = currentBook['currentPage'];
    const numPages = Object.keys(currentBook['pages']).length
    if(currentPage+1!=numPages){
        const nextPageNumber = currentPage + 1
        const nextPage = currentBook['pages'][nextPageNumber.toString()];
        nextPage['pageNumber'] = nextPageNumber;
        setPageView(nextPage);
        currentBook['currentPage'] = nextPageNumber;
    }
}


async function fetchBookIdeas(child_age, child_interests, illustration_style, characters, settings, emotions_include, lessons) {
    console.log('Favorite book and author submitted!')
    const query_url = buildQueryUrl(child_age, child_interests, illustration_style, characters, settings, emotions_include, lessons);
    // console.log('query_url')
    // console.log(query_url)

    return await fetch(query_url, {mode: 'no-cors', method: 'GET'})
        .then(response => {
            if (!response.ok) throw new Error(`Network response was not ok: ${response.statusText}`);
            console.log('response')
            console.log(response)
            return response.json();
        })
        .then(data => Object.values(data));
}

function buildQueryUrl(age, interests, illust_style, charactrs, settngs, emotions_incl, lessns) {
    let response = full_base_url+'/kids/book/ideas?'
    const child_age = `child_age=${age}`;
    const child_interests = `child_interests=${interests}`;
    const illustration_style = `illustration_style=${illust_style}`;
    const characters = `characters=${charactrs}`;
    const settings = `settings=${settngs}`;
    const emotions_include = `emotions_include=${emotions_incl}`;
    const lessons = `lessons=${lessns}`;
    let queries = [child_age,child_interests,illustration_style,characters,settings,emotions_include,lessons]


    for(let query_index in queries){
        let query = queries[query_index]
        if(query.charAt(query.length - 1) !="="){
            response = response + query + '&'
        }
    }
    // console.log('response')
    // console.log(response)
    return response;
}

function generateHTMLList(books) {
    console.log('books')
    console.log(books)

    let html = '<form>';
    books.forEach(book => {
        const { title, genre, concept, synopsis } = book;
        html += `
            <label>
                <input type="radio" name="book" title="${title}" genre="${genre}" synopsis="${synopsis}" value="${title}">
                <h2>${title}</h2>
                <p>${genre}</p>
                <p>${concept}</p>
            </label>`;
    });
    // html += '</form><input id="num_chapters" type="text" name="num-chapters" value="10" placeholder="How many chapters?" />';
    html += '<input type="button" id="more_concepts_submit" name="next" value="Create Five More Book Ideas" />';
    return html;
}


//MODAL STUFF
// Get the modal
var modal = document.getElementById("myModal");

// Get the button that opens the modal
var btn = document.getElementById("myBtn");

// Get the <span> element that closes the modal
var span = document.getElementsByClassName("close")[0];

// When the user clicks the button, open the modal
btn.onclick = function() {
    modal.style.display = "block";


}

// When the user clicks on <span> (x), close the modal
span.onclick = function() {
    modal.style.display = "none";
}

// When the user clicks anywhere outside of the modal, close it
window.onclick = function(event) {
    if (event.target == modal) {
        modal.style.display = "none";
    }
}