window.onload = function() {
    const btn = document.createElement('button');
    btn.textContent = "Voir les cotes";
    btn.onclick = function() {
        alert("Les cotes s'affichent bientôt !");
    };
    document.body.appendChild(btn);

    checkAuth();
};

async function checkAuth(){
    try{
        const response = await fetch('/api/user');
        const userData = await response.json();
        const loginLink = document.getElementById("login-link");
        
        if(userData.loggedIn){
            loginLink.innerHTML = `Mon compte : ${userData.username} - Points: ${userData.compteur}`;
            loginLink.href = '#';  
        } else {
            loginLink.innerHTML = "Se Connecter";
            loginLink.href = "/login.html";
        }
    } catch(error){  
        console.log('Erreur auth:', error);
    }
}  
