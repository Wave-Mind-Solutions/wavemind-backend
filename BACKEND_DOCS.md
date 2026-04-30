# WaveMind Solutions – Backend Documentation

## 📁 Complete Folder Structure

```
server/
├── server.js                   # Entry point – HTTP + Socket.io bootstrap
├── app.js                      # Express app, middleware, routes
├── package.json
├── .env                        # Your secrets (gitignored)
├── .env.example                # Template to share
├── .gitignore
│
├── config/
│   ├── db.js                   # MongoDB connection (Mongoose)
│   ├── cloudinary.js           # Cloudinary + Multer storage config
│   └── mailer.js               # Nodemailer SMTP transporter
│
├── models/
│   ├── User.model.js
│   ├── Requirement.model.js
│   ├── Project.model.js
│   ├── Task.model.js
│   ├── Deliverable.model.js
│   └── Message.model.js
│
├── routes/
│   ├── auth.routes.js
│   ├── admin.routes.js
│   ├── dev.routes.js
│   ├── client.routes.js
│   └── chat.routes.js
│
├── controllers/
│   ├── auth.controller.js
│   ├── admin.controller.js
│   ├── dev.controller.js
│   ├── client.controller.js
│   └── chat.controller.js
│
├── middleware/
│   ├── auth.middleware.js
│   ├── role.middleware.js
│   ├── validate.middleware.js
│   └── errorHandler.js
│
├── services/
│   └── email.service.js
│
├── sockets/
│   └── socket.js
│
└── utils/
    ├── token.utils.js
    └── response.utils.js
```

---

## 🔐 API Reference

### Auth — `/api/auth`
| Method | Endpoint            | Auth | Description              |
|--------|---------------------|------|--------------------------|
| POST   | `/register`         | No   | Register client/developer|
| POST   | `/login`            | No   | Login, returns JWT       |
| POST   | `/forgot-password`  | No   | Send reset email         |
| GET    | `/profile`          | Yes  | Get logged-in user       |

### Admin — `/api/admin` (role: admin)
| Method | Endpoint                | Description                    |
|--------|-------------------------|--------------------------------|
| GET    | `/requirements`         | List all requirements          |
| GET    | `/projects`             | List all projects              |
| POST   | `/projects/convert`     | Convert requirement to project |
| POST   | `/projects/assign`      | Assign developers to project   |
| PATCH  | `/projects/:id`         | Update project                 |
| GET    | `/specialists`          | List developers by type        |
| POST   | `/tasks`                | Create and assign a task       |

### Developer — `/api/dev` (role: developer)
| Method | Endpoint            | Description                       |
|--------|---------------------|-----------------------------------|
| GET    | `/tasks`            | Get my assigned tasks             |
| PATCH  | `/tasks/:id`        | Update task status                |
| POST   | `/deliverables`     | Upload file (multipart/form-data) |
| GET    | `/deliverables`     | Get my uploads                    |

### Client — `/api/client` (role: client)
| Method | Endpoint            | Description                    |
|--------|---------------------|--------------------------------|
| POST   | `/requirements`     | Submit a new requirement       |
| GET    | `/requirements`     | My requirements list           |
| GET    | `/projects`         | My active projects             |
| GET    | `/payments`         | Payment/voucher summary        |

### Chat — `/api/chat` (any role)
| Method | Endpoint                        | Description             |
|--------|---------------------------------|-------------------------|
| GET    | `/conversations`                | My conversation threads |
| POST   | `/messages`                     | Send a message          |
| GET    | `/messages/:conversationId`     | Fetch message history   |

---

## Socket.io Events

### Client emits to Server
| Event                | Payload                      | Purpose                   |
|----------------------|------------------------------|---------------------------|
| `join`               | `{ userId }`                 | Join personal room        |
| `join_conversation`  | `{ conversationId }`         | Join a chat thread        |
| `leave_conversation` | `{ conversationId }`         | Leave a chat thread       |
| `typing`             | `{ conversationId, userId }` | Typing indicator on       |
| `stop_typing`        | `{ conversationId, userId }` | Typing indicator off      |

### Server emits to Client
| Event              | When Triggered                     |
|--------------------|------------------------------------|
| `new_message`      | Message sent to user               |
| `project_created`  | Requirement converted to project   |
| `project_updated`  | Project updated by admin           |
| `task_assigned`    | Developer assigned to task/project |
| `user_typing`      | Another user typing                |
| `user_stop_typing` | Another user stopped typing        |

---

## Environment Variables (.env)

```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/wavemind
JWT_SECRET=your_super_secret_key
JWT_EXPIRES_IN=7d

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@gmail.com
SMTP_PASS=your_app_password
EMAIL_FROM=noreply@wavemind.com

CLIENT_URL=http://localhost:5173
```

---

## Running the Backend

```bash
cd server
npm install
# Edit .env with real credentials
npm run dev        # dev mode (nodemon hot-reload)
npm start          # production
```

Health check: GET http://localhost:5000/api/health

---

## Frontend Integration

```js
// src/api/axios.js
import axios from "axios";
const api = axios.create({ baseURL: "http://localhost:5000/api" });
api.interceptors.request.use(cfg => {
  const token = localStorage.getItem("token");
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});
export default api;

// src/socket.js
import { io } from "socket.io-client";
const socket = io("http://localhost:5000", { withCredentials: true });
export default socket;
```

After login, emit: socket.emit("join", { userId: user._id })
File uploads: multipart/form-data with fields: file, taskId, projectId, fileType
