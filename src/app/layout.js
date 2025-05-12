import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import '@fortawesome/fontawesome-free/css/all.min.css';
require('dotenv').config()

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Falconverse",
  description: "Privacy focused chat app",
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/FalconLogo.webp', type: 'image/webp' },
    ],
    
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased flex justify-center`}
      >
        {children}
      </body>
    </html>
  );
}
