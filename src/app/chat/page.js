"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import io from "socket.io-client";
import AvatarManager from '../utils/AvatarManager';
import {
  generateKeyPair,
  encryptMessage,
  decryptMessage,
  exportPublicKey,
  importPublicKey,
} from "../../lib/crypto";
import Header from "../components/header";

// Create a client component that uses useSearchParams
function ChatContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const joinRoomId = searchParams.get("join");
  const create = searchParams.get("create");
  const invitedRoomId = searchParams.get("invite");
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [currentRoomId, setCurrentRoomId] = useState("");
  const [keyPair, setKeyPair] = useState(null);
  const [otherPublicKey, setOtherPublicKey] = useState(null);
  const [openCreatePopup, setOpenCreatePopup] = useState(false);
  const [profile, setProfile] = useState(null);
  const [otherProfile, setOtherProfile] = useState(null);
  const [isRoomCreator, setIsRoomCreator] = useState(false);
  const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);
  const [userName, setUserName] = useState("");
  const [usersInRoom, setUsersInRoom] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [copyLinkSuccess, setCopyLinkSuccess] = useState(false);
  const typingTimeoutRef = useRef(null);
  const otherUserNameRef = useRef(null);
  const typingUserRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Use refs to access latest state in event callbacks
  const socketRef = useRef(null);
  const currentRoomIdRef = useRef(currentRoomId);
  const inputRef = useRef(null);

  // Keep the ref updated with the latest value
  useEffect(() => {
    currentRoomIdRef.current = currentRoomId;
  }, [currentRoomId]);

  //Scroll to bottom of chat
  useEffect(() => {
    scrollToBottom();
  }, [messages]);


  // Generate keys first
  useEffect(() => {
    const initialize = async () => {
      try {
        // Generate keys first
        await generateKeys();

        // Initialize avatar
        AvatarManager.initialize();
        const userProfile = AvatarManager.getProfile();
        setProfile(userProfile);

        // Set username
        if (userProfile?.name) {
          setUserName(userProfile.name.replace('-', ' '));
        } else {
          setUserName("Anonymous User");
        }
      } catch (error) {
        console.error("Initialization failed:", error);
      }
    };

    initialize();
  }, []);

  // Initialize socket after keys are generated
  useEffect(() => {
    if (!keyPair || !profile) return;
    socketInitializer();

    // Cleanup function
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [keyPair, profile]);

  useEffect(() => {
    typingUserRef.current = profile?.name.replace('-', ' ');
  }, [profile]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const socketInitializer = async () => {
    const HOST_URL = process.env.NODE_ENV === 'production'
      ? process.env.NEXT_PUBLIC_PRODUCTION_URL
      : process.env.NEXT_PUBLIC_HOST_URL;

    socketRef.current = io(HOST_URL);
    const socket = socketRef.current;
    console.log("URL: ", HOST_URL);
    socket.on("connect", () => {
      if (joinRoomId || invitedRoomId) {
        let roomId = joinRoomId || invitedRoomId;
        // Join room with username as separate parameters

        socket.emit("join-room", {
          roomId: roomId,
          profile: profile
        });
        setIsRoomCreator(false);
      } else if (create) {
        // Pass username when creating room
        socket.emit("create-room", profile?.name);
        setIsRoomCreator(true);
      }
    });

    socket.on("room-created", (id) => {


      setCurrentRoomId(id);
      setOpenCreatePopup(true);
      setCopySuccess(false);
      setCopyLinkSuccess(false);

    });

    socket.on("room-joined", async (id, creatorProfile) => {

      setCurrentRoomId(id);

      // If not creator, set the other profile to creator's profile
      if (!isRoomCreator) {
        setOtherProfile(creatorProfile);
      }

      // After room is joined, share public key
      const exportedKey = await exportPublicKey(keyPair.publicKey);

      socket.emit("send-message", {
        roomId: id,
        message: { type: "public-key", key: exportedKey },
        senderId: socket.id,
        profile: profile
      });
    });

    socket.on("user-joined", async ({ userId, profile: joinedProfile, timestamp }) => {

      const username = joinedProfile?.name.replace("-", " ");
      otherUserNameRef.current = username;

      // Set other profile if we're the room creator
      if (isRoomCreator) {
        setOtherProfile(joinedProfile);
      }

      setUsersInRoom(true);
      // Add system message about user joining
      setMessages((prev) => [
        ...prev,
        { text: `${username} has joined the chat`, sender: "system", timestamp }
      ]);

      // Always use the ref to get the latest value
      if (currentRoomIdRef.current) {
        const exportedKey = await exportPublicKey(keyPair.publicKey);

        socket.emit("send-message", {
          roomId: currentRoomIdRef.current,
          message: { type: "public-key", key: exportedKey },
          senderId: socket.id,
          profile: profile
        });
      } else {
        console.log('Current room id not available yet');
      }
    });

    socket.on("user-left", ({ userId, username, timestamp }) => {

      setOtherProfile(null);
      setOtherPublicKey(null);
      setUsersInRoom(false);
      otherUserNameRef.current = null;
      // Add system message about user leaving
      setMessages((prev) => [
        ...prev,
        { text: `${username} has left the chat`, sender: "system", timestamp }
      ]);
    });

    socket.on("user-typing", ({ userId, username, isTyping }) => {
      otherUserNameRef.current = username;
      setIsOtherUserTyping(isTyping);
    });

    socket.on("receive-message", async ({ message: msg, senderId, timestamp, username, profile: senderProfile }) => {

      if (senderId === socket.id) {
        return; // Ignore messages sent by self
      }

      // Update other profile if it's the first message from this user
      if (!otherProfile && senderProfile) {
        setOtherProfile(senderProfile);
      }

      if (msg.type === "public-key") {
        const importedKey = await importPublicKey(msg.key);
        setOtherPublicKey(importedKey);
      } else {
        try {
          const decrypted = await decryptMessage(keyPair.privateKey, msg);
          setMessages((prev) => [
            ...prev,
            { text: decrypted, sender: senderId, timestamp, username },
          ]);
        } catch (error) {
          console.error("Failed to decrypt message:", error);
        }
      }
    });

    socket.on("error", (errorMessage) => {
      console.error("Socket error:", errorMessage);
      router.push("/");
      alert(errorMessage);
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
      console.error("Cannot send message. Missing required data:", {
        message: !!message,
        otherPublicKey: !!otherPublicKey,
        currentRoomId: currentRoomIdRef.current
      });
      return;
    }

    try {
      const encrypted = await encryptMessage(otherPublicKey, message);
      // Get time
      const timestamp = getCurrentTime();

      socketRef.current.emit("send-message", {
        roomId: currentRoomIdRef.current,
        message: encrypted,
        senderId: socketRef.current.id,
        profile: profile,
        timestamp: timestamp
      });

      

      setMessages((prev) => [
        ...prev,
        { text: message, sender: socketRef.current.id, timestamp, username: userName },
      ]);
      setMessage("");

      // Clear the typing indicator
      handleTypingEnd();
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  // Get current time in HH:MM AM/PM format (same as server)
  const getCurrentTime = () => {
    const now = new Date();
    let hours = now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';

    hours = hours % 12;
    hours = hours ? hours : 12; // hour '0' should be '12'

    return `${hours}:${minutes} ${ampm}`;
  };

  // Handle typing indicator
  const handleTypingStart = () => {
    if (socketRef.current && currentRoomIdRef.current) {
      socketRef.current.emit("typing-start", {
        roomId: currentRoomIdRef.current,
        username: typingUserRef.current
      });
    }
  };

  const handleTypingEnd = () => {
    if (socketRef.current && currentRoomIdRef.current) {
      socketRef.current.emit("typing-end", currentRoomIdRef.current);
    }
  };

  const handleMessageChange = (e) => {
    setMessage(e.target.value);

    // Clear any existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Emit typing-start event
    handleTypingStart();

    // Set timeout to emit typing-end after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      handleTypingEnd();
    }, 2000);
  };

  const copyRoomId = () => {
    if (currentRoomId) {
      navigator.clipboard.writeText(currentRoomId)
        .then(() => {
          
          setCopySuccess(true);
          setTimeout(() => {
            closeCreatePopup();
          }, 2000); // Reset after 2 seconds
        })
        .catch(err => {
          console.error('Failed to copy room ID:', err);
        });
    }
  }

  const copyRoomInvite = () => {
    if (currentRoomId) {
      navigator.clipboard.writeText(`https://falconverse-chat-app.onrender.com/chat?invite=${currentRoomId}`)
        .then(() => {
          
          setCopyLinkSuccess(true);
          setTimeout(() => {
            closeCreatePopup();
          }, 2000); // Reset after 2 seconds
        })
        .catch(err => {
          console.error('Failed to copy room invite:', err);
        });
    }
  }

  const closeCreatePopup = () => {
    setOpenCreatePopup(false);
    setCopySuccess(false);
    setCopyLinkSuccess(false);

  }



  const leaveRoom = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();

      router.push("/");
    }
  }


  const renderAvatar = (profileData) => {
    return (
      <div className="flex bg-white rounded-lg justify-between w-full mt-2 px-2 py-2  items-center">
        <div className="flex  items-center w-full">
          <div dangerouslySetInnerHTML={{ __html: profileData?.avatarSvg }}
            className=" w-[25px] h-[25px] mr-5 sm:w-[45px] sm:h-[45px]  p-[4px] sm:p-[8px] lg:p-[8px] lg:w-[45px] lg:h-[45px] rounded-full shadow-[0px_0px_4px_1px_var(--light-gray)]"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%',
              backgroundColor: 'white',
              overflow: 'hidden',


            }}
          />
          <div className="flex flex-col h-full justify-center">
            <span className="text-dark-gray font-bold text-sm sm:text-xl lg:text-lg cursor-default">
              {profileData?.name.replace('-', ' ')}
            </span>
          </div>

        </div>
        <button onClick={leaveRoom} className="text-sm sm:text-lg cursor-pointer  w-fit h-fit py-1 px-4 bg-red-700 text-nowrap rounded-lg text-white">
          <i className="fa-solid fa-right-from-bracket"></i>
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col relative items-center justify-center w-full bg-gray-100">
      <Header activeComponent={"chat"} setActiveComponent={leaveRoom} />
      <div className="moc-container relative h-[calc(100dvh-60px)] sm:h-[calc(100dvh-72px)] mt-[60px] sm:mt-[72px] flex flex-col bg-gray-100">
        <div className="flex flex-col w-full">
          {otherProfile && usersInRoom ? renderAvatar(otherProfile) : renderAvatar(profile)}

          <div className="flex justify-center relative sm:py-2 my-2 items-center">

            <div className=" w-full justify-start">
              <div className="w-full ">
                <h1 className=" text-sm sm:text-xl text-dark-gray text-start ">
                  Room Id:<strong>  {currentRoomId || 'Connecting...'}</strong>
                </h1>
              </div>
            </div>

          </div>

        </div>


        <div className="flex flex-col max-h-[calc(100%)] h-[calc(100%)] mb-[76px] sm:mb-[72px] bg-white rounded-lg  w-full px-4 pt-2 pb-6 overflow-y-scroll">
          <p className=" text-xs py-2 text-light-gray sm:text-lg lg:w-full text-center lg:py-2" dangerouslySetInnerHTML={{
            __html: otherProfile && usersInRoom
              ? `You're now chatting with <strong> ${otherProfile?.name.replace('-', ' ')} </strong>`
              : 'No other users in the chat room yet. Hang on a bit'
          }} />
          {messages.map((msg, index) => (
            <div className={`flex  w-full  ${msg.sender === socketRef.current?.id ? "justify-end" : msg.sender === "system" ? "justify-center py-2" : "justify-start"} `} key={index}>

              <div className={`flex  w-fit mb-2 ${msg.sender === socketRef.current?.id ? "flex-row-reverse " : msg.sender === "system" ? "flex-row" : "flex-row"}`}>
                <div
                  className={`w-fit min-w-[100px] px-2 py-1 text-xs sm:text-xl rounded relative ${msg.sender === socketRef.current?.id ? "bg-[var(--dark-gray)] text-white ml-auto" : msg.sender === "system" ? "bg-white text-center text-light-gray w-full" : "bg-[var(--light-gray)] text-white"} `}
                >
                  {msg?.text || "Message not available"}
                </div>
                {msg.timestamp && (
                  <span className={`text-xs text-nowrap mx-4 h-full flex text-light-gray ${msg.sender === "system" ? "hidden" : "items-end"}`}>
                    {msg.timestamp}
                  </span>
                )}
              </div>


            </div>
          ))}
          {otherProfile && isOtherUserTyping && (
            <div className="text-sm text-gray-600 flex justify-self-start">
              <span className="italic ml-2">{otherUserNameRef.current} is typing...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>




        {openCreatePopup && (
          <>
            <div className="fixed inset-0 flex items-center justify-center bg-black opacity-50 z-50"></div>
            <div className="flex absolute inset-0 z-50 justify-center items-center w-full">
              <div className="bg-white opacity-100 relative p-8 rounded-lg shadow-[0_0_4px_0.01px_var(--light-gray)] w-full max-w-md">
                <i onClick={closeCreatePopup} className="cursor-pointer fa-regular fa-x absolute z-50 top-0 right-0 bg-white rounded-full p-4"></i>
                <div className="absolute flex justify-center items-center flex-col z-20 -top-[55px] left-0 right-0 w-full">
                  <div dangerouslySetInnerHTML={{ __html: profile?.avatarSvg }}
                    className="w-[110px] h-[110px] rounded-full shadow-[0px_0px_4px_1px_var(--light-gray)]"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '50%',
                      backgroundColor: 'white',
                      overflow: 'hidden',
                      padding: '15px',
                      width: '110px',
                    }}
                  />
                  <span className="text-dark-gray font-bold mt-2 text-lg cursor-default">{profile?.name.replace('-', ' ')}</span>
                </div>

                <h1 className="text-2xl font-bold mb-2 mt-22 text-center text-dark-gray">Room Created</h1>
                <p className="text-light-gray text-center">Share the Room Id or Share invite link with them</p>
                <div className="space-y-4 mt-10">
                  <span className="w-full bg-[var(--dark-gray)] group text-white flex overflow-hidden rounded hover:bg-white hover:border-[var(--dark-gray)] border-2 border-[var(--dark-gray)] transition-all duration-300">
                    <p className="w-full py-2 px-4 group-hover:text-[var(--dark-gray)]">
                      {currentRoomId || 'Loading...'}
                    </p>
                    <div onClick={copyRoomId} className="cursor-pointer bg-[var(--light-gray)] flex items-center px-4">
                      {copySuccess ? <i className="fa-solid fa-check"></i> : <i className="fa-regular fa-copy"></i>}
                    </div>
                  </span>
                  <span className="w-full bg-[var(--dark-gray)] group text-white flex overflow-hidden rounded hover:bg-white hover:border-[var(--dark-gray)] border-2 border-[var(--dark-gray)] transition-all duration-300">
                    <p className="w-full py-2 px-4 group-hover:text-[var(--dark-gray)]">
                      {`https://falconverse-chat-app.onrender.com/chat?invite=${currentRoomId}` || 'Loading...'}
                    </p>
                    <div onClick={copyRoomInvite} className="cursor-pointer bg-[var(--light-gray)] flex items-center px-4">
                      {copyLinkSuccess ? <i className="fa-solid fa-check"></i> : <i className="fa-regular fa-copy"></i>}
                    </div>
                  </span>
                  <div className="flex justify-center">
                    <button onClick={closeCreatePopup} className="px-4 bg-white group text-[var(--light-gray)] py-2 rounded-full hover:border-[var(--dark-gray)] border-2 border-[var(--light-gray)] transition-all duration-300 mt-4">
                      <p className="group-hover:text-[var(--dark-gray)] text-[var(--light-gray)]">Close</p>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
      <div className="py-4 moc-container rounded-lg absolute bottom-2 z-20 w-full  flex">
        <input
          ref={inputRef}
          type="text"
          value={message}
          onChange={handleMessageChange}
          onFocus={handleTypingStart}
          onBlur={handleTypingEnd}
          placeholder="Type a message..."
          className="flex-1 bg-white p-2 border border-[var(--light-gray)] text-gray-700 rounded-l-lg outline-none focus:ring-0 focus:border-[var(--light-gray)]"
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
        />
        <button
          onClick={sendMessage}
          disabled={!otherPublicKey || !currentRoomId}
          className={`p-2 rounded-r ${otherPublicKey && currentRoomId
            ? "bg-[var(--dark-gray)] text-white cursor-pointer hover:bg-white hover:text-[var(--dark-gray)] hover:border-[var(--dark-gray)] border-2 border-[var(--dark-gray)] transition-all duration-300"
            : "bg-[var(--light-gray)] text-white cursor-not-allowed"
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