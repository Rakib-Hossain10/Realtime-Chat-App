
import { useChatStore } from "../store/useChatStore";
import React, { useEffect, useRef, useState } from "react";

import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import { useAuthStore } from "../store/useAuthStore";
import { formatMessageTime } from "../lib/utils";
import SOSMessage from "./SOSMessage";

const ChatContainer = () => {
  const {
    messages,
    getMessages,
    isMessagesLoading,
    selectedUser,
    subscribeToMessages,
    unsubscribeFromMessages,
  } = useChatStore();
  const { authUser, socket } = useAuthStore(); // Access socket from Zustand store
  const messageEndRef = useRef(null);

  // State to store SOS messages, live location, and voice data
  const [sosMessages, setSosMessages] = useState([]);

  useEffect(() => {
    getMessages(selectedUser._id);

    subscribeToMessages();

    return () => unsubscribeFromMessages();
  }, [selectedUser._id, getMessages]);

  useEffect(() => {
    // Auto scroll to the latest message
    if (messageEndRef.current && (messages.length || sosMessages.length)) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, sosMessages]); // Trigger the effect when either messages or sosMessages are updated

  useEffect(() => {
    if (!socket) return; // If socket is not initialized, don't do anything

    // Listen for new SOS message
    socket.on("newSOS", (sosData) => {
      if (
        sosData.receiverId === selectedUser._id ||
        sosData.userId === selectedUser._id
      ) {
        setSosMessages((prevMessages) => [...prevMessages, sosData]);
      }
    });

    // Listen for new live location update
    socket.on("newLiveLocation", (locationData) => {
      if (
        locationData.receiverId === selectedUser._id ||
        locationData.userId === selectedUser._id
      ) {
        setSosMessages((prevMessages) => [...prevMessages, locationData]);
      } // Add the live location to the message list
    });

    // Listen for new SOS voice message
    socket.on("newSOSVoice", (voiceData) => {
      if (
        voiceData.receiverId === selectedUser._id ||
        voiceData.userId === selectedUser._id
      ) {
        setSosMessages((prevMessages) => [...prevMessages, voiceData]);
      } // Add voice message to message list
    });

    return () => {
      socket.off("newSOS");
      socket.off("newLiveLocation"); // Remove the listener for live location updates
      socket.off("newSOSVoice"); // Remove listener for voice messages
    };
  }, [socket]); // Re-run the effect whenever socket changes

  if (isMessagesLoading) {
    return (
      <div className="flex-1 flex flex-col overflow-auto">
        <ChatHeader />
        <MessageSkeleton />
        <MessageInput />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-auto">
      <ChatHeader />

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message._id}
            className={`chat ${
              message.senderId === authUser._id ? "chat-end" : "chat-start"
            }`}
            ref={messageEndRef}
          >
            <div className=" chat-image avatar">
              <div className="size-10 rounded-full border">
                <img
                  src={
                    message.senderId === authUser._id
                      ? authUser.profilePic || "/profilePic.jpg"
                      : selectedUser.profilePic || "/profilePic.jpg"
                  }
                  alt="profile pic"
                />
              </div>
            </div>
            <div className="chat-header mb-1">
              <time className="text-xs opacity-50 ml-1">
                {formatMessageTime(message.createdAt)}
              </time>
            </div>
            <div className="chat-bubble flex flex-col">
              {message.image && (
                <img
                  src={message.image}
                  alt="Attachment"
                  className="sm:max-w-[200px] rounded-md mb-2"
                />
              )}
              {message.text && <p>{message.text}</p>}
            </div>
          </div>
        ))}

        {/* Display SOS Messages */}

        {sosMessages
          .filter(
            (sos) =>
              sos.receiverId === selectedUser._id ||
              sos.userId === selectedUser._id
          )
          .map((sos, index) => (
            <SOSMessage key={index} sosData={sos} />
          ))}
      </div>

      <MessageInput />
    </div>
  );
};
export default ChatContainer;
