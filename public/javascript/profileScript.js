async function displayProfile(){
    const getUserInformation = await fetch("/getUserInformation");
    const response = await getUserInformation.json();
    if(response.valid){
        const div = `<h1>${response.data.name}</h1><h2>${response.data.email}</h2><h3>${response.data.role}</h3>`;
        document.getElementsByClassName("userInfo")[0].innerHTML = div;
        if(response.data.role === "Administrator"){
            getUsersVerify();
        }
    }    
}

async function getUsersVerify(){
    const getUsersVerify = await fetch("/getUsersVerify");
    const response = await getUsersVerify.json();    
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
    const savedArticlesDiv = document.getElementsByClassName("savedArticls")[0];
    if(response.length > 0){
        console.log("Saved articles")
    } else {
        console.log("No saved articles")
        savedArticlesDiv.innerHTML = "<h2>No saved articles</h2>";
    }
}

getSavedArticles();
displayProfile();