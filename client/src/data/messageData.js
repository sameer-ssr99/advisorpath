import api from '../api/axios';

export const getMessagesData = async () => {
  try {
    const res = await api.get('/messages');
    // Group messages by conversation (sender/receiver pair)
    const messages = res.data.messages;
    return messages;
  } catch (err) {
    console.error("Error fetching messages:", err);
    return [];
  }
};

export const sendMessage = async (receiverId, text) => {
  try {
    const res = await api.post('/messages', { receiverId, text });
    return res.data.message;
  } catch (err) {
    console.error("Error sending message:", err);
    throw err;
  }
};

export const markAsRead = async (senderId) => {
  try {
    await api.patch(`/messages/read/${senderId}`);
    return true;
  } catch (err) {
    console.error("Error marking messages as read:", err);
    return false;
  }
};
