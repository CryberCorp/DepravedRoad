const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('MongoDB connected');
}).catch((err) => {
  console.error('MongoDB connection error:', err);
});

const UserSchema = new mongoose.Schema({
  _id: String, // Utilisation d'un ID personnalisé
  username: { type: String, required: true, unique: true },
  address: { type: String, required: true },
  signature: { type: String, required: true }, // Stockée sous forme hachée
  lastLogin: { type: Number, required: true },  // Dernière date de connexion
  lastLoginTimezone: { type: String, required: true } // Dernier fuseau horaire de connexion
});

const User = mongoose.model('User', UserSchema);

// Fonction pour générer l'ID personnalisé
const generateCustomId = async () => {
  const userCount = await User.countDocuments({});
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const increment = userCount % 10000;  // Reste de la division par 10,000
  const letterIndex = Math.floor(userCount / 10000);  // Quotient de la division par 10,000
  const suffix = letters[letterIndex];  // Obtenir la lettre correspondante
  const incrementString = increment.toString().padStart(4, '0');  // Remplir avec des zéros à gauche

  if (letterIndex >= letters.length) {
    throw new Error('User limit exceeded');
  }

  return `${incrementString}${suffix}`;
};

app.post('/register', async (req, res) => {
  const { username, address, signature } = req.body;
  console.log('Received registration request:', { username, address, signature });

  try {
    const hashedSignature = await bcrypt.hash(signature, 10); // Hacher la signature

    // Obtenir le timestamp du serveur
    const timestamp = Math.floor(Date.now() / 1000);  // Obtenir l'horodatage Unix

    // Générer un ID personnalisé
    const customId = await generateCustomId();

    const newUser = await User.create({
      _id: `${customId}-${timestamp}`,
      username,
      address,
      signature: hashedSignature,
      lastLogin: timestamp,  // Utiliser le même horodatage pour la dernière connexion
      lastLoginTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone // Utiliser le fuseau horaire actuel
    });
    console.log('User registered:', newUser);
    res.status(201).json(newUser);
  } catch (err) {
    console.error('Registration error:', err.message); // Ajout de logs détaillés
    res.status(400).json({ error: err.message });
  }
});

app.post('/login', async (req, res) => {
  const { address, signature } = req.body;
  console.log('Received login request:', { address, signature });

  const user = await User.findOne({ address });
  if (!user) {
    console.error('User not found for address:', address);
    return res.status(400).json({ error: 'User not found' });
  }

  console.log('User found:', user);

  const isSignatureMatch = await bcrypt.compare(signature, user.signature); // Comparer les signatures
  if (!isSignatureMatch) {
    console.error('Signature mismatch for address:', address);
    return res.status(400).json({ error: 'Signature mismatch' });
  }

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
  
  // Mettre à jour la dernière date de connexion et le fuseau horaire
  const lastLogin = Math.floor(Date.now() / 1000);  // Obtenir l'horodatage Unix
  const lastLoginTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;  // Obtenir le fuseau horaire

  user.lastLogin = lastLogin;
  user.lastLoginTimezone = lastLoginTimezone;
  await user.save();

  console.log('User logged in:', user);
  res.json({ token });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
