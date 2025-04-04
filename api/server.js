require('dotenv').config();
const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');
const bodyParser = require('body-parser');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Import routes
const userRoutes = require('./routes/users');

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// MongoDB Connection
let db;
const mongoClient = new MongoClient(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// Connect to MongoDB
async function connectToMongo() {
    try {
        await mongoClient.connect();
        db = mongoClient.db('tweet-saver');
        app.locals.db = db; // Make db available to routes
        console.log('Connected to MongoDB');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
}

// Routes
app.get('/api/health', (req, res) => {
    res.json({ status: 'healthy' });
});

// Use routes
app.use('/api/users', userRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
async function startServer() {
    await connectToMongo();
    app.listen(port, () => {
        console.log(`Server running on http://localhost:${port}`);
    });
}

startServer().catch(console.error); 