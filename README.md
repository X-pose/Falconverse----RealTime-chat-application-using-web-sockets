# Falconverse Chat App

A real-time, secure chat application built with Next.js and Socket.IO, featuring end-to-end encrypted messaging, room-based chats, and user profile avatars. Users can create or join chat rooms, exchange messages securely, and see typing indicators.

## Features

- **Real-Time Messaging**: Send and receive messages instantly using Socket.IO WebSocket.
- **End-to-End Encryption**: Messages are encrypted with public/private key pairs for secure communication.
- **Room-Based Chats**: Create or join private chat rooms with unique IDs.
- **Typing Indicators**: See when the other user is typing.
- **User Profiles**: Automated avatars and usernames via Avatar Manager.
- **Responsive UI**: Built with Next.js and Tailwind CSS for a modern, mobile-friendly interface.
- **Room Management**: Copy room IDs or invite links to share with others.
- **Hosted on Render**: Deployed at [https://falconverse-chat-app.onrender.com](https://falconverse-chat-app.onrender.com).

## System Architecture

The application follows a client-server architecture

- **Frontend**: A Next.js app running in the browser, handling UI rendering, WebSocket communication, and message encryption/decryption.
- **Backend**: A Node.js server with Socket.IO, managing rooms, participants, and real-time events.
- **Communication**: WebSocket for real-time events (e.g., `create-room`, `send-message`) and HTTPS for serving Next.js pages.

## Technologies

- **Frontend**:
  - Next.js (React framework)
  - Socket.IO Client
  - Tailwind CSS
  - Web Crypto API (for encryption)
- **Backend**:
  - Node.js
  - Socket.IO Server
  - Next.js (server-side rendering)
- **Deployment**: 
  - Docker
  - GitHub Actions
  - Render.com
- **Tools**:
  - Docker

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Git

## Setup Instructions

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/your-username/falconverse-chat-app.git
   cd falconverse-chat-app
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Run the Development Server**:
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:3000`.

4. **Build for Production**:
   ```bash
   npm run build
   npm run start
   ```
   
## Usage

1. **Access the App**:
   - Open `http://localhost:3000` (or the deployed URL: [https://falconverse-chat-app.onrender.com](https://falconverse-chat-app.onrender.com)).
   - The homepage allows creating or joining a chat room.

2. **Create a Room**:
   - Click "Create Room" to generate a unique room ID.
   - Share the room ID or invite link with another user.

3. **Join a Room**:
   - Enter a room ID or use an invite link (e.g., `?invite=abc123`).
   - Connect with the room creator for a one-on-one chat.

4. **Chat**:
   - Type messages in the input field and press "Send" or Enter.
   - Messages are encrypted before sending and decrypted on receipt.
   - See typing indicators when the other user is typing.

5. **Leave Room**:
   - Click "Leave Room" to disconnect and return to the homepage.

## Contributing

Contributions are welcome! To contribute:

1. Fork the repository.
2. Create a feature branch (`git checkout -b feature/your-feature`).
3. Commit your changes (`git commit -m "Add your feature"`).
4. Push to the branch (`git push origin feature/your-feature`).
5. Open a Pull Request.

## Acknowledgments

- Built with [Next.js](https://nextjs.org/) and [Socket.IO](https://socket.io/).
- Containerized with Docker [Docker](https://www.docker.com/)
- Deployed on [Render](https://render.com/).
