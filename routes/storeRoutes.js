const express = require('express');
const router = express.Router();

// Hardcoded products (replace with database calls later)
const products = [
    { id: 1, name: 'Product 1', description: 'Description for Product 1', price: 10.00, image: '/uploads/product1.jpg' },
    { id: 2, name: 'Product 2', description: 'Description for Product 2', price: 20.00, image: '/uploads/product2.jpg' },
    { id: 3, name: 'Product 3', description: 'Description for Product 3', price: 30.00, image: '/uploads/product3.jpg' }
];

// Helper function to find a product by ID
const findProductById = (id) => products.find(product => product.id === parseInt(id));

// Route to view the store page with products
router.get('/', (req, res) => {
    res.render('store/home', { products });
});

// Route to view a single product by its ID
router.get('/product/:id', (req, res) => {
    const productId = req.params.id;
    const product = findProductById(productId);

    if (product) {
        res.render('store/product', { product });
    } else {
        res.status(404).send('Product not found');
    }
});

// Route to add an item to the cart
router.post('/add-to-cart', (req, res) => {
    const productId = req.body.productId;
    const quantity = parseInt(req.body.quantity) || 1;

    console.log(`Adding product ${productId} with quantity ${quantity} to cart`);

    if (!req.session.cart) {
        req.session.cart = [];
    }

    const product = findProductById(productId);
    if (product) {
        const existingProductIndex = req.session.cart.findIndex(item => item.product.id === parseInt(productId));
        if (existingProductIndex >= 0) {
            req.session.cart[existingProductIndex].quantity += quantity;
        } else {
            req.session.cart.push({ product, quantity });
        }
        console.log(`Cart updated: ${JSON.stringify(req.session.cart)}`);
    } else {
        console.error(`Product ${productId} not found`);
    }

    res.redirect('/store/cart');
});

// Route to view the cart
router.get('/cart', (req, res) => {
    res.render('store/cart', { cart: req.session.cart || [] });
});
router.post('/update-cart', (req, res) => {
    console.log('Updating cart:', req.body);

    if (req.session.cart) {
        const updatedCart = req.session.cart.map(item => {
            const quantityKey = `quantity_${item.product.id}`;
            const productIdKey = `productId_${item.product.id}`;
            
            // Check if both quantity and productId are present in the request body
            if (req.body[quantityKey] && req.body[productIdKey]) {
                const newQuantity = parseInt(req.body[quantityKey]);
                
                if (newQuantity > 0) {
                    console.log(`Updating product ${item.product.id} to quantity ${newQuantity}`);
                    return { ...item, quantity: newQuantity };
                } else {
                    console.warn(`Invalid quantity ${newQuantity} for product ${item.product.id}`);
                }
            }
            return item;
        });

        req.session.cart = updatedCart;
        console.log('Cart updated:', req.session.cart);
    } else {
        console.error('No cart found in session');
    }

    res.redirect('/store/cart');
});

router.post('/remove-from-cart', (req, res) => {
    const productId = parseInt(req.body.productId); // Ensure ID is an integer
    console.log(`Attempting to remove product with ID ${productId} from cart`);

    if (req.session.cart) {
        // Log current cart for debugging
        console.log('Current cart before removal:', req.session.cart);

        // Check if productId is valid and exists in the cart
        const initialCartLength = req.session.cart.length;
        req.session.cart = req.session.cart.filter(item => item.product.id !== productId);

        if (req.session.cart.length < initialCartLength) {
            console.log(`Product with ID ${productId} removed. Updated cart:`, req.session.cart);
        } else {
            console.warn(`Product with ID ${productId} was not found in the cart.`);
        }
    } else {
        console.error('No cart found in session.');
    }

    res.redirect('/store');
});


// Route to checkout (not implemented yet)
router.get('/checkout', (req, res) => {
    res.render('store/checkout', { cart: req.session.cart || [] });
});

// Route to get the cart item count
router.get('/cart-summary', (req, res) => {
    const itemCount = (req.session.cart || []).reduce((count, item) => count + item.quantity, 0);
    res.json({ itemCount });
});

module.exports = router;
