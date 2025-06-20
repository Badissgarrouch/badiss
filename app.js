require('dotenv').config({ path: `${process.cwd()}/.env` });
const express = require('express');
const authRoute = require('./route/authRoute');
const invitationRoute = require('./route/invitationRoute');
const notificationRoute = require('./route/notificationRoute');
const evaluationRoute = require('./route/evaluationRoute');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE','PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  },
});

app.use(express.json());
const cors = require('cors');
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE','PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use('/api/v1/invitations', invitationRoute);
app.use('/api/v1/auth', authRoute);
app.use('/api/v1/notification', notificationRoute);
app.use('/api/v1/evaluate', evaluationRoute);


app.get('/', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Bravo',
  });
});

const connectedUsers = new Map();

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  
  socket.on('authenticate', (token) => {
    try {
      const decoded = require('jsonwebtoken').verify(token, process.env.JWT_SECRET_KEY);
      connectedUsers.set(decoded.id.toString(), socket.id);
      socket.userId = decoded.id; 
      console.log(`User ${decoded.id} authenticated with socket ${socket.id}`);
    } catch (error) {
      console.error('Socket authentication error:', error);
      socket.disconnect();
    }
  });

  socket.on('disconnect', () => {
   
    for (const [userId, socketId] of connectedUsers.entries()) {
      if (socketId === socket.id) {
        connectedUsers.delete(userId);
        console.log(`User ${userId} disconnected`);
        break;
      }
    }
  });
});
app.set('io', io);
app.set('connectedUsers', connectedUsers);

app.use('*', (req, res) => {
  res.status(404).json({
    status: 'fail',
    message: 'Route not found on this server',
  });
});

const PORT = process.env.APP_PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Serveur démarré et run sur le port ${PORT}`);
});