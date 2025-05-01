"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Home() {
  const router = useRouter();
  const [roomId, setRoomId] = useState("");

  const handleCreateRoom = () => {
    router.push("/chat?create=true");
  };

  const handleJoinRoom = () => {
    if (roomId) {
      router.push(`/chat?roomId=${roomId}`);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center text-black">Real-Time Chat</h1>
        <div className="space-y-4">
          <button
            onClick={handleCreateRoom}
            className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
          >
            Create Chat Room
          </button>
          <div>
            <input
              type="text"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              placeholder="Enter Room ID"
              className="w-full p-2 border rounded mb-2"
            />
            <button
              onClick={handleJoinRoom}
              className="w-full bg-green-500 text-white py-2 rounded hover:bg-green-600"
            >
              Join Chat Room
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}