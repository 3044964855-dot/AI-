import React from 'react';
import { ConnectionStatus } from '../types';

interface ControlPanelProps {
  status: ConnectionStatus;
  onDisconnect: () => void;
  onSayBetter?: () => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({ status, onDisconnect, onSayBetter }) => {
  const isConnected = status === ConnectionStatus.CONNECTED;
  
  if (status === ConnectionStatus.DISCONNECTED || status === ConnectionStatus.SUMMARY) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 w-full p-6 bg-white/80 backdrop-blur-md border-t border-pink-100 shadow-lg flex flex-col items-center gap-4 pb-10 z-50">
      <div className="text-center mb-2">
        {status === ConnectionStatus.CONNECTING && <p className="text-pink-500 text-sm animate-pulse">Connecting to Marilyn...</p>}
        {status === ConnectionStatus.CONNECTED && <p className="text-pink-600 font-medium text-sm">Session Active</p>}
        {status === ConnectionStatus.ERROR && <p className="text-red-500 text-sm">Connection Error. Please try again.</p>}
      </div>

      <div className="flex items-center gap-4 w-full justify-center">
        {/* Level 3: Say This Better Button */}
        {isConnected && onSayBetter && (
          <button
            onClick={onSayBetter}
            className="flex flex-col items-center gap-1 group active:scale-95 transition-transform"
            title="How do I say this better?"
          >
            <div className="w-12 h-12 rounded-full bg-yellow-100 border-2 border-yellow-300 flex items-center justify-center text-yellow-600 shadow-md group-hover:bg-yellow-200">
               <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
            </div>
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Say Better</span>
          </button>
        )}

        {/* End Chat Button */}
        {isConnected && (
          <button
            onClick={onDisconnect}
            className="relative group overflow-hidden px-8 py-3 rounded-full font-bold text-lg shadow-xl transition-all duration-300 transform active:scale-95 bg-red-50 text-red-500 border-2 border-red-200 hover:bg-red-100"
          >
            <span className="relative z-10 flex items-center gap-2">
               <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path><line x1="12" y1="2" x2="12" y2="12"></line></svg>
               End
            </span>
          </button>
        )}
      </div>
      
      {status === ConnectionStatus.ERROR && (
        <button
          onClick={onDisconnect}
          className="text-gray-500 underline text-sm"
        >
          Reset
        </button>
      )}
    </div>
  );
};

export default ControlPanel;