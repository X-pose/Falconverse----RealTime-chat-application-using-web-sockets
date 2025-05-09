"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { useState, useEffect, useRef, useCallback } from "react";
import Header from "./components/header";
import gsap from "gsap";
import AvatarManager from './utils/AvatarManager';


export default function Home() {
  const router = useRouter();
  const [roomId, setRoomId] = useState("");
  const [activeComponent, setActiveComponent] = useState("home");
  const textRefs = useRef([null, null, null]);
  const animationRef = useRef(null);
  const [profile, setProfile] = useState(null);
  const [openJoinPopup, setOpenJoinPopup] = useState(false);


  const startAnimation = useCallback(() => {
    const chars = 'abcdefghijklmnopqrstuvwxyz!@#$%^&*()_+-=[]{}|;:,.?';
    const charsOrg = ["5sd2d28a 54sdafd4gh,", "aesdss655 f138f,", "7551f6a3 6cafdwr45t"];
    const originalTexts = [
      "Instant Connection,",
      "Secured Privacy,",
      "Ultimate Protection"
    ];
    let iterations = [0, 0, 0];
    let currentLine = 0;

    // Initialize with encrypted text for all lines
    const initializeEncrypted = () => {
      originalTexts.forEach((text, index) => {

        const encryptedWords = charsOrg[index];
        textRefs.current[index].innerText = encryptedWords;
      });
    };

    initializeEncrypted();

    const decryptText = () => {
      if (currentLine >= originalTexts.length) return;

      const currentText = textRefs.current[currentLine].innerText;
      const originalText = originalTexts[currentLine];
      const currentChar = Math.floor(iterations[currentLine]);

      const scrambled = currentText
        .split("")
        .map((char, index) => {
          if (index === currentChar) {
            return chars[Math.floor(Math.random() * chars.length)];
          }
          if (index < currentChar) {
            return originalText[index];
          }
          if (originalText[index] === " ") {
            return " ";
          }
          return currentText[index];
        })
        .join("");

      textRefs.current[currentLine].innerText = scrambled;

      if (iterations[currentLine] < originalText.length) {
        iterations[currentLine] += 0.3;
        gsap.delayedCall(0.03, decryptText);
      } else {
        currentLine++;
        if (currentLine < originalTexts.length) {
          gsap.delayedCall(0.03, decryptText);
        }
      }
    };

    // Start decryption with a delay
    gsap.delayedCall(0.5, decryptText);

    return () => {
      gsap.killTweensOf(decryptText);

    };
  },[])

  // Initialize socket after keys are generated


  useEffect(() => {
    // Initialize the avatar manager on the client side
    
    AvatarManager.initialize();
    setProfile(AvatarManager.getProfile());
  
  }, []);

  useEffect(() => {
    if (activeComponent === 'home') {
      const cleanup = startAnimation();
      return () => {
        cleanup();
      };
    }
  }, [activeComponent, startAnimation]);

  const handleCreateRoom = () => {
    router.push("/chat?create=true");
  };

  const handleJoinRoom = () => {
    setOpenJoinPopup(true);
  };
  const handleLetsChat = () => {
    setActiveComponent("chat");
  };


  const handleJoinRoomById = () => {
    if (roomId) {
      router.push(`/chat?join=${roomId}`);
    }
    closeJoinPopup();
  }

  const closeJoinPopup = () => {
    // Reset states
    setOpenJoinPopup(false);
  }
  return (
    <div className="w-full flex justify-center items-center ">
      <Header activeComponent={activeComponent} setActiveComponent={setActiveComponent} />
      <div className="moc-container">

        {activeComponent === "home" && (<div className="min-h-screen flex items-center justify-center ">

          <div className="flex lg:flex-row flex-col justify-center items-center w-full">
            <div className="flex flex-col items-center lg:items-start justify-start w-full lg:w-[60%]">
              <h3 className=" text-light-gray text-xl sm:text-4xl lg:text-3xl mb-2">We deliver</h3>

              <h2
                ref={el => textRefs.current[0] = el}
                className="scramble-text-original text-dark-gray  text-3xl sm:text-5xl lg:text-7xl font-bold"
              >
                5sd2d28a 54sdafd4gh,
              </h2>
              <h2
                ref={el => textRefs.current[1] = el}
                className="scramble-text-original text-dark-gray text-3xl sm:text-5xl lg:text-7xl font-bold"
              >
                aesdss655 f138f,
              </h2>
              <h2
                ref={el => textRefs.current[2] = el}
                className="scramble-text-original text-dark-gray text-3xl sm:text-5xl lg:text-7xl font-bold"
              >
                7551f6a3 6cafdwr45t
              </h2>
              <p className="text-light-gray text-xl text-center sm:text-4xl lg:text-start lg:text-3xl mt-6">Real-time messaging wrapped in military-grade encryption - delivered without a trace</p>

              <button onClick={handleLetsChat} className="bg-[var(--dark-gray)] mt-8 text-white px-4 py-1.5 sm:text-2xl lg:text-xl cursor-pointer rounded-full border-2 border-[var(--dark-gray)] hover:bg-transparent hover:text-[var(--dark-gray)] transition-all duration-300 ">Let&apos;s Chat <i className="ml-2 fa-regular fa-paper-plane"></i></button>
            </div>
            <div className="flex mt-5 lg:mt-0 justify-center items-center h-full lg:w-[40%]">
              <Image
                src="/hero.webp"
                alt="hero"
                width={100}
                height={100}
                className="w-full object-contain"
                unoptimized={true}
              />
            </div>
          </div>

          {/* */}
        </div>)}

        {activeComponent === "chat" && (<div className="min-h-screen flex items-center justify-center ">
          <div className="flex justify-center items-center w-full">
            <div className="bg-white relative p-8 rounded-lg shadow-[0_0_4px_0.01px_var(--light-gray)] w-full max-w-md">
              <div className="absolute flex justify-center items-center flex-col z-20 -top-[55px] left-0 right-0 w-full">

                <div dangerouslySetInnerHTML={{ __html: profile?.avatarSvg }}
                  className="w-[110px] h-[110px] rounded-full shadow-[0px_0px_4px_1px_var(--light-gray)]" // Add width and height
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '50%',
                    backgroundColor: 'white',
                    overflow: 'hidden',
                    padding: '15px',
                    width: '110px', // Set a fixed width
                  }}
                />
                <span className="text-dark-gray font-bold mt-2 text-lg cursor-default">{profile?.name.replace('-', ' ')}</span>
              </div>


              <h1 className="text-2xl font-bold mb-2 mt-22 text-center text-dark-gray">Welcome!</h1>
              <p className="text-light-gray text-center">Create a Room and get started right away, or join a room with Room Id</p>
              <div className="space-y-4 mt-10">
                <button
                  onClick={handleCreateRoom}
                  className="w-full bg-[var(--dark-gray)] group text-white py-2 rounded hover:bg-white  hover:border-[var(--dark-gray)] border-2 border-[var(--dark-gray)] transition-all duration-300"
                >
                  <p className=" group-hover:text-[var(--dark-gray)] ">Create a Room</p>
                </button>
                <div>
                  {/* <input
                  type="text"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  placeholder="Enter Room ID"
                  className="w-full p-2 border rounded mb-2 text-gray-600"
                /> */}
                  <button
                    onClick={handleJoinRoom}
                    className="w-full bg-[var(--light-gray)] group text-[var(--dark-gray)] py-2 rounded hover:bg-white  hover:border-[var(--light-gray)] border-2 border-[var(--light-gray)] transition-all duration-300"
                  >
                    <p className="group-hover:text-[var(--light-gray)]">Join a Room</p>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>)}

        

        {openJoinPopup && (
          <>
            <div className="fixed inset-0 flex items-center justify-center bg-black opacity-50 z-50">

            </div>
            <div className="flex absolute inset-0 z-50 justify-center items-center w-full">

              <div className="bg-white opacity-100 relative p-8 rounded-lg shadow-[0_0_4px_0.01px_var(--light-gray)] w-full moc-container max-w-md">
                <i onClick={closeJoinPopup} className="cursor-pointer fa-regular fa-x absolute z-50 top-0 right-0 bg-white rounded-full p-4"></i>
                <div className="absolute flex justify-center items-center flex-col z-20 -top-[55px] left-0 right-0 w-full">

                  <div dangerouslySetInnerHTML={{ __html: profile?.avatarSvg }}
                    className="w-[110px] h-[110px] rounded-full shadow-[0px_0px_4px_1px_var(--light-gray)]" // Add width and height
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '50%',
                      backgroundColor: 'white',
                      overflow: 'hidden',
                      padding: '15px',
                      width: '110px', // Set a fixed width
                    }}
                  />
                  <span className="text-dark-gray font-bold mt-2 text-lg cursor-default">{profile?.name.replace('-', ' ')}</span>
                </div>


                <h1 className="text-2xl font-bold mb-2 mt-22 text-center text-dark-gray">Join Room</h1>
                <p className="text-light-gray text-center">Paste Room Id and Press Join</p>
                <div className="space-y-4 mt-10">
                  <input
                    type="text"
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value)}
                    placeholder="Enter Room ID"
                    onKeyPress={(e) => e.key === 'Enter' && handleJoinRoomById()}
                    className="w-full bg-white group text-[var(--dark-gray)] px-4 py-2 flex overflow-hidden rounded  border-2 border-[var(--dark-gray)]"
                  >

                  </input>

                  <div className="flex justify-center">
                    <button onClick={handleJoinRoomById} className=" cursor-pointer px-4 bg-white group text-[var(--dark-gray)] py-2 rounded-full hover:bg-[var(--dark-gray)]  hover:border-[var(--dark-gray)] border-2 border-[var(--dark-gray)] transition-all duration-300 mt-4">
                      <p className="group-hover:text-white text-[var(--dark-gray)]">Join Room</p>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>

  );
}