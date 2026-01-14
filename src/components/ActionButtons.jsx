import React from 'react';
import { Send } from 'lucide-react';

const ActionButtons = ({ onShowReport }) => {
  return (
    <div className="grid grid-cols-1 gap-4 px-6">
      <button
        onClick={onShowReport}
        className="group relative w-full h-20 bg-blue-500 hover:bg-blue-600 text-white rounded-[1.5rem] font-bold text-xl flex items-center justify-between px-8 transition-all active:scale-[0.97] shadow-lg shadow-blue-100"
      >
        <div className="flex flex-col items-start">
          <span>위치 보고하기</span>
          <span className="text-sm font-normal text-blue-100 opacity-80">지금 어디에 있는지 알려주세요</span>
        </div>
        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center group-hover:bg-white/30 transition-colors">
          <Send className="w-6 h-6" />
        </div>
      </button>
    </div>
  );
};

export default ActionButtons;
