import React, { useEffect, useState } from 'react';
import { TranscriptItem, Correction, VocabularyItem } from '../types';
import { analyzeTranscript } from '../services/genAiService';

interface SessionSummaryProps {
  transcript: TranscriptItem[];
  vocabulary: VocabularyItem[];
  onClose: () => void;
}

const SessionSummary: React.FC<SessionSummaryProps> = ({ transcript, vocabulary, onClose }) => {
  const [corrections, setCorrections] = useState<Correction[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'review' | 'vocabulary'>('review');

  useEffect(() => {
    const fetchCorrections = async () => {
      try {
        const result = await analyzeTranscript(transcript);
        setCorrections(result);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchCorrections();
  }, [transcript]);

  return (
    <div className="flex-1 w-full max-w-md bg-white rounded-t-3xl shadow-2xl p-6 overflow-y-auto animate-slide-up relative mt-4 pb-20">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-marilyn-dark">Session Summary</h2>
        <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100">
           <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex p-1 bg-gray-100 rounded-xl mb-6">
        <button 
            onClick={() => setActiveTab('review')}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'review' ? 'bg-white text-pink-600 shadow-sm' : 'text-gray-500'}`}
        >
            Feedback
        </button>
        <button 
            onClick={() => setActiveTab('vocabulary')}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'vocabulary' ? 'bg-white text-pink-600 shadow-sm' : 'text-gray-500'}`}
        >
            Vocabulary ({vocabulary.length})
        </button>
      </div>

      {activeTab === 'review' ? (
        <>
            {/* Transcript List */}
            <div className="space-y-4 mb-8">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Conversation Highlight</h3>
                {transcript.length === 0 ? (
                <p className="text-gray-400 italic text-center py-4">No transcript available.</p>
                ) : (
                transcript.map((item, idx) => (
                    <div key={idx} className={`flex ${item.speaker === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-2xl p-3 text-sm ${item.speaker === 'user' ? 'bg-pink-100 text-pink-900 rounded-br-none' : 'bg-gray-100 text-gray-800 rounded-bl-none'}`}>
                        {item.text}
                    </div>
                    </div>
                ))
                )}
            </div>

            {/* Level 2 Corrections */}
            <div>
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Improvement Tips</h3>
                {loading ? (
                <div className="flex items-center justify-center space-x-2 py-8">
                    <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce delay-75"></div>
                    <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce delay-150"></div>
                    <span className="text-pink-400 text-sm ml-2">Marilyn is reviewing your notes...</span>
                </div>
                ) : corrections.length === 0 ? (
                <div className="text-center py-6 bg-green-50 rounded-xl border border-green-100">
                    <p className="text-green-600 font-medium">Great job! No major slips found.</p>
                </div>
                ) : (
                <div className="space-y-4">
                    {corrections.map((corr, idx) => (
                    <div key={idx} className="bg-orange-50 rounded-xl p-4 border border-orange-100 shadow-sm">
                        <div className="flex items-start gap-3">
                            <div className="mt-1 bg-white p-1 rounded-full shadow-sm text-orange-500">
                            {corr.type === 'grammar' && <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>}
                            {corr.type === 'vocabulary' && <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>}
                            {corr.type === 'naturalness' && <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"/><line x1="16" y1="8" x2="2" y2="22"/><line x1="17.5" y1="15" x2="9" y2="15"/></svg>}
                            </div>
                            <div className="flex-1">
                            <p className="text-gray-500 line-through text-xs mb-1">{corr.original}</p>
                            <p className="text-gray-800 font-bold text-sm mb-1">{corr.better}</p>
                            <p className="text-orange-600 text-xs italic">{corr.explanation}</p>
                            </div>
                        </div>
                    </div>
                    ))}
                </div>
                )}
            </div>
        </>
      ) : (
        <div className="space-y-4">
             <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Words Collected</h3>
             {vocabulary.length === 0 ? (
                 <div className="text-center py-10">
                     <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto flex items-center justify-center mb-3">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
                     </div>
                     <p className="text-gray-400 text-sm">No new words saved this session.</p>
                     <p className="text-gray-300 text-xs mt-1">Ask "What does X mean?" to save words!</p>
                 </div>
             ) : (
                 vocabulary.map((vocab, i) => (
                     <div key={i} className="bg-yellow-50 rounded-xl p-4 border border-yellow-200 shadow-sm relative overflow-hidden">
                         <div className="absolute top-0 right-0 w-8 h-8 bg-yellow-100 rounded-bl-xl flex items-center justify-center">
                            <span className="text-xs text-yellow-600 font-bold">{i+1}</span>
                         </div>
                         <h4 className="font-bold text-lg text-gray-800 capitalize mb-1">{vocab.word}</h4>
                         <p className="text-sm text-gray-600 mb-2">{vocab.definition}</p>
                         <div className="bg-white/60 p-2 rounded-lg">
                             <p className="text-xs text-gray-500 italic">"{vocab.example}"</p>
                         </div>
                     </div>
                 ))
             )}
        </div>
      )}
      
      <button onClick={onClose} className="w-full mt-8 bg-marilyn-dark text-white py-3 rounded-full font-bold shadow-lg">
        Practice Again
      </button>
    </div>
  );
};

export default SessionSummary;