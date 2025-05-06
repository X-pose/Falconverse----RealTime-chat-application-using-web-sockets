"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import io from "socket.io-client";
import {
  generateKeyPair,
  encryptMessage,
  decryptMessage,
  exportPublicKey,
  importPublicKey,
} from "../../lib/crypto";

// Create a client component that uses useSearchParams
function ChatContent() {
  const searchParams = useSearchParams();
  const create = searchParams.get("create");
  const roomId = searchParams.get("roomId");
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [currentRoomId, setCurrentRoomId] = useState("");
  const [keyPair, setKeyPair] = useState(null);
  const [otherPublicKey, setOtherPublicKey] = useState(null);

  // Use refs to access latest state in event callbacks
  const socketRef = useRef(null);
  const currentRoomIdRef = useRef(currentRoomId);

  // Keep the ref updated with the latest value
  useEffect(() => {
    currentRoomIdRef.current = currentRoomId;
  }, [currentRoomId]);

  // Generate keys first
  useEffect(() => {
    generateKeys();
  }, []);

  // Initialize socket after keys are generated
  useEffect(() => {
    if (!keyPair) return;

    socketInitializer();

    // Cleanup function
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [keyPair]);

  const socketInitializer = async () => {
    socketRef.current = io("https://falconverse-chat-app.onrender.com/");
    const socket = socketRef.current;

    socket.on("connect", () => {
      if (create) {
        socket.emit("create-room");
      } else if (roomId) {
        socket.emit("join-room", roomId);
      }
    });

    socket.on("room-created", (id) => {
      setCurrentRoomId(id);
    });

    socket.on("room-joined", async (id) => {
      setCurrentRoomId(id);
      // After room is joined, share public key
      const exportedKey = await exportPublicKey(keyPair.publicKey);
      socket.emit("send-message", {
        roomId: id,
        message: { type: "public-key", key: exportedKey },
        senderId: socket.id,
      });
    });

    socket.on("user-joined", async () => {
      // Always use the ref to get the latest value
      if (currentRoomIdRef.current) {
        const exportedKey = await exportPublicKey(keyPair.publicKey);
        socket.emit("send-message", {
          roomId: currentRoomIdRef.current,
          message: { type: "public-key", key: exportedKey },
          senderId: socket.id,
        });
      } else {
        console.log('Current room id not available yet');
      }
    });

    socket.on("receive-message", async ({ message: msg, senderId }) => {
      if (senderId === socket.id) {
        return; // Ignore messages sent by self
      }

      if (msg.type === "public-key") {
        const importedKey = await importPublicKey(msg.key);
        setOtherPublicKey(importedKey);
      } else {
        try {
          const decrypted = await decryptMessage(keyPair.privateKey, msg);
          setMessages((prev) => [
            ...prev,
            { text: decrypted, sender: senderId },
          ]);
        } catch (error) {
          console.error("Failed to decrypt message:", error);
        }
      }
    });
  };

  const generateKeys = async () => {
    try {
      const keys = await generateKeyPair();
      setKeyPair(keys);
    } catch (error) {
      console.error("Failed to generate key pair:", error);
    }
  };

  const sendMessage = async () => {
    if (!message || !otherPublicKey || !currentRoomIdRef.current) {
      console.log("Cannot send message. Missing required data:", {
        message: !!message,
        otherPublicKey: !!otherPublicKey,
        currentRoomId: currentRoomIdRef.current
      });
      return;
    }

    try {
      const encrypted = await encryptMessage(otherPublicKey, message);
      socketRef.current.emit("send-message", {
        roomId: currentRoomIdRef.current,
        message: encrypted,
        senderId: socketRef.current.id,
      });

      setMessages((prev) => [
        ...prev,
        { text: message, sender: socketRef.current.id },
      ]);
      setMessage("");
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <div className="bg-white p-4 shadow">
        <h1 className="text-xl text-black font-bold">
          Chat Room {currentRoomId || 'Connecting...'}
        </h1>
      </div>
      <div className="flex-1 p-4 overflow-y-auto">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`mb-2 text-black p-2 rounded ${msg.sender === socketRef.current?.id ? "bg-blue-200 ml-auto" : "bg-gray-200"
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
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
        />
        <button
          onClick={sendMessage}
          disabled={!otherPublicKey || !currentRoomId}
          className={`p-2 rounded-r ${otherPublicKey && currentRoomId
              ? "bg-blue-500 text-white"
              : "bg-gray-300 text-gray-500"
            }`}
        >
          Send
        </button>
      </div>
    </div>
  );
}

// Main component that properly wraps the content in Suspense
export default function Chat() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ChatContent />
    </Suspense>
  );
}