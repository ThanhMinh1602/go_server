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

// Location Room Events
const JOIN_LOCATIONS = 'join:locations';
const LEAVE_LOCATIONS = 'leave:locations';

// Location Events
const LOCATION_CREATED = 'location:created';
const LOCATION_UPDATED = 'location:updated';
const LOCATION_DELETED = 'location:deleted';

module.exports = {
  // Connection Events
  CONNECT,
  DISCONNECT,
  RECONNECT,
  CONNECT_ERROR,
  ERROR,

  // Room Events
  JOIN_LOCATIONS,
  LEAVE_LOCATIONS,

  // Location Events
  LOCATION_CREATED,
  LOCATION_UPDATED,
  LOCATION_DELETED,
};
