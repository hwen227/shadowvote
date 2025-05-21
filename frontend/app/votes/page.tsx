"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { VoteCard } from "@/components/vote/vote-card";
import { VoteStatus, VotePoolDisplayType, SuiResponseVotePool } from "@/types";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { getMultiVotePools, getVotePoolState } from "@/contracts/query";
import { PieChart, Plus } from "lucide-react";


export default function VotesPage() {
    const [activeTab, setActiveTab] = useState<"all" | "active" | "upcoming" | "ended" | "my">("all");
    const [votepools, setVotepools] = useState<VotePoolDisplayType[]>([]);
    const [loading, setLoading] = useState(true);
    const currentAccount = useCurrentAccount();


    const fetchVotePools = async () => {
        setLoading(true);
        setVotepools([]);
        try {
            const state = await getVotePoolState();
            const voteIds = state.map((item) => item.vote_pool);
            const votePools = await getMultiVotePools(voteIds);
            const displayVotepools = votePools.map(convertVotePoolToDisplayType);
            setVotepools(displayVotepools);
        } catch (error) {
            console.error("Failed to get vote pools:", error);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        // 使用立即执行的异步函数来调用fetchVotePools
        (async () => {
            await fetchVotePools();
        })();
    }, [currentAccount]);

    // 根据选项卡筛选投票
    const getFilteredVotes = () => {
        switch (activeTab) {
            case "active":
                return votepools.filter(vote => vote.status === VoteStatus.ACTIVE);
            case "upcoming":
                return votepools.filter(vote => vote.status === VoteStatus.UPCOMING);
            case "ended":
                return votepools.filter(vote => vote.status === VoteStatus.ENDED);
            case "my":
                return votepools.filter(vote => vote.creator === currentAccount?.address);
            default:
                return votepools;
        }
    };

    const convertVotePoolToDisplayType = (votePool: SuiResponseVotePool): VotePoolDisplayType => {

        const currentTime = Date.now();
        let status = VoteStatus.ENDED;

        if (currentTime >= votePool.end) {
            status = VoteStatus.ENDED;
        } else if (currentTime >= votePool.start) {
            status = VoteStatus.ACTIVE;
        } else {
            status = VoteStatus.UPCOMING;
        }

        return {
            id: votePool.id.id,
            title: votePool.title,
            creator: votePool.creator,
            start: votePool.start,
            end: votePool.end,
            participantsCount: votePool.participantsCount,
            status,
            iconType: "chart-pie"
        } as VotePoolDisplayType;
    }

    return (
        <div className="min-h-screen bg-black text-white">

            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-purple-900/20 via-black to-black z-0 overflow-hidden">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxwYXR0ZXJuIGlkPSJncmlkIiB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiPjxwYXRoIGQ9Ik0gNDAgMCBMIDAgMCAwIDQwIiBmaWxsPSJub25lIiBzdHJva2U9IiM4YjVjZjYiIHN0cm9rZS13aWR0aD0iMC41Ii8+PC9wYXR0ZXJuPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiIG9wYWNpdHk9IjAuMSIvPjwvc3ZnPg==')]"></div>
            </div>
            <div className="container mx-auto px-4 py-8 relative z-10">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold mb-6 flex items-center">
                        <PieChart className="w-5 h-5 mr-2 text-purple-400" />
                        Explore Voting Pools
                    </h1>
                    <Tabs defaultValue="all" className="w-full" onValueChange={(value) => setActiveTab(value as never)}>
                        <TabsList className="bg-black border border-purple-900/50 rounded-lg p-1 w-full md:w-auto inline-flex">
                            <TabsTrigger value="all" className="data-[state=active]:bg-purple-900/30 data-[state=active]:text-purple-300 flex-1">All</TabsTrigger>
                            <TabsTrigger value="active" className="data-[state=active]:bg-purple-900/30 data-[state=active]:text-purple-300 flex-1">Active</TabsTrigger>
                            <TabsTrigger value="upcoming" className="data-[state=active]:bg-purple-900/30 data-[state=active]:text-purple-300 flex-1">Upcoming</TabsTrigger>
                            <TabsTrigger value="ended" className="data-[state=active]:bg-purple-900/30 data-[state=active]:text-purple-300 flex-1">Ended</TabsTrigger>
                            <TabsTrigger value="my" className="data-[state=active]:bg-purple-900/30 data-[state=active]:text-purple-300 flex-1">My</TabsTrigger>
                        </TabsList>

                        <TabsContent value="all" className="mt-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {loading ? (
                                    // 加载动画，可以根据项目风格调整
                                    <div className="col-span-3 flex justify-center items-center py-12">
                                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                                    </div>
                                ) : (
                                    <>
                                        <Link href="/votes/create" passHref>
                                            <div className="border border-purple-900/50 bg-black/30 backdrop-blur-sm rounded-lg p-6 h-full flex flex-col items-center justify-center text-center hover:border-purple-500 transition-colors">
                                                <div className="bg-purple-900/30 p-4 rounded-full mb-4">
                                                    <Plus className="w-8 h-8 text-purple-400" />
                                                </div>
                                                <h3 className="text-lg font-medium mb-2">Create New Vote</h3>
                                                <p className="text-gray-400 text-sm">Start a new anonymous vote</p>
                                            </div>
                                        </Link>
                                        {getFilteredVotes().map(votepool => (
                                            <VoteCard key={votepool.id} vote={votepool} />
                                        ))}
                                    </>
                                )}
                            </div>
                        </TabsContent>

                        <TabsContent value="active" className="mt-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {loading ? (
                                    <div className="col-span-3 flex justify-center items-center py-12">
                                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                                    </div>
                                ) : (
                                    getFilteredVotes().map(votepool => (
                                        <VoteCard key={votepool.id} vote={votepool} />
                                    ))
                                )}
                            </div>
                        </TabsContent>

                        <TabsContent value="upcoming" className="mt-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {loading ? (
                                    <div className="col-span-3 flex justify-center items-center py-12">
                                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                                    </div>
                                ) : (
                                    getFilteredVotes().map(votepool => (
                                        <VoteCard key={votepool.id} vote={votepool} />
                                    ))
                                )}
                            </div>
                        </TabsContent>

                        <TabsContent value="ended" className="mt-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {loading ? (
                                    <div className="col-span-3 flex justify-center items-center py-12">
                                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                                    </div>
                                ) : (
                                    getFilteredVotes().map(votepool => (
                                        <VoteCard key={votepool.id} vote={votepool} />
                                    ))
                                )}
                            </div>
                        </TabsContent>

                        <TabsContent value="my" className="mt-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {loading ? (
                                    <div className="col-span-3 flex justify-center items-center py-12">
                                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                                    </div>
                                ) : (
                                    getFilteredVotes().map(votepool => (
                                        <VoteCard key={votepool.id} vote={votepool} />
                                    ))
                                )}
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>
    );
} 