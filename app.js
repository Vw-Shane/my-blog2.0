// const express = require('express');
// const app = express();
// const session = require('express-session');
// const bodyParser = require('body-parser');
// const path = require('path');
// const multer = require('multer');
// const cloudinary = require('cloudinary').v2;
// const { CloudinaryStorage } = require('multer-storage-cloudinary');
// const { v4: uuidv4 } = require('uuid'); // Add this line to import UUID package
// const { Client } = require('pg');
// require('dotenv').config();
// const adminPassword2 = process.env.ADMIN_PASSWORD2;

// const client = new Client({
//   host: process.env.DATABASE_HOST,
//   port: process.env.DATABASE_PORT,
//   database: process.env.DATABASE_NAME,
//   user: process.env.DATABASE_USER,
//   password: process.env.DATABASE_PASSWORD,
//   connectionString: process.env.DATABASE_URL,
//   ssl: {
//     rejectUnauthorized: false
//   }
// });

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
//     transformation: [{ width: 400, height: 400, crop: 'limit' }]
//   },
// });

// client.connect(err => {
//   if (err) {
//     console.error('Connection error', err.stack);
//   } else {
//     console.log('Connected to the database');
//   }
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

// // Define middleware to fetch categories
// const fetchCategoriesMiddleware = async (req, res, next) => {
//   try {
//     const query = 'SELECT categoryName FROM blog2.categories'; // Adjust schema name if necessary
//     const result = await client.query(query);
//     const categories = result.rows.map(row => row.categoryname); // Extract category names

//     res.locals.categories = categories; // Make categories available in res.locals

//     next(); // Proceed to next middleware or route handler
//   } catch (err) {
//     console.error('Error fetching categories', err);
//     res.locals.categories = []; // Set categories to empty array or handle error
//     next(); // Proceed to next middleware or route handler
//   }
// };

// app.use(fetchCategoriesMiddleware);
// // const categories = ['Legos', 'Just Photos', 'Automotive']; // Define your categories here
// // Middleware to check if user is authenticated
// function isAuthenticated(req, res, next) {
//   if (req.session.authenticated) {
//     return next();
//   }
//   res.redirect('/login');
// }

// // app.get('/', async (req, res) => {
// //   try {
// //     const query = 'SELECT * FROM categories'; // Adjust SQL query as per your table structure
// //     const result = await client.query(query);
// //     const categories = result.rows; // Assuming result.rows contains the fetched categories

// //     res.render('index', { posts, categories });
// //   } catch (err) {
// //     console.error('Error executing query', err);
// //     res.status(500).json({ error: 'Database error' });
// //   }
// // });
// app.get('/', async (req, res) => {
//   try {


//     res.render('index', { posts, categories: res.locals.categories });
//   } catch (err) {
//     console.error('Error executing query', err);
//     res.status(500).json({ error: 'Database error' });
//   }
// });


// app.get('/post/:category/:id', (req, res) => {
//   const post = posts.find(p => p.id === req.params.id);
//   res.render('post', { post,categories: res.locals.categories });
// });

// app.get('/admin', isAuthenticated, async(req, res) => {
// res.render('admin', { categories: res.locals.categories });
//  // res.render('admin', { categories }); // Pass categories to the admin view
// });

// app.get('/login', (req, res) => {
//   res.render('login', { error: null });
// });

// app.post('/login', (req, res) => {
//   const { password } = req.body;
//   if (password === adminPassword2) {
//     req.session.authenticated = true;
//     res.redirect('/admin');
//   } else {
//     res.render('login', { error: 'Incorrect password' });
//   }
// });



// // app.post('/admin', upload.array('images', 10), async (req, res) => {
// //   console.log('Form data received:', req.body); // Check if form data is received
// //   console.log('File data received:', req.files); // Check if file data is received
// //   const { title, content, category, layout, size, qtyPerRow } = req.body;
// //   const images = req.files ? req.files.map(file => file.path) : [];

// //   posts.push({ title, content, category, date: new Date(), images, layout, size, qtyPerRow });

