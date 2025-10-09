
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

const cors = require('cors');
app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? ['https://pari-zfuf.onrender.com']
        : ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
    methods: ['GET', 'POST'], // Cette ligne doit être dans l'objet CORS
    allowedHeaders: ['Content-Type', 'Authorization']
}));

const session = require('express-session');
app.use(session({
    secret: process.env.SESSION_SECRET || 'dev-secret-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false,
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000,
        sameSite: process.env.NODE_ENV === 'production' ? 'lax' : 'lax'
    }
}));

// Middleware pour parser les données JSON et URL encoded
app.use(express.json()); // Permet de lire les données JSON dans les requêtes
app.use(express.urlencoded({ extended: true })); // Permet de lire les données de formulaires
app.use('/static', express.static(path.join(__dirname, 'static'))); // Serve les fichiers statiques

// Tentative de connexion à MongoDB
// Utilisez la variable d'environnement
mongoose.connect(uri || 'mongodb://localhost:27017/pari')
  .then(() => console.log('Connecté à MongoDB'))
  .catch(err => console.error('Erreur de connexion à MongoDB:', err));

// Définition du schéma utilisateur (structure de données)
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true }, // Nom d'utilisateur obligatoire et unique
    password: { type: String, required: true }, // Mot de passe obligatoire
    compteur: { type: Number,default: 5},
    role: {type:String,enum:['user','admin'],default:'user'},
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
    if (error.code === 11000) {
      return res.status(400).json({ 
        success: false, 
        message: 'Nom d\'utilisateur déjà utilisé' 
      });
    }
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
    

    // ✅ Recherche par name (correspond au schéma)
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
    req.session.userId=user._id;
    req.session.username = user.username;
    console.log("✅ Session créée :", req.session);

    res.json({ 
      success: true, 
      message: 'Connexion réussie',
      user: { 
        username: user.username,
        createdAt: user.createdAt,
        compteur:user.compteur
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



app.get('/api/user', async (req,res)=>{
  if (!req.session.userId) {
   return res.json({ loggedIn: false });
}
  
  const user=await User.findById(req.session.userId);
  if (!user) return res.json({ loggedIn: false });
  
  res.json({
    loggedIn: true,
    username: user.username,
    compteur: user.compteur
  });
});
app.post('/logout',(req,res)=>{
  req.session.destroy();
  res.json({succes:true});
});

const requireAuth=(req,res,next)=>{
  if (!req.session.userId){
    return res.status(401).json({error:'Non authentifié'});
  }
  next();
};

const requireRole = (role) => {
  return async (req, res, next) => {
    try {
      const user = await User.findById(req.session.userId);
      if (!user || user.role !== role) {
        return res.status(403).json({ error: 'Accès refusé' });
      }
      req.currentUser = user; // Stocke l'utilisateur dans la requête
      next();
    } catch (error) {
      res.status(500).json({ error: 'Erreur serveur' });
    }
  };
};
app.put('/api/users/:userId/points',
  requireAuth,
  requireRole('admin'),
  async (req, res) => {
    try{
      const{userId}=req.params
      const{points}=req.body
      const user= await User.findByIdAndUpdate(
        userId,
        {compteur:points},
        {new:true}
      );
      res.json({succes:true,user});
    }catch(error){
      res.status(500).json({error:'Erreur serveur'});
    }
    // Logique pour modifier les points
  }
);
app.get('/api/users',
  requireAuth,
  requireRole('admin'),
  async (req, res) => {
    try{
      const users=await User.find();
      res.json({success:true,users})
    }catch(error){
      res.status(500).json({error:'Erreur serveur'})
    }
  }
);

// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});
