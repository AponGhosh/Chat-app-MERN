// import dotenv from 'dotenv';
// dotenv.config();

// import express from 'express';
// import mongoose from 'mongoose';
// import connectDB from './config/db.js'; // Note the .js extension

// // Rest of your code...

// //const userRoutes = require("./routes/userRoutes");
// import userRoutes from './routes/userRoutes.js'; 
// const chatRoutes = require("./routes/chatRoutes");
// const messageRoutes = require("./routes/messageRoutes");
// const { notFound, errorHandler } = require("./middleware/errorMiddleware");
// const path = require("path");
// const colors = require("colors");

// // Load environment variables
// dotenv.config();

// // Connect to DB
// connectDB();
// //mongoose.connect("mongodb+srv://aponghosh:1997.apon@cluster0.abc123.mongodb.net/chat-app?retryWrites=true&w=majority")

// const app = express();
// app.use(express.json()); // to accept JSON data

// // API Routes
// app.use("/api/user", userRoutes);
// app.use("/api/chat", chatRoutes);
// app.use("/api/message", messageRoutes);

// // Deployment Setup
// const __dirname1 = path.resolve();

// if (process.env.NODE_ENV === "production") {
//   app.use(express.static(path.join(__dirname1, "/frontend/build")));

//   app.get("*", (req, res) =>
//     res.sendFile(path.resolve(__dirname1, "frontend", "build", "index.html"))
//   );
// } else {
//   app.get("/", (req, res) => {
//     res.send("API is running..");
//   });
// }

// // Error Handlers
// app.use(notFound);
// app.use(errorHandler);

// // PORT fallback to 5000
// const PORT = process.env.PORT || 5000;

// // Start Server
// const server = app.listen(PORT, () => {
//   console.log(`Server running on PORT ${PORT}...`.yellow.bold);
// });

// // Socket.io setup
// const io = require("socket.io")(server, {
//   pingTimeout: 60000,
//   cors: {
//     origin: "http://localhost:5000",
//     // credentials: true,
//   },
// });

// io.on("connection", (socket) => {
//   console.log("Connected to socket.io");

//   socket.on("setup", (userData) => {
//     socket.join(userData._id);
//     socket.emit("connected");
//   });

//   socket.on("join chat", (room) => {
//     socket.join(room);
//     console.log("User Joined Room: " + room);
//   });

//   socket.on("typing", (room) => socket.in(room).emit("typing"));
//   socket.on("stop typing", (room) => socket.in(room).emit("stop typing"));

//   socket.on("new message", (newMessageReceived) => {
//     const chat = newMessageReceived.chat;

//     if (!chat.users) return console.log("chat.users not defined");

//     chat.users.forEach((user) => {
//       if (user._id === newMessageReceived.sender._id) return;

//       socket.in(user._id).emit("message received", newMessageReceived);
//     });
//   });

//   socket.off("setup", () => {
//     console.log("USER DISCONNECTED");
//     socket.leave(socket.id);
//   });
// });
import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import colors from 'colors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import connectDB from './config/db.js';
import userRoutes from './routes/userRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';

// ES Modules equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('MongoDB URI:', process.env.MONGO_URI); 
// Connect to MongoDB
connectDB();

// Initialize Express app
const app = express();
app.use(express.json()); // to accept JSON data

// API Routes
app.use('/api/user', userRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/message', messageRoutes);

// -------------------------- Deployment Setup ---------------------------
const __dirname1 = path.resolve();

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname1, '/frontend/build')));

  app.get('*', (req, res) =>
    res.sendFile(path.resolve(__dirname1, 'frontend', 'build', 'index.html'))
  );
} else {
  app.get('/', (req, res) => {
    res.send('API is running successfully');
  });
}
// -------------------------- Deployment Setup ---------------------------

// Error Handlers
app.use(notFound);
app.use(errorHandler);

// Create HTTP server
const PORT = process.env.PORT || 5000;
const httpServer = createServer(app);

// Socket.io setup
const io = new Server(httpServer, {
  pingTimeout: 60000,
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  },
});

io.on('connection', (socket) => {
  console.log('Connected to socket.io');

  socket.on('setup', (userData) => {
    socket.join(userData._id);
    socket.emit('connected');
  });

  socket.on('join chat', (room) => {
    socket.join(room);
    console.log(`User Joined Room: ${room}`);
  });

  socket.on('typing', (room) => socket.in(room).emit('typing'));
  socket.on('stop typing', (room) => socket.in(room).emit('stop typing'));

  socket.on('new message', (newMessageReceived) => {
    const chat = newMessageReceived.chat;

    if (!chat.users) return console.log('chat.users not defined');

    chat.users.forEach((user) => {
      if (user._id === newMessageReceived.sender._id) return;
      socket.in(user._id).emit('message received', newMessageReceived);
    });
  });

  socket.off('setup', () => {
    console.log('USER DISCONNECTED');
    socket.leave(socket.id);
  });
});

// Start server
httpServer.listen(PORT, () => {
  console.log(colors.yellow.bold(`Server running on PORT ${PORT}`));
});