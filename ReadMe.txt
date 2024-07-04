I added all the db stuff to the heroku env var
I also actived the SSL automatic thing?



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



<!-- <!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Admin - My Blog</title>
  <link href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css" rel="stylesheet">
  <link rel="stylesheet" href="/styles.css">
</head>
<body class="bg-dark text-white">
  <div class="container mt-5">
    <h1 class="text-center">Admin - Create Post</h1>
    <form id="postForm" action="/admin" method="POST" enctype="multipart/form-data" class="mt-4">
      <div class="form-group">
        <label for="title">Title</label>
        <input type="text" class="form-control" id="title" name="title" required>
      </div>
      <div class="form-group">
        <label for="content">Content</label>
        <textarea class="form-control" id="content" name="content" rows="5" required></textarea>
      </div>
      <div class="form-group">
        <label for="image">Image</label>
        <input type="file" class="form-control-file" id="image" name="image">
        <small id="fileHelp" class="form-text text-muted">Max file size 1MB.</small>
      </div>
      <div class="form-group">
        <label for="layout">Image Layout</label>
        <select class="form-control" id="layout" name="layout" required>
          <option value="top">Image on top</option>
          <option value="bottom">Image on bottom</option>
          <option value="left">Image on left</option>
          <option value="right">Image on right</option>
        </select>
      </div>
      <button type="submit" class="btn btn-primary">Create Post</button>
    </form>
    <div id="errorMessage" class="mt-3 text-danger"></div>
  </div>
  <script>
    document.getElementById('postForm').addEventListener('submit', function(event) {
      const fileInput = document.getElementById('image');
      const errorMessage = document.getElementById('errorMessage');
      errorMessage.textContent = '';

      if (fileInput.files[0] && fileInput.files[0].size > 1 * 1024 * 1024) { // 1MB limit
        event.preventDefault();
        errorMessage.textContent = 'File size exceeds the maximum limit of 1MB.';
      }
    });
  </script>
</body>
</html>
 -->