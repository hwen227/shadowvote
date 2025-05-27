"use client";

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Check, RotateCcw } from 'lucide-react';

interface NftManagerProps {
    nftObjectId: string;
    verifiedNftType: string | null;
    isVerified: boolean;
    isLoading: boolean;
    error: string | null;
    onNftIdChange: (id: string) => void;
    onVerify: () => Promise<void>;
    onReset: () => void;
}

export function NftManager({
    nftObjectId,
    verifiedNftType,
    isVerified,
    isLoading,
    error,
    onNftIdChange,
    onVerify,
    onReset
}: NftManagerProps) {
    return (
        <div className="border border-purple-900/50 bg-black/30 backdrop-blur-sm rounded-lg p-6 space-y-4">
            <h2 className="text-xl font-semibold text-white mb-2">NFT verification</h2>

            <div className="space-y-2">
                <label className="text-sm text-gray-300">NFT Object ID</label>
                <Input
                    value={nftObjectId}
                    onChange={(e) => onNftIdChange(e.target.value)}
                    placeholder="Please enter the NFT Object ID"
                    className="bg-gray-900/70 border-gray-700 text-white"
                    disabled={isVerified}
                />
                {error && <p className="text-sm text-red-500">{error}</p>}
            </div>

            {verifiedNftType && (
                <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4 mt-4">
                    <div className="flex items-center space-x-2">
                        <Check className="w-4 h-4 text-green-400" />
                        <span className="text-sm text-gray-300">Verified NFT Type:</span>
                    </div>
                    <p className="text-sm text-purple-400 mt-2 font-mono break-all">{verifiedNftType}</p>
                </div>
            )}

            <div className="flex space-x-2">
                <Button
                    onClick={onVerify}
                    disabled={isLoading || isVerified}
                    className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
                >
                    {isLoading ? 'Verifying...' : 'Verify NFT'}
                </Button>

                {isVerified && (
                    <Button
                        onClick={onReset}
                        className="bg-gray-600 hover:bg-gray-700"
                        variant="secondary"
                    >
                        <RotateCcw className="w-4 h-4" />
                    </Button>
                )}
            </div>

            <p className="text-xs text-gray-400 mt-2">
                Enter the Object ID of the NFT you own for verification, and continue the voting operation after successful verification.
            </p>
        </div>
    );
}
