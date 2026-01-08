import React, { useState, useEffect } from 'react';
import AvatarDisplay from './components/AvatarDisplay';
import ControlPanel from './components/ControlPanel';
import TopicSelector from './components/TopicSelector';
import SessionSummary from './components/SessionSummary';
import HintPanel from './components/HintPanel';
import { useLiveConnection } from './hooks/useLiveConnection';
import { ConnectionStatus } from './types';

const App: React.FC = () => {
  const { 
    status, 
    connect, 
    disconnect, 
    resetSession,
    triggerSayThisBetter,
    toggleEasyMode,
    isEasyMode,
    volume, 
    inputVolume, 
    currentVisualAid,
    transcript,
    hints,
    vocabulary
  } = useLiveConnection();

  const [showVocabToast, setShowVocabToast] = useState(false);

  // Heuristic for "is talking": if volume > threshold
  const isModelTalking = volume > 0.1;
  const isUserTalking = inputVolume > 0.05;

  // Show toast when vocabulary length increases
  useEffect(() => {
    if (vocabulary.length > 0) {
      setShowVocabToast(true);
      const timer = setTimeout(() => setShowVocabToast(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [vocabulary.length]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white flex flex-col items-center overflow-hidden relative">
      
      {/* Header */}
      <header className="w-full p-6 flex justify-between items-center z-10">
        <h1 className="text-2xl font-bold text-marilyn-dark tracking-tight">Marilyn's Lounge</h1>
        <div className="flex items-center gap-2">
            {/* Easy Mode Toggle Cloud */}
            {status === ConnectionStatus.CONNECTED && (
                <button 
                  onClick={toggleEasyMode}
                  className={`p-2 rounded-full transition-all duration-300 shadow-md ${isEasyMode ? 'bg-blue-100 text-blue-500 scale-110 shadow-blue-200' : 'bg-white text-gray-400 hover:text-blue-300'}`}
                  title="Super Simple Mode"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill={isEasyMode ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.5 19c0-1.7-1.3-3-3-3h-1.1c-.1-2.9-2.5-5.2-5.4-5.3-2.6-.1-4.9 1.8-5.4 4.4-.1.3-.1.7-.1 1H2c-1.1 0-2 .9-2 2s.9 2 2 2h15.5c1.7 0 3-1.3 3-3z"/><path d="M21 16v-1a4 4 0 0 0-4-4h-.1"/></svg>
                </button>
            )}
            <div className="bg-white/50 backdrop-blur px-3 py-1 rounded-full text-xs font-semibold text-pink-700 border border-pink-100">
            English Tutor
            </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-md flex flex-col items-center relative -mt-10 pb-24">
        
        {status === ConnectionStatus.SUMMARY ? (
           <SessionSummary transcript={transcript} vocabulary={vocabulary} onClose={resetSession} />
        ) : (
          <>
            {/* Decorative Background Elements */}
            <div className="absolute top-1/4 left-10 w-12 h-12 bg-yellow-200 rounded-full opacity-40 animate-bounce-gentle" style={{ animationDelay: '0s' }}></div>
            <div className="absolute bottom-1/3 right-10 w-8 h-8 bg-pink-300 rounded-full opacity-40 animate-bounce-gentle" style={{ animationDelay: '1s' }}></div>
            <div className="absolute top-20 right-20 w-4 h-4 bg-purple-300 rounded-full opacity-40 animate-pulse"></div>

            {/* Avatar */}
            <div className="relative mt-16 transition-all duration-500">
              <AvatarDisplay 
                isTalking={isModelTalking} 
                isListening={status === ConnectionStatus.CONNECTED && !isModelTalking && isUserTalking}
              />
              
              {/* Visual Aid Bubble */}
              {currentVisualAid && (
                 <div className="absolute -top-10 -right-4 w-40 h-40 bg-white rounded-2xl shadow-2xl border-4 border-pink-200 p-2 animate-bounce-gentle z-30 transform rotate-6">
                    <img 
                      src={currentVisualAid.url} 
                      alt="Visual Aid" 
                      className="w-full h-full object-cover rounded-lg"
                    />
                    <div className="absolute -bottom-2 -left-2 w-6 h-6 bg-white rounded-full border-2 border-pink-200"></div>
                    <div className="absolute -bottom-6 -left-6 w-3 h-3 bg-white rounded-full border-2 border-pink-200"></div>
                 </div>
              )}
            </div>

            {/* Vocab Toast */}
            {showVocabToast && (
                <div className="absolute top-0 transform -translate-y-full bg-yellow-100 text-yellow-800 px-4 py-2 rounded-full shadow-lg text-sm font-bold flex items-center gap-2 animate-bounce z-40">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                    Word saved to notebook!
                </div>
            )}

            {/* Interaction Area */}
            <div className="w-full mt-4 flex flex-col items-center">
              {status === ConnectionStatus.DISCONNECTED ? (
                <div className="mt-8 w-full">
                  <TopicSelector onSelect={connect} />
                </div>
              ) : (
                 <>
                   {/* Smart Hints Panel */}
                   <div className="w-full mt-2 mb-2">
                     <HintPanel hints={hints} />
                   </div>

                   <div className="text-center animate-pulse-slow px-8 mt-2">
                      <p className="text-gray-500 font-light italic text-sm">
                        {isEasyMode ? "Speaking simply & slowly..." : (isUserTalking ? "Listening..." : "Speak naturally, darling.")}
                      </p>
                   </div>
                 </>
              )}
            </div>
          </>
        )}

      </main>

      {/* Footer Controls */}
      <ControlPanel 
        status={status}
        onDisconnect={disconnect}
        onSayBetter={triggerSayThisBetter}
      />
    </div>
  );
};

export default App;