const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

// Load env vars
dotenv.config();

// Connect to database
// Note: Only connect if URI is present, to prevent immediate crash before .env setup
if (process.env.MONGO_URI) {
  connectDB();
} else {
  console.log('No MONGO_URI provided in .env yet.');
}

const app = express();

// Body parser
app.use(express.json());

// Enable CORS
const allowedOrigin = process.env.CLIENT_URL || 'http://localhost:5173';
app.use(cors({ origin: allowedOrigin, credentials: true }));

// Mount routers
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/properties', require('./routes/property.routes'));
app.use('/api/clients', require('./routes/client.routes'));
app.use('/api/deals', require('./routes/deal.routes'));
app.use('/api/commissions', require('./routes/commission.routes'));

// Basic route
app.get('/', (req, res) => {
  res.send('API is running...');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, console.log(`Server running on port ${PORT}`));
