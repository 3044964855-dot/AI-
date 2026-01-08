import React, { useState, useEffect } from 'react';
import { getRandomTopics } from '../utils/topicData';

interface TopicSelectorProps {
  onSelect: (topic: string) => void;
}

const TopicSelector: React.FC<TopicSelectorProps> = ({ onSelect }) => {
  const [topics, setTopics] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    refreshTopics();
  }, []);

  const refreshTopics = () => {
    setTopics([...getRandomTopics(5), "Free Talk"]);
    setSelected(null);
  };

  return (
    <div className="w-full max-w-sm mx-auto px-4 z-20">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-marilyn-dark font-bold text-lg">Choose a Scenario</h2>
        <button 
          onClick={refreshTopics}
          className="text-gray-500 hover:text-pink-500 transition-colors text-sm flex items-center gap-1"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.3"/></svg>
          Shuffle
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        {topics.map((topic, index) => (
          <button
            key={index}
            onClick={() => setSelected(topic)}
            className={`
              p-3 rounded-xl text-sm font-medium text-left transition-all duration-200 border-2
              ${selected === topic 
                ? 'bg-pink-500 border-pink-500 text-white shadow-lg scale-105' 
                : 'bg-white border-pink-100 text-gray-700 hover:border-pink-300 hover:bg-pink-50'
              }
            `}
          >
            {topic}
          </button>
        ))}
      </div>

      <button
        disabled={!selected}
        onClick={() => selected && onSelect(selected)}
        className={`
          w-full py-4 rounded-full font-bold text-lg shadow-xl transition-all duration-300
          ${selected 
            ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white transform hover:scale-105 hover:shadow-pink-300/50 cursor-pointer' 
            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }
        `}
      >
        Start Chatting
      </button>
      
      {!selected && (
        <p className="text-center text-xs text-gray-400 mt-2">Please select a topic to begin</p>
      )}
    </div>
  );
};

export default TopicSelector;