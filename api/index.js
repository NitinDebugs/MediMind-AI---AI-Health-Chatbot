const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const users = [];

app.post('/api/auth/register', (req, res) => {
  try {
    const { email, password, username } = req.body;
    if (!email || !password || !username) {
      return res.status(400).json({ error: 'All fields required' });
    }
    const exists = users.find(u => u.email === email);
    if (exists) {
      return res.status(400).json({ error: 'Email already registered' });
    }
    const user = { id: Date.now(), email, password, username };
    users.push(user);
    res.json({ message: 'Registered successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;
    const user = users.find(u => u.email === email && u.password === password);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    res.json({ token: 'token_' + user.id, user: { email: user.email, username: user.username } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = app;
