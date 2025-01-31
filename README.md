
---

# Real-Time Forum

## Overview
This project is a **real-time forum** where users can register, log in, create posts, comment on posts, and send private messages to other users. The forum is built using **Golang** for the backend, **SQLite** for the database, and **HTML/CSS/JavaScript** for the frontend. Real-time communication is achieved using **WebSockets**, enabling features like live private messaging and instant updates for posts and comments.

The forum is designed as a **single-page application (SPA)**, meaning all interactions happen without reloading the page. This provides a seamless user experience.

---

## Features

### 1. **User Authentication**
- **Registration**: Users can register by providing a nickname, age, gender, first name, last name, email, and password.
- **Login**: Users can log in using their nickname or email and password.
- **Logout**: Users can log out from any page on the forum.

### 2. **Posts and Comments**
- **Create Posts**: Logged-in users can create posts with categories.
- **Comment on Posts**: Users can comment on existing posts.
- **Post Feed**: Posts are displayed in a feed, and users can click on a post to view its comments.

### 3. **Private Messaging**
- **Real-Time Chat**: Users can send private messages to other users in real time.
- **Online/Offline Status**: A section displays online and offline users, organized by the last message sent or alphabetically.
- **Message History**: Users can view the last 10 messages in a chat and load more messages by scrolling up.

### 4. **Real-Time Updates**
- **WebSocket Integration**: Real-time updates for posts, comments, and private messages are handled using WebSockets.
- **Instant Notifications**: Users receive notifications for new messages, posts, and comments without refreshing the page.

---

## System Architecture

### 1. **Frontend**
- Built with **HTML**, **CSS**, and **JavaScript**.
- Single-page application (SPA) for seamless navigation.
- Communicates with the backend via **HTTP** and **WebSockets**.

### 2. **Backend**
- Built with **Golang**.
- Handles HTTP requests for user authentication, post creation, and commenting.
- Manages WebSocket connections for real-time communication.
- Uses **Gorilla WebSocket** for WebSocket implementation.

### 3. **Database**
- **SQLite** is used for persistent data storage.
- Tables include:
  - **Users**: Stores user information.
  - **Posts**: Stores posts created by users.
  - **Comments**: Stores comments on posts.
  - **Private Messages**: Stores private messages between users.

### 4. **WebSocket Communication**
- Real-time communication between the frontend and backend.
- Used for:
  - Sending and receiving private messages.
  - Notifying users of new posts and comments.

---

## Setup Instructions

### Prerequisites
- **Golang** installed on your machine.
- **SQLite** installed for database management.
- A modern web browser (e.g., Chrome, Firefox).

### Step 1: Clone the Repository
```bash
git clone https://github.com/your-username/real-time-forum.git
cd real-time-forum
```

### Step 2: Set Up the Database
1. Navigate to the `backend` directory.
2. Run the SQL script to create the necessary tables:
   ```bash
   sqlite3 forum.db < schema.sql
   ```

### Step 3: Start the Backend Server
1. Navigate to the `backend` directory.
2. Run the Golang server:
   ```bash
   go run main.go
   ```
   The server will start on `http://localhost:8080`.

### Step 4: Open the Frontend
1. Open the `index.html` file in your browser.
2. The forum should now be accessible at `http://localhost:8080`.

---

## Usage

### 1. **Registration and Login**
- Click on the "Register" button to create a new account.
- After registration, log in using your nickname/email and password.

### 2. **Creating Posts**
- Once logged in, click on the "Create Post" button.
- Fill in the post details and submit.

### 3. **Commenting on Posts**
- Click on a post to view its details.
- Add a comment in the comment section.

### 4. **Private Messaging**
- In the chat section, select a user from the online/offline list.
- Send a message, and it will appear in real time for the recipient.

---

## Allowed Packages
- **Golang**:
  - Standard Go packages.
  - [Gorilla WebSocket](https://pkg.go.dev/github.com/gorilla/websocket) for WebSocket communication.
  - [sqlite3](https://github.com/mattn/go-sqlite3) for database operations.
  - [bcrypt](https://pkg.go.dev/golang.org/x/crypto/bcrypt) for password hashing.
  - [UUID](https://github.com/gofrs/uuid) for generating unique IDs.
- **Frontend**:
  - No external libraries or frameworks (e.g., React, Angular, Vue).

---

## Learning Outcomes
This project will help you learn:
- **Web Development Basics**:
  - HTML, CSS, JavaScript.
  - HTTP, sessions, cookies.
  - Backend and frontend communication.
- **Golang**:
  - Go routines and channels for concurrency.
  - WebSocket implementation.
- **Database Management**:
  - SQL queries and database design.
- **Real-Time Communication**:
  - WebSocket integration for real-time updates.

---

## Bonus Features (Optional)
- **User Profiles**: Allow users to view and edit their profiles.
- **Image Sharing**: Enable users to send images in private messages.
- **Performance Optimization**: Use Go routines, channels, and asynchronous JavaScript to improve performance.

---

## Contributing
If you'd like to contribute to this project, please follow these steps:
1. Fork the repository.
2. Create a new branch for your feature or bug fix.
3. Submit a pull request with a detailed description of your changes.

---

## License
This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

## Acknowledgments
- Special thanks to the Golang and JavaScript communities for their excellent documentation and resources.
- Inspired by modern forum and chat applications like Discord and Reddit.

---
