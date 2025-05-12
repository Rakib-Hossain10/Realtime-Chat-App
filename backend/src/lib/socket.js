
import { Server } from "socket.io";
import http from "http";
import express from "express";
import Emergency from "../models/emergency.model.js"; 
const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173"], // Frontend URL
  },
});

const userSocketMap = {}; // {userId: socket.id}

export function getReceiverSocketId(userId) {
  return userSocketMap[userId]; // Return the socket ID of the given user
}

// Handle incoming socket connections
io.on("connection", (socket) => {
  console.log("A user is connected", socket.id);

  const userId = socket.handshake.query.userId;
  if (userId) userSocketMap[userId] = socket.id;

  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  socket.on("disconnect", () => {
    console.log("A user is disconnected", socket.id);
    delete userSocketMap[userId];
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });

  // Save SOS start event to the database and send SOS to receiver
  socket.on(
    "sosStart",
    async ({userId, receiverId, latitude, longitude, timestamp, text }) => {
      if (!userId || !receiverId || !text) {
        console.error("Missing required data: userId, receiverId, or text");
        return; // Ensure we don't save incomplete SOS events
      }

      const address = "Click to view on Google Maps"; // You can add reverse geocoding logic here if needed

      const newEmergency = new Emergency({
        userId,
        receiverId,
        text,
        latitude,
        longitude,
        address,
        timestamp,
      });

      try {
        await newEmergency.save(); // Save SOS to database
        console.log("SOS event saved to database");

        const payload = {
          userId,
          receiverId,
          latitude,
          longitude,
          address,
          timestamp,
          text,
        };

        const receiverSocket = getReceiverSocketId(receiverId);
        if (receiverSocket) {
          io.to(receiverSocket).emit("newSOS", payload);
        } else {
          console.log("Receiver not online.");
        }
      } catch (error) {
        console.error("Error saving SOS event:", error);
      }
    }
  );

  // Save SOS voice event to the database and send voice message to receiver
  socket.on(
    "sosVoice",
    async ({ userId, receiverId, audioBlob, latitude, longitude }) => {
      if (!userId || !receiverId || !audioBlob || !latitude || !longitude) {
        console.error(
          "Missing required data: userId, receiverId, or audioBlob"
        );
        return; // Ensure we don't save incomplete SOS voice events
      }

      const newEmergencyVoice = new Emergency({
        userId,
        receiverId,
        text: "SOS voice message", // Default text for voice message
        audioBlob: audioBlob, // Save audio blob as Buffer
        latitude, // Save latitude
        longitude, // Save longitude
      });

      try {
        await newEmergencyVoice.save(); // Save SOS voice to the database
        console.log("SOS voice event saved to database");

        const receiverSocket = getReceiverSocketId(receiverId);
        if (receiverSocket) {
          io.to(receiverSocket).emit("newSOSVoice", {
            userId,
            audioBlob,
            latitude,
            longitude,
          });
        } else {
          console.log("Receiver not online.");
        }
      } catch (error) {
        console.error("Error saving SOS voice:", error);
      }
    }
  );

  // Receive live location updates and send them to the receiver
  socket.on(
    "sendLiveLocation",
    async ({userId,receiverId, latitude, longitude, timestamp }) => {

      if (!userId || !receiverId) {
      console.error("Missing required data: userId, receiverId");
      return; 
    }

      const address = "Click to view on Google Maps"; 

      const payload = {
        userId,
        receiverId,
        latitude,
        longitude,
        address,
        timestamp,
        text: "🚨 SOS! User in danger. Live location update.",
      };

      // Save the live location to the database
      const newLiveLocation = new Emergency({
        userId,
        receiverId,
        latitude,
        longitude,
        address,
        timestamp,
        text: "SOS Live Location Update",
      });

      try {
        await newLiveLocation.save(); // Save live location to the database
        console.log("Live location saved to database");

        const receiverSocket = getReceiverSocketId(receiverId);
        if (receiverSocket) {
          io.to(receiverSocket).emit("newLiveLocation", payload); // Send live location to the receiver
        } else {
          console.log("Receiver not online.");
        }
      } catch (error) {
        console.error("Error saving live location:", error);
      }
    }
  );
});

export { app, server, io };

