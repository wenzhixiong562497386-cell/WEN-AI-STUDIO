import React, { useRef } from 'react';
import { Upload, Image as ImageIcon, X } from 'lucide-react';
import { Button } from './Button';

interface UploadZoneProps {
  onUpload: (files: FileList) => void;
  isProcessing: boolean;
}

export const UploadZone: React.FC<UploadZoneProps> = ({ onUpload, isProcessing }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onUpload(e.dataTransfer.files);
    }
  };

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onUpload(e.target.files);
    }
  };

  return (
    <div 
      className={`border-2 border-dashed border-slate-700 rounded-xl p-8 text-center transition-all hover:border-blue-500 hover:bg-slate-800/50 cursor-pointer ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      <input 
        type="file" 
        ref={inputRef} 
        onChange={handleFileChange} 
        className="hidden" 
        multiple 
        accept="image/jpeg,image/png,image/webp,image/heic"
        max={5}
      />
      <div className="flex flex-col items-center justify-center space-y-4">
        <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center">
          <Upload className="w-8 h-8 text-blue-400" />
        </div>
        <div>
          <h3 className="text-lg font-medium text-white">点击或拖拽上传图片</h3>
          <p className="text-sm text-slate-400 mt-1">支持 JPG, PNG, WEBP (最多5张)</p>
        </div>
        <Button variant="secondary" size="sm" onClick={(e) => { e.stopPropagation(); handleClick(); }}>
          选择文件
        </Button>
      </div>
    </div>
  );
};