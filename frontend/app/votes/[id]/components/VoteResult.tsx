"use client";

import { Button } from "@/components/ui/button";
import { useState, useEffect, useCallback, useRef } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

import { queryVoteBox } from "@/contracts/query";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { SuiResponseVotePool, VoteOption } from "@/types";
import { decryptVoteResult, MoveCallConstructor } from "@/contracts/seal";
import { SessionKey } from "@mysten/seal";
import { PieChart } from "lucide-react";

// 添加处理投票者显示的函数
const getVoterDisplay = (voter: string) => {
    // 检查是否为匿名地址
    if (voter === "0x0000000000000000000000000000000000000000000000000000000000000123") {
        return "anonymous address";
    }
    // 其他地址显示缩略形式
    return `${voter.slice(0, 6)}...${voter.slice(-4)}`;
};

interface VoteResultProps {
    votePool: SuiResponseVotePool;
    options: VoteOption[];
    sessionKey: SessionKey;
    customMoveCall: MoveCallConstructor;
}

export default function VoteResult({ votePool, options, sessionKey, customMoveCall }: VoteResultProps) {
    const [decryptedVoteResults, setDecryptedVoteResults] = useState<{ voter: string; vote: string | null }[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDecrypted, setIsDecrypted] = useState(false);
    // 添加ref来跟踪解密状态，防止重复执行
    const isDecrypting = useRef(false);

    const currentAccount = useCurrentAccount();


    // 定义解密函数
    const downloadAndDecryptVoteData = useCallback(async () => {
        // 防止重复执行
        if (isDecrypting.current) {
            console.log("已有解密任务在执行中，跳过");
            return;
        }

        if (!votePool || !currentAccount || !sessionKey) {
            console.error('Vote pool object data is null, user not connected, or no session key');
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        isDecrypting.current = true;

        try {
            console.log("开始解密投票结果");
            const encryptedVoteBoxData = await queryVoteBox(votePool.votebox_id);
            const results = await decryptVoteResult(sessionKey, encryptedVoteBoxData, customMoveCall);

            console.log("result", results);

            console.log("results", results);

            if (!results) {
                throw new Error('解密结果为空');
            }

            setDecryptedVoteResults(results);
            setIsDecrypted(true);
            setIsLoading(false);
        } catch (error) {
            console.error('解密失败:', error);
            setDecryptedVoteResults([]);
            setIsDecrypted(false);
            setIsLoading(false);
        } finally {
            isDecrypting.current = false;
        }
    }, [currentAccount, sessionKey, votePool, customMoveCall]);

    // 当组件加载或依赖项变化时自动执行解密
    useEffect(() => {
        if (
            currentAccount &&
            sessionKey &&
            !isDecrypted &&
            !isDecrypting.current
        ) {
            console.log("触发解密流程");
            downloadAndDecryptVoteData();
        }
    }, [currentAccount, downloadAndDecryptVoteData, sessionKey, isDecrypted]);

    useEffect(() => {
        // 当账户切换时，重置所有相关状态
        setDecryptedVoteResults([]);
        setIsLoading(true);
        setIsDecrypted(false);
    }, [currentAccount]);

    if (!currentAccount) {
        return (
            <div className="container mx-auto p-4 text-center">
                <p className="mt-4 text-lg">请先连接钱包后继续操作</p>
            </div>
        );
    }

    // 计算每个选项的投票数
    const calculateVoteCounts = () => {
        const voteCounts = new Map<string, number>();

        // 初始化所有选项的计数为0
        options.forEach(option => {
            voteCounts.set(option.id, 0);
        });

        // 统计每个选项的投票数
        decryptedVoteResults.forEach(({ vote }) => {
            if (!vote) return; // 跳过解密失败的投票

            // 根据选项id查找匹配的选项
            const matchedOption = options.find(opt => opt.id === vote);

            if (matchedOption) {
                const currentCount = voteCounts.get(matchedOption.id) || 0;
                voteCounts.set(matchedOption.id, currentCount + 1);
            }
        });

        // 将投票数附加到选项上
        return options.map(option => ({
            ...option,
            voteCount: voteCounts.get(option.id) || 0
        }));
    };

    const optionsWithVotes = isDecrypted ? calculateVoteCounts() : [];
    const totalVotes = decryptedVoteResults.filter(result => result.vote !== null).length;

    return (
        <div className="border border-purple-900/50 bg-black/30 backdrop-blur-sm rounded-lg p-6">

            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-12 border border-dashed rounded-lg">
                    <div className="mb-4">
                        <div className="w-8 h-8 border-4 border-t-purple-500 border-b-purple-200 border-l-purple-200 border-r-purple-200 rounded-full animate-spin"></div>
                    </div>
                    <p className="text-gray-600">Loading vote results...</p>
                </div>
            ) : !isDecrypted ? (
                <div className="flex flex-col items-center justify-center py-8 border border-dashed rounded-lg">
                    <p className="text-gray-600 mb-4">Decryption failed, you do not have permission to view the vote results</p>
                    <Button
                        onClick={downloadAndDecryptVoteData}
                        disabled={isLoading || isDecrypting.current}
                    >
                        {isLoading ? 'Processing' : 'Try again'}
                    </Button>
                </div>
            ) : (
                <div className="mb-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-medium flex items-center">
                            <PieChart className="w-5 h-5 mr-2 text-purple-400" />Vote Results ({totalVotes} votes)</h2>
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button variant="outline"
                                    size="sm"
                                    className="bg-black/50 border-purple-900/50 hover:bg-purple-900/20 hover:border-purple-500 text-gray-300 hover:text-purple-400">
                                    View vote details
                                </Button>
                            </DialogTrigger>
                            <DialogContent className=" bg-black border border-purple-900/50 text-white max-w-2xl">
                                <DialogHeader>
                                    <DialogTitle>Vote Details List</DialogTitle>
                                </DialogHeader>
                                <ScrollArea className="h-[400px] w-full rounded-md border p-4">
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center py-2 border-b border-b-2 font-medium text-sm text-gray-500">
                                            <div className="w-[200px]">Voter Address</div>
                                            <div className="flex-1">Vote Choice</div>
                                        </div>
                                        {decryptedVoteResults
                                            .filter(result => result.vote !== null)
                                            .map((result, index) => {
                                                const votedOption = options.find(opt => opt.id === result.vote);
                                                return (
                                                    <div key={index} className="flex justify-between items-center py-2 border-b">
                                                        <div className="text-sm font-mono truncate w-[200px]" title={result.voter}>
                                                            {getVoterDisplay(result.voter)}
                                                        </div>
                                                        <div className="text-sm flex-1">
                                                            <span className="font-medium">{votedOption?.text || 'Unknown option'}</span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                    </div>
                                </ScrollArea>
                            </DialogContent>
                        </Dialog>
                    </div>
                    <div className="space-y-6">
                        {optionsWithVotes.map((option) => {
                            const percentage = totalVotes > 0 ? Math.round((option.voteCount! / totalVotes) * 100) : 0;

                            return (
                                <div key={option.id} className="space-y-2">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="font-medium text-gray-300">{option.text}</span>
                                        <span className="text-sm text-gray-500">{option.voteCount} votes ({percentage}%)</span>
                                    </div>
                                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-purple-500 rounded-full"
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}