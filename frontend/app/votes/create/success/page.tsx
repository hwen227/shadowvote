"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { VoteCreateSuccessType } from "@/types";
import { CheckCircle2, Copy, ExternalLink, FileDigit, Home, Link2 } from "lucide-react";

// Sui相关URL配置
const SUI_VIEW_TX_URL = `https://suiscan.xyz/testnet/tx`;      // Sui交易查看URL
const SUI_VIEW_OBJECT_URL = `https://suiscan.xyz/testnet/object`; // Sui对象查看URL

export default function VoteCreateSuccessPage() {
    const [copied, setCopied] = useState(false);
    const [voteData, setVoteData] = useState<VoteCreateSuccessType | null>(null);
    const searchParams = useSearchParams();

    useEffect(() => {
        // 从URL查询参数中获取投票创建成功的数据
        const voteId = searchParams.get("voteId");
        const digest = searchParams.get("digest");

        if (voteId && digest) {
            setVoteData({
                voteId,
                digest
            });
        }
    }, [searchParams]);


    // 添加默认值避免null错误
    const displayData = voteData || {
        voteId: "0x123456789abcdef",
        digest: "0x123456789abcdef"
    };


    const voteUrl = `${SUI_VIEW_OBJECT_URL}/${displayData.voteId}`;
    const digestUrl = `${SUI_VIEW_TX_URL}/${displayData.digest}`;

    const handleCopyLink = () => {
        navigator.clipboard.writeText(voteUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };



    return (
        <div className="min-h-screen bg-black text-white">
            {/* Animated background with tech pattern */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-purple-900/20 via-black to-black z-0 overflow-hidden">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxwYXR0ZXJuIGlkPSJncmlkIiB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiPjxwYXRoIGQ9Ik0gNDAgMCBMIDAgMCAwIDQwIiBmaWxsPSJub25lIiBzdHJva2U9IiM4YjVjZjYiIHN0cm9rZS13aWR0aD0iMC41Ii8+PC9wYXR0ZXJuPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiIG9wYWNpdHk9IjAuMSIvPjwvc3ZnPg==')]"></div>
            </div>
            <div className="container mx-auto max-w-2xl px-4 py-16 relative z-10">
                <div className="flex flex-col items-center text-center mb-10">
                    <div className="w-20 h-20 bg-green-900/20 rounded-full flex items-center justify-center mb-6">
                        <CheckCircle2 className="w-10 h-10 text-green-400" />
                    </div>

                    <h1 className="text-3xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-purple-600">
                        Vote Creation Successful!
                    </h1>

                    <p className="text-gray-400 max-w-md">Your encrypted vote pool has been successfully created on the blockchain</p>
                </div>

                <div className="border border-purple-900/50 bg-black/30 backdrop-blur-sm rounded-lg p-6 mb-6">

                    <h2 className="text-lg font-medium mb-4 flex items-center">
                        <Link2 className="w-5 h-5 mr-2 text-purple-400" />
                        Vote Link
                    </h2>
                    <div className="flex mb-3">
                        <Input
                            value={`${window.location.origin}/votes/${displayData.voteId}`}
                            readOnly
                            className="bg-black/50 border-purple-900/50 text-gray-300 font-mono text-sm pr-10"
                        />
                        <Button
                            onClick={handleCopyLink}
                            variant="ghost"
                            size="icon"
                            className="ml-[-40px] relative z-10 text-gray-400 hover:text-purple-400"
                        >
                            {copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                    </div>
                    <p className="text-sm text-gray-400">Share this link with people you want to invite to vote</p>
                </div>
                <div className="border border-purple-900/50 bg-black/30 backdrop-blur-sm rounded-lg p-6 mb-8">
                    <h2 className="text-lg font-medium mb-4 flex items-center">
                        <FileDigit className="w-5 h-5 mr-2 text-purple-400" />
                        Blockchain Information
                    </h2>
                    <div className="space-y-3 text-sm">
                        <div className="flex flex-col sm:flex-row sm:items-center">
                            <span className="text-gray-400 mr-2 mb-1 sm:mb-0">Object ID:</span>
                            <a
                                href={voteUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-purple-400 hover:text-purple-300 font-mono flex items-center"
                            >
                                {displayData.voteId.slice(0, 10)}...{displayData.voteId.slice(-10)}
                                <ExternalLink className="w-3 h-3 ml-1" />
                            </a>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center">
                            <span className="text-gray-400 mr-2 mb-1 sm:mb-0">Digest:</span>
                            <a
                                href={digestUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-purple-400 hover:text-purple-300 font-mono flex items-center"
                            >
                                {displayData.digest}
                                <ExternalLink className="w-3 h-3 ml-1" />
                            </a>
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Link href="/votes" className="block">
                        <Button
                            variant="outline"
                            className="w-full bg-black/50 border-purple-900/50 hover:bg-purple-900/20 hover:border-purple-500 text-gray-300 hover:text-purple-400 transition-colors"
                        >
                            <Home className="w-4 h-4 mr-2" />
                            Return to Home
                        </Button>
                    </Link>

                    <Link href={`/votes/${displayData.voteId}`} className="block">
                        <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white">
                            <ExternalLink className="w-4 h-4 mr-2" />
                            View Vote
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
} 