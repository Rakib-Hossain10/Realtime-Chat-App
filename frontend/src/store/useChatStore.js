import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create((set, get) => ({
  messages: [],
  users: [],
  selectedUser: null,
  sosMessages: [], // Add a new state for SOS messages
  isUsersLoading: false,
  isMessagesLoading: false,

  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/users");
      set({ users: res.data });
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMessages: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      set({ messages: res.data });
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isMessagesLoading: false });
    }
  },
  sendMessage: async (messageData) => {
    const { selectedUser, messages } = get();
    try {
      const res = await axiosInstance.post(
        `/messages/send/${selectedUser._id}`,
        messageData
      );
      set({ messages: [...messages, res.data] });
    } catch (error) {
      toast.error(error.response.data.message);
    }
  },

  subscribeToMessages: () => {
    const { selectedUser } = get();
    if (!selectedUser) return;

    const socket = useAuthStore.getState().socket;

    socket.on("newMessage", (newMessage) => {
      const isMessageSentFromSelectedUser =
        newMessage.senderId === selectedUser._id;

      if (!isMessageSentFromSelectedUser) return;

      set({
        messages: [...get().messages, newMessage],
      });
    });

    // Subscribe to new SOS messages
    socket.on("newSOS", (sosData) => {
      const isMessageSentFromSelectedUser =
        sosData.senderId === selectedUser._id;
      if (!isMessageSentFromSelectedUser) return;
      set({
        sosMessages: [...get().sosMessages, sosData], // Add SOS data to the store
      });
    });

    // Subscribe to live location updates
    socket.on("newLiveLocation", (locationData) => {
      const isMessageSentFromSelectedUser =
        locationData.senderId === selectedUser._id;
      if (!isMessageSentFromSelectedUser) return;
      set({
        sosMessages: [...get().sosMessages, locationData], // Add live location to SOS messages
      });
    });

    // Subscribe to SOS voice messages
    socket.on("newSOSVoice", (voiceData) => {
      const isMessageSentFromSelectedUser =
        voiceData.senderId === selectedUser._id;
      if (!isMessageSentFromSelectedUser) return;
      set({
        sosMessages: [...get().sosMessages, voiceData], // Add voice data to SOS messages
      });
    });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    socket.off("newMessage");
    socket.off("newSOS");
    socket.off("newLiveLocation");
    socket.off("newSOSVoice");
  },

  setSelectedUser: (selectedUser) => set({ selectedUser }),
}));
