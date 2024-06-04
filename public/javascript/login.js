document.querySelectorAll(".changeForm").forEach(button => {
    button.addEventListener("click", () =>{
        const currentForm = button.parentElement.parentElement.parentElement
        const otherForm = currentForm.previousElementSibling || currentForm.nextElementSibling
        currentForm.style.display = "none";
        otherForm.style.display = "block";
    })
});

document.getElementById("signupform").addEventListener("submit", async function(e) {
    e.preventDefault();
    const form = e.target;
    const signupData = {
        username: form.signupUsername.value,
        email: form.signupEmail.value,
        password: form.signupPassword.value,
        role: form.signupRole.value
    }
    const requestBody = {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(signupData)
    }
    const createAccount = await fetch("/createAccount", requestBody);
    const response = await createAccount.json();
    if(response.message){
        document.getElementsByClassName("responseMessage signup")[0].innerText = response.message;
        if(response.valid){
            form.reset();
        }
    }
})

document.getElementById("loginform").addEventListener("submit", async function(e) {
    e.preventDefault();
    const form = e.target;
    const loginData = {
        email: form.loginEmail.value,
        password: form.loginPassword.value
    }
    const requestBody = {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(loginData)
    }
    const login = await fetch("/checkLogin", requestBody);
    const response = await login.json();
    if(response.valid){
        window.location.href = "/home";
    }
    else{
        document.getElementsByClassName("responseMessage login")[0].innerText = response.message;
    }
})

async function displayRole(){
    const getRole = await fetch("/getRole");
    const response = await getRole.json();
    response.forEach(role => {
        const roleElement = document.createElement("option");
        roleElement.innerText = role.Name;
        roleElement.value = role.ID;
        document.getElementById("signupRole").appendChild(roleElement);
    })
    

}

displayRole();