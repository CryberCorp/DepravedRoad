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
  username: { type: String, required: true, unique: true },
  address: { type: String, required: true },
  signedMessage: { type: String, required: true },
  signature: { type: String, required: true } // Stockée sous forme hachée
});

const User = mongoose.model('User', UserSchema);

app.post('/register', async (req, res) => {
  const { username, address, signedMessage, signature } = req.body;
  console.log('Received registration request:', { username, address, signedMessage, signature });

  try {
    const hashedSignature = await bcrypt.hash(signature, 10); // Hacher la signature
    const newUser = await User.create({ username, address, signedMessage: address, signature: hashedSignature });
    console.log('User registered:', newUser);
    res.status(201).json(newUser);
  } catch (err) {
    console.error('Registration error:', err);
    res.status(400).json({ error: err.message });
  }
});

app.post('/login', async (req, res) => {
  const { address, signature, message } = req.body;
  console.log('Received login request:', { address, signature, message });

  const user = await User.findOne({ address });
  if (!user) {
    console.error('User not found for address:', address);
    return res.status(400).json({ error: 'User not found' });
  }

  console.log('User found:', user);
  console.log('Stored signedMessage:', user.signedMessage);
  console.log('Provided message:', message);

  if (user.signedMessage !== message) {
    console.error('Message mismatch:', user.signedMessage, message);
    return res.status(400).json({ error: 'Message mismatch' });
  }

  const isSignatureMatch = await bcrypt.compare(signature, user.signature); // Comparer les signatures
  if (!isSignatureMatch) {
    console.error('Signature mismatch for address:', address);
    return res.status(400).json({ error: 'Signature mismatch' });
  }

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
  console.log('User logged in:', user);
  res.json({ token });
});

app.post('/update-address', async (req, res) => {
  const { username, address } = req.body;

  try {
    const user = await User.findOneAndUpdate({ username }, { $set: { address: address } }, { new: true });
    console.log('Address updated for user:', user);
    res.json(user);
  } catch (err) {
    console.error('Update address error:', err);
    res.status(400).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));