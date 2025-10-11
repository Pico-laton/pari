// static/js/admin.js

let selectedUsersId = [];

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
                <div class="user-item" style="margin: 10px; padding: 10px; border: 1px solid #ccc; background: ${selectedUsers.includes(user._id) ? '#e0f7fa' : 'white'}">
                    <span>${user.username} - Points: ${user.compteur} - Rôle: ${user.role}</span>
                    <input 
                        type="checkbox" 
                        ${selectedUsers.includes(user._id) ? 'checked' : ''}
                        onchange="toggleUserSelection('${user._id}', '${user.username}')"
                    >
                    <label>Sélectionner</label>
                </div>
            `).join('');
            
            updateSelectedUsersDisplay();
        }
    } catch (error) {
        console.error('Erreur chargement utilisateurs:', error);
    }
}

// Ajoute ou retire un utilisateur de la sélection
function toggleUserSelection(userId, username) {
    if (selectedUsers.includes(userId)) {
        // Retire de la sélection
        selectedUsers = selectedUsers.filter(id => id !== userId);
    } else {
        // Ajoute à la sélection
        selectedUsers.push(userId);
    }
    
    // Recharge l'affichage pour mettre à jour les couleurs
    loadUsersList();
}

// Met à jour l'affichage des utilisateurs sélectionnés
function updateSelectedUsersDisplay() {
    const selectedDisplay = document.getElementById('selected-user');
    if (selectedUsers.length === 0) {
        selectedDisplay.textContent = 'Aucun utilisateur sélectionné';
    } else {
        selectedDisplay.textContent = `${selectedUsers.length} utilisateur(s) sélectionné(s)`;
    }
}

document.getElementById('update-points-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (selectedUsers.length === 0) {
        alert('❌ Veuillez sélectionner au moins un utilisateur');
        return;
    }
    
    const newPoints = document.getElementById('new-points').value;
    
    if (!newPoints) {
        alert('❌ Veuillez entrer un nombre de points');
        return;
    }
    
    try {
        // Modification pour CHAQUE utilisateur sélectionné
        const promises = selectedUsers.map(userId => 
            fetch(`/api/users/${userId}/points`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ compteur: parseInt(newPoints) })
            })
        );
        
        // Attend que toutes les requêtes soient terminées
        const responses = await Promise.all(promises);
        const results = await Promise.all(responses.map(r => r.json()));
        
        // Vérifie si toutes les modifications ont réussi
        const allSuccess = results.every(result => result.success);
        
        if (allSuccess) {
            alert(`✅ Points modifiés avec succès pour ${selectedUsers.length} utilisateur(s)`);
            document.getElementById('new-points').value = '';
            selectedUsers = []; // Réinitialise la sélection
            await loadUsersList(); // Recharge la liste
        } else {
            alert('❌ Certaines modifications ont échoué');
        }
        
    } catch (error) {
        console.error('Erreur:', error);
        alert('❌ Erreur de connexion');
    }
});

// Vérifie le statut admin au chargement de la page
document.addEventListener('DOMContentLoaded', checkAdminStatus);
