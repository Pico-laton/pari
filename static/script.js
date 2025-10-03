window.onload = function() {
    const btn = document.createElement('button');
    btn.textContent = "Voir les cotes";
    btn.onclick = function() {
        alert("Les cotes s'affichent bientôt !");
    };
    document.body.appendChild(btn);
};
