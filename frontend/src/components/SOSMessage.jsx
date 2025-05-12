
import React, { useRef } from "react";

const SOSMessage = ({ sosData }) => {

  // In your component
  const audioRef = useRef(null);

  // Your off button handler
  const handleOffButton = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  // Construct the Google Maps URL using latitude and longitude
  const googleMapsUrl = `https://www.google.com/maps?q=${sosData.latitude},${sosData.longitude}`;

  return (
    <div className="chat chat-start">
      <div className="chat-image avatar">
        <div className="size-10 rounded-full border">
          <img
            src={sosData.profilePic || "/profilePic.jpg"}
            alt="profile pic"
          />
        </div>
      </div>
      <div className="chat-header mb-1">
        <time className="text-xs opacity-50 ml-1">
          {/* Format the timestamp */}
          {new Date(sosData.timestamp).toLocaleString()}
        </time>
      </div>
      <div className="chat-bubble flex flex-col">
        <div className="text-red-600">🚨 Emergency Alert</div>
        <p>{sosData.text}</p>

        {/* Display the location with a clickable link */}
        <p>Location: 
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 underline"
          >
            {sosData.address || "Click to view on Google Maps"}
          </a>
        </p>
        <p>
          Latitude: {sosData.latitude}, Longitude: {sosData.longitude}
        </p>

        {/* Display voice message if available */}
        {sosData.audioBlob && (
          <div className="mt-4 max-w-2xl mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
              <div className="flex flex-col space-y-3">
                <div className="flex justify-between items-center">
                  <p className="text-blue-500 dark:text-blue-400 text-lg font-semibold">
                    Voice Message
                  </p>
                </div>
                <div className="flex items-center justify-center">
                  <audio
                    ref={audioRef}
                    controls
                    className="w-full rounded-lg bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <source
                      src={URL.createObjectURL(new Blob([sosData.audioBlob]))}
                      type="audio/wav"
                    />
                    Your browser does not support the audio element.
                  </audio>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Click to play the recorded message
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SOSMessage;

