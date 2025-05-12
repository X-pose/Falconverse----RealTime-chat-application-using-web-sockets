const { createServer } = require("http");
const { Server } = require("socket.io");
require('dotenv').config({ path: '.env' });
const next = require("next");
const { parse } = require("url");

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

// Track rooms and their participants with their complete profiles
const rooms = new Map(); // roomId -> array of {socketId, profile}

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  const io = new Server(server, {
    cors: {
      origin: process.env.NODE_ENV === 'production'
      ? process.env.NEXT_PUBLIC_PRODUCTION_URL
      : process.env.NEXT_PUBLIC_HOST_URL,
      methods: ["GET", "POST"],
    },
  });

  io.on("connect", (socket) => {
    

    // Create room
    socket.on("create-room", (username) => {
      const roomId = Math.random().toString(36).substring(2, 8);
      
      // Get the profile from socket data or create a placeholder
      const profile = socket.data.profile || { name: username };
      
      // Initialize room with creator as first participant with full profile
      rooms.set(roomId, [{socketId: socket.id, profile}]);
      
      socket.join(roomId);
      
      
      // Notify creator
      socket.emit("room-created", roomId);
      socket.emit("room-joined", roomId, profile);
      
      // Store profile in socket data
      socket.data.profile = profile;
      socket.data.currentRoom = roomId;
      socket.data.isCreator = true;
    });

    // Join room
    socket.on("join-room", ({ roomId, profile }) => {
      // Store profile in socket data
      socket.data.profile = profile;
      socket.data.isCreator = false;
      
      
      // Check if room exists
      if (!rooms.has(roomId)) {
        socket.emit("error", "Room doesn't exist");
        return;
      }
      
      // Check if room is full (already has 2 participants)
      const participants = rooms.get(roomId);
      if (participants.length >= 2) {
        socket.emit("error", "Room is full");
        return;
      }
      
      // Join the room
      socket.join(roomId);
      socket.data.currentRoom = roomId;
      
      // Get the creator's profile
      const creatorProfile = participants[0].profile;
      
      // Add participant to room with full profile
      participants.push({socketId: socket.id, profile});
      
      // Notify the joining user about the room and send the creator's profile
      socket.emit("room-joined", roomId, creatorProfile);
      
      // Notify all users in room that someone joined
      io.to(roomId).emit("user-joined", {
        userId: socket.id,
        profile: profile,
        timestamp: getCurrentTime()
      });
    });

    // Send message
    socket.on("send-message", ({ roomId, message, senderId, profile, timestamp }) => {
      
      // Use profile from parameters or socket data
      const senderProfile = profile || socket.data.profile;
      const username = senderProfile?.name.replace('-', ' ') || "Anonymous";
      
      socket.to(roomId).emit("receive-message", { 
        message, 
        senderId, 
        timestamp,
        username,
        profile: senderProfile
      });
    });

    // Typing indicator
    socket.on("typing-start", (obj) => {
      
      socket.to(obj.roomId).emit("user-typing", {
        userId: socket.id,
        username: obj.username,
        isTyping: true
      });
    });

    socket.on("typing-end", (roomId) => {
      const username = socket.data.profile?.name.replace('-', ' ') || "Anonymous";
      socket.to(roomId).emit("user-typing", {
        userId: socket.id,
        username,
        isTyping: false
      });
    });

    // Disconnect
    socket.on("disconnect", () => {
      
      
      // Remove user from any room they were in
      const roomId = socket.data.currentRoom;
      if (roomId && rooms.has(roomId)) {
        const participants = rooms.get(roomId);
        const leavingUser = participants.find(p => p.socketId === socket.id);
        const updatedParticipants = participants.filter(p => p.socketId !== socket.id);
        
        // If room is now empty, delete it
        if (updatedParticipants.length === 0) {
          rooms.delete(roomId);
        } else {
          // Otherwise update participant list
          rooms.set(roomId, updatedParticipants);
          
          // Get username from profile
          const username = leavingUser?.profile?.name?.replace('-', ' ') || "Anonymous";
          
          // Notify remaining user that the other person left
          io.to(roomId).emit("user-left", {
            userId: socket.id,
            username,
            timestamp: getCurrentTime()
          });
        }
      }
    });
  });

  server.listen(3000, '0.0.0.0', (err) => {
    if (err) throw err;
    console.log("> Ready on http://localhost:3000");
  });
});

// Helper function to get current time in HH:MM AM/PM format
function getCurrentTime() {
  const now = new Date();
  let hours = now.getHours();
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  
  hours = hours % 12;
  hours = hours ? hours : 12; // hour '0' should be '12'
  
  return `${hours}:${minutes} ${ampm}`;
}