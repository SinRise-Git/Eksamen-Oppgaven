async function checkIfLogin() {
    const div = document.getElementsByClassName("user")[0];
    const username = localStorage.getItem("username");
    if(username){
        div.innerHTML = "<a href='/profile'>" + username + "</a>";
    }
    const checkLogin = await fetch("/checkIfLogin");
    const response = await checkLogin.json();
    if(response.valid){
        localStorage.setItem("username", response.data.name);
        div.innerHTML = "<a href='/profile'>" + response.data.name + "</a>";      
    } else {
        localStorage.removeItem("username");
        div.innerHTML = "<a href='/login'>Login</a>";
    }
}
checkIfLogin();