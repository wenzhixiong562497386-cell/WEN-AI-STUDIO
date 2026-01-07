import React from 'react';
import { LayoutGrid, Image, Crop, Maximize, FileText, ShoppingBag, History, Settings } from 'lucide-react';
import { GenerationType } from '../types';

interface SidebarProps {
  activeTab: GenerationType | 'history';
  onTabChange: (tab: GenerationType | 'history') => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange }) => {
  const navItems = [
    { id: GenerationType.WHITE_BG, label: '白底图生成', icon: Crop },
    { id: GenerationType.SCENARIO, label: '场景图合成', icon: Image },
    { id: GenerationType.DIMENSION, label: '尺寸标注图', icon: Maximize },
  ];

  return (
    <div className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-full">
      <div className="p-6 border-b border-slate-800">
        <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent flex items-center gap-2">
           <LayoutGrid className="w-6 h-6 text-blue-500" />
           WEN STUDIO
        </h1>
      </div>

      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-2">核心功能</div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm transition-all ${
                isActive 
                  ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <Icon className="w-5 h-5" />
              {item.label}
            </button>
          );
        })}

        <div className="mt-8 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-2">资源管理</div>
        <button
          onClick={() => onTabChange('history')}
          className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm transition-all ${
            activeTab === 'history'
              ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20'
              : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
          }`}
        >
          <History className="w-5 h-5" />
          生成历史
        </button>
      </nav>

      <div className="p-4 border-t border-slate-800">
         <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-400 hover:bg-slate-800 transition-all">
            <Settings className="w-5 h-5" />
            系统设置
         </button>
      </div>
    </div>
  );
};