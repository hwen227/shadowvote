"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SuiInputVotePool, VoteOption, EncryptedInputVotePool, WalrusAttchFileBlob } from "@/types";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { useCurrentAccount, useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import * as sealUtils from "@/contracts/seal";
import { suiClient } from "@/contracts";
import { createVotePoolTx, createVotePoolTx_woal } from "@/contracts/transaction";
import { AllowlistManager } from "@/components/vote/allowlist-manager";
import { findObjectTypeName } from "@/contracts/query";
import { Transaction } from "@mysten/sui/transactions";
import { FileUpload } from "@/components/vote/file-upload";
import { useUploadBlob } from "@/hooks/useUploadBlob";
import Link from "next/link";
import { Calendar } from "@/components/ui/calendar";
import { AlertCircle, ArrowLeft, ArrowRight, CalendarIcon, Check, Clock, FileLock2, HardDrive, Plus, Sparkles, Trash2, Users } from "lucide-react";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

import { format } from "date-fns";
// 表单步骤类型
type FormStep = "basic" | "options" | "timing" | "permissions" | "confirmation";

// 生成随机ID前缀 (3个字符)
const generateRandomIdPrefix = (): string => {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    const randomValues = new Uint8Array(3);
    crypto.getRandomValues(randomValues);

    for (let i = 0; i < 3; i++) {
        result += chars[randomValues[i] % chars.length];
    }

    return result;
};

// 投票选项类型
interface FormVoteOption {
    id: string;
    text: string;
}

// 投票表单数据类型
interface VoteFormData {
    title: string;
    description: string;
    options: FormVoteOption[];
    startTime: {
        date: Date | undefined;
        hour: string;
        minute: string;
        period: 'AM' | 'PM';
    };
    endTime: {
        date: Date | undefined;
        hour: string;
        minute: string;
        period: 'AM' | 'PM';
    };
    permissionType: "all" | "specific";
    selectedAllowlistId: string;
    selectedAllowlistInfo: {
        name: string;
        addressCount: number;
    } | null;
    attachments: File[];
}

