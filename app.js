const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const multer = require('multer');

const app = express();

// Set up session middleware
app.use(session({
  secret: 'your_secret_key',
  resave: false,
  saveUninitialized: true
}));

// Set up body-parser middleware
app.use(bodyParser.urlencoded({ extended: true }));

// Set up static file serving
app.use(express.static(path.join(__dirname, 'public')));

// Set up EJS as the templating engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// In-memory storage for posts
const posts = [];

// Home route
app.get('/', (req, res) => {
  res.render('index', { posts });
});

// Post route
app.get('/post/:id', (req, res) => {
  const post = posts[req.params.id];
  res.render('post', { post });
});

// Admin route
app.get('/admin', (req, res) => {
  res.render('admin');
});

app.post('/admin', upload.single('image'), (req, res) => {
  const { title, content } = req.body;
  const image = req.file ? `/uploads/${req.file.filename}` : null;
  posts.push({ title, content, date: new Date(), image });
  res.redirect('/');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
