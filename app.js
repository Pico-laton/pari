// Importation des modules nécessaires
const express = require('express'); // Framework web pour Node.js
const path = require('path'); // Module pour manipuler les chemins de fichiers
const mongoose = require('mongoose'); // ODM (Object Document Mapping) pour MongoDB
const bcrypt = require('bcryptjs'); // Module pour hacher les mots de passe
const app = express(); // Création de l'application Express
const PORT = process.env.PORT || 3000; // Port d'écoute (3000 par défaut)
require('dotenv').config(); // Charge les variables d'environnement

// Récupération depuis les variables d'environnement
const uri = process.env.MONGODB_URI;

// Middleware pour parser les données JSON et URL encoded
app.use(express.json()); // Permet de lire les données JSON dans les requêtes
app.use(express.urlencoded({ extended: true })); // Permet de lire les données de formulaires
app.use('/static', express.static(path.join(__dirname, 'static'))); // Serve les fichiers statiques

// Tentative de connexion à MongoDB
// Utilisez la variable d'environnement
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pari', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Connecté à MongoDB'))
.catch(err => console.error('Erreur de connexion à MongoDB:', err));

// Définition du schéma utilisateur (structure de données)
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true }, // Nom d'utilisateur obligatoire et unique
  password: { type: String, required: true }, // Mot de passe obligatoire
  createdAt: { type: Date, default: Date.now } // Date de création automatique
});

// Création du modèle User basé sur le schéma
const User = mongoose.model('User', userSchema);

// Route pour la page d'accueil
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'templates', 'index.html')); // Envoie le fichier index.html
});

// Route générique pour les autres pages HTML
app.get('/:page', (req, res) => {
  const page = req.params.page; // Récupère le nom de la page depuis l'URL
  const filePath = path.join(__dirname, 'templates', page); // Construit le chemin du fichier
  res.sendFile(filePath, err => { // Envoie le fichier
    if (err) {
      res.status(404).send('Page non trouvée'); // Erreur 404 si fichier non trouvé
    }
  });
});

// Route POST pour l'inscription des utilisateurs
app.post('/register', async (req, res) => {
  try {
    // Récupération des données du formulaire
    const { username, password } = req.body;

    // Vérification si l'utilisateur existe déjà
    const existingUser = await User.findOne({ username }); // Recherche par email OU username
    
    // Si utilisateur existe déjà
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'Utilisateur déjà existant' 
      });
    }

    // Hachage du mot de passe avec un salt de 10 rounds
    const hashedPassword = await bcrypt.hash(password, 10);

    // Création d'un nouvel utilisateur
    const newUser = new User({
      username,
      password: hashedPassword // Stocke le mot de passe haché
    });

    // Sauvegarde dans la base de données
    await newUser.save();

    // Réponse de succès
    res.json({ 
      success: true, 
      message: 'Compte créé avec succès' 
    });

  } catch (error) {
    // Gestion des erreurs
    console.error('Erreur inscription:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur serveur' 
    });
  }
});

// Route POST pour la connexion des utilisateurs
app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // ✅ Recherche par username (correspond au schéma)
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ 
        success: false, 
        message: 'Utilisateur non trouvé' 
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ 
        success: false, 
        message: 'Mot de passe incorrect' 
      });
    }

    res.json({ 
      success: true, 
      message: 'Connexion réussie',
      user: { 
        username: user.username,
        createdAt: user.createdAt
      }
    });

  } catch (error) {
    console.error('Erreur connexion:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur serveur' 
    });
  }
});

// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});
