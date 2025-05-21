'use client'
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import { encryptUserVote } from "@/contracts/seal";
import { castVoteTx as defaultCastVoteTx, dry_run_has_voted } from "@/contracts/transaction";
import { suiClient } from "@/contracts";
import { EncryptedInputVotePool } from "@/types";
import { Transaction } from "@mysten/sui/transactions";
import { useRouter } from "next/navigation";
import { Send, Loader2 } from "lucide-react";
import { useCurrentAccount } from "@mysten/dapp-kit";

// 创建简易toast通知组件
const showToast = (type: 'error' | 'success', message: string) => {
    alert(`${type === 'error' ? '错误' : '成功'}: ${message}`);
    console[type === 'error' ? 'error' : 'log'](message);
};

interface VoteCastProps {
    voteId: string;
    voteBoxId: string;
    decryptedVotePoolData: EncryptedInputVotePool;
    customCastVoteTx?: (votePoolId: string, votebox: string, vote: Uint8Array, isAnonymous: boolean) => Promise<Transaction>;
}

export default function VoteCast({
    voteId,
    voteBoxId,
    decryptedVotePoolData,
    customCastVoteTx
}: VoteCastProps) {
    const currentAccount = useCurrentAccount();
    const [selectedOption, setSelectedOption] = useState<string>("");
    const [isAnonymous, setIsAnonymous] = useState<boolean>(false);
    const [isProcessing, setIsProcessing] = useState<boolean>(false);
    const router = useRouter();
    const { mutate: signAndExecute } = useSignAndExecuteTransaction({
        execute: async ({ bytes, signature }) =>
            await suiClient.executeTransactionBlock({
                transactionBlock: bytes,
                signature,
                options: {
                    showRawEffects: true,
                    showEffects: true,
                },
            }),
    });

    const handleSubmitVote = async () => {
        if (!selectedOption) {
            showToast('error', '请选择一个选项');
            return;
        }

        try {
            setIsProcessing(true);
            const encryptedVote = await encryptUserVote(selectedOption, voteBoxId);

            if (voteBoxId) {
                // 使用自定义的castVoteTx函数或默认的castVoteTx函数
                const castVoteTxFunc = customCastVoteTx || defaultCastVoteTx;
                const tx = await castVoteTxFunc(voteId, voteBoxId, encryptedVote, isAnonymous);

                if (currentAccount?.address) {
                    await dry_run_has_voted(tx, currentAccount?.address);
                }

                signAndExecute({
                    transaction: tx.serialize(),
                }, {
                    onSuccess: (result) => {
                        setIsProcessing(false);
                        console.log('Transaction Success:', result);
                        showToast('success', 'Vote Success!');
                        router.push(`/votes/${voteId}/submit`);
                    },
                    onError: (error) => {
                        setIsProcessing(false);
                        console.error('Transaction Failed:', error);
                        showToast('error', 'Transaction Failed: ' + error.message);
                    },
                });
            } else {
                setIsProcessing(false);
                showToast('error', 'Vote Box ID does not exist');
            }
        } catch (error) {
            setIsProcessing(false);
            console.error('Submit Vote Failed:', error);
            if (error instanceof Error && error.message === 'You have already voted for this vote') {
                showToast('error', 'You have already voted for this vote');
            } else {
                showToast('error', 'Submit Vote Failed');
            }
        }
    };

    return (
        <>
            <div className="mb-8">
                <h3 className="text-lg font-medium mb-4 text-gray-200">Select your preferred option:</h3>

                <RadioGroup value={selectedOption} onValueChange={setSelectedOption}>
                    <div className="space-y-3">
                        {(decryptedVotePoolData?.options || []).map((option) => {
                            const optionId = option.id;
                            return (
                                <div
                                    key={optionId}
                                    className="flex items-start space-x-2 border border-purple-900/50 bg-black/30 backdrop-blur-sm rounded-lg p-4 hover:bg-purple-900/20 transition-colors cursor-pointer"
                                    onClick={() => setSelectedOption(optionId)}
                                >
                                    <RadioGroupItem
                                        value={optionId}
                                        id={optionId}
                                        className="mt-1 text-purple-400"
                                    />
                                    <Label
                                        htmlFor={optionId}
                                        className="flex-1 cursor-pointer text-gray-300"
                                    >
                                        {option.text}
                                    </Label>
                                </div>
                            );
                        })}
                    </div>
                </RadioGroup>
            </div>

            <div className="flex items-center space-x-2 mb-4">
                <Checkbox
                    id="anonymous"
                    checked={isAnonymous}
                    onCheckedChange={(checked: boolean) => setIsAnonymous(checked)}
                    className="border-purple-900/50 data-[state=checked]:bg-purple-500 data-[state=checked]:border-purple-500"
                />
                <Label htmlFor="anonymous" className="text-gray-300">Anonymous Vote</Label>
            </div>

            <div className="flex justify-center">
                <Button
                    onClick={handleSubmitVote}
                    disabled={!selectedOption || isProcessing}
                    className="w-full md:w-auto bg-purple-500 hover:bg-purple-600 disabled:bg-purple-900/50"
                >
                    {isProcessing ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...
                        </>
                    ) : (
                        <>
                            <Send className="w-4 h-4 mr-2" /> Submit Vote
                        </>
                    )}
                </Button>
            </div>
        </>
    );
} 