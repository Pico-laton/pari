window.onload = function() {
    const btn = document.createElement('button');
    btn.textContent = "Voir les cotes";
    btn.onclick = function() {
        alert("Les cotes s'affichent bientôt !");
    };
    document.body.appendChild(btn);
};

async function checkAuth(){
    const response=await fetch('/api/user');
    const userData=await response.json();

    if(userData.loggedIn){
        document.getElementById('login-link').innerHTML=
        `Mon compte (${userData.username}) - Points: ${userData.compteur}`;
        document.getElementById('login-link').href='#';
    }
    else{
        print("hello")
    }
}