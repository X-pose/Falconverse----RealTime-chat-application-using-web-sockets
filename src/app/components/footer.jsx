'use client';

import { useEffect, useState } from 'react';

const Footer = () => {

    return (
        <div className=' flex justify-center bg-[var(--dark-gray)] shadow-sm w-full'>
            <footer className=" moc-container w-full py-6 sm:py-8 lg:py-12 flex flex-col items-center justify-center h-full">
                <div className=' flex justify-center'>
                    <div className='flex flex-col w-full'>
                        <h2 className="text-3xl sm:text-5xl lg:text-5xl font-[700] text-white"><span>Fal</span><span className='fal-light-gray'>converse</span></h2>
                        <p className=" text-sm sm:text-lg lg:text-lg w-full text-center fal-light-gray">Secure. Private. Encrypted</p>
                    </div>

                </div>
                <div className=' flex text-white justify-center py-6 sm:py-8'>
                    <ul className='flex space-x-2 sm:space-x-4'>
                        <li className="text-xs sm:text-lg before:content-['•'] sm:before:mr-4 first:before:hidden">
                            <a href="/privacy" className="hover:text-[var(--light-gray)] transition-colors duration-300">
                                Privacy Policy
                            </a>
                        </li>
                        <li className="text-xs sm:text-lg before:content-['•'] before:mr-2 sm:before:mr-4">
                            <a href="/terms" className="hover:text-[var(--light-gray)] transition-colors duration-300">
                                Terms of Service
                            </a>
                        </li>
                        <li className="text-xs sm:text-lg before:content-['•'] before:mr-2 sm:before:mr-4">
                            <a href="/contact" className="hover:text-[var(--light-gray)] transition-colors duration-300">
                                Contact Us
                            </a>
                        </li>
                        <li className="text-xs sm:text-lg before:content-['•'] before:mr-2 sm:before:mr-4">
                            <a href="/about" className="hover:text-[var(--light-gray)] transition-colors duration-300">
                                About Us
                            </a>
                        </li>
                    </ul>

                </div>

                <div className=' flex justify-center text-center'>
                    <p className="text-xs sm:text-sm text-light-gray">© 2025 Falconverse. All rights reserved. We don't track, trace, or store</p>
                </div>
            </footer>
        </div>
    );
};

export default Footer;