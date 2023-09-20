let base_url = 'http://localhost';
let port = '3000';
let full_base_url = base_url+':'+port;

document.addEventListener("DOMContentLoaded", () => {
    addEventListenerById("book_idea_preferences_submit", handlePreferences, "click");
    addEventListenerById("5_more_concepts_submit", handleFiveMoreConceptsSubmit, "click");
    addEventListenerById("create_book_submit", handleCreateBook, "click");
});

function addEventListenerById(id, handler, type) {
    const element = document.getElementById(id);
    if (element) {
        element.addEventListener(type, handler);
    }
}

function handlePreferences() {
    console.log('Favorite book and author submitted!')
    const book_author = document.getElementById("book_author").value;
    const book_title = document.getElementById("book_title").value;
    const book_genre = document.getElementById("book_genre").value;
    const book_concept = document.getElementById("book_concept").value;
    const num_chapters = document.getElementById("num_chapters").value;

    document.getElementById('book-ideas-list').innerHTML = '<h2>Loading...</h2>'
    fetchBookIdeas(book_author, book_title, book_genre, book_concept, num_chapters)
        .then(books => {
            let booksHtml = generateHTMLList(books);

            document.getElementById("book-ideas-list").innerHTML = booksHtml;
            addEventListenerById("create_book", handleCreateBook, "click");
            addEventListenerById("5_more_concepts_submit", handleFiveMoreConceptsSubmit, "click");

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
            your_book_genre.textContent = radioButton.getAttribute('genre');
            your_book_chapters.textContent = document.getElementById("num_chapters").value;
            your_book_synopsis.textContent = radioButton.getAttribute('synopsis');
        });
    });
}

function handleFiveMoreConceptsSubmit() {
    console.log('User requested 5 more book ideas.');
    document.getElementById('book-ideas-list').innerHTML = '<h2>Loading...</h2>'

    const book_author = document.getElementById("book_author").value;
    const book_title = document.getElementById("book_title").value;

    fetchBooks(author_name, book_title)
        .then(books => {
            let booksHtml = generateHTMLList(books);
            document.getElementById("book-ideas-list").innerHTML = booksHtml;

            addEventListenerById("create_book", handleCreateBook, "click");
            addEventListenerById("5_more_concepts_submit", handleFiveMoreConceptsSubmit, "click");
            addRadioButtonListeners()
        })
        .catch(error => console.error(`There was a problem with the fetch: ${error}`));
}

async function handleCreateBook() {
    console.log('Creating book!')

    const book_object = {
        "title": document.getElementById("your_book_title").innerHTML,
        "genre": document.getElementById("your_book_genre").innerHTML,
        "num_chapters": document.getElementById("your_book_chapters").innerHTML,
        "synopsis": document.getElementById("your_book_synopsis").innerHTML,
    }

    await fetch(full_base_url + '/book/build', {
        // mode: 'no-cors',
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(book_object)
    })
        .then(response => response.json())
        .then(data => {
            console.log('Success:', data)
        })
        .catch(error => console.error('Error:', error));
}

async function fetchBookIdeas(book_author, book_title, book_genre, book_concept, num_chapters) {
    const query_url = buildQueryUrl(book_author, book_title, book_genre, book_concept, num_chapters);
    console.log('query_url')
    console.log(query_url)

    return await fetch(query_url, {mode: 'no-cors', method: 'GET'})
        .then(response => {
            if (!response.ok) throw new Error(`Network response was not ok: ${response.statusText}`);
            console.log(response)
            return response.json();
        })
        .then(data => Object.values(data));
}

function buildQueryUrl(book_author, book_title, book_genre, book_concept, num_chapters) {
    let response = full_base_url+'/book/ideas?'
    const author_query = `book_author=${book_author}`;
    const title_query = `book_title=${book_title}`;
    const genre_query = `book_query=${book_genre}`;
    const concept_query = `book_concept=${book_concept}`;
    const num_chapters_query = `num_chapters=${num_chapters}`;
    let queries = [author_query,title_query,genre_query,concept_query,num_chapters_query]

    for(let query_index in queries){
        let query = queries[query_index]
        if(query.charAt(query.length - 1) !="="){
            response = response + query
        }
    }
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
    html += '<input type="button" id="5_more_concepts_submit" name="next" value="Create Five More Book Ideas" />';
    return html;
}