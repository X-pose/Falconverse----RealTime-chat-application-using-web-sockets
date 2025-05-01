"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import io from "socket.io-client";
import {
  generateKeyPair,
  encryptMessage,
  decryptMessage,
  exportPublicKey,
  importPublicKey,
} from "../../lib/crypto";

let socket;

export default function Chat() {
  const searchParams = useSearchParams();
  const create = searchParams.get("create"); // Get the 'create' query parameter
  const roomId = searchParams.get("roomId"); // Get the 'roomId' query parameter
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [currentRoomId, setCurrentRoomId] = useState("");
  const [keyPair, setKeyPair] = useState(null);
  const [otherPublicKey, setOtherPublicKey] = useState(null);

  useEffect(() => {
    socketInitializer();
    generateKeys();

    return () => {
      socket?.disconnect();
    };
  }, []);

  const socketInitializer = async () => {
    socket = io("http://localhost:3000"); // Connect directly to the custom server

    socket.on("connect", () => {
        console.log("is create? : ", create);
      if (create) {
        socket.emit("create-room");
      } else if (roomId) {
        socket.emit("join-room", roomId);
      }
    });

    socket.on("room-created", (id) => {
      setCurrentRoomId(id);
    });

    socket.on("room-joined", (id) => {
      setCurrentRoomId(id);
    });

    socket.on("user-joined", async () => {
      const exportedKey = await exportPublicKey(keyPair?.publicKey);
      socket.emit("send-message", {
        roomId: currentRoomId,
        message: { type: "public-key", key: exportedKey },
        senderId: socket.id,
      });
    });

    socket.on("receive-message", async ({ message: msg, senderId }) => {
      console.log("Received message:", msg, "from:", senderId);
      if (msg.type === "public-key") {
        const importedKey = await importPublicKey(msg.key);
        setOtherPublicKey(importedKey);
      } else {
        const decrypted = await decryptMessage(keyPair.privateKey, msg);
        setMessages((prev) => [
          ...prev,
          { text: decrypted, sender: senderId },
        ]);
      }
    });
  };

  const generateKeys = async () => {
    const keys = await generateKeyPair();
    setKeyPair(keys);
  };

  const sendMessage = async () => {
    if (message && otherPublicKey) {
      const encrypted = await encryptMessage(otherPublicKey, message);
      socket.emit("send-message", {
        roomId: currentRoomId,
        message: encrypted,
        senderId: socket.id,
      });
      setMessages((prev) => [
        ...prev,
        { text: message, sender: socket.id },
      ]);
      setMessage("");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <div className="bg-white p-4 shadow">
        <h1 className="text-xl text-black font-bold">
          Chat Room {currentRoomId || 'id not available'}
        </h1>
      </div>
      <div className="flex-1 p-4 overflow-y-auto">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`mb-2 text-black p-2 rounded ${
              msg.sender === socket.id ? "bg-blue-200 ml-auto" : "bg-gray-200"
            } max-w-xs`}
          >
            {msg?.text || "Message not available"}
          </div>
        ))}
      </div>
      <div className="p-4 bg-white flex">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 p-2 border text-gray-700 rounded-l"
        />
        <button
          onClick={sendMessage}
          className="bg-blue-500 text-white p-2 rounded-r"
        >
          Send
        </button>
      </div>
    </div>
  );
}