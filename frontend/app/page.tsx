"use client";

import { useEffect } from "react";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { useRouter } from "next/navigation";
import { ArrowRight, Shield, Check, Lock, FileCode, Zap } from "lucide-react"
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HomePage() {
    const currentAccount = useCurrentAccount();
    const router = useRouter();

    useEffect(() => {
        // 这里可以添加一些初始化逻辑
        const fetchState = async () => {
            console.log("initial")
        };

        fetchState();
    }, [currentAccount]);


    return (
        <div className="min-h-screen bg-black text-white">

            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-purple-900/20 via-black to-black z-0 overflow-hidden">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxwYXR0ZXJuIGlkPSJncmlkIiB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiPjxwYXRoIGQ9Ik0gNDAgMCBMIDAgMCAwIDQwIiBmaWxsPSJub25lIiBzdHJva2U9IiM4YjVjZjYiIHN0cm9rZS13aWR0aD0iMC41Ii8+PC9wYXR0ZXJuPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiIG9wYWNpdHk9IjAuMSIvPjwvc3ZnPg==')]"></div>
            </div>

            <div className="relative z-10">

                <section className="py-20">
                    <div className="container mx-auto text-center">
                        <div className="max-w-3xl mx-auto">
                            <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
                                Encrypted Voting Tool
                                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-purple-600">
                                    Powered by Blockchain
                                </span>
                            </h1>
                            <p className="text-gray-400 text-lg mb-8 max-w-2xl mx-auto">
                                A privacy-focused voting platform built on blockchain technology. Create secure, transparent, and
                                verifiable votes for your organization or community.
                            </p>
                            <div className="flex flex-col sm:flex-row justify-center gap-4">
                                <Link href="votes/create">
                                    <Button
                                        className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-6 rounded-md w-full sm:w-auto"
                                    >
                                        Create New Vote
                                        <ArrowRight className="w-4 h-4 ml-2" />
                                    </Button>
                                </Link>
                                <Button
                                    variant="outline"
                                    className="border-purple-700 text-purple-400 hover:bg-purple-900/20 px-8 py-6 rounded-md w-full sm:w-auto"
                                    onClick={() => router.push('/votes')}
                                >
                                    Explore Votes
                                </Button>
                            </div>
                        </div>
                    </div>
                </section>


                {/* Features Section */}
                <section className="py-20 bg-black/50 backdrop-blur-sm border-y border-purple-900/30">
                    <div className="container mx-auto">
                        <h2 className="text-2xl font-bold text-center mb-12 flex items-center justify-center">
                            <FileCode className="w-5 h-5 mr-2 text-purple-400" />
                            <span>Key Features</span>
                        </h2>

                        <div className="grid md:grid-cols-3 gap-8">
                            {/* Feature 1 */}
                            <div className="bg-black/40 border border-purple-900/50 rounded-lg p-6 backdrop-blur-sm hover:border-purple-600 transition-colors">
                                <div className="bg-purple-900/30 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                                    <Shield className="w-6 h-6 text-purple-400" />
                                </div>
                                <h3 className="text-xl font-medium mb-3 text-white">Encrypted Voting</h3>
                                <p className="text-gray-400">
                                    Your vote choices are encrypted and securely stored on the blockchain, ensuring complete privacy
                                    throughout the voting process.
                                </p>
                            </div>

                            {/* Feature 2 */}
                            <div className="bg-black/40 border border-purple-900/50 rounded-lg p-6 backdrop-blur-sm hover:border-purple-600 transition-colors">
                                <div className="bg-purple-900/30 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                                    <Check className="w-6 h-6 text-purple-400" />
                                </div>
                                <h3 className="text-xl font-medium mb-3 text-white">Verifiable Results</h3>
                                <p className="text-gray-400">
                                    Blockchain technology ensures vote results are transparent and publicly verifiable, while maintaining
                                    individual vote privacy.
                                </p>
                            </div>

                            {/* Feature 3 */}
                            <div className="bg-black/40 border border-purple-900/50 rounded-lg p-6 backdrop-blur-sm hover:border-purple-600 transition-colors">
                                <div className="bg-purple-900/30 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                                    <Lock className="w-6 h-6 text-purple-400" />
                                </div>
                                <h3 className="text-xl font-medium mb-3 text-white">Tamper-Proof</h3>
                                <p className="text-gray-400">
                                    Once cast, votes cannot be altered or deleted, ensuring the integrity of the voting process and
                                    results.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="py-20">
                    <div className="container mx-auto text-center">
                        <div className="max-w-3xl mx-auto bg-gradient-to-r from-purple-900/20 to-black p-8 rounded-lg border border-purple-900/50">
                            <Zap className="w-10 h-10 text-purple-400 mx-auto mb-4" />
                            <h2 className="text-2xl font-bold mb-4">Ready to create your first secure vote?</h2>
                            <p className="text-gray-400 mb-6">
                                Start using blockchain technology to run transparent and secure voting processes today.
                            </p>
                            <Link href="/create-vote">
                                <Button className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-6 rounded-md">
                                    Create New Vote
                                    <ArrowRight className="w-4 h-4 ml-2" />
                                </Button>
                            </Link>
                        </div>
                    </div>
                </section>

            </div>
        </div>
    );
}
