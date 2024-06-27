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
const { v4: uuidv4 } = require('uuid'); // Add this line to import UUID package
const { Client } = require('pg');
require('dotenv').config();
const adminPassword2 = process.env.ADMIN_PASSWORD2;
const client = new Client({
  host: process.env.DATABASE_HOST,
  port: process.env.DATABASE_PORT,
  database: process.env.DATABASE_NAME,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  //   ssl: {
  //   rejectUnauthorized: false,
  // }
});



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
client.connect(err => {
  if (err) {
    console.error('Connection error', err.stack);
  } else {
    console.log('Connected to the database');
  }
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
// const categories = ['Legos', 'Just Photos', 'Automotive']; // Define your categories here
// Middleware to check if user is authenticated
function isAuthenticated(req, res, next) {
  if (req.session.authenticated) {
    return next();
  }
  res.redirect('/login');
}

// app.get('/', async (req, res) => {
//   try {
//     const query = 'SELECT * FROM categories'; // Adjust SQL query as per your table structure
//     const result = await client.query(query);
//     const categories = result.rows; // Assuming result.rows contains the fetched categories

//     res.render('index', { posts, categories });
//   } catch (err) {
//     console.error('Error executing query', err);
//     res.status(500).json({ error: 'Database error' });
//   }
// });
app.get('/', async (req, res) => {
  try {
    const query = 'SELECT categoryName FROM blog2.categories'; // Adjust schema name if necessary
    const result = await client.query(query);
    const categories = result.rows; // Assuming result.rows contains the fetched categories
 console.log(categories); // Log categories to the console

    res.render('index', { posts, categories });
  } catch (err) {
    console.error('Error executing query', err);
    res.status(500).json({ error: 'Database error' });
  }
});


app.get('/post/:category/:id', (req, res) => {
  const post = posts.find(p => p.id === req.params.id);
  res.render('post', { post,categories });
});

app.get('/admin', isAuthenticated, async(req, res) => {
      const query = 'SELECT categoryName FROM blog2.categories'; // Adjust schema name if necessary
    const result = await client.query(query);
    const categories = result.rows.map(row => row.categoryname); // Extract category names

   
  res.render('admin', { categories }); // Pass categories to the admin view
});

app.get('/login', (req, res) => {
  res.render('login', { error: null });
});

app.post('/login', (req, res) => {
  const { password } = req.body;
  if (password === adminPassword2) {
    req.session.authenticated = true;
    res.redirect('/admin');
  } else {
    res.render('login', { error: 'Incorrect password' });
  }
});



// app.post('/admin', upload.array('images', 10), async (req, res) => {
//   console.log('Form data received:', req.body); // Check if form data is received
//   console.log('File data received:', req.files); // Check if file data is received
//   const { title, content, category, layout, size, qtyPerRow } = req.body;
//   const images = req.files ? req.files.map(file => file.path) : [];

//   posts.push({ title, content, category, date: new Date(), images, layout, size, qtyPerRow });

//   res.redirect('/');
// });
//app.post('/admin', upload.single('image'), async (req, res) => {
app.post('/admin', upload.array('images', 10), async (req, res) => {
  console.log('Form data received:', req.body); // Check if form data is received
  console.log('File data received:', req.files); // Check if file data is received
  const { title, content, category, layout, size, qtyPerRow } = req.body;
  const images = req.files ? req.files.map(file => file.path) : [];

  const newPost = {
    id: uuidv4(), // Generate a unique ID for the post
    title,
    content,
    category,
    date: new Date(),
    images,
    layout,
    size,
    qtyPerRow
  };

  posts.push(newPost);

  res.redirect('/');
});
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
