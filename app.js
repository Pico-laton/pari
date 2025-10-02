const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// Sert tous les fichiers statiques du dossier 'static'
app.use(express.static('templates'));

// Si tu veux que la racine serve index.html explicitement :
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/templates/index.html');
});

app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});
