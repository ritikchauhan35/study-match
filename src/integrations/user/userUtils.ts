// User utility functions for generating and retrieving user IDs

// Generate a random user ID for the session
export const generateUserId = () => {
  const storedId = localStorage.getItem('study_buddy_user_id');
  if (storedId) return storedId;
  
  const newId = 'user_' + Math.random().toString(36).substring(2, 15);
  localStorage.setItem('study_buddy_user_id', newId);
  return newId;
};

// Get the current user ID
export const getUserId = () => {
  return localStorage.getItem('study_buddy_user_id') || generateUserId();
};

// Helper function to get current user info without authentication
export const getCurrentUser = () => {
  const userId = getUserId();
  return {
    id: userId,
    display_name: `User ${userId.slice(-6)}`
  };
};