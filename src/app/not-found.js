"use client"
import Link from 'next/link';
import Header from './components/header';
import Footer from './components/footer';
import { useEffect, useState } from 'react';
import router from 'next/router';
import { useRouter } from "next/navigation";

export default function NotFound() {
    const router = useRouter();
    const [activeComponent, setActiveComponent] = useState('home');

    
    const setComponent = (component) => {
        setActiveComponent(component);
        router.push(`/?ac=${component}`);
    }

    return (
        <div className=" w-full flex flex-col items-center justify-center min-h-screen bg-gray-100">
            <Header activeComponent={activeComponent} setActiveComponent={setComponent} />
            <div className='moc-container flex justify-center items-center min-h-[100dvh]'>
                <div className="text-center w-fit p-8 bg-white rounded-lg shadow-md">
                    <h1 className="text-6xl font-bold text-[var(--dark-gray)] mb-4">404</h1>
                    <h2 className="text-2xl text-[var(--dark-gray)] mb-4">Page Not Found</h2>
                    <p className="text-[var(--light-gray)] mb-8">
                        The page you&apos;re looking for doesn&apos;t exist or has been moved.
                    </p>
                    <Link
                        href="/"
                        className="bg-[var(--dark-gray)] text-white px-6 py-2 rounded-full hover:bg-white hover:text-[var(--dark-gray)] border-2 border-[var(--dark-gray)] transition-all duration-300"
                    >
                        Go Home
                    </Link>
                </div>

            </div>
            <Footer/>

        </div>
    );
}