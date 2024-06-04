async function canCreateArtical(){
    const getUserInformation = await fetch("/getUserInformation");
    const response = await getUserInformation.json();
    if(response.valid && response.data.Role != "Kunde"){
        const button = document.createElement("button");
        button.innerHTML = "Create Article";
        button.onclick = function(){
            window.location.href = "/articles/create";
        }
        document.getElementsByClassName("button")[0].appendChild(button);
    }
}

async function getArticles(){
    let isArticleSaved = false
    const getArticles = await fetch("/articles/getArticles");
    const getSavedArticles = await fetch("/getSavedArticles");
    const responseGetArticles = await getArticles.json();
    const responseGetSavedArticles = await getSavedArticles.json();
    const articleDiv = document.getElementsByClassName("articles")[0];
    const search = document.getElementById("searchArticles").value;
    articleDiv.innerHTML = "";
    if(responseGetArticles.length > 0){
        responseGetArticles.forEach(article => {
            if(article.Name.toLowerCase().includes(search.toLowerCase())){
                const div = document.createElement("div");
                div.className = "article";
                if(responseGetSavedArticles.valid !== false){
                    isArticleSaved = responseGetSavedArticles.some(savedArticle => savedArticle.UUID === article.UUID);
                }
                const favoriteButtonText = isArticleSaved ? "Unfavorite" : "Favorite";
                div.innerHTML = `
                <h2>${article.Name}</h2>
                <p>${article.Description}</p>
                <p>${article.Content}</p>
                <div>
                <p>Created at ${article.Date}</p>
                <p>Created by ${article.Owner}</p>
                </div>
                <div>
                <button onclick="location.href='/articles/read/${article.UUID}';"">Read more</button>
                <button onclick="saveArticle('${article.UUID}')">${favoriteButtonText}</button>
                </div>
                `;
                articleDiv.appendChild(div);
            }
        })
    }
}

async function saveArticle(uuid){
    const saveArticle = await fetch(`/articles/saveArticle/${uuid}`);
    const response = await saveArticle.json();
    if(response.valid){
        getArticles();
    } else{
        window.location.href = "/login";
    }
}

document.getElementById("searchArticles").addEventListener("input", getArticles);
getArticles()
canCreateArtical();