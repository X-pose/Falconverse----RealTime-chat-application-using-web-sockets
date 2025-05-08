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
                            className="rounded-full"
                        />
                        <div className='ml-4'>
                            <h2 className="text-3xl font-[700] fal-dark-gray">Falconverse</h2>
                            <p className="text-sm fal-light-gray">Privacy focused chat app</p>
                        </div>
                        </div>
                        

                        {/* Navigation */}
                        <nav className="flex items-center h-full ml-8">
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
                        <span className="text-dark-gray mr-2 font-bold text-lg cursor-default">{profile?.name.replace('-', ' ')}</span>
                        <div dangerouslySetInnerHTML={{ __html: profile?.avatarSvg }} 
                            className="w-10 h-10 rounded-full" // Add width and height
                            style={{
                                 display: 'flex',
                                 alignItems: 'center',
                                 justifyContent: 'center',
                                 borderRadius: '50%',
                                 backgroundColor: 'white',
                                 overflow: 'hidden',
                                 width: '40px', // Set a fixed width
                             }}
                        />
                    </div>
                </div>
            </header>
        </div>
    );
};

export default Header;