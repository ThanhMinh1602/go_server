/**
 * Socket Events Constants
 * Quản lý tất cả các socket event names để tránh hardcode string
 */

// Connection Events
const CONNECT = 'connect';
const DISCONNECT = 'disconnect';
const RECONNECT = 'reconnect';
const CONNECT_ERROR = 'connect_error';
const ERROR = 'error';

// Restaurant Room Events
const JOIN_RESTAURANTS = 'join:restaurants';
const LEAVE_RESTAURANTS = 'leave:restaurants';

// Restaurant Events
const RESTAURANT_CREATED = 'restaurant:created';
const RESTAURANT_UPDATED = 'restaurant:updated';
const RESTAURANT_DELETED = 'restaurant:deleted';

module.exports = {
  // Connection Events
  CONNECT,
  DISCONNECT,
  RECONNECT,
  CONNECT_ERROR,
  ERROR,

  // Room Events
  JOIN_RESTAURANTS,
  LEAVE_RESTAURANTS,

  // Restaurant Events
  RESTAURANT_CREATED,
  RESTAURANT_UPDATED,
  RESTAURANT_DELETED,
};

