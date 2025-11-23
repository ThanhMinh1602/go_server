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

// Friend Room Events
const JOIN_FRIENDS = 'join:friends';
const LEAVE_FRIENDS = 'leave:friends';

// Friend Events
const FRIEND_REQUEST_RECEIVED = 'friend:request:received';
const FRIEND_REQUEST_ACCEPTED = 'friend:request:accepted';
const FRIEND_REQUEST_REJECTED = 'friend:request:rejected';
const FRIEND_ADDED = 'friend:added';

// Message Room Events
const JOIN_MESSAGES = 'join:messages';
const LEAVE_MESSAGES = 'leave:messages';

// Message Events
const MESSAGE_SENT = 'message:sent';
const MESSAGES_READ = 'messages:read';

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
  JOIN_FRIENDS,
  LEAVE_FRIENDS,
  JOIN_MESSAGES,
  LEAVE_MESSAGES,

  // Location Events
  LOCATION_CREATED,
  LOCATION_UPDATED,
  LOCATION_DELETED,

  // Friend Events
  FRIEND_REQUEST_RECEIVED,
  FRIEND_REQUEST_ACCEPTED,
  FRIEND_REQUEST_REJECTED,
  FRIEND_ADDED,

  // Message Events
  MESSAGE_SENT,
  MESSAGES_READ,
};
