# API Mapping: Firebase → Go Server

Tài liệu này mô tả cách chuyển đổi từ Firebase sang Go Server backend.

## Authentication

### Firebase Auth → Go Server Auth

| Firebase Method | Go Server Endpoint | Method | Auth Required |
|----------------|-------------------|--------|---------------|
| `signInWithEmailAndPassword()` | `/api/auth/login` | POST | No |
| `createUserWithEmailAndPassword()` | `/api/auth/register` | POST | No |
| `sendPasswordResetEmail()` | `/api/auth/forgot-password` | POST | No |
| `signOut()` | `/api/auth/logout` | POST | Yes |
| `currentUser` | `/api/auth/me` | GET | Yes |
| `getIdToken()` | Returned in login/register | - | - |

**Ví dụ:**

```javascript
// Firebase
const userCredential = await auth.signInWithEmailAndPassword(email, password);
const token = await userCredential.user.getIdToken();

// Go Server
const response = await fetch('http://localhost:3000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
});
const { token, user } = await response.json();
```

## Firestore → MongoDB/REST API

### Users Collection

| Firebase Operation | Go Server Endpoint | Method | Auth Required |
|-------------------|-------------------|--------|---------------|
| `collection('users').doc(id).get()` | `/api/users/:id` | GET | Yes |
| `collection('users').doc(id).set()` | `/api/users/:id` | PUT | Yes |
| `collection('users').get()` | `/api/users` | GET | Yes |

### Restaurants Collection

| Firebase Operation | Go Server Endpoint | Method | Auth Required |
|-------------------|-------------------|--------|---------------|
| `collection('restaurants').add()` | `/api/restaurants` | POST | No* |
| `collection('restaurants').doc(id).get()` | `/api/restaurants/:id` | GET | No |
| `collection('restaurants').doc(id).update()` | `/api/restaurants/:id` | PUT | No* |
| `collection('restaurants').doc(id).delete()` | `/api/restaurants/:id` | DELETE | No* |
| `collection('restaurants').get()` | `/api/restaurants` | GET | No |
| Filter by area/type | `/api/restaurants?area=xxx&type=xxx` | GET | No |
| Get distinct areas | `/api/restaurants/areas` | GET | No |
| `collection('restaurants').snapshots()` | Polling hoặc WebSocket | - | - |

*Có thể thêm auth middleware nếu cần

**Ví dụ:**

```javascript
// Firebase
const restaurants = await firestore.collection('restaurants').get();
const restaurant = await firestore.collection('restaurants').doc(id).get();

// Go Server
const response = await fetch('http://localhost:3000/api/restaurants');
const { restaurants } = await response.json();

const response2 = await fetch(`http://localhost:3000/api/restaurants/${id}`);
const { restaurant } = await response2.json();
```

## Firebase Storage → Google Drive API

### Image Upload

| Firebase Operation | Go Server Endpoint | Method | Auth Required |
|-------------------|-------------------|--------|---------------|
| `ref().putFile()` | `/api/images/upload` | POST | No* |
| `ref().putFile()` (multiple) | `/api/images/upload-multiple` | POST | No* |
| `refFromURL().delete()` | `/api/images/:id` | DELETE | No* |

**Ví dụ:**

```javascript
// Firebase
const ref = storage.ref().child(`restaurant_images/${id}/${fileName}`);
const uploadTask = ref.putFile(imageFile);
const snapshot = await uploadTask;
const url = await snapshot.ref.getDownloadURL();

// Go Server
const formData = new FormData();
formData.append('image', imageFile);
formData.append('restaurantId', id);

const response = await fetch('http://localhost:3000/api/images/upload', {
  method: 'POST',
  body: formData
});
const { url } = await response.json();
```

## Data Models

### User Model

**Firebase/Firestore:**
```javascript
{
  id: string,
  email: string,
  name: string,
  phone?: string,
  avatar?: string
}
```

**Go Server (MongoDB):**
```javascript
{
  id: string,        // _id converted to id
  email: string,
  name: string,
  phone?: string,
  avatar?: string,
  createdAt: Date,
  updatedAt: Date
}
```

### Restaurant Model

**Firebase/Firestore:**
```javascript
{
  id: string,
  name: string,
  types: string[],
  imageUrls: string[],
  location?: {
    latitude: number,
    longitude: number,
    address: string,
    area: string
  },
  createdAt: string,  // ISO string
  updatedAt: string   // ISO string
}
```

**Go Server (MongoDB):**
```javascript
{
  id: string,        // _id converted to id
  name: string,
  types: string[],
  imageUrls: string[],
  location?: {
    latitude: number,
    longitude: number,
    address: string,
    area: string
  },
  createdAt: Date,
  updatedAt: Date
}
```

## Real-time Updates

Firebase Firestore có real-time listeners (`snapshots()`), Go Server hiện tại chưa hỗ trợ WebSocket. Có thể:

1. **Polling**: Gọi API định kỳ
2. **WebSocket**: Thêm Socket.io vào Go Server (tùy chọn)
3. **Server-Sent Events (SSE)**: Thêm SSE endpoint (tùy chọn)

## Error Handling

**Firebase:**
```javascript
try {
  await firestore.collection('restaurants').add(data);
} catch (error) {
  console.error('Firebase error:', error);
}
```

**Go Server:**
```javascript
try {
  const response = await fetch('/api/restaurants', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }
} catch (error) {
  console.error('API error:', error);
}
```

## Authentication Headers

Tất cả requests cần authentication phải gửi JWT token trong header:

```javascript
headers: {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
}
```

## Migration Checklist

- [ ] Cập nhật Flutter app để sử dụng HTTP client (Dio) thay vì Firebase SDK
- [ ] Thay thế Firebase Auth bằng API calls
- [ ] Thay thế Firestore operations bằng REST API calls
- [ ] Thay thế Firebase Storage bằng image upload API
- [ ] Cập nhật error handling
- [ ] Test tất cả features
- [ ] Cấu hình CORS cho production
- [ ] Setup MongoDB production database
- [ ] Setup Google Drive API credentials

