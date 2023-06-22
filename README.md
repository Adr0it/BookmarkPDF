# BookmarkPDF
A browser extension that lets you bookmark your pdfs (built upon the doqment PDF viewer).

Express Install Instructions: 
1. Download the zip file and unzip the two extensions (the doqument PDF viewer and my bookmarking extension).
2. Go to chrome://extensions and load them in through "Load unpacked"
3. *IMPORTANT:* Copy the ID of the doqument extension, navigate to the popup.js of my bookmarking extension, and paste it in where it says "const pdfViewerId = ..."
4. Save all changes, and the bookmarking extension should function. If it's not reading the local pdf file, then make sure to scroll a few pages and try again, and if no luck, then reload the pdf and try again.  
