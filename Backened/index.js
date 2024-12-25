const express = require('express');
const app = express();
const session = require('express-session');
const User = require('./Models/user');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// MongoDB connection
mongoose
  .connect('mongodb://localhost:27017/mydatabase')
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Setting up view engine
app.set('view engine', 'ejs');
app.set('views', 'views');

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(
  session({
    secret: 'yoursecretkey',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // Use `true` in production with HTTPS
      maxAge: null, // Session cookie expires when the browser is closed
    },
  })
);

// Authentication Middleware
function isAuthenticated(req, res, next) {
  if (req.session.userId) {
    return next();
  }
  res.redirect('/login');
}

// Routes
app.get('/register', (req, res) => {
  res.render('register');
});

app.post('/register', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).send('Username and password are required');
  }

  try {
    const hash = await bcrypt.hash(password, 12);
    const user = new User({ username, password: hash });
    await user.save();
    req.session.userId = user._id;
    res.redirect('/Secret');
  } catch (err) {
    console.error('Error saving user:', err);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/login', (req, res) => {
  res.render('login');
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).send('Username and password are required');
  }

  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).send('User not found');
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).send('Invalid password');
    }

    req.session.userId = user._id;
    res.redirect('/Secret');
  } catch (err) {
    console.error('Error during login:', err);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/Secret', isAuthenticated, (req, res) => {
  res.render('secret');
});

app.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Error during logout:', err);
      return res.status(500).send('Internal Server Error');
    }
    res.clearCookie('connect.sid');
    res.redirect('/login');
  });
});
app.get('/homepage',(req,res)=>{
  res.send('Welcome to Home page');
})
app.get('/', (req, res) => {
  res.redirect('/login');
});
app.get('/users', async (req, res) => {
  try {
    const users = await User.find({});
    res.json(users);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).send('Internal Server Error');
  }
});
// Start server
const PORT = 4000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
