const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const { initGarbageCollection } = require('./utils/cron');

// Load env vars
dotenv.config();

// Connect to database
// Note: Only connect if URI is present, to prevent immediate crash before .env setup
if (process.env.MONGO_URI) {
  connectDB();
  initGarbageCollection();
} else {
  console.log('No MONGO_URI provided in .env yet.');
}

const app = express();

// Body parser
app.use(express.json());

// Enable CORS
app.use(cors({
  origin: true,
  credentials: true,
}));

// Serve local upload files
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Mount routers
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/properties', require('./routes/property.routes'));
app.use('/api/clients', require('./routes/client.routes'));
app.use('/api/deals', require('./routes/deal.routes'));
app.use('/api/commissions', require('./routes/commission.routes'));
app.use('/api/bids', require('./routes/bid.routes'));
app.use('/api/payments', require('./routes/payment.routes'));
app.use('/api/admin', require('./routes/admin.routes'));
app.use('/api/feedbacks', require('./routes/feedback.routes'));

// Basic route
app.get('/', (req, res) => {
  res.send('API is running...');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, console.log(`Server running on port ${PORT}`));
