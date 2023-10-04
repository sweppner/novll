# novll

To get the test app up and running
- install dependencies
- run node app/Server.js
- visit "http://localhost:3000/kids/" in the browser

The Libraries are:
app/
  - Server.js
  - AdultCustomer.js
  - KidsCustomer
  - Publisher.js
  - KidsAuthor
  - Author
  - Illustrator

Depending on the application (what type of book we want to write), the client.js fetches a REST call to Server.js which interacts with a customer persona that requests the book. 

Web (client.js) <-> Server.js <-> *Customer.js <-> Publisher.js <-> Workers (*Author.js, Illustrator.js)



(this only views well in edit mode)
Web (client.js) <-> Server.js <-> *Customer.js <-> Publisher.js <-> *Author.js
                               -> (KidsCustomer.js)              -> (KidsAuthor.js)
                               -> (AdultCustomer.js)             -> (Author.js)
                                                                 -> Illustrator.js
