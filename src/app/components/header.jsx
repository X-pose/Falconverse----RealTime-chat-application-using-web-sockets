'use client';

import Image from 'next/image';
import AvatarManager from '../utils/AvatarManager';
import { useEffect, useState } from 'react';

const Header = ({ activeComponent, setActiveComponent }) => {
    
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState(null);

    useEffect(() => {
        // Initialize the avatar manager on the client side
        AvatarManager.initialize();
        setProfile(AvatarManager.getProfile());
        setLoading(false);
      }, []);

    useEffect(() => {
      console.log('Profile updated:', profile);
    }, [profile]);

    const handleActiveComponentChange = (component) => {
        setActiveComponent(component);
    }
    return (
        <div className=' flex justify-center bg-white shadow-sm w-full absolute top-0 z-50'>
            <header className=" moc-container ">
                <div className="flex items-center justify-between h-full   ">
                    {/* Logo and Brand */}
                    <div className="flex items-center h-full ">
                        <div className='flex items-center py-2'>
                        <Image
                            src="/FalconLogo.webp"
                            alt="Falconverse Logo"
                            width={48}
                            height={48}
                            unoptimized={true}
                            className="rounded-full w-[24px] h-[24px] sm:w-[64px] sm:h-[64px] lg:w-[48px] lg:h-[48px]"
                        />
                        <div className='ml-2 lg:ml-4'>
                            <h2 className="text-xl sm:text-2xl lg:text-3xl font-[700] fal-dark-gray">Falconverse</h2>
                            <p className=" text-xs sm:text-sm lg:text-sm fal-light-gray">Privacy focused chat app</p>
                        </div>
                        </div>
                        

                        {/* Navigation */}
                        <nav className="hidden sm:flex items-center h-full sm:ml-12 lg:ml-8">
                            <div
                                onClick={() => handleActiveComponentChange('home')}
                                className={`px-3 text-lg text-center cursor-pointer items-center flex h-full ${activeComponent === 'home'
                                        ? 'text-dark-gray font-medium border-b-2 border-[var(--dark-gray)]'
                                        : 'text-light-gray hover:text-dark-gray'
                                    }`}
                            >
                                Home
                            </div>
                            <div
                                onClick={() => handleActiveComponentChange('chat')}
                                className={`px-3 text-lg text-center cursor-pointer items-center flex h-full  ${activeComponent === 'chat'
                                        ? 'text-dark-gray font-medium border-b-2 border-[var(--dark-gray)]'
                                        : 'text-light-gray hover:text-dark-gray'
                                    }`}
                            >
                                Chat
                            </div>
                        </nav>
                    </div>



                    {/* User Profile */}
                    <div className="flex items-center">
                        <span className="text-dark-gray mr-1 sm:mr-2 font-bold text-sm sm:text-lg cursor-default">{profile?.name.replace('-', ' ')}</span>
                        <div dangerouslySetInnerHTML={{ __html: profile?.avatarSvg }} 
                            className=" w-5 h-5 sm:w-10 sm:h-10 rounded-full" // Add width and height
                            style={{
                                 display: 'flex',
                                 alignItems: 'center',
                                 justifyContent: 'center',
                                 borderRadius: '50%',
                                 backgroundColor: 'white',
                                 overflow: 'hidden',
                                  // Set a fixed width
                             }}
                        />
                    </div>
                </div>
            </header>
        </div>
    );
};

export default Header;