async function getArticlesInformation(){
    let favoriteButtonText = "Favorite";
    const uuid = window.location.pathname.split('/').pop();
    const getArticleInformation = await fetch(`/articles/getArticleInformation/${uuid}`);
    const getSavedArticles = await fetch("/getSavedArticles");
    const getUserInformation = await fetch("/getUserInformation");
    const responseGetSavedArticles = await getSavedArticles.json();
    const responseArticles = await getArticleInformation.json();
    const responseUser = await getUserInformation.json();
    if(responseUser.valid){
        responseGetSavedArticles.forEach(element => {
            if(element.UUID === uuid){
               favoriteButtonText = "Unfavorite";
            }
        });
    }
    if(responseArticles){
        const div = `
        <h1>${responseArticles.Name}</h1>
        <p>${responseArticles.Description}</p>
        <p>${responseArticles.Content}</p>
        <div>
            <p>Created at ${responseArticles.Date}</p>
            <p>Created by ${responseArticles.Owner}</p>
        </div>
        <div class="button">
             <button onclick="location.href='/articles/'">Cancel</button>
             <button onclick="saveArticle('${uuid}')">${favoriteButtonText}</button>
        </div>`
        document.getElementsByClassName("articles")[0].innerHTML = div;
        if(responseUser.valid && responseUser.data.Role != "Kunde"){
            const button = document.createElement("button");
            button.innerHTML = "Delete";
            button.onclick = async function(){
                const deleteArticle = await fetch(`/articles/deleteArticle/${uuid}`);
                const response = await deleteArticle.json();
                if(response.valid){
                    window.location.href = "/articles";
                }
            }
            document.getElementsByClassName("button")[0].appendChild(button);
        }
    }
}

async function saveArticle(uuid){
    const saveArticle = await fetch(`/articles/saveArticle/${uuid}`);
    const response = await saveArticle.json();
    if(response.valid){
        getArticlesInformation();
    } else{
        window.location.href = "/login";
    }
}

getArticlesInformation();