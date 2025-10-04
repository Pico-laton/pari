const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); goClient;
require('dotenv').config();
const uri = process.env.MONGODB_URI;

mongoose.connect(uri)
  .then(() => console.log('✅ Connecté à MongoDB'))
  .catch(err => console.error('❌ Erreur connexion:', err));
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use('/static', express.static(path.join(__dirname, 'static')));

// Route pour la racine
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'templates', 'index.html'));
});

// Route générique pour les autres fichiers HTML
app.get('/:page', (req, res) => {
  const page = req.params.page;
  const filePath = path.join(__dirname, 'templates', page);
  res.sendFile(filePath, err => {
    if (err) {
      res.status(404).send('Page non trouvée');
    }
  });
});

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  createdAT: { type: Date, default: Date.now }
});

const User = mongoose.model('User',userSchema);

// nouveaux utilisateurs 
app.post('/register',async (req,res)=>{
  try{
    const{username,password}=req.body
    const existingUser = await User.findOne({
      username: username
    });
    if(existingUser){
      return res.status(400).json({
        succes:false,
        message : 'Utilisateur déjà existant'
      });
    }
    const hashPassword = await bcrypt.hash(password,10);
    const newUser = new User({
      username,
      password:hashPassword
    });
    await newUser.save();
    res.json({
      succes:true,
      message:'Compte créé avec succès'
    });
  } catch (error){
    console.error('Erreur inscription:',error);
    res.status(500).json({
      succes:false,
      message: 'Erreur serveur'
    });
    }
});

// connexion utilisateur
app.post('/login',async(req,res)=>{
  try{
    const{username,password}=req.body;
    const user=await User.findOne({username});
    if (!user){
      return res.status(400).json({
        succes:false,
        message: 'Utilisateur non trouvé'
      });
    }
    const isMatch = await bcrypt.compare(password,user.password);
    if(!isMatch){
      return res.status(400).json({
        succes: false,
        messgae: 'Mot de passe incorrect'
      });
    }
    res.json({
      succes:true,
      message: 'Connexion réussie',
      user:{username:user.username}
    });
  } catch (error) {
    console.error('Erreur connexion:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});
