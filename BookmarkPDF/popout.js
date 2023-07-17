let pdfViewerId = null;
let pdfInfo = null;

// Dynamically Find doqment Extension ID //
function getExtensionID() {
    return new Promise((resolve, reject) => {
        chrome.management.getAll((extensionInfoArray) => {
            extensionInfoArray.forEach(ext => {
                if (ext.name.includes("doqment")) {
                    console.log(ext.id);
                    resolve(ext.id);
                }
            })
        });
    })
}

function getCurURL() {
    return new Promise((resolve, reject) => {
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            console.log(tabs[0].url);
            resolve(tabs[0].url);
        });
    });
}

async function getPDFInfo() {
    return new Promise(async (resolve, reject) => {
        pdfViewerId = await getExtensionID();
        chrome.runtime.sendMessage(pdfViewerId, {fetchData: true}, function(response) {
            console.log(response.dict);
            resolve(response.dict);
        });
    });
}

async function processPDFInfo() {
    try {
        var t = await getPDFInfo();
        var u = await getCurURL();
        if (!u.includes("pdf")) throw new Error();

        pdfInfo = {
            title: t.title,
            curPage: t.curPage,
            thumbnail: t.thumbnail,
            url: u
        }
        var pageInput = document.querySelector("#pagenum > input[type=text]");
        pageInput.value = pdfInfo.curPage;
    } catch (error) {
        var pageInput = document.querySelector("#pagenum > input[type=text]");
        var addButton = document.querySelector("#add");
        pageInput.remove();
        addButton.style.backgroundColor = "gray";
    }
    console.log(pdfInfo);
}

function loadBookmarks() {
    chrome.storage.local.get("BookmarkPDF", function(result) {
        var bookmarkArray = result.BookmarkPDF || [];
        bookmarkArray.forEach(function(dict) {
            console.log(dict);
            addBookmark(dict);
        });
    });
}


function addBookmark(dict) {
    if (dict === null) {
        alert("Failed to fetch data. Please reload extension and try again.");
        return;
    }
    console.log(dict);
    var content = document.querySelector(".content");

    var title = dict.title.substring(0, Math.min(30, dict.title.length));
    if (dict.title.length > 30) title += "...";
    var page = dict.page;
    var thumbnail = dict.thumbnail;
    var url = dict.url.substring(0, dict.url.indexOf(".pdf") + 4) + "#page=" + page;

    var entry_component = `
    <div class="entry-container" style="background-image: url('${thumbnail}')">
      <div class="entry-text">
        <p id="title">${title}</p>
        <p id="spacer"> - </p>
        <p id="page">${page}</p>
      </div>
      <div id="delete"></div>
    </div>
    `;
    
    var entry = document.createElement('div');
    entry.innerHTML = entry_component;
    entry.querySelector('.entry-container').addEventListener('click', () => {
        chrome.tabs.create({url: url});
    });
    entry.querySelector('.entry-container > #delete').addEventListener('click', (event) => {
        event.stopPropagation();
        entry.remove();
        
        // delete from chrome storage //
        chrome.storage.local.get("BookmarkPDF", function(result) {
            var bookmarkArray = result.BookmarkPDF || [];
            var updatedArray = bookmarkArray.filter(entry => entry.page !== page || entry.thumbnail !== thumbnail);
            chrome.storage.local.set({"BookmarkPDF": updatedArray}, function() {
                console.log("Entry removed from Chrome storage.");
            });
        });
    });
    content.appendChild(entry);

    // Save to Chrome storage
    chrome.storage.local.get("BookmarkPDF", function (result) {
        var bookmarkArray = result.BookmarkPDF || [];
        
        // Check if the bookmark already exists based on page and thumbnail in the storage
        var existingBookmark = bookmarkArray.find(entry => entry.page === page && entry.thumbnail === thumbnail);
        if (!existingBookmark) {
        bookmarkArray.push(dict);
        chrome.storage.local.set({ "BookmarkPDF": bookmarkArray }, function () {
            console.log("Dictionary appended to the existing array.");
        });
        } else {
        console.log("Bookmark already exists in Chrome storage.");
        }
    });
}






processPDFInfo();
loadBookmarks();

// Add and Remove All Bookmark Functionalities //
document.addEventListener('DOMContentLoaded', function() {
    try {
        var addButton = document.querySelector("#add");
        var clearButton = document.querySelector("#clearBookmarks");
    } catch (error) {return;}


    addButton.addEventListener('click', () => {
        try {
            var pg = document.querySelector("#pagenum > input[type=text]").value;
        } catch (error) {return;}
        if (Number.isNaN(Number.parseInt(pg)) || pg < 1 || pg > 9999) return

        var d = {
            title: pdfInfo.title,
            page: pg,
            thumbnail: pdfInfo.thumbnail,
            url: pdfInfo.url
        }
        addBookmark(d);
    });

    clearButton.addEventListener('click', () => {
        var content = document.querySelector(".content");
        content.innerHTML = "";
    
        chrome.storage.local.clear(function() {
            console.log('Local storage cleared');
        });
    });
});
