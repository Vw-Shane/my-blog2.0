const express = require('express');
const axios = require('axios');
require('dotenv').config();

const router = express.Router(); // Use router from express

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
        } else if (type === 'project') {
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
module.exports = router;
