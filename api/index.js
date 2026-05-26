const users = [];

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const url = req.url;

  if (url.includes('/register') && req.method === 'POST') {
    const { email, password, username } = req.body;
    if (!email || !password || !username) {
      return res.status(400).json({ error: 'All fields required' });
    }
    const exists = users.find(u => u.email === email);
    if (exists) {
      return res.status(400).json({ error: 'Email already registered' });
    }
    users.push({ id: Date.now(), email, password, username });
    return res.status(200).json({ message: 'Registered successfully' });
  }

  if (url.includes('/login') && req.method === 'POST') {
    const { email, password } = req.body;
    const user = users.find(u => u.email === email && u.password === password);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    return res.status(200).json({ token: 'token_' + user.id });
  }

  return res.status(404).json({ error: 'Route not found' });
};
