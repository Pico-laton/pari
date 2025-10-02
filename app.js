const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Sert les fichiers statiques (.css, .js, images, etc.)
app.use('/static', express.static(path.join(__dirname, 'static')));

// Sert index.html pour la racine
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'templates', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});