export function VoteForm() {
    const router = useRouter();
    const { storeBlob } = useUploadBlob();
    const [currentStep, setCurrentStep] = useState<FormStep>("basic");
    const [idPrefix, setIdPrefix] = useState<string>(generateRandomIdPrefix());

    const [formData, setFormData] = useState<VoteFormData>({
        title: "",
        description: "",
        options: [
            { id: `${idPrefix}_0`, text: "" },
            { id: `${idPrefix}_1`, text: "" }
        ],
        startTime: {
            date: undefined,
            hour: "09",
            minute: "00",
            period: "AM"
        },
        endTime: {
            date: undefined,
            hour: "05",
            minute: "00",
            period: "PM"
        },
        permissionType: "all",
        selectedAllowlistId: "",
        selectedAllowlistInfo: null,
        attachments: []
    });
    const [isProcessing, setIsProcessing] = useState(false);
    const [processingStatus, setProcessingStatus] = useState("");
    const [validationError, setValidationError] = useState<string>("");

    const currentAccount = useCurrentAccount();

    // 当钱包地址改变时重置表单
    useEffect(() => {
        // 生成新的ID前缀
        const newIdPrefix = generateRandomIdPrefix();
        setIdPrefix(newIdPrefix);

        // 重置表单数据到初始状态
        setFormData({
            title: "",
            description: "",
            options: [
                { id: `${newIdPrefix}_0`, text: "" },
                { id: `${newIdPrefix}_1`, text: "" }
            ],
            startTime: {
                date: undefined,
                hour: "09",
                minute: "00",
                period: "AM"
            },
            endTime: {
                date: undefined,
                hour: "05",
                minute: "00",
                period: "PM"
            },
            permissionType: "all",
            selectedAllowlistId: "",
            selectedAllowlistInfo: null,
            attachments: []
        });
        // 重置到第一步
        setCurrentStep("basic");
    }, [currentAccount]);

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
    const getCurrentStepIndex = () => {
        const steps: FormStep[] = ["basic", "options", "timing", "permissions", "confirmation"];
        return steps.indexOf(currentStep);
    };

    const goToPrevStep = () => {
        const stepIndex = getCurrentStepIndex();
        if (stepIndex > 0) {
            const steps: FormStep[] = ["basic", "options", "timing", "permissions", "confirmation"];
            setCurrentStep(steps[stepIndex - 1]);
        }
    };

    const goToNextStep = () => {
        const stepIndex = getCurrentStepIndex();
        const steps: FormStep[] = ["basic", "options", "timing", "permissions", "confirmation"];
        if (stepIndex < steps.length - 1) {
            setCurrentStep(steps[stepIndex + 1]);
        }
    };

    // 添加新选项
    const addOption = () => {
        // 获取当前最大的索引值
        const maxIndex = formData.options.reduce((max, option) => {
            const parts = option.id.split('_');
            const index = parseInt(parts[1]);
            return Math.max(max, index);
        }, -1);

        setFormData({
            ...formData,
            options: [...formData.options, { id: `${idPrefix}_${maxIndex + 1}`, text: "" }]
        });
    };

    // 删除选项
    const removeOption = (id: string) => {
        if (formData.options.length <= 2) {
            return; // 保持至少两个选项
        }
        setFormData({
            ...formData,
            options: formData.options.filter(option => option.id !== id)
        });
    };

    // 更新选项文本
    const updateOptionText = (id: string, text: string) => {
        setFormData({
            ...formData,
            options: formData.options.map(option =>
                option.id === id ? { ...option, text } : option
            )
        });
    };

    // 更新选择的白名单ID
    const updateSelectedAllowlistId = (id: string) => {
        setFormData({
            ...formData,
            selectedAllowlistId: id
        });
    };

    // 更新选择的白名单信息
    const updateSelectedAllowlistInfo = (info: { name: string, addressCount: number }) => {
        setFormData({
            ...formData,
            selectedAllowlistInfo: info
        });
    };

    const uploadFilesToWalrus = async () => {
        if (formData.attachments.length === 0) {
            throw new Error("No attachments");
        }
        const walrusFiles: WalrusAttchFileBlob[] = [];
        try {
            for (const file of formData.attachments) {
                const response = await storeBlob(file);
                walrusFiles.push({
                    blob_id: response.blobId,
                    name: file.name
                });
            }
            return walrusFiles;
        } catch (error) {
            console.error('文件上传失败:', error);
            throw error;
            return [];
        }

    }
    const transformFormData = (): { suiVotePool: SuiInputVotePool, encryptInput: EncryptedInputVotePool } => {
        const startTimeStr = getISODateTime(formData.startTime);
        const endTimeStr = getISODateTime(formData.endTime);

        const start = startTimeStr ? Math.floor(new Date(startTimeStr).getTime()) : 0;
        const end = endTimeStr ? Math.floor(new Date(endTimeStr).getTime()) : 0;

        const options: VoteOption[] = formData.options.map((option) => ({
            id: option.id,
            text: option.text
        }));

        const encryptInput: EncryptedInputVotePool = {
            title: formData.title,
            description: formData.description,
            options: options,
        }

        const suiVotePool: SuiInputVotePool = {
            title: formData.title,
            allowlist_Id: formData.permissionType === "specific" ? formData.selectedAllowlistId : "",
            start,
            end,
            details: ""
        }

        return { suiVotePool, encryptInput };
    }

    const encryptVotePool = async (EncryptInput: EncryptedInputVotePool) => {

        if (formData.permissionType !== "specific" && !formData.selectedAllowlistId) {
            throw new Error("White list ID cannot be empty");
        }

        try {
            setProcessingStatus("Encrypting vote pool...");

            const allowlistId = formData.permissionType === "specific" ? formData.selectedAllowlistId : "";
            const encryptedBytes = await sealUtils.encryptVotePool(EncryptInput, allowlistId);

            return encryptedBytes;
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    // 验证表单数据
    const validateForm = (): { isValid: boolean; error: string } => {
        // 重置验证错误
        setValidationError("");

        // 检查标题
        if (!formData.title.trim()) {
            return { isValid: false, error: "Vote Title cannot be empty" };
        }

        // 检查描述
        if (!formData.description.trim()) {
            return { isValid: false, error: "Vote Description cannot be empty" };
        }

        // 检查选项
        const validOptions = formData.options.filter(opt => opt.text.trim().length > 0);
        if (validOptions.length < 2) {
            return { isValid: false, error: "At least 2 valid vote options are required" };
        }

        // 检查时间
        if (!formData.startTime.date || !formData.endTime.date) {
            return { isValid: false, error: "Please set start and end time" };
        }

        const startDateTime = new Date(getISODateTime(formData.startTime));
        const endDateTime = new Date(getISODateTime(formData.endTime));


        if (endDateTime <= startDateTime) {
            return { isValid: false, error: "End time must be later than start time" };
        }

        // 检查权限设置
        if (formData.permissionType === "specific" && !formData.selectedAllowlistId) {
            return { isValid: false, error: "Please select a white list" };
        }

        return { isValid: true, error: "" };
    };

    const handleCreateVotePool = async () => {
        // 首先进行表单验证
        const { isValid, error } = validateForm();
        if (!isValid) {
            setValidationError(error);
            return;
        }

        try {
            setIsProcessing(true);
            setValidationError("");
            let tx = new Transaction();
            let attchFiles: WalrusAttchFileBlob[] = [];

            if (formData.attachments.length > 0) {
                setProcessingStatus("Uploading attachments to Walrus");
                attchFiles = await uploadFilesToWalrus();
                console.log('attchFiles', attchFiles);
            }

            if (formData.permissionType === "specific" && formData.selectedAllowlistId) {
                const { suiVotePool, encryptInput } = transformFormData();
                if (attchFiles.length > 0) {
                    encryptInput.attch_file_blobs = attchFiles;
                }
                const encryptedBytes = await encryptVotePool(encryptInput);
                suiVotePool.details = encryptedBytes;
                tx = createVotePoolTx(suiVotePool);
            } else {
                const { suiVotePool, encryptInput } = transformFormData();
                if (attchFiles.length > 0) {
                    encryptInput.attch_file_blobs = attchFiles;
                }
                const Input = JSON.stringify(encryptInput);
                suiVotePool.details = Input;
                tx = createVotePoolTx_woal(suiVotePool);
            }

            setProcessingStatus("Submitting to Sui blockchain...");

            signAndExecute({
                transaction: tx.serialize(),
            }, {
                onSuccess: async (result) => {
                    const createdObjects = [];
                    let voteId = "";
                    const digest = result.digest;

                    console.log('交易成功:', result);

                    if (result.effects && result.effects.created) {
                        for (const item of result.effects.created) {
                            if (item.owner && typeof item.owner === 'object' && 'Shared' in item.owner) {
                                createdObjects.push(item.reference.objectId);

                                // 检查对象类型并分配ID
                                const objectType = await findObjectTypeName(item.reference.objectId);
                                if (objectType) {
                                    if (objectType.includes('::shadowvote::VotePool') || objectType.includes('::votepool_wo_al::VotePool_WOAl'))
                                        voteId = item.reference.objectId;
                                }
                            }
                        }
                    }

                    setIsProcessing(false);
                    setProcessingStatus("");

                    console.log('创建的对象ID:', createdObjects);

                    // 跳转到成功页面并传递数据
                    if (voteId) {
                        const queryParams = new URLSearchParams({
                            voteId,
                            digest
                        }).toString();

                        router.push(`/votes/create/success?${queryParams}`);
                    }
                },
                onError: (error) => {
                    console.error('交易失败:', error);
                    alert('交易失败: ' + error.message);
                    setIsProcessing(false);
                    setProcessingStatus("");
                },
            });
        } catch (error) {
            console.error('创建投票失败:', error);
            alert('创建投票失败: ' + (error as Error).message);
            setIsProcessing(false);
            setProcessingStatus("");
        }
    }

    // 更新时间的辅助函数
    const updateDateTime = (timeType: 'startTime' | 'endTime', field: 'date' | 'hour' | 'minute' | 'period', value: any) => {
        setFormData(prev => ({
            ...prev,
            [timeType]: {
                ...prev[timeType],
                [field]: value
            }
        }));
    };

    // 获取完整的 ISO 时间字符串
    const getISODateTime = (timeData: typeof formData.startTime): string => {
        if (!timeData.date) return '';

        const date = new Date(timeData.date);
        let hours = parseInt(timeData.hour);

        // 处理12小时制到24小时制的转换
        if (timeData.period === 'PM' && hours < 12) hours += 12;
        if (timeData.period === 'AM' && hours === 12) hours = 0;

        date.setHours(hours, parseInt(timeData.minute), 0, 0);
        return date.toISOString();
    };




    return (
        <div className="max-w-2xl mx-auto">
            <div className="flex items-center mb-8">
                <Link href="/" className="flex items-center text-gray-400 hover:text-purple-400 transition-colors">
                    <ArrowLeft className="w-5 h-5 mr-2" />
                    <span>Back</span>
                </Link>
                <h1 className="text-2xl font-bold ml-4 flex items-center">
                    <Sparkles className="w-5 h-5 mr-2 text-purple-400" />
                    Create New Vote
                </h1>
            </div>

            <Tabs value={currentStep} onValueChange={(value) => setCurrentStep(value as FormStep)} className="mb-8">
                <TabsList className="grid grid-cols-5 bg-black border border-purple-900/50 rounded-lg p-1">
                    <TabsTrigger
                        value="basic"
                        className="data-[state=active]:bg-purple-900/30 data-[state=active]:text-purple-300"
                    >
                        Basic Info
                    </TabsTrigger>
                    <TabsTrigger
                        value="options"
                        className="data-[state=active]:bg-purple-900/30 data-[state=active]:text-purple-300"
                    >
                        Options
                    </TabsTrigger>
                    <TabsTrigger
                        value="timing"
                        className="data-[state=active]:bg-purple-900/30 data-[state=active]:text-purple-300"
                    >
                        Timing
                    </TabsTrigger>
                    <TabsTrigger
                        value="permissions"
                        className="data-[state=active]:bg-purple-900/30 data-[state=active]:text-purple-300"
                    >
                        Permissions
                    </TabsTrigger>
                    <TabsTrigger
                        value="confirmation"
                        className="data-[state=active]:bg-purple-900/30 data-[state=active]:text-purple-300"
                    >
                        Confirm
                    </TabsTrigger>
                </TabsList>

                {/* Basic Info Tab */}
                <TabsContent value="basic" className="mt-6">
                    <div className="space-y-8">
                        {/* Vote Title */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300 flex items-center">
                                <HardDrive className="w-4 h-4 mr-2 text-purple-400" />
                                Vote Title
                            </label>
                            <Input
                                placeholder="Enter vote title"
                                className="bg-black/50 border-purple-900/50 focus:border-purple-500 text-white placeholder:text-gray-500"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            />
                        </div>

                        {/* Vote Description */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300 flex items-center">
                                <HardDrive className="w-4 h-4 mr-2 text-purple-400" />
                                Vote Description
                            </label>
                            <Textarea
                                placeholder="Detailed explanation of the vote's purpose and background"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="bg-black/50 border-purple-900/50 focus:border-purple-500 text-white placeholder:text-gray-500 min-h-[150px]"
                            />
                        </div>

                        {/* File Upload */}
                        <FileUpload
                            onFileSelect={(files) => setFormData({ ...formData, attachments: files })}
                        />

                        {/* Action Buttons */}
                        <div className="flex justify-end pt-4">
                            <Button className="bg-purple-600 hover:bg-purple-700 text-white" onClick={() => goToNextStep()}>
                                Next Step
                                <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        </div>
                    </div>
                </TabsContent>

                {/* Options Tab */}
                <TabsContent value="options" className="mt-6">
                    {/* Tab content remains the same */}
                    <div className="space-y-8">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300 flex items-center">
                                <HardDrive className="w-4 h-4 mr-2 text-purple-400" />
                                Vote Options
                            </label>

                            <div className="space-y-3">
                                {formData.options.map((option, index) => (
                                    <div key={index} className="flex items-center gap-2">
                                        <Input
                                            value={option.text}
                                            onChange={(e) =>
                                                updateOptionText(option.id, e.target.value)
                                            }
                                            placeholder={`Option ${index + 1}`}
                                            className="bg-black/50 border-purple-900/50 focus:border-purple-500 text-white placeholder:text-gray-500"
                                        />
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => removeOption(option.id)}
                                            className="text-gray-500 hover:text-red-500"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>

                            <Button
                                variant="outline"
                                onClick={addOption}
                                className="w-full mt-2 bg-black/50 border-purple-900/50 hover:bg-purple-900/20 hover:border-purple-500 text-gray-300 hover:text-purple-400 transition-colors"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Add Option
                            </Button>

                            <p className="text-xs text-gray-500 mt-2">At least 2 options are required</p>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex justify-between pt-4">
                            <Button
                                variant="outline"
                                className="bg-black/50 border-purple-900/50 hover:bg-purple-900/20 hover:border-purple-500 text-gray-300 hover:text-purple-400 transition-colors"
                                onClick={() => goToPrevStep()}
                            >
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Previous
                            </Button>

                            <Button className="bg-purple-600 hover:bg-purple-700 text-white" onClick={() => goToNextStep()}>
                                Next Step
                                <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        </div>
                    </div>
                </TabsContent>

                {/* Timing Tab */}
                <TabsContent value="timing" className="mt-6">
                    {/* Tab content remains the same */}
                    <div className="space-y-8">
                        {/* Start Time */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300 flex items-center">
                                <CalendarIcon className="w-4 h-4 mr-2 text-purple-400" />
                                Start Time
                            </label>

                            <div className="flex gap-2">
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className="w-full justify-start text-left font-normal bg-black/50 border-purple-900/50 hover:bg-purple-900/20 hover:border-purple-500 text-gray-300 hover:text-purple-400 transition-colors"
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {formData.startTime.date ? format(formData.startTime.date, "PPP") : <span>Select date</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0 bg-black/90 border-purple-900/50">
                                        <Calendar
                                            mode="single"
                                            selected={formData.startTime.date}
                                            onSelect={(date) => updateDateTime('startTime', 'date', date)}
                                            initialFocus
                                            className="bg-black text-white"
                                        />
                                    </PopoverContent>
                                </Popover>

                                <div className="flex gap-2">
                                    <Select
                                        value={formData.startTime.hour}
                                        onValueChange={(value) => updateDateTime('startTime', 'hour', value)}
                                    >
                                        <SelectTrigger className="w-20 bg-black/50 border-purple-900/50 text-gray-300">
                                            <SelectValue placeholder="09" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-black/90 border-purple-900/50 text-gray-300">
                                            {Array.from({ length: 12 }, (_, i) => (
                                                <SelectItem key={i} value={String(i + 1).padStart(2, "0")}
                                                    className="text-gray-300 data-[state=checked]:text-purple-400 hover:bg-gray-800">
                                                    {String(i + 1).padStart(2, "0")}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>

                                    <Select
                                        value={formData.startTime.minute}
                                        onValueChange={(value) => updateDateTime('startTime', 'minute', value)}
                                    >
                                        <SelectTrigger className="w-20 bg-black/50 border-purple-900/50 text-gray-300">
                                            <SelectValue placeholder="00" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-black/90 border-purple-900/50 text-gray-300">
                                            {Array.from({ length: 60 }, (_, i) => (
                                                <SelectItem key={i} value={String(i).padStart(2, "0")}
                                                    className="text-gray-300 data-[state=checked]:text-purple-400 hover:bg-gray-800">
                                                    {String(i).padStart(2, "0")}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>

                                    <Select
                                        value={formData.startTime.period}
                                        onValueChange={(value) => updateDateTime('startTime', 'period', value as 'AM' | 'PM')}
                                    >
                                        <SelectTrigger className="w-20 bg-black/50 border-purple-900/50 text-gray-300">
                                            <SelectValue placeholder="AM" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-black/90 border-purple-900/50 text-gray-300">
                                            <SelectItem value="AM" className="text-gray-300 data-[state=checked]:text-purple-400 hover:bg-gray-800">AM</SelectItem>
                                            <SelectItem value="PM" className="text-gray-300 data-[state=checked]:text-purple-400 hover:bg-gray-800">PM</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>

                        {/* End Time */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300 flex items-center">
                                <Clock className="w-4 h-4 mr-2 text-purple-400" />
                                End Time
                            </label>

                            <div className="flex gap-2">
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className="w-full justify-start text-left font-normal bg-black/50 border-purple-900/50 hover:bg-purple-900/20 hover:border-purple-500 text-gray-300 hover:text-purple-400 transition-colors"
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {formData.endTime.date ? format(formData.endTime.date, "PPP") : <span>Select date</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0 bg-black/90 border-purple-900/50">
                                        <Calendar
                                            mode="single"
                                            selected={formData.endTime.date}
                                            onSelect={(date) => updateDateTime('endTime', 'date', date)}
                                            initialFocus
                                            className="bg-black text-white"
                                        />
                                    </PopoverContent>
                                </Popover>

                                <div className="flex gap-2">
                                    <Select
                                        value={formData.endTime.hour}
                                        onValueChange={(value) => updateDateTime('endTime', 'hour', value)}
                                    >
                                        <SelectTrigger className="w-20 bg-black/50 border-purple-900/50 text-gray-300">
                                            <SelectValue placeholder="09" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-black/90 border-purple-900/50 text-gray-300">
                                            {Array.from({ length: 12 }, (_, i) => (
                                                <SelectItem key={i} value={String(i + 1).padStart(2, "0")}
                                                    className="text-gray-300 data-[state=checked]:text-purple-400 hover:bg-gray-800">
                                                    {String(i + 1).padStart(2, "0")}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>

                                    <Select
                                        value={formData.endTime.minute}
                                        onValueChange={(value) => updateDateTime('endTime', 'minute', value)}
                                    >
                                        <SelectTrigger className="w-20 bg-black/50 border-purple-900/50 text-gray-300">
                                            <SelectValue placeholder="00" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-black/90 border-purple-900/50 text-gray-300">
                                            {Array.from({ length: 60 }, (_, i) => (
                                                <SelectItem key={i} value={String(i).padStart(2, "0")}
                                                    className="text-gray-300 data-[state=checked]:text-purple-400 hover:bg-gray-800">
                                                    {String(i).padStart(2, "0")}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>

                                    <Select
                                        value={formData.endTime.period}
                                        onValueChange={(value) => updateDateTime('endTime', 'period', value as 'AM' | 'PM')}
                                    >
                                        <SelectTrigger className="w-20 bg-black/50 border-purple-900/50 text-gray-300">
                                            <SelectValue placeholder="AM" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-black/90 border-purple-900/50 text-gray-300">
                                            <SelectItem value="AM" className="text-gray-300 data-[state=checked]:text-purple-400 hover:bg-gray-800">AM</SelectItem>
                                            <SelectItem value="PM" className="text-gray-300 data-[state=checked]:text-purple-400 hover:bg-gray-800">PM</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex justify-between pt-4">
                            <Button
                                variant="outline"
                                className="bg-black/50 border-purple-900/50 hover:bg-purple-900/20 hover:border-purple-500 text-gray-300 hover:text-purple-400 transition-colors"
                                onClick={() => goToPrevStep()}
                            >
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Previous
                            </Button>

                            <Button className="bg-purple-600 hover:bg-purple-700 text-white" onClick={() => goToNextStep()}>
                                Next Step
                                <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        </div>
                    </div>
                </TabsContent>

                {/* Permissions Tab */}
                <TabsContent value="permissions" className="mt-6">
                    {/* Tab content remains the same */}
                    <div className="space-y-8">
                        <div className="space-y-4">
                            <label className="text-sm font-medium text-gray-300 flex items-center">
                                <Users className="w-4 h-4 mr-2 text-purple-400" />
                                Participation Rights
                            </label>

                            <RadioGroup
                                defaultValue="specific"
                                className="space-y-3"
                                value={formData.permissionType}
                                onValueChange={(value) =>
                                    setFormData({ ...formData, permissionType: value as "all" | "specific" })
                                }
                            >
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="all" id="all" className="border-purple-500 text-purple-500" />
                                    <label htmlFor="all" className="text-sm font-medium leading-none text-gray-300">
                                        Everyone can participate
                                    </label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="specific" id="specific" className="border-purple-500 text-purple-500" />
                                    <label htmlFor="specific" className="text-sm font-medium leading-none text-gray-300">
                                        Specified addresses can participate
                                    </label>
                                </div>
                            </RadioGroup>
                        </div>

                        {formData.permissionType === "specific" && (
                            <AllowlistManager
                                selectedAllowlistId={formData.selectedAllowlistId}
                                onAllowlistSelect={updateSelectedAllowlistId}
                                onAllowlistInfoChange={updateSelectedAllowlistInfo}
                            />
                        )}

                        {/* Action Buttons */}
                        <div className="flex justify-between pt-4">
                            <Button
                                variant="outline"
                                className="bg-black/50 border-purple-900/50 hover:bg-purple-900/20 hover:border-purple-500 text-gray-300 hover:text-purple-400 transition-colors"
                                onClick={() => goToPrevStep()}
                            >
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Previous
                            </Button>

                            <Button className="bg-purple-600 hover:bg-purple-700 text-white" onClick={() => goToNextStep()}>
                                Next Step
                                <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        </div>
                    </div>
                </TabsContent>

                {/* Confirm Tab */}
                <TabsContent value="confirmation" className="mt-6">
                    {/* Tab content remains the same */}
                    <div className="space-y-8">
                        <div className="bg-black/30 border border-purple-900/50 rounded-lg p-6">
                            <h2 className="text-xl font-bold mb-4">test</h2>
                            <p className="text-gray-400 mb-6">{formData.description}</p>

                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-sm font-medium text-gray-300 mb-2 flex items-center">
                                        <HardDrive className="w-4 h-4 mr-2 text-purple-400" />
                                        Vote Options:
                                    </h3>
                                    <ul className="list-disc list-inside space-y-1 text-gray-400 ml-4">
                                        {formData.options.map((option) => (
                                            <li key={option.id}>{option.text || "Empty Option"}</li>
                                        ))}
                                    </ul>
                                </div>

                                <div>
                                    <h3 className="text-sm font-medium text-gray-300 mb-2 flex items-center">
                                        <Clock className="w-4 h-4 mr-2 text-purple-400" />
                                        Voting Period:
                                    </h3>
                                    <p className="text-gray-400 ml-6">
                                        {formData.startTime.date ? (
                                            `${format(formData.startTime.date, "PPP")} ${formData.startTime.hour}:${formData.startTime.minute} ${formData.startTime.period} `
                                        ) : "Not set"}  -
                                        {formData.endTime.date ? (
                                            ` ${format(formData.endTime.date, "PPP")} ${formData.endTime.hour}:${formData.endTime.minute} ${formData.endTime.period}`
                                        ) : "Not set"}
                                    </p>
                                </div>

                                <div>
                                    <h3 className="text-sm font-medium text-gray-300 mb-2 flex items-center">
                                        <Users className="w-4 h-4 mr-2 text-purple-400" />
                                        Participation Rights:
                                    </h3>
                                    <p className="text-gray-400 ml-6">
                                        {formData.permissionType === "all" ? "Everyone can participate" : `Specified addresses can participate - (${formData.selectedAllowlistInfo?.addressCount} addresses from whitelist ${formData.selectedAllowlistInfo?.name} )`}
                                    </p>
                                </div>

                                {formData.attachments.length > 0 && (
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-300 mb-2 flex items-center">
                                            <FileLock2 className="w-4 h-4 mr-2 text-purple-400" />
                                            Attachments:
                                        </h3>
                                        <ul className="list-disc list-inside space-y-1 text-gray-400 ml-4">
                                            {formData.attachments.map((attachment, index) => (
                                                <li key={index}>{attachment.name} ({Math.round(attachment.size / 1024)} KB)</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>


                            {/* Action Buttons */}
                            <div className="flex justify-between pt-4">
                                <Button
                                    variant="outline"
                                    className="bg-black/50 border-purple-900/50 hover:bg-purple-900/20 hover:border-purple-500 text-gray-300 hover:text-purple-400 transition-colors"
                                    onClick={() => goToPrevStep()}
                                >
                                    <ArrowLeft className="w-4 h-4 mr-2" />
                                    Previous
                                </Button>

                                <Button className="bg-purple-600 hover:bg-purple-700 text-white" onClick={handleCreateVotePool}>
                                    <Check className="w-4 h-4 mr-2" />
                                    Confirm Creation
                                </Button>
                            </div>
                        </div>

                        {validationError && (
                            <div className="bg-red-900/10 border border-red-500/30 rounded-lg p-4 flex items-start mb-4">
                                <AlertCircle className="w-5 h-5 text-red-500 mr-3 mt-0.5 flex-shrink-0" />
                                <p className="text-red-200 text-sm">{validationError}</p>
                            </div>
                        )}

                        {isProcessing && (
                            <div className="mt-4 bg-black/30 border border-purple-900/50 rounded-lg p-4">
                                <div className="flex items-center space-x-3">
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-400"></div>
                                    <p className="text-purple-300">{processingStatus}</p>
                                </div>
                            </div>
                        )}

                        <div className="bg-amber-900/10 border border-amber-500/30 rounded-lg p-4 flex items-start">
                            <AlertCircle className="w-5 h-5 text-amber-500 mr-3 mt-0.5 flex-shrink-0" />
                            <p className="text-amber-200 text-sm">Creating a vote will consume SUI tokens as gas fees</p>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}


