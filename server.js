const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(express.static(path.join(__dirname, 'public')));
const server = http.createServer(app);
const io = new Server(server);

const SAVE_FILE = path.join(__dirname, 'pixels.json');

let pixels = {}; // key "lon,lat" -> color

// Load saved pixels if file exists
if (fs.existsSync(SAVE_FILE)) {
  try {
    const saved = JSON.parse(fs.readFileSync(SAVE_FILE));
    pixels = saved;
    console.log("Loaded saved pixels:", Object.keys(pixels).length);
  } catch (e) {
    console.error("Error loading pixels.json:", e);
  }
}

// Function to save pixels to file
function savePixels() {
  fs.writeFileSync(SAVE_FILE, JSON.stringify(pixels));
}

io.on('connection', socket => {
  console.log("Client connected",socket.id,socket.handshake.address);
  console.log("Total pixels:", Object.keys(pixels).length);
  // Send all existing pixels at once
  const allPixels = Object.entries(pixels).map(([k,color]) => {
    const [lon,lat] = k.split(',');
    return { lon: +lon, lat: +lat, color };
  });
  socket.emit('pixels:init', allPixels);
  socket.on('pixels:siteload', ({lon,lat}) => {
    console.log("Client requested initial pixel data" + socket.id, "at", lon, lat);
    // Send all pixels when site loads
    
  });
  // Handle placing a pixel
  socket.on('pixel:place', ({lon,lat,color}) => {
    const key = `${lon},${lat}`;
    pixels[key] = color;
    console.log("Total pixels:", Object.keys(pixels).length);
    savePixels(); // save after each placement
    io.emit('pixel:update', {lon,lat,color}); // broadcast to all clients
  });
  socket.on('disconnect', () => {
    console.log("Client disconnected");
  });
});

server.listen(3000, () => console.log("Running on http://localhost:3000"));
