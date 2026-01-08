import React, { useEffect, useState } from 'react';
import { generateAvatarImage } from '../services/genAiService';

interface AvatarDisplayProps {
  isTalking: boolean;
  isListening: boolean;
}

const AvatarDisplay: React.FC<AvatarDisplayProps> = ({ isTalking, isListening }) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let mounted = true;
    const fetchImage = async () => {
      try {
        const result = await generateAvatarImage();
        if (mounted) {
          setImageUrl(result.url);
          setLoading(false);
        }
      } catch (e) {
        console.error("Failed to load avatar", e);
        if (mounted) setLoading(false);
      }
    };

    fetchImage();
    return () => { mounted = false; };
  }, []);

  return (
    <div className="relative w-72 h-72 md:w-96 md:h-96 mx-auto mt-8 flex items-center justify-center">
      {/* Glow Effect */}
      <div 
        className={`absolute inset-0 rounded-full bg-pink-300 blur-3xl opacity-30 transition-all duration-300 ${isTalking ? 'scale-110 opacity-60' : 'scale-90'}`}
      ></div>

      {/* Image Container */}
      <div className={`relative z-10 w-full h-full rounded-full overflow-hidden border-8 border-white shadow-2xl transition-transform duration-300 ${isTalking ? 'scale-105' : 'scale-100'}`}>
        {loading ? (
          <div className="w-full h-full bg-pink-100 flex items-center justify-center animate-pulse">
            <span className="text-pink-400 font-bold">Summoning Marilyn...</span>
          </div>
        ) : (
          <img 
            src={imageUrl || 'https://picsum.photos/400/400'} 
            alt="Marilyn Avatar" 
            className="w-full h-full object-cover"
          />
        )}
      </div>

      {/* Status Indicator Badge */}
      <div className="absolute bottom-4 right-4 z-20">
         {isListening && (
            <div className="flex space-x-1 bg-white px-3 py-1 rounded-full shadow-lg">
                <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce delay-75"></div>
                <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce delay-150"></div>
            </div>
         )}
      </div>
    </div>
  );
};

export default AvatarDisplay;