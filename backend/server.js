const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: ["http://localhost:5173", "http://localhost:3000"],
    methods: ["GET", "POST"]
  }
});

// Middleware
const allowedOrigins = [
  "http://localhost:5173", 
  "http://localhost:3000",
  process.env.FRONTEND_URL, // Optional: for specific deployments
  "*" // Temporary for initial deployment to avoid any blocks
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes("*")) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// MongoDB + Models
const mongoose = require('mongoose');

// Socket real-time
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  socket.on('join-room', (room) => socket.join(room));
  socket.on('update-data', (data) => socket.to(data.room).emit('data-updated', data));
  socket.on('disconnect', () => console.log('User disconnected'));
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/classes', require('./routes/classes'));
app.use('/api/teachers', require('./routes/teachers'));
app.use('/api/students', require('./routes/students'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/public', require('./routes/public'));
// Alias for exams specifically for public
app.get('/api/exams/published', require('./routes/public').handle ? require('./routes/public').handle : (req, res, next) => {
    // Quick inline proxy to the public router if needed, but better to mount it directly or use the route inside public.js
    // Let's just use the router we already built in public.js which has /published-exams
    res.redirect(`/api/public/published-exams?classId=${req.query.classId}`);
}); 

app.get('/api/test', (req, res) => res.json({ msg: 'MongoDB Backend running!' })); 

app.set('io', io);

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected');
    
    // Seed default admin
    const Admin = require('./models/Admin');
    const defaultUsername = 'admin';
    const defaultPassword = 'admin123';
    const existingAdmin = await Admin.findOne({ username: defaultUsername });
    console.log('Checking admin:', existingAdmin ? 'exists' : 'not found');
    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash(defaultPassword, 10);
      const newAdmin = await Admin.create({ username: defaultUsername, password: hashedPassword });
      console.log(`Default admin created: ID=${newAdmin._id}, username=${defaultUsername}, password=${defaultPassword}`);
    } else {
      console.log(`Default admin exists: ${defaultUsername}`);
    }
  } catch (err) {
    console.error('Mongo error:', err);
    process.exit(1);
  }
};

connectDB().catch(console.error);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🖥️ Server running on http://localhost:${PORT}`);
});

module.exports = app;

