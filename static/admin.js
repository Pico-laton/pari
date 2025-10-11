// static/js/admin.js

let selectedUserId = null;

// Vérifie si l'utilisateur est admin
async function checkAdminStatus() {
    try {
        const response = await fetch('/api/user');
        const userData = await response.json();
        
        console.log('✅ Données utilisateur:', userData);
        
        if (userData.loggedIn && userData.role === 'admin') {
            // Affiche le panel admin
            document.getElementById('admin-panel').style.display = 'block';
            // Charge la liste des utilisateurs
            await loadUsersList();
        }
    } catch (error) {
        console.error('❌ Erreur:', error);
    }
}

// Charge la liste des utilisateurs
async function loadUsersList() {
    try {
        const response = await fetch('/api/users');
        const data = await response.json();
        
        if (data.success) {
            const usersListDiv = document.getElementById('user-list');
            usersListDiv.innerHTML = data.users.map(user => `
                <div class="user-item" style="margin: 10px; padding: 10px; border: 1px solid #ccc;">
                    <span>${user.username} - Points: ${user.compteur} - Rôle: ${user.role}</span>
                    <input type="checkbox" onclick="selectUser('${user._id}', '${user.username}')" checked>
                        <label>Sélectionner</label>
                    </input>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Erreur chargement utilisateurs:', error);
    }
}

// Sélectionne un utilisateur pour modification
function selectUser(userId, username) {
    selectedUserId = userId;
    document.getElementById('selected-user').textContent = `Utilisateur sélectionné: ${username}`;
}

// Gère la modification des points
document.getElementById('update-points-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (!selectedUserId) {
        alert('❌ Veuillez sélectionner un utilisateur');
        return;
    }
    
    const newPoints = document.getElementById('new-points').value;
    
    try {
        const response = await fetch(`/api/users/${selectedUserId}/points`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ compteur: parseInt(newPoints) })
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert('✅ Points modifiés avec succès');
            document.getElementById('new-points').value = '';
            await loadUsersList(); // Recharge la liste
        } else {
            alert('❌ Erreur lors de la modification');
        }
    } catch (error) {
        console.error('Erreur:', error);
        alert('❌ Erreur de connexion');
    }
});

// Vérifie le statut admin au chargement de la page
document.addEventListener('DOMContentLoaded', checkAdminStatus);
