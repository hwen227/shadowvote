import { useState, useEffect } from 'react';
import { WalrusAttchFileBlob } from '@/types';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription
} from "@/components/ui/dialog";
import { useUploadBlob } from '@/hooks/useUploadBlob';

interface FilePreviewProps {
    files: WalrusAttchFileBlob[];
}

interface FileWithUrl extends WalrusAttchFileBlob {
    url?: string;
    type: 'image' | 'pdf' | 'doc' | 'txt' | 'unknown';
}

export function FilePreview({ files }: FilePreviewProps) {
    const [processedFiles, setProcessedFiles] = useState<FileWithUrl[]>([]);
    const [selectedFile, setSelectedFile] = useState<FileWithUrl | null>(null);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const { downloadBlobAsFile } = useUploadBlob();

    // 根据文件名判断文件类型
    const getFileType = (fileName: string): FileWithUrl['type'] => {
        const extension = fileName.toLowerCase().split('.').pop();
        switch (extension) {
            case 'jpg':
            case 'jpeg':
            case 'png':
            case 'gif':
                return 'image';
            case 'pdf':
                return 'pdf';
            case 'doc':
            case 'docx':
                return 'doc';
            case 'txt':
                return 'txt';
            default:
                return 'unknown';
        }
    };


    // 获取文件URL
    useEffect(() => {
        const fetchUrls = async () => {
            setIsLoading(true);
            const processed = await Promise.all(files.map(async (file) => {
                try {
                    const response = await downloadBlobAsFile(file.blob_id);
                    const fileType = getFileType(file.name);

                    let fixedBlob: Blob;

                    if (fileType === 'txt') {
                        const text = await response.text();
                        fixedBlob = new Blob([text], { type: 'text/plain' });
                    } else if (fileType === 'pdf') {
                        fixedBlob = new Blob([response], { type: 'application/pdf' });
                    } else if (fileType === 'image') {
                        const extension = file.name.toLowerCase().split('.').pop();
                        const imageType =
                            extension === 'png' ? 'image/png' :
                                extension === 'jpg' || extension === 'jpeg' ? 'image/jpeg' :
                                    extension === 'gif' ? 'image/gif' :
                                        'image/png';
                        fixedBlob = new Blob([response], { type: imageType });
                    } else {
                        fixedBlob = new Blob([response], { type: 'application/octet-stream' });
                    }


                    return {
                        ...file,
                        url: URL.createObjectURL(fixedBlob),
                        type: getFileType(file.name)
                    };
                } catch (error) {
                    console.error('获取文件URL失败:', error);
                    return {
                        ...file,
                        url: undefined,
                        type: getFileType(file.name)
                    };
                }
            }));
            setProcessedFiles(processed);
            setIsLoading(false);
        };

        fetchUrls();
    }, [files]);

    const handleFileClick = (file: FileWithUrl) => {
        setSelectedFile(file);
        setIsPreviewOpen(true);
    };

    const renderPreviewContent = (file: FileWithUrl) => {
        if (!file.url) return <div className="text-red-500">无法加载文件</div>;

        switch (file.type) {
            case 'image':
                return (
                    <img
                        src={file.url}
                        alt={file.name}
                        className="max-w-full max-h-[80vh] object-contain"
                    />
                );
            case 'pdf':
                return (
                    <iframe
                        src={file.url}
                        className="w-full h-[80vh]"
                        title={file.name}
                    />
                );
            case 'txt':
                return (
                    <iframe
                        src={file.url}
                        className="w-full h-[80vh]"
                        title={file.name}
                    />

                );
            case 'doc':
                return (
                    <div className="p-4 text-center">
                        <p>Word文档预览暂不支持</p>
                        <a
                            href={file.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:text-blue-700 underline mt-2 block"
                        >
                            点击下载查看
                        </a>
                    </div>
                );
            default:
                return (
                    <div className="p-4 text-center">
                        <p>不支持的文件类型</p>
                        <a
                            href={file.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:text-blue-700 underline mt-2 block"
                        >
                            点击下载查看
                        </a>
                    </div>
                );
        }
    };

    return (
        <div className="space-y-2 border border-dashed rounded-lg p-4 mb-4">
            <div className="font-bold text-sm mb-3">attachments:</div>
            {isLoading ? (
                <div className="flex items-center justify-center py-4 space-x-3">
                    <div className="w-4 h-4 border-2 border-t-blue-500 border-blue-200 rounded-full animate-spin"></div>
                    <span className="text-sm text-gray-500">Loading Attachments...</span>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-2">
                    {processedFiles.map((file) => (
                        <div
                            key={file.blob_id}
                            onClick={() => handleFileClick(file)}
                            className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-100 cursor-pointer"
                        >
                            <i className={`fas fa-${file.type === 'image' ? 'image' :
                                file.type === 'pdf' ? 'file-pdf' :
                                    file.type === 'doc' ? 'file-word' :
                                        file.type === 'txt' ? 'file-alt' :
                                            'file'
                                } text-gray-500`}></i>
                            <span className="text-sm text-blue-500 hover:text-blue-700">
                                {file.name}
                            </span>
                        </div>
                    ))}
                </div>
            )}

            <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
                <DialogContent className="max-w-4xl w-full">
                    <DialogHeader>
                        <DialogTitle>{selectedFile?.name}</DialogTitle>
                        <DialogDescription>
                            Preview of the selected file
                        </DialogDescription>
                    </DialogHeader>
                    {selectedFile && renderPreviewContent(selectedFile)}
                </DialogContent>
            </Dialog>
        </div>
    );
} 