"use client";

import Link from "next/link";
import { ConnectButton } from "@mysten/dapp-kit";
import { Sparkles } from "lucide-react";
import { usePathname } from "next/navigation";

export function Navbar() {
    const pathname = usePathname();
    return (



        <header className="border-b border-purple-900/30 backdrop-blur-sm sticky top-0 z-50 bg-black">
            <div className="container mx-auto flex justify-between items-center py-4 px-6">
                <Link href="/" className="flex items-center">
                    <Sparkles className="w-5 h-5 mr-2 text-purple-400" />
                    <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-purple-600">
                        ShadowVote
                    </span>
                </Link>
                <div className="flex items-center space-x-4">
                    <Link
                        href="/explore"
                        className={`transition-colors text-sm ${pathname === "/explore" ? "text-purple-400" : "text-gray-400 hover:text-purple-400"
                            }`}
                    >
                        Explore
                    </Link>
                    <Link
                        href="/about"
                        className={`transition-colors text-sm ${pathname === "/about" ? "text-purple-400" : "text-gray-400 hover:text-purple-400"
                            }`}
                    >
                        About
                    </Link>
                    <Link
                        href="/docs"
                        className={`transition-colors text-sm ${pathname === "/docs" ? "text-purple-400" : "text-gray-400 hover:text-purple-400"
                            }`}
                    >
                        Docs
                    </Link>
                    <ConnectButton className="border-purple-700 text-purple-400 outline hover:bg-purple-900/20" />
                </div>
            </div>
        </header>
    );
} 