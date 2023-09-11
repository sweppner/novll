document.addEventListener("DOMContentLoaded", () => {
    addEventListenerById("preferences_submit", handlePreferencesSubmit, "click");
    addEventListenerById("5_more_concepts_submit", handleMoreConceptsSubmit, "click");
    addEventListenerById("book_submit", handleConceptSelected, "click");
});

function addEventListenerById(id, handler, type) {
    const element = document.getElementById(id);
    if (element) {
        element.addEventListener(type, handler);
    }
}

function handlePreferencesSubmit() {
    const author_name = document.getElementById("author_name").value;
    const book_title = document.getElementById("book_title").value;

    fetchBooks(author_name, book_title)
        .then(books => {
            const booksHtml = generateHTMLList(books);
            document.getElementById("book-ideas-list").innerHTML = booksHtml;
            addEventListenerById("create_book", handleCreateBook, "click");
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
        })
        .catch(error => console.error(`There was a problem with the fetch: ${error}`));
}

function handleMoreConceptsSubmit() {
    const author_name = document.getElementById("author_name").value;
    const book_title = document.getElementById("book_title").value;

    fetchBooks(author_name, book_title)
        .then(books => {
            const booksHtml = generateHTMLList(books);
            document.getElementById("book-ideas-list").innerHTML = booksHtml;
            const radioButtons = document.querySelectorAll('input[type="radio"][name="book"]');

            // <input type="radio" name="book" title="${title}" genre="${genre}" synopsis="${synopsis}" value="${title}">
            const your_book_title = document.getElementById('your_book_title');
            const your_book_genre = document.getElementById('your_book_genre');
            const your_book_chapters = document.getElementById('your_book_chapters');
            const your_book_synopsis = document.getElementById('your_book_synopsis');
            radioButtons.forEach(radioButton => {
                radioButton.addEventListener('change', () => {
                    your_book_title.textContent = radioButton.title;
                    your_book_genre.textContent = radioButton.genre;
                    your_book_chapters.textContent = document.getElementById("num_chapters").value;
                    your_book_synopsis.textContent = radioButton.synopsis;
                });
            });
        })
        .catch(error => console.error(`There was a problem with the fetch: ${error}`));
}

function handleConceptSelected() {
    const book_object = {
        "title":document.getElementById("your_book_title").innerHTML,
        "genre":document.getElementById("your_book_genre").innerHTML,
        "num_chapters":document.getElementById("your_book_chapters").innerHTML,
        "synopsis":document.getElementById("your_book_synopsis").innerHTML,
    }

    fetch("http://localhost:3000/build/book", {
        mode: 'no-cors',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(book_object),
    })
        .then(response => response.json())
        .then(data => {

            console.log('Success:', data)
        })
        .catch(error => console.error('Error:', error));
}

function fetchBooks(authorName, bookTitle) {
    const query_url = buildQueryUrl(authorName, bookTitle);

    return fetch(query_url, { mode: 'no-cors', method: 'GET' })
        .then(response => {
            if (!response.ok) throw new Error(`Network response was not ok: ${response.statusText}`);
            return response.json();
        })
        .then(data => Object.values(data));
}

function buildQueryUrl(authorName, bookTitle) {
    const author_query = `author_name=${authorName}`;
    const title_query = `book_title=${bookTitle}`;
    return `http://localhost:3000/ideas/author_title?${author_query}&${title_query}`;
}

function generateHTMLList(books) {
    let html = '<form>';
    console.log(books)
    books.forEach(book => {
        const { title, genre, synopsis } = book;
        html += `
            <label>
                <input type="radio" name="book" title="${title}" genre="${genre}" synopsis="${synopsis}" value="${title}">
                <h2>${title}</h2>
                <p>${genre}</p>
                <p>${synopsis}</p>
            </label>`;
    });
    html += '</form><input id="num_chapters" type="text" name="num-chapters" value="10" placeholder="How many chapters?" />';
    html += '<input type="button" id="create_book" name="next" value="Generate Book!" />';
    html += '<input type="button" id="5_more_concepts_submit" name="next" value="Five More Book Ideas" />';
    return html;
}

function handleCreateBook() {
    // Logic for creating a book
}
