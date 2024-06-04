document.getElementById("articleForm").addEventListener("submit", async function(e){
    e.preventDefault();
    const form = e.target;
    const requestData = {
        title: form.title.value,
        description: form.description.value,
        content: form.content.value
    }
    const requestOption = {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(requestData)
    }
    const response = await fetch("/articles/createArticle", requestOption);
    const data = await response.json();
    if(data.valid){
        window.location.href = "/articles";
    }
})