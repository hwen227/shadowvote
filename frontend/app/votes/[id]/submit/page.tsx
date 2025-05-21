"use client";

//TODO： 区分状态，未开启的投票和以开启的投票

import { use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Check, Shield } from "lucide-react";




export default function VoteSubmitPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const voteId = params instanceof Promise
        ? use(params).id
        : params.id;

    const handleBackToList = () => {
        router.push("/votes");
    };

    const handleBackToDetail = () => {
        router.push(`/votes/${voteId}`);
    };

    return (
        <div className="min-h-screen bg-black text-white">
            {/* Animated background with tech pattern */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-purple-900/20 via-black to-black z-0 overflow-hidden">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxwYXR0ZXJuIGlkPSJncmlkIiB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiPjxwYXRoIGQ9Ik0gNDAgMCBMIDAgMCAwIDQwIiBmaWxsPSJub25lIiBzdHJva2U9IiM4YjVjZjYiIHN0cm9rZS13aWR0aD0iMC41Ii8+PC9wYXR0ZXJuPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiIG9wYWNpdHk9IjAuMSIvPjwvc3ZnPg==')]"></div>
            </div>
            <div className="container max-w-2xl mx-auto px-4 py-8 relative z-10">
                <div className="flex items-center mb-6">
                    <Button
                        variant="outline"
                        size="icon"
                        className="mr-4 border-purple-900/50 bg-black hover:bg-purple-900/20 hover:text-purple-400"
                        onClick={handleBackToDetail}
                    >
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                    <h1 className="text-xl font-medium text-gray-200">Vote Submitted Successfully</h1>
                </div>

                <Card className="border border-purple-900/50 bg-black/30 backdrop-blur-sm mb-6">
                    <CardContent className="pt-6">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-16 h-16 bg-purple-900/30 border border-purple-500/50 rounded-full flex items-center justify-center mb-4">
                                <Check className="w-8 h-8 text-purple-400" />
                            </div>
                            <h3 className="text-lg font-semibold mb-2 text-gray-200">Your vote has been successfully submitted</h3>
                            <p className="text-gray-400 mb-4">Thank you for participating in community governance</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border border-purple-900/50 bg-black/30 backdrop-blur-sm mb-8">
                    <CardContent className="pt-6">
                        <div className="flex items-center text-sm text-gray-400">
                            <Shield className="w-4 h-4 text-purple-400 mr-2" />
                            <span>Your vote has been encrypted and stored, and no one can see it before the vote ends</span>
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-center gap-20">
                    <Button
                        variant="outline"
                        onClick={handleBackToDetail}
                        className="w-full md:w-auto bg-black border-purple-500 hover:bg-purple-900/20 text-gray-200 hover:text-purple-400"
                    >
                        Back to vote details
                    </Button>
                    <Button
                        onClick={handleBackToList}
                        className="w-full md:w-auto bg-purple-500 hover:bg-purple-600 text-white"
                    >
                        View all votes
                    </Button>
                </div>
            </div>
        </div>
    );
} 