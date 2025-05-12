import React, { useState, useEffect } from "react";
import { useAuthStore } from "../store/useAuthStore"; // Use Zustand store
import { useChatStore } from "../store/useChatStore";

const SOSButton = ({ receiverId }) => {
  // receiverId is the person you're sending SOS to
  const { socket, authUser } = useAuthStore();
  const { selectedUser } = useChatStore(); // Access selectedUser from store
  const [isRecording, setIsRecording] = useState(false);

  // Get current user location
  const getLocation = () => {
    return new Promise((resolve, reject) => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      } else {
        reject("Geolocation is not supported by this browser.");
      }
    });
  };

  // Trigger SOS
  const handleSOS = async () => {
    if (!socket || !authUser) return;

    try {
      const position = await getLocation();
      const { latitude, longitude } = position.coords;
      const timestamp = Date.now();

      // Send SOS start event to the specific user (receiverId)
      socket.emit("sosStart", {
        userId: authUser._id,
        receiverId: selectedUser._id,
        latitude,
        longitude,
        timestamp,
        text: "🚨 SOS! User in danger.",
      });

      // Start sending live location updates every 10 seconds
      const liveLocationInterval = setInterval(async () => {
        const position = await getLocation();
        const { latitude, longitude } = position.coords;
        const timestamp = Date.now();

        // Send live location update to the receiver
        socket.emit("sendLiveLocation", {
          userId: authUser._id,
          receiverId: selectedUser._id,
          latitude,
          longitude,
          timestamp,
        });
      }, 10000); // Update every 10 seconds

      // Stop live location updates after 30 seconds
      setTimeout(() => {
        clearInterval(liveLocationInterval);
        console.log("Stopped live location updates");
      }, 40000); //todo ekhane ami 3 theke 4 korci

      // Handle voice recording...
      setIsRecording(true);
      const audioChunks = [];
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);

      recorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: "audio/wav" });
        console.log("Audio blob created:", audioBlob);
        socket.emit("sosVoice", {
          userId: authUser._id,
          receiverId: selectedUser._id,
          audioBlob,
          latitude,
          longitude,
        });
        setIsRecording(false);
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
      setTimeout(() => recorder.stop(), 30000); // Stop after 30 seconds
    } catch (error) {
      console.error("Error with SOS:", error);
    }
  };

  return (
    <div>
      <button
        onClick={handleSOS}
        disabled={isRecording}
        // style={{ backgroundColor: isRecording ? "red" : "green" }}
        className={`bg-${
          isRecording
            ? "px-1 py-1 bg-red-500 text-white rounded-md cursor-pointer"
            : "px-1 py-1.5 bg-green-500 text-white rounded-md cursor-pointer"
        }-500 w-full sm:w-auto p-2 rounded`}
      >
        {isRecording ? "Processing..." : "Lifeline"}
      </button>
    </div>
  );
};

export default SOSButton;
