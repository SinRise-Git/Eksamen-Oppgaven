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
    const getArticles = await fetch("/getArticles");
    const response = await getArticles.json();
    const articleDiv = document.getElementsByClassName("articles")[0];
    const search = document.getElementById("searchArticles").value;
    articleDiv.innerHTML = "";
    if(response.length > 0){
        response.forEach(article => {
            if(article.Name.toLowerCase().includes(search.toLowerCase())){
                const div = document.createElement("div");
                div.className = "article";
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
                <button>Favorite</button>
                </div>
                `;
                articleDiv.appendChild(div);
            }
        })
    }
}
document.getElementById("searchArticles").addEventListener("input", getArticles());

getArticles()
canCreateArtical();