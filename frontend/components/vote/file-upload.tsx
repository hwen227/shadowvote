import { useState, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { HardDrive, Upload } from "lucide-react";

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
            setTimeout(() => {
                onFileSelect(updatedFiles);
            }, 0);
        }
    }, [selectedFiles, onFileSelect]);

    const handleRemoveFile = useCallback((index: number) => {
        const updatedFiles = selectedFiles.filter((_, i) => i !== index);
        setSelectedFiles(updatedFiles);
        setTimeout(() => {
            onFileSelect(updatedFiles);
        }, 0);
    }, [selectedFiles, onFileSelect]);

    return (
        <div className="space-y-2">
            <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-300 flex items-center">
                    <HardDrive className="w-4 h-4 mr-2 text-purple-400" />
                    Attachment Upload
                </label>
            </div>
            <div className="mt-2">
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
                    className="bg-black/50 border-purple-900/50 hover:bg-purple-900/10 hover:border-purple-500 text-gray-300 hover:text-purple-400 transition-colors"
                >
                    <Upload className="w-4 h-4 mr-2" />
                    Select File
                </Button>
            </div>

            {selectedFiles.length > 0 && (
                <div className="space-y-2 mt-2">
                    {selectedFiles.map((file, index) => (
                        <div
                            key={`${file.name}-${index}`}
                            className="flex items-center justify-between bg-black/50 border border-purple-900/50 p-2 rounded-md"
                        >
                            <span className="text-sm text-gray-300 truncate max-w-[80%]">
                                {file.name} ({Math.round(file.size / 1024)} KB)
                            </span>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveFile(index)}
                                className="hover:bg-purple-900/10 text-gray-300 hover:text-red-400 transition-colors"
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