// //   res.redirect('/');
// // });
// //app.post('/admin', upload.single('image'), async (req, res) => {
// app.post('/admin', upload.array('images', 10), async (req, res) => {
//   console.log('Form data received:', req.body); // Check if form data is received
//   console.log('File data received:', req.files); // Check if file data is received
//   const { title, content, category, layout, size, qtyPerRow } = req.body;
//   const images = req.files ? req.files.map(file => file.path) : [];

//   const newPost = {
//     id: uuidv4(), // Generate a unique ID for the post
//     title,
//     content,
//     category,
//     date: new Date(),
//     images,
//     layout,
//     size,
//     qtyPerRow
//   };

//   posts.push(newPost);

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
const { v4: uuidv4 } = require('uuid');
const { Client } = require('pg');
require('dotenv').config();
const adminPassword2 = process.env.ADMIN_PASSWORD2;

const client = new Client({
    host: process.env.DATABASE_HOST,
    port: process.env.DATABASE_PORT,
    database: process.env.DATABASE_NAME,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
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

// Middleware to fetch categories
const fetchCategoriesMiddleware = async (req, res, next) => {
    try {
        const query = 'SELECT id, categoryname AS categoryName FROM blog2.categories';
        const result = await client.query(query);
        res.locals.categories = result.rows;
        next();
    } catch (err) {
        console.error('Error fetching categories', err);
        res.locals.categories = [];
        next();
    }
};

app.use(fetchCategoriesMiddleware);

function isAuthenticated(req, res, next) {
    if (req.session.authenticated) {
        return next();
    }
    res.redirect('/login');
}

app.get('/', async (req, res) => {
    try {
        const isLocalhost = req.get('host') === 'localhost:3000';
        const categoriesResult = await client.query('SELECT * FROM blog2.categories ORDER BY id');
        const categories = categoriesResult.rows;

        const postsResult = await client.query(`
      SELECT p.*, c.categoryname AS category_name
      FROM blog2.post p
      JOIN blog2.categories c ON p.category_id = c.id
      ORDER BY p.createDate DESC
    `);
        const posts = postsResult.rows;

        const projectsResult = await client.query(`
      SELECT pr.*, c.categoryname AS category_name
      FROM blog2.project pr
      JOIN blog2.categories c ON pr.category_id = c.id
      ORDER BY pr.createDate DESC
    `);
        const projects = projectsResult.rows;

    // Create a mapping of categories to their most recent entry (post or project)
    const recentEntries = {};
    categories.forEach(category => {
      const categoryPosts = posts.filter(post => post.category_id === category.id);
      const categoryProjects = projects.filter(project => project.category_id === category.id);

     // Combine posts and projects
      const combinedEntries = [
        ...categoryPosts.map(post => ({ ...post, type: 'post' })),
        ...categoryProjects.map(project => ({ ...project, type: 'project' }))
      ];

      // Find the most recent entry where testTF is false or if we're on localhost
      const recentEntry = combinedEntries.find(entry => {
        return isLocalhost || (!entry.testtf || entry.testtf === 'f');
      });

      if (recentEntry) {
        recentEntries[category.id] = recentEntry; // Most recent entry
      }
    });

            res.render('index', { entries: recentEntries, categories });
    } catch (err) {
        console.error('Error executing query', err);
        res.status(500).json({ error: 'Database error' });
    }
});


app.get('/post/:category_id/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // First, try to fetch the post
        let query = 'SELECT * FROM blog2.post WHERE post_id = $1';
        let values = [id];
        let result = await client.query(query, values);
        let post = result.rows[0];

        if (post) {
            return res.render('post', { post });
        }

        // If no post is found, try to fetch the project
        query = 'SELECT * FROM blog2.project WHERE project_id = $1';
        result = await client.query(query, values);
        let project = result.rows[0];

        if (!project) {
            return res.status(404).json({ error: 'Post or Project not found' });
        }

        // Fetch the project sections
        query = 'SELECT * FROM blog2.projectsection WHERE project_id = $1';
        result = await client.query(query, values);
        const sections = result.rows;

        res.render('project', { project, sections });
    } catch (err) {
        console.error('Error fetching post or project', err);
        res.status(500).json({ error: 'Database error' });
    }
});



