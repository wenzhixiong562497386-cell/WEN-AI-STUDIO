import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { UploadZone } from './components/UploadZone';
import { ChatPanel } from './components/ChatPanel';
import { Button } from './components/Button';
import { UploadedImage, GenerationType, ImageSize, ChatMessage, ImageVersion } from './types';
import { AMAZON_SIZES } from './constants';
import { analyzeAndRepairImage, generateProductImage, chatEditImage } from './services/geminiService';
import { Download, RefreshCw, ZoomIn, Check, AlertCircle } from 'lucide-react';

export default function App() {
  // State
  const [activeTab, setActiveTab] = useState<GenerationType | 'history'>(GenerationType.WHITE_BG);
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [previewVersionId, setPreviewVersionId] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<ImageSize>(AMAZON_SIZES[0]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Computed
  const selectedImage = images.find(img => img.id === selectedImageId);
  const currentVersion = selectedImage 
    ? (previewVersionId 
        ? selectedImage.versions.find(v => v.id === previewVersionId) 
        : selectedImage.versions[selectedImage.versions.length - 1])
    : undefined;

  // Helpers
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  // Handlers
  const handleUpload = async (fileList: FileList) => {
    setIsProcessing(true);
    setErrorMsg(null);
    const newImages: UploadedImage[] = [];

    try {
      for (let i = 0; i < Math.min(fileList.length, 5); i++) {
        const file = fileList[i];
        const base64 = await fileToBase64(file);
        
        // Auto-analyze and repair immediately
        const { repairedImage, analysis } = await analyzeAndRepairImage(base64);

        newImages.push({
          id: Date.now().toString() + i,
          file,
          name: file.name,
          url: repairedImage, // Start with the repaired version
          processed: true,
          status: 'completed',
          versions: [
            { id: 'v0', url: base64, type: 'original', description: '原始上传', timestamp: Date.now() },
            { id: 'v1', url: repairedImage, type: 'original', description: 'AI 自动修复', timestamp: Date.now() + 1 }
          ]
        });

        // Add initial analysis to chat
        setChatMessages(prev => [...prev, {
          id: Date.now().toString() + '_sys',
          role: 'model',
          text: `已上传 ${file.name}。AI 分析报告: ${analysis}`,
          timestamp: Date.now()
        }]);
      }

      setImages(prev => [...prev, ...newImages]);
      if (newImages.length > 0 && !selectedImageId) {
        setSelectedImageId(newImages[0].id);
        setPreviewVersionId(null);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("上传或修复图片失败，请重试。");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGenerate = async () => {
    if (!selectedImage || !currentVersion || activeTab === 'history') return;
    setIsProcessing(true);
    setErrorMsg(null);

    try {
      // Use the currently viewed version as input (allows branching from history)
      const inputImage = currentVersion.url;
      
      const resultBase64 = await generateProductImage(inputImage, activeTab, selectedSize);

      // Update image history
      const newVersion: ImageVersion = {
        id: Date.now().toString(),
        url: resultBase64,
        type: activeTab,
        description: `${selectedSize.label} - ${activeTab}`,
        timestamp: Date.now()
      };

      setImages(prev => prev.map(img => {
        if (img.id === selectedImageId) {
          return { ...img, versions: [...img.versions, newVersion] };
        }
        return img;
      }));
      
      // Reset preview to show the newly generated version
      setPreviewVersionId(null);

      setChatMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'model',
        text: `生成成功！已为您创建 ${selectedSize.label} 的 ${activeTab === 'white_bg' ? '白底图' : activeTab === 'scenario' ? '场景图' : '尺寸图'}。`,
        timestamp: Date.now()
      }]);

    } catch (err) {
      setErrorMsg("生成失败，请稍后重试。");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleChat = async (text: string) => {
    if (!selectedImage || !currentVersion) return;
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text, timestamp: Date.now() };
    setChatMessages(prev => [...prev, userMsg]);
    setIsProcessing(true);

    try {
      // Use currently viewed version for context
      const currentImgUrl = currentVersion.url;
      
      const response = await chatEditImage(
        currentImgUrl, 
        text, 
        chatMessages.map(m => ({ role: m.role, text: m.text }))
      );

      // Handle text response
      if (response.text) {
        setChatMessages(prev => [...prev, {
          id: Date.now().toString() + '_r',
          role: 'model',
          text: response.text,
          timestamp: Date.now()
        }]);
      }

      // Handle image response (if AI decided to edit)
      if (response.image) {
        const newVersion: ImageVersion = {
          id: Date.now().toString() + '_edit',
          url: response.image,
          type: 'original', // Treat edits as variations
          description: `AI 优化: ${text.substring(0, 10)}...`,
          timestamp: Date.now()
        };

        setImages(prev => prev.map(img => {
          if (img.id === selectedImageId) {
            return { ...img, versions: [...img.versions, newVersion] };
          }
          return img;
        }));
        
        // Reset preview to show the new edit
        setPreviewVersionId(null);
      }

    } catch (err) {
      setChatMessages(prev => [...prev, {
        id: Date.now().toString() + '_err',
        role: 'model',
        text: "抱歉，处理您的请求时出现错误。",
        timestamp: Date.now(),
        isError: true
      }]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!currentVersion) return;
    const link = document.createElement('a');
    link.href = currentVersion.url;
    link.download = `WEN_AI_${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePreviewVersion = (version: ImageVersion) => {
    setPreviewVersionId(version.id);
  };

  const handleSwitchImage = (id: string) => {
    setSelectedImageId(id);
    setPreviewVersionId(null); // Reset history preview when switching images
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-200 overflow-hidden font-sans">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full min-w-0">
        
        {/* Top Bar */}
        <div className="h-16 border-b border-slate-800 bg-slate-900 flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
             {images.length > 0 && (
               <div className="flex space-x-2 overflow-x-auto max-w-md py-2">
                 {images.map(img => (
                   <button 
                    key={img.id}
                    onClick={() => handleSwitchImage(img.id)}
                    className={`relative w-10 h-10 rounded-md overflow-hidden border-2 transition-all ${selectedImageId === img.id ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-slate-700 opacity-60 hover:opacity-100'}`}
                   >
                     <img src={img.versions[img.versions.length-1].url} className="w-full h-full object-cover" alt="" />
                   </button>
                 ))}
                 {images.length < 5 && (
                    <div className="w-10 h-10 rounded-md border-2 border-dashed border-slate-700 flex items-center justify-center cursor-pointer hover:border-slate-500" onClick={() => document.getElementById('top-upload')?.click()}>
                      <span className="text-xl text-slate-500">+</span>
                      <input id="top-upload" type="file" className="hidden" onChange={(e) => e.target.files && handleUpload(e.target.files)} />
                    </div>
                 )}
               </div>
             )}
          </div>
          
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => setImages([])} disabled={images.length === 0}>清除全部</Button>
            <Button variant="primary" size="sm" onClick={handleDownload} disabled={!currentVersion}>
              <Download className="w-4 h-4 mr-2" /> 导出图片
            </Button>
          </div>
        </div>

        {/* Workspace */}
        <div className="flex-1 overflow-y-auto bg-slate-950 p-6 relative">
          
          {!selectedImage ? (
             <div className="h-full flex items-center justify-center max-w-2xl mx-auto">
               <UploadZone onUpload={handleUpload} isProcessing={isProcessing} />
             </div>
          ) : (
            <div className="flex flex-col h-full">
              {/* Toolbar */}
              {activeTab !== 'history' && (
                <div className="mb-6 bg-slate-900/50 p-4 rounded-xl border border-slate-800 flex flex-wrap items-center gap-6 justify-between">
                  <div className="flex items-center gap-4">
                     <div className="flex flex-col">
                       <label className="text-xs text-slate-500 font-medium mb-1">输出尺寸 (Amazon Standard)</label>
                       <select 
                        className="bg-slate-800 border border-slate-700 text-sm rounded-lg p-2.5 focus:ring-blue-500 focus:border-blue-500 min-w-[200px]"
                        value={selectedSize.label}
                        onChange={(e) => {
                          const s = AMAZON_SIZES.find(size => size.label === e.target.value);
                          if(s) setSelectedSize(s);
                        }}
                       >
                         {AMAZON_SIZES.map(s => (
                           <option key={s.label} value={s.label}>[{s.category}] {s.label} - {s.width}x{s.height}</option>
                         ))}
                       </select>
                     </div>
                  </div>
                  
                  <Button onClick={handleGenerate} disabled={isProcessing} className="w-full md:w-auto">
                    {isProcessing ? 'AI 生成中...' : '立即生成'}
                  </Button>
                </div>
              )}

              {/* Canvas/Preview */}
              <div className="flex-1 flex items-center justify-center bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-slate-900 rounded-xl border border-slate-800 relative overflow-hidden group">
                 {currentVersion ? (
                   <img 
                    src={currentVersion.url} 
                    alt="Preview" 
                    className="max-h-full max-w-full object-contain shadow-2xl transition-transform duration-300" 
                    style={{ aspectRatio: `${selectedSize.width}/${selectedSize.height}` }}
                   />
                 ) : (
                   <div className="text-slate-500">无法加载图片</div>
                 )}
                 
                 {isProcessing && (
                   <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-10">
                     <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                     <p className="text-blue-400 font-medium animate-pulse">WEN AI 正在处理...</p>
                   </div>
                 )}

                 {errorMsg && (
                   <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-red-500/90 text-white px-4 py-2 rounded-lg text-sm flex items-center shadow-lg">
                     <AlertCircle className="w-4 h-4 mr-2" />
                     {errorMsg}
                   </div>
                 )}
              </div>

              {/* Version History (Only shown in history tab) */}
              {activeTab === 'history' && selectedImage && (
                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {selectedImage.versions.slice().reverse().map(v => {
                    const isSelected = currentVersion?.id === v.id;
                    return (
                      <div 
                        key={v.id} 
                        className={`group relative bg-slate-900 rounded-lg p-2 border transition-all cursor-pointer ${isSelected ? 'border-blue-500 ring-1 ring-blue-500' : 'border-slate-800 hover:border-blue-500/50'}`} 
                        onClick={() => handlePreviewVersion(v)}
                      >
                         <div className="aspect-square rounded overflow-hidden mb-2 bg-slate-950 relative">
                           <img src={v.url} className={`w-full h-full object-cover ${isSelected ? 'opacity-100' : 'opacity-70 group-hover:opacity-100'}`} alt="" />
                           {isSelected && <div className="absolute inset-0 ring-2 ring-inset ring-blue-500/50 rounded pointer-events-none" />}
                         </div>
                         <p className={`text-xs truncate font-medium ${isSelected ? 'text-blue-400' : 'text-slate-400'}`}>{v.description}</p>
                         <p className="text-[10px] text-slate-600">{new Date(v.timestamp).toLocaleTimeString()}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right Sidebar */}
      <ChatPanel 
        messages={chatMessages} 
        onSendMessage={handleChat} 
        isGenerating={isProcessing}
      />
    </div>
  );
}