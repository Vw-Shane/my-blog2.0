require('dotenv').config();
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const multer = require('multer');
const { v2: cloudinary } = require('cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

const app = express();

// Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'blog_images',
    format: async (req, file) => 'png',
    public_id: (req, file) => file.originalname,
  },
});

const upload = multer({ storage });

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
  console.log('Form data received:', req.body); // Check if form data is received
  console.log('File data received:', req.file); // Check if file data is received

  const { title, content } = req.body;
  const image = req.file ? req.file.path : null;

  posts.push({ title, content, date: new Date(), image });

  res.redirect('/');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
