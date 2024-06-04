async function displayProfile(){
    const getUserInformation = await fetch("/getUserInformation");
    const response = await getUserInformation.json();
    if(response.valid){
        const div = `<h1>Navn: ${response.data.name}</h1><h2>Email: ${response.data.email}</h2><h3>Rolle: ${response.data.role}</h3>`;
        document.getElementsByClassName("userInfo")[0].innerHTML = div;
        if(response.data.role === "Administrator"){
            getAllUsers();
        }
    }    
}

async function getAllUsers(){
    const getUsersVerify = await fetch("/getAllUsers");
    const response = await getUsersVerify.json();  
    const table = document.getElementById("userTable");
    response.forEach(user => {
        const status = user.Status === "valid" ? "Active" : `<button onclick="activateUser('${user.UUID}')" >Activate</button>`;
        const div = `<tr>
        <td>${user.Name}</td>
        <td>${user.Email}</td>
        <td>${user.roleName}</td>
        <td>${status}</td>
        <td><button onclick="deleteUser('${user.UUID}')">Delete</button></td>
        </tr>`;
        table.innerHTML += div;
    })
}

async function deleteUser(uuid){
    const deleteUser = await fetch(`/deleteUser/${uuid}`);
    const response = await deleteUser.json();
    if(response.valid){
        window.location.href = "/profile";
    }

}

async function activateUser(uuid){
    const activateUser = await fetch(`/activateUser/${uuid}`);
    const response = await activateUser.json();
    if(response.valid){
        window.location.href = "/profile";
    }

}

document.getElementById("logoutButton").addEventListener("click", async function(){
    const logout = await fetch("/logout");
    const response = await logout.json();
    if(response.valid){
        window.location.href = "/login";
    }
})

async function getSavedArticles(){
    const getSavedArticles = await fetch("/getSavedArticles");
    const response = await getSavedArticles.json();
    const table = document.getElementById("articalTable");
    response.forEach(article => {
        const div = `
        <tr>
        <td>${article.Name}</td>
        <td>${article.Owner}</td>
        <td>${article.Date}</td>
        <td><button onclick="location.href='/articles/read/${article.UUID}'">Read</button></td>
        <td><button onclick="saveArticle('${article.UUID}')">Unfavorite</button></td>
        </tr>`;
        table.innerHTML += div;
    })
}

async function saveArticle(uuid){
    const saveArticle = await fetch(`/articles/saveArticle/${uuid}`);
    const response = await saveArticle.json();
    if(response.valid){
        location.reload();
    }
}
getSavedArticles();
displayProfile();