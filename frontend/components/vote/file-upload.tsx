import { useState, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface FileUploadProps {
    onFileSelect: (files: File[]) => void;
}

export function FileUpload({ onFileSelect }: FileUploadProps) {
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

    const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (files) {
            const newFiles = Array.from(files);
            const updatedFiles = [...selectedFiles, ...newFiles];
            setSelectedFiles(updatedFiles);
            // 使用setTimeout来避免在渲染周期中调用父组件的更新
            setTimeout(() => {
                onFileSelect(updatedFiles);
            }, 0);
        }
    }, [selectedFiles, onFileSelect]);

    const handleRemoveFile = useCallback((index: number) => {
        const updatedFiles = selectedFiles.filter((_, i) => i !== index);
        setSelectedFiles(updatedFiles);
        // 使用setTimeout来避免在渲染周期中调用父组件的更新
        setTimeout(() => {
            onFileSelect(updatedFiles);
        }, 0);
    }, [selectedFiles, onFileSelect]);

    return (
        <div className="space-y-2">
            <div className="flex items-center gap-2">
                <Label>附件上传</Label>
                <span className="text-xs text-gray-500">
                    目前仅支持：PDF、TXT、JPG、PNG（最大20MB）
                </span>
            </div>
            <div className="flex items-center space-x-2">
                <input
                    type="file"
                    onChange={handleFileChange}
                    className="hidden"
                    id="file-upload"
                    accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                    multiple
                />
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('file-upload')?.click()}
                >
                    <i className="fas fa-upload mr-2"></i>
                    选择文件
                </Button>
            </div>
            {selectedFiles.length > 0 && (
                <div className="space-y-2 mt-2">
                    {selectedFiles.map((file, index) => (
                        <div
                            key={`${file.name}-${index}`}
                            className="flex items-center justify-between bg-gray-50 p-2 rounded-md"
                        >
                            <span className="text-sm text-gray-600 truncate max-w-[80%]">
                                {file.name} ({Math.round(file.size / 1024)} KB)
                            </span>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveFile(index)}
                                className="hover:bg-gray-200"
                            >
                                <i className="fas fa-times"></i>
                            </Button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
} 