app.get('/admin', isAuthenticated, async (req, res) => {
    try {
        const categoriesResult = await client.query('SELECT * FROM blog2.categories ORDER BY id');
        const categories = categoriesResult.rows;

        const layoutResult = await client.query('SELECT placement_id, value FROM blog2.photoPlacement ORDER BY placement_id');
        const layoutOptions = layoutResult.rows;

        const sizeResult = await client.query('SELECT size_id, value FROM blog2.photoSize ORDER BY size_id');
        const sizeOptions = sizeResult.rows;

        res.render('admin', { categories, layoutOptions, sizeOptions });
    } catch (err) {
        console.error('Error fetching categories, layoutOptions, or sizeOptions', err);
        res.status(500).json({ error: 'Database error' });
    }
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
//   try {
//     const { title, content, category, layout, size } = req.body;
//     const images = req.files ? req.files.map(file => file.path) : [];

//     // Fetch layout_id and size_id from their respective tables
//     const layoutQuery = 'SELECT placement_id FROM blog2.photoPlacement WHERE value = $1';
//     const layoutResult = await client.query(layoutQuery, [layout]);
//     const layout_id = layoutResult.rows[0]?.placement_id;

//     const sizeQuery = 'SELECT size_id FROM blog2.photoSize WHERE value = $1';
//     const sizeResult = await client.query(sizeQuery, [size]);
//     const size_id = sizeResult.rows[0]?.size_id;

//     if (!layout_id || !size_id) {
//       throw new Error('Invalid layout or size value');
//     }

//     const query = `
//       INSERT INTO blog2.post (category_id, title, content, photolocation_id, photosize_id, photo_link, viewcount, createdate, modifieddate, adspace_id)
//       VALUES ($1, $2, $3, $4, $5, $6, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, NULL)
//       RETURNING *
//     `;
//     const values = [category, title, content, layout_id, size_id, images[0]];
//     await client.query(query, values);

//     res.redirect('/');
//   } catch (err) {
//     console.error('Error creating post', err);
//     res.status(500).json({ error: 'Database error' });
//   }
// });
app.post('/admin', upload.array('images', 10), async (req, res) => {
    try {
        const { type, title, content, category, layout, size, sectionQty, sectionTitles, sectionContents, testtf } = req.body;
        //const testtf = req.body.testtf === 'true' ? 't' : 'f'; // Default to false
        const images = req.files ? req.files.map(file => file.path) : [];

        // Log form values for debugging
        console.log('Form Values:', { type, title, content, category, layout, size, sectionQty, sectionTitles, sectionContents, testtf });


        // Ensure all required fields are present
        if (!title || !content || !category || !layout || !size) {
            throw new Error('Missing required fields');
        }

        if (type === 'post') {
            const query = `
        INSERT INTO blog2.post (category_id, title, content, photolocation_id, photosize_id, photo_link, viewcount, createdate, modifieddate, adspace_id, testtf)
        VALUES ($1, $2, $3, $4, $5, $6, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, NULL, $7)
        RETURNING *
      `;
            const values = [category, title, content, layout, size, images[0], testtf];
            const result = await client.query(query, values);

            // Log the result for debugging
            console.log('Post created:', result.rows[0]);
        } else if (type === 'project') {
            const projectQuery = `
        INSERT INTO blog2.project (category_id, title, sectionqty, viewcount, createdate, modifieddate, adspace_id, testtf)
        VALUES ($1, $2, $3, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, NULL, $4)
        RETURNING project_id
      `;
            const projectValues = [category, title, sectionQty, testtf];
            const projectResult = await client.query(projectQuery, projectValues);

            const projectId = projectResult.rows[0].project_id;

            // Log the result for debugging
            console.log('Project created:', projectResult.rows[0]);

            for (let i = 0; i < sectionQty; i++) {
                const sectionQuery = `
          INSERT INTO blog2.projectsection (project_id, category_id, subheader, content, photolocation_id, photosize_id, photo_link, viewcount, createdate, modifieddate)
          VALUES ($1, $2, $3, $4, $5, $6, $7, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `;
                const sectionValues = [projectId, category, sectionTitles[i], sectionContents[i], layout, size, images[i + 1] || null];
                await client.query(sectionQuery, sectionValues);
            }

            // Log the sections for debugging
            console.log('Project sections created');
        }

        res.redirect('/');
    } catch (err) {
        console.error('Error creating post', err);
        res.status(500).json({ error: 'Database error' });
    }
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});