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
const axios = require('axios');
require('dotenv').config();
const adminPassword2 = process.env.ADMIN_PASSWORD2;
const pokemonAPI = process.env.POKEMON_TCG_API_KEY;
const pok_URL = 'https://api.pokemontcg.io/v2/cards';
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
      //  transformation: [{ width: 400, height: 400, crop: 'limit' }]
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
        
        const categoriesResult = await client.query('SELECT * FROM blog2.categories ORDER BY id');
        const categories = categoriesResult.rows;
const isLocalhost = req.get('host') === 'localhost:3000';
        const ppResult = await client.query(`
            SELECT pp.*,
              coalesce(pjt.title,pst.title) as title,
              coalesce(pjt.createdate,pst.createdate) as createdate, 
              c.categoryname AS category_name,
              pst.photo_link
            FROM pp 
            JOIN blog2.categories c ON pp.category_id = c.id
            left join blog2.post pst on pp.post_id=pst.post_id and c.id=pst.category_id
            left join blog2.project pjt on pp.project_id=pjt.project_id and c.id=pjt.category_id
            ORDER BY pp.pp_id DESC
         `);
    
        const ppEntries = ppResult.rows;

        // Create a set of category IDs that have associated entries in `pp`
        // const populatedCategoryIds = new Set(ppEntries.map(entry => entry.category_id));
        const populatedCategoryIds = new Set(
            ppEntries
                .filter(entry => isLocalhost || !entry.localhosttf)  // Filter based on localhosttf
                .map(entry => entry.category_id)
        );
        // Filter categories to include only those with populated entries
        const filteredCategories = categories.filter(category => populatedCategoryIds.has(category.id));

        const recentEntries = {};
        filteredCategories.forEach(category => {
            // Filter entries based on the current category
            const categoryEntries = ppEntries.filter(entry => entry.category_id === category.id);

            // Find the most recent entry considering the localhost condition
            let recentEntry;
            if (isLocalhost) {
                // On localhost, include both localhostTF = 0 and localhostTF = 1
                recentEntry = categoryEntries[0]; // Assuming entries are ordered by descending pp_id
            } else {
                // On non-localhost, only include entries with localhostTF = 0
                recentEntry = categoryEntries.find(entry => !entry.localhosttf);
            }

            // Save the found entry to the result map if it exists
            if (recentEntry) {
                recentEntries[category.id] = recentEntry;
            }
        });

        res.render('index', { entries: recentEntries, categories: filteredCategories });
    } catch (err) {        
        console.error('Error executing query', err);
        res.status(500).json({ error: 'Database error' });
    }
});

app.get('/post/:category_id/:pp_id', async (req, res) => {
    try {
        const { category_id, pp_id } = req.params;
        const isLocalHost = req.hostname === 'localhost';

        // Fetch the pp entry using the provided pp_id
        const ppQuery = 'SELECT * FROM pp WHERE pp_id = $1';
        const ppValues = [pp_id];
        const ppResult = await client.query(ppQuery, ppValues);
        const ppEntry = ppResult.rows[0];

        if (!ppEntry) {
            return res.status(404).json({ error: 'Entry not found in pp table' });
        }

        // Handle view count increment
        if (ppEntry.post_id) {
            // Increment view count for the post
            await client.query('UPDATE blog2.post SET viewcount = viewcount + 1 WHERE post_id = $1', [ppEntry.post_id]);
        } else if (ppEntry.project_id) {
            // Increment view count for the project
            await client.query('UPDATE blog2.project SET viewcount = viewcount + 1 WHERE project_id = $1', [ppEntry.project_id]);
        }


        // Fetch the post or project based on ppEntry.post_id or ppEntry.project_id
        let post, project, sections, previousPost, nextPost;

        if (ppEntry.post_id) {
            // Fetch the post
            const postQuery = 'SELECT * FROM blog2.post WHERE post_id = $1';
            const postValues = [ppEntry.post_id];
            const postResult = await client.query(postQuery, postValues);
            post = postResult.rows[0];

            if (!post) {
                return res.status(404).json({ error: 'Post not found' });
            }

            // Fetch the photo size for the post
            const photoSizeQuery = 'SELECT value FROM blog2.photoSize WHERE size_id = $1';
            const photoSizeValues = [post.photosize_id];
            const photoSizeResult = await client.query(photoSizeQuery, photoSizeValues);
            const photoSize = photoSizeResult.rows[0].value;

            // Fetch the previous post for navigation
            const prevQuery = `
                SELECT p.*, pp.pp_id
                FROM blog2.post p
                JOIN pp ON pp.post_id = p.post_id
                WHERE p.post_id < $1 AND pp.category_id = $2
                ${isLocalHost ? '' : 'AND pp.LocalHostTF = false'}
                ORDER BY p.post_id DESC
                LIMIT 1
            `;
            const prevValues = [post.post_id, category_id];
            const prevResult = await client.query(prevQuery, prevValues);
            previousPost = prevResult.rows[0] || null;

            // Fetch the next post for navigation
            const nextQuery = `
                SELECT p.*, pp.pp_id
                FROM blog2.post p
                JOIN pp ON pp.post_id = p.post_id
                WHERE p.post_id > $1 AND pp.category_id = $2
                ${isLocalHost ? '' : 'AND pp.LocalHostTF = false'}
                ORDER BY p.post_id ASC
                LIMIT 1
            `;
            const nextValues = [post.post_id, category_id];
            const nextResult = await client.query(nextQuery, nextValues);
            nextPost = nextResult.rows[0] || null;

            // Render the post view
            return res.render('post', { post, category_id, photoSize, previousPost, nextPost });

        } else if (ppEntry.project_id) {
            // Fetch the project
            const projectQuery = 'SELECT * FROM blog2.project WHERE project_id = $1';
            const projectValues = [ppEntry.project_id];
            const projectResult = await client.query(projectQuery, projectValues);
            project = projectResult.rows[0];

            if (!project) {
                return res.status(404).json({ error: 'Project not found' });
            }

            // Fetch the project sections
            const sectionsQuery = 'SELECT * FROM blog2.projectsection WHERE project_id = $1';
            const sectionsValues = [ppEntry.project_id];
            const sectionsResult = await client.query(sectionsQuery, sectionsValues);
            sections = sectionsResult.rows;

            // Render the project view
            return res.render('project', { project, sections, category_id });
        } else {
            return res.status(404).json({ error: 'No associated post or project found' });
        }
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
app.get('/adminCreate', isAuthenticated, async (req, res) => {
    try {
        const categoriesResult = await client.query('SELECT * FROM blog2.categories ORDER BY id');
        const categories = categoriesResult.rows;

        const layoutResult = await client.query('SELECT placement_id, value FROM blog2.photoPlacement ORDER BY placement_id');
        const layoutOptions = layoutResult.rows;

        const sizeResult = await client.query('SELECT size_id, value FROM blog2.photoSize ORDER BY size_id');
        const sizeOptions = sizeResult.rows;

        res.render('adminCreate', { categories, layoutOptions, sizeOptions });
    } catch (err) {
        console.error('Error fetching categories, layoutOptions, or sizeOptions', err);
        res.status(500).json({ error: 'Database error' });
    }
});

app.get('/admin/edit', isAuthenticated, async (req, res) => {
    try {
        const categoriesResult = await client.query('SELECT * FROM blog2.categories ORDER BY id');
        const categories = categoriesResult.rows;

        const layoutResult = await client.query('SELECT placement_id, value FROM blog2.photoPlacement ORDER BY placement_id');
        const layoutOptions = layoutResult.rows;

        const sizeResult = await client.query('SELECT size_id, value FROM blog2.photoSize ORDER BY size_id');
        const sizeOptions = sizeResult.rows;

        res.render('adminEdit', { categories, layoutOptions, sizeOptions });
    } catch (err) {
        console.error('Error fetching categories, layoutOptions, or sizeOptions', err);
        res.status(500).json({ error: 'Database error' });
    }
});


app.get('/admin/posts', isAuthenticated, async (req, res) => {
    try {
        const postsResult = await client.query(`
            SELECT p.post_id AS id, p.title, p.createdate, c.categoryname, 'post' AS type
            FROM blog2.post p
            JOIN blog2.categories c ON p.category_id = c.id
            UNION
            SELECT pr.project_id AS id, pr.title, pr.createdate, c.categoryname, 'project' AS type
            FROM blog2.project pr
            JOIN blog2.categories c ON pr.category_id = c.id
            ORDER BY createdate DESC
        `);

        res.json(postsResult.rows);
    } catch (err) {
        console.error('Error fetching posts/projects', err);
        res.status(500).json({ error: 'Database error' });
    }
});
app.get('/admin/post/:postId', isAuthenticated, async (req, res) => {
    try {
        const { postId } = req.params;

        const postResult = await client.query(`
            SELECT post_id AS id, title, content, category_id, photolocation_id, photosize_id, testtf, 'post' AS type
            FROM blog2.post
            WHERE post_id = $1
            UNION
            SELECT project_id AS id, title, null AS content, category_id, null AS photolocation_id, null AS photosize_id, testtf, 'project' AS type
            FROM blog2.project
            WHERE project_id = $1
        `, [postId]);

        const post = postResult.rows[0];

        if (post.type === 'project') {
            const sectionsResult = await client.query(`
                SELECT subheader, content, photo_link
                FROM blog2.projectsection
                WHERE project_id = $1
                ORDER BY section_id
            `, [postId]);

            post.sections = sectionsResult.rows;
        }

        res.json(post);
    } catch (err) {
        console.error('Error fetching post/project details', err);
        res.status(500).json({ error: 'Database error' });
    }
});
app.post('/admin/edit', upload.array('images', 10), async (req, res) => {
    try {
        const { postProject, type, title, content, category, layout, size, sectionQty, sectionTitles, sectionContents, testtf, replaceImage } = req.body;
        const images = req.files ? req.files.map(file => file.path) : [];
        const postId = postProject;

        // Log form values for debugging
        console.log('Form Values:', { postProject, type, title, content, category, layout, size, sectionQty, sectionTitles, sectionContents, testtf, replaceImage });

        // Ensure all required fields are present
        if (!postId || !title || !content || !category || !layout || !size) {
            throw new Error('Missing required fields');
        }

        // Get the current photo_link from the database if replacing image is not required
        let currentPhotoLink;
        if (replaceImage === 'no') {
            // Fetch the current photo_link from the database
            const currentPhotoQuery = 'SELECT photo_link FROM blog2.post WHERE post_id = $1';
            const result = await client.query(currentPhotoQuery, [postId]);
            if (result.rows.length > 0) {
                currentPhotoLink = result.rows[0].photo_link;
            } else {
                throw new Error('Post not found');
            }
        }

        if (type === 'post') {
            const photoLink = replaceImage === 'yes' && images.length > 0 ? images[0] : currentPhotoLink;

            const updatePostQuery = `
                UPDATE blog2.post
                SET title = $1, content = $2, category_id = $3, photolocation_id = $4, photosize_id = $5, photo_link = $6, modifieddate = CURRENT_TIMESTAMP, testtf = $7
                WHERE post_id = $8
            `;
            const updatePostValues = [title, content, category, layout, size, photoLink, testtf, postId];
            await client.query(updatePostQuery, updatePostValues);

            // Log the result for debugging
            console.log('Post updated:', postId);
        }
 else if (type === 'project') {
            const updateProjectQuery = `
                UPDATE blog2.project
                SET title = $1, category_id = $2, sectionqty = $3, modifieddate = CURRENT_TIMESTAMP, testtf = $4
                WHERE project_id = $5
            `;
            const updateProjectValues = [title, category, sectionQty, testtf, postId];
            await client.query(updateProjectQuery, updateProjectValues);

            // Delete existing project sections
            await client.query('DELETE FROM blog2.projectsection WHERE project_id = $1', [postId]);

            // Insert updated project sections
            for (let i = 0; i < sectionQty; i++) {
                const insertSectionQuery = `
                    INSERT INTO blog2.projectsection (project_id, category_id, subheader, content, photo_link, viewcount, createdate, modifieddate)
                    VALUES ($1, $2, $3, $4, $5, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                `;
                const insertSectionValues = [postId, category, sectionTitles[i], sectionContents[i], images[i + 1] || null];
                await client.query(insertSectionQuery, insertSectionValues);
            }

            // Log the sections for debugging
            console.log('Project sections updated:', postId);
        }

        res.redirect('/');
    } catch (err) {
        console.error('Error updating post or project', err);
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
async function getAllCategories() {
    const query = 'SELECT * FROM blog2.categories ORDER BY id';
    const result = await client.query(query);
    return result.rows;
}
async function getTheCategory(categoryId) {
    const query = 'SELECT * FROM blog2.categories WHERE id = $1';
    const result = await client.query(query, [categoryId]);

    return result.rows[0]; // Assuming you need the single category detail
}


const getEntriesByCategory = async (categoryId, isLocalhost) => {
    const query = `
        SELECT pp.*,
          coalesce(pjt.title,pst.title) as title,
          coalesce(pjt.createdate,pst.createdate) as createdate,
          c.categoryname AS category_name,
          /*coalesce(pjt.photo_link,pst.photo_link) as photo_link will need to update this */
          pst.photo_link 
        FROM pp 
        JOIN blog2.categories c ON pp.category_id = c.id
        LEFT JOIN blog2.post pst ON pp.post_id = pst.post_id AND c.id = pst.category_id
        LEFT JOIN blog2.project pjt ON pp.project_id = pjt.project_id AND c.id = pjt.category_id
        WHERE pp.category_id = $1 
        AND ($2 OR pp.localHostTF != true)  -- Check for localhost or localhostTF = 0
        ORDER BY pp.pp_id DESC
    `;
   
    const values = [categoryId, isLocalhost];
    const result = await client.query(query, values);
    return result.rows;
};


app.get('/categories', async (req, res) => {
    try {
const isLocalhost = req.get('host') === 'localhost:3000';
        const categories = await getAllCategories(); // Fetch all categories

        const entries = {};

        for (const category of categories) {
    
            // Fetch all entries for each category with the localhost condition
            const categoryEntries = await getEntriesByCategory(category.id, isLocalhost);

            if (categoryEntries.length > 0) {
                entries[category.id] = categoryEntries;
            }
        }

        // Render the allCategories view with the filtered entries and categories
        res.render('allCategories', { categories: categories.filter(category => entries[category.id]), entries });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});


app.get('/categories/:category_id', async (req, res) => {
    try {
        const isLocalhost = req.get('host') === 'localhost:3000';
        const { category_id } = req.params;

        if (!category_id) {
            return res.status(400).send('Category ID is required');
        }

        // Fetch the category based on category_id
        const category = await getTheCategory(category_id);

     
        const entries = {};

        // Fetch all entries for the current category with the localhost condition
        const categoryEntries = await getEntriesByCategory(category.id, isLocalhost);
        entries[category.id] = categoryEntries;

        // Render the view with the category and entries
        res.render('theCat', { category, entries });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});





app.post('/adminCreate', upload.array('images', 10), async (req, res) => {
    try {
        const { type, title, content, category, layout, size, sectionQty, sectionTitles, sectionContents, testtf } = req.body;
        const images = req.files ? req.files.map(file => file.path) : [];


        // Log form values for debugging
        console.log('Form Values:', { type, title, content, category, layout, size, sectionQty, sectionTitles, sectionContents, testtf });

        // Ensure all required fields are present
        if (!title || !content || !category || !layout || !size) {
            throw new Error('Missing required fields');
        }

        if (type === 'post') {
            const postQuery = `
                INSERT INTO blog2.post (category_id, title, content, photolocation_id, photosize_id, photo_link, viewcount, createdate, modifieddate, adspace_id, testtf)
                VALUES ($1, $2, $3, $4, $5, $6, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, NULL, $7)
                RETURNING post_id
            `;
            const postValues = [category, title, content, layout, size, images[0], testtf];
            const postResult = await client.query(postQuery, postValues);

            const postId = postResult.rows[0].post_id;

            // Insert into pp table
            const ppQuery = `
                INSERT INTO pp (post_id, category_id, localHostTF)
                VALUES ($1, $2, $3)
            `;
            const ppValues = [postId, category, testtf];
            await client.query(ppQuery, ppValues);

            // Log the result for debugging
            console.log('Post created:', postResult.rows[0]);
        } else if (type === 'project') {
            const projectQuery = `
                INSERT INTO blog2.project (category_id, title, sectionqty, viewcount, createdate, modifieddate, adspace_id, testtf)
                VALUES ($1, $2, $3, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, NULL, $4)
                RETURNING project_id
            `;
            const projectValues = [category, title, sectionQty, testtf];
            const projectResult = await client.query(projectQuery, projectValues);

            const projectId = projectResult.rows[0].project_id;

            // Insert into pp table
            const ppQuery = `
                INSERT INTO pp (project_id, category_id, localHostTF)
                VALUES ($1, $2, $3)
            `;
            const ppValues = [projectId, category, testtf];
            await client.query(ppQuery, ppValues);

            // Log the result for debugging
            console.log('Project created:', projectResult.rows[0]);

            for (let i = 0; i < sectionQty; i++) {
                const sectionQuery = `
                    INSERT INTO blog2.projectsection (project_id, category_id, subheader, content,  photo_link, viewcount, createdate, modifieddate)
                    VALUES ($1, $2, $3, $4, $5, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                `;
                const sectionValues = [projectId, category, sectionTitles[i], sectionContents[i], images[i + 1] || null];
                await client.query(sectionQuery, sectionValues);
            }

            // Log the sections for debugging
            console.log('Project sections created');
        }

        res.redirect('/');
     } catch (err) {
        console.error('Error creating post or project:', err.message);
        console.error('Stack Trace:', err.stack);
        res.status(500).json({ error: 'Database error' });
    }
});

// Route to render subscription page
app.get('/subscribe', (req, res) => {
    const frequenciesQuery = 'SELECT freq_id, name AS frequencyName FROM blog2.frequencies';

    // Fetch frequencies and render the page
client.query(frequenciesQuery)
    .then(frequenciesResult => {
        console.log(frequenciesResult.rows); // Log data for debugging
        res.render('subscribe', {
            categories: res.locals.categories, // Use categories from res.locals
            frequencies: frequenciesResult.rows // Frequencies fetched from the database
        });
    })
    .catch(err => {
        console.error('Error rendering subscription page:', err);
        res.status(500).send('An error occurred while fetching data.');
    });


});
app.post('/subscribe', (req, res) => {
    const { email, frequency, categories } = req.body;

    // Validate input
    if (!email || !frequency) {
        return res.status(400).send('Email and frequency are required.');
    }

    // Insert into subscribers table
    const insertSubscriberQuery = 'INSERT INTO subscribers (email, created_at) VALUES ($1, NOW()) RETURNING sub_id';

    client.query(insertSubscriberQuery, [email])
        .then(result => {
            const subscriberId = result.rows[0].sub_id;

            // Normalize categories from form (remove spaces and convert to lowercase)
            const normalizedCategories = categories.map(category => category.replace(/\s+/g, '').toLowerCase());

            // Define category columns and their normalized versions
            const categoryColumns = [
                'Automotive', 'Lego', 'justphotos', 'Entrepreneurial', 'Creative', 'General' // List all category columns
            ];
            const normalizedCategoryColumns = categoryColumns.map(column => column.replace(/\s+/g, '').toLowerCase());

            // Create a set of columns with true/false values
            const categoryUpdates = normalizedCategoryColumns.map((column, index) => {
                const originalColumn = categoryColumns[index];
                return `${originalColumn} = ${normalizedCategories.includes(column) ? 'TRUE' : 'FALSE'}`;
            }).join(', ');

            // Insert into catSub table with frequency_id
            const insertOrUpdateCatSubQuery = `
                INSERT INTO blog2.catSub (subscriber_id, frequency_id, ${categoryColumns.join(', ')})
                VALUES ($1, $2, ${categoryColumns.map((_, i) => `$${i + 3}`).join(', ')})
                ON CONFLICT (subscriber_id) DO UPDATE
                SET frequency_id = EXCLUDED.frequency_id,
                    ${categoryUpdates}`;
            
            // Prepare values for the query
            const categoryValues = normalizedCategoryColumns.map(column => normalizedCategories.includes(column) ? true : false);

            return client.query(insertOrUpdateCatSubQuery, [subscriberId, frequency, ...categoryValues]);
        })
        .then(() => {
            // Success response
            res.status(200).send('Subscription successful.');
        })
        .catch(err => {
            console.error('Error processing subscription:', err);
            res.status(500).send('An error occurred while processing your subscription.');
        });
});

app.get('/admin/top-posts', async (req, res) => {
    try {
        // Query to get the top 10 posts with view counts greater than 1, ordered by view count descending
        const query = `
            SELECT * FROM blog2.post
            WHERE viewcount > 1
            ORDER BY viewcount DESC
            LIMIT 10
        `;
        
        const result = await client.query(query);
        const topPosts = result.rows;

        // Render the top-posts view and pass the topPosts data
        res.render('top-posts', { topPosts });
    } catch (err) {
        console.error('Error fetching top posts', err);
        res.status(500).json({ error: 'Database error' });
    }
});


// Fetch cards from the Pokémon TCG API
async function fetchCards(query) {
    try {
        const response = await axios.get(pok_URL, {
            headers: {
                'X-Api-Key': pokemonAPI
            },
            params: {
                q: query // Example query
            }
        });
        return response.data.data; // Return card data
    } catch (error) {
        console.error('Error fetching cards:', error);
        throw error;
    }
}

// Function to break the user input into segments of three letters or fewer
function breakIntoSegments(userInput) {
    const segments = [];
    for (let i = 0; i < userInput.length; i += 3) {
        segments.push(userInput.substring(i, i + 3));
    }
    return segments;
}

// Function to find a valid segment with results
async function findValidSegment(segments) {
    const attempts = 10; // Number of attempts to find a valid segment
    let attemptsLeft = attempts;
    let found = false;
    let resultCards = [];
    let chosenSegment = '';

    while (attemptsLeft > 0 && !found) {
        // Randomly choose one of the segments
        const randomSegment = segments[Math.floor(Math.random() * segments.length)];
        const query = `name:${randomSegment}*`;

        // Fetch Pokémon cards based on the query
        resultCards = await fetchCards(query);

        if (resultCards.length > 0) {
            chosenSegment = randomSegment;
            found = true;
        } else {
            attemptsLeft--;
        }
    }

    return { resultCards, chosenSegment, found };
}

// Define the /pokemon route to handle form submissions and display results
app.get('/pokemon', async (req, res) => {
    try {
        const userInput = req.query.name || '';
        let cards = [];
        let message = '';

        if (userInput) {
            // Break the user input into segments of three letters or fewer
            const segments = breakIntoSegments(userInput);

            if (segments.length > 0) {
                // Find a valid segment with results
                const { resultCards, chosenSegment, found } = await findValidSegment(segments);

                if (found) {
                    cards = resultCards;
                    message = `Pokémon found with segment "${chosenSegment}".`;
                } else {
                    message = `No Pokémon found with any segment of "${userInput}".`;
                }
            } else {
                message = 'Invalid input.';
            }
        }

        res.render('pokemon', { cards, search: userInput, message });
    } catch (error) {
        res.status(500).send('Error fetching Pokémon cards.');
    }
});

// Route to handle title search
app.get('/search', async (req, res) => {
    const title = req.query.title;
    let covers = [];
    if (title) {
        try {
            const response = await axios.get(`https://www.googleapis.com/books/v1/volumes`, {
                params: {
                    q: `intitle:${title}`,
                    maxResults: 40  // Adjust this number based on how many results you want
                }
            });
            const books = response.data.items || [];
            covers = books.flatMap(book =>
                book.volumeInfo.imageLinks ? [book.volumeInfo.imageLinks.thumbnail] : []
            );
        } catch (error) {
            console.error(error);
        }
    }
    res.render('search', { covers });
});

const storeRoutes = require('./routes/storeRoutes'); // Ensure path is correct
app.use((req, res, next) => {
    console.log(`Request URL: ${req.originalUrl}`);
    next();
});
// Use the store routes
app.use('/store', storeRoutes); // Prefix for store routes

app.post('/uploadImage', upload.single('file'), (req, res) => {
    // Handle the uploaded file here
    // For simplicity, we'll just return the file path
    res.json({ location: `/uploads/${req.file.filename}` });
});

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});