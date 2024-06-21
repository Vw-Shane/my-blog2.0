// const express = require('express');
// const app = express();
// const session = require('express-session');
// const bodyParser = require('body-parser');
// const path = require('path');
// const multer = require('multer');
// const cloudinary = require('cloudinary').v2;
// const { CloudinaryStorage } = require('multer-storage-cloudinary');

// require('dotenv').config();

// cloudinary.config({
//   cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//   api_key: process.env.CLOUDINARY_API_KEY,
//   api_secret: process.env.CLOUDINARY_API_SECRET
// });

// const storage = new CloudinaryStorage({
//   cloudinary: cloudinary,
//   params: {
//     folder: 'blog_images',
//     format: async (req, file) => 'png',
//     public_id: (req, file) => file.originalname,
//   },
// });

// const upload = multer({ storage });

// app.use(session({
//   secret: 'your_secret_key',
//   resave: false,
//   saveUninitialized: true,
// }));

// app.use(bodyParser.urlencoded({ extended: true }));

// app.use(express.static(path.join(__dirname, 'public')));

// app.set('view engine', 'ejs');
// app.set('views', path.join(__dirname, 'views'));

// const posts = [];

// app.get('/', (req, res) => {
//   res.render('index', { posts });
// });

// app.get('/post/:id', (req, res) => {
//   const post = posts[req.params.id];
//   res.render('post', { post });
// });

// app.get('/admin', (req, res) => {
//   res.render('admin');
// });

// app.post('/admin', upload.single('image'), (req, res) => {
//   const { title, content, layout } = req.body;
//   const image = req.file ? req.file.path : null;
//   posts.push({ title, content, date: new Date(), image, layout });
//   res.redirect('/');
// });

// const PORT = process.env.PORT || 3000;
// app.listen(PORT, () => {
//   console.log(`Server is running on port ${PORT}`);
// });

const express = require('express');
const app = express();
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
require('dotenv').config();

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
    transformation: [{ width: 400, height: 400, crop: 'limit' }]
  },
});

const upload = multer({ storage });

app.use(session({
  secret: 'your_secret_key',
  resave: false,
  saveUninitialized: true,
}));

app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, 'public')));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

const posts = [];

app.get('/', (req, res) => {
  res.render('index', { posts });
});

app.get('/post/:id', (req, res) => {
  const post = posts[req.params.id];
  res.render('post', { post });
});

app.get('/admin', (req, res) => {
  res.render('admin');
});

app.post('/admin', upload.array('images', 10), async (req, res) => {
  console.log('Form data received:', req.body); // Check if form data is received
  console.log('File data received:', req.files); // Check if file data is received
  const { title, content, category, layout, size, qtyPerRow } = req.body;
  const images = req.files ? req.files.map(file => file.path) : [];

  posts.push({ title, content, category, date: new Date(), images, layout, size, qtyPerRow });

  res.redirect('/');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
