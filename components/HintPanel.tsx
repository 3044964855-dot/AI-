import React from 'react';
import { ConversationHints } from '../types';

interface HintPanelProps {
  hints: ConversationHints | null;
  className?: string;
}

const FILLER_WORDS = ["Well...", "Actually...", "You know...", "Let me see...", "I mean...", "To be honest..."];

const HintPanel: React.FC<HintPanelProps> = ({ hints, className }) => {
  return (
    <div className={`w-full max-w-sm px-4 ${className}`}>
      
      {/* Filler Words - Always Available */}
      <div className="flex flex-wrap justify-center gap-2 mb-4">
        {FILLER_WORDS.map((word, i) => (
          <span 
            key={i} 
            className="text-xs text-gray-400 bg-white/50 border border-gray-200 px-2 py-1 rounded-full cursor-default hover:bg-white hover:text-pink-500 transition-colors"
          >
            {word}
          </span>
        ))}
      </div>

      {/* Dynamic Hints */}
      {hints ? (
        <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl p-4 border border-pink-100 animate-slide-up transform transition-all duration-500">
          <div className="grid grid-cols-1 gap-3">
            
            {/* Level 1: Topic */}
            <div className="flex items-center gap-2">
              <span className="bg-blue-100 text-blue-600 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider min-w-fit">Topic</span>
              <p className="text-gray-700 text-sm font-medium truncate">{hints.topic}</p>
            </div>

            {/* Level 2: Sentence Starter */}
            <div className="flex items-center gap-2">
              <span className="bg-purple-100 text-purple-600 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider min-w-fit">Start</span>
              <p className="text-gray-700 text-sm italic">"{hints.sentence}..."</p>
            </div>

            {/* Level 3: Keywords */}
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <span className="bg-pink-100 text-pink-600 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">Vocab</span>
              <div className="flex gap-2">
                {hints.keywords.map((kw, i) => (
                  <span key={i} className="text-xs bg-gray-50 text-gray-600 px-2 py-1 rounded border border-gray-100">
                    {kw}
                  </span>
                ))}
              </div>
            </div>

          </div>
        </div>
      ) : (
        <div className="text-center">
            <p className="text-xs text-gray-300 italic">Listening to context...</p>
        </div>
      )}
    </div>
  );
};

export default HintPanel;