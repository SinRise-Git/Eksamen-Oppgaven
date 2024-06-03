async function displayProfile(){
    const getUserInformation = await fetch("/getUserInformation");
    const response = await getUserInformation.json();
    console.log(response);
    if(response.valid){
        const div = `<h1>${response.data.name}</h1><h2>${response.data.email}</h2><h3>${response.data.role}</h3>`;
        document.getElementsByClassName("userInfo")[0].innerHTML = div;
    }    
}

document.getElementById("logoutButton").addEventListener("click", async function(){
    const logout = await fetch("/logout");
    const response = await logout.json();
    if(response.valid){
        window.location.href = "/login";
    }
})
displayProfile();