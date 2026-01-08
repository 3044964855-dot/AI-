import { useState, useRef, useCallback, useEffect } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, FunctionDeclaration, Type } from '@google/genai';
import { ConnectionStatus, VisualAid, TranscriptItem, ConversationHints, VocabularyItem } from '../types';
import { createPcmBlob, decodeAudioData, base64ToUint8Array } from '../utils/audioUtils';
import { generateVisualAidImage, generateConversationHints } from '../services/genAiService';

const API_KEY = process.env.API_KEY || '';
const MODEL = 'gemini-2.5-flash-native-audio-preview-12-2025';

const visualAidTool: FunctionDeclaration = {
  name: 'generate_visual_aid',
  description: 'Generates an image to help explain a complex concept, show an object, or create a funny meme to relax the user.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      description: {
        type: Type.STRING,
        description: 'A description of the image to generate.',
      },
    },
    required: ['description'],
  },
};

const vocabTool: FunctionDeclaration = {
  name: 'save_vocabulary',
  description: 'Saves a word, phrase, or idiom to the user\'s vocabulary notebook. Use this when the user explicitly asks for a definition, asks "what does X mean", or when you teach them a new key term.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      word: { type: Type.STRING, description: 'The word or phrase to learn.' },
      definition: { type: Type.STRING, description: 'A simple, clear definition in English.' },
      example: { type: Type.STRING, description: 'An example sentence using the word.' },
    },
    required: ['word', 'definition', 'example'],
  },
};

export const useLiveConnection = () => {
  const [status, setStatus] = useState<ConnectionStatus>(ConnectionStatus.DISCONNECTED);
  const [volume, setVolume] = useState<number>(0); 
  const [inputVolume, setInputVolume] = useState<number>(0);
  const [currentVisualAid, setCurrentVisualAid] = useState<VisualAid | null>(null);
  const [transcript, setTranscript] = useState<TranscriptItem[]>([]);
  const [hints, setHints] = useState<ConversationHints | null>(null);
  const [vocabulary, setVocabulary] = useState<VocabularyItem[]>([]);
  const [isEasyMode, setIsEasyMode] = useState<boolean>(false);
  
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const inputSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const outputGainRef = useRef<GainNode | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sessionRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  // Transcription buffers
  const currentInputTransRef = useRef<string>('');
  const currentOutputTransRef = useRef<string>('');

  const disconnect = useCallback(async () => {
    // Determine if we should show summary or just disconnect
    setStatus(prev => prev === ConnectionStatus.CONNECTED ? ConnectionStatus.SUMMARY : ConnectionStatus.DISCONNECTED);

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (inputSourceRef.current) {
      inputSourceRef.current.disconnect();
      inputSourceRef.current = null;
    }
    if (inputAudioContextRef.current) {
      await inputAudioContextRef.current.close();
      inputAudioContextRef.current = null;
    }
    if (outputAudioContextRef.current) {
      await outputAudioContextRef.current.close();
      outputAudioContextRef.current = null;
    }
    
    setVolume(0);
    setInputVolume(0);
    setCurrentVisualAid(null);
    setHints(null);
    setIsEasyMode(false);
    sessionRef.current = null;
  }, []);

  const resetSession = useCallback(() => {
    setStatus(ConnectionStatus.DISCONNECTED);
    setTranscript([]);
    setHints(null);
    setVocabulary([]);
    setIsEasyMode(false);
  }, []);

  const triggerSayThisBetter = useCallback(async () => {
    if (sessionRef.current) {
      const session = await sessionRef.current;
      session.send({
        parts: [{ text: "[System]: The user clicked 'Say this better'. Please explain how they could improve their LAST sentence to sound more natural or grammatically correct. Be brief." }]
      });
    }
  }, []);

  const toggleEasyMode = useCallback(async () => {
    if (sessionRef.current) {
      const session = await sessionRef.current;
      const newMode = !isEasyMode;
      setIsEasyMode(newMode);
      
      const instruction = newMode 
        ? "[System]: User switched to EASY MODE. Please speak MUCH SLOWER. Use very simple A1/A2 vocabulary. Short sentences. Be extra patient and encouraging. Treat the user like a beginner."
        : "[System]: User switched OFF Easy Mode. Return to normal conversation speed and natural vocabulary.";
      
      session.send({
        parts: [{ text: instruction }]
      });
    }
  }, [isEasyMode]);

  const connect = useCallback(async (selectedTopic: string) => {
    if (!API_KEY) {
      console.error("No API Key found");
      return;
    }

    try {
      setStatus(ConnectionStatus.CONNECTING);
      setCurrentVisualAid(null);
      setTranscript([]);
      setHints(null);
      setVocabulary([]);
      currentInputTransRef.current = '';
      currentOutputTransRef.current = '';

      // Audio Setup
      inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      outputGainRef.current = outputAudioContextRef.current.createGain();
      outputGainRef.current.connect(outputAudioContextRef.current.destination);

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const ai = new GoogleGenAI({ apiKey: API_KEY });
      
      const source = inputAudioContextRef.current.createMediaStreamSource(stream);
      inputSourceRef.current = source;
      
      const scriptProcessor = inputAudioContextRef.current.createScriptProcessor(4096, 1, 1);
      processorRef.current = scriptProcessor;

      scriptProcessor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        let sum = 0;
        for(let i=0; i<inputData.length; i++) sum += inputData[i] * inputData[i];
        setInputVolume(Math.sqrt(sum / inputData.length));

        const pcmBlob = createPcmBlob(inputData);
        if (sessionRef.current) {
            sessionRef.current.then((session: any) => {
                session.sendRealtimeInput({ media: pcmBlob });
            });
        }
      };

      source.connect(scriptProcessor);
      scriptProcessor.connect(inputAudioContextRef.current.destination);

      const systemInstruction = `
        You are Marilyn Monroe, an English language tutor.
        CURRENT TOPIC: "${selectedTopic}".
        
        LANGUAGE POLICY (CRITICAL):
        - The user is allowed to speak CHINESE if they get stuck.
        - You MUST understand their Chinese intent perfectly.
        - You MUST ALWAYS REPLY IN ENGLISH. Never speak Chinese yourself.
        - If they speak Chinese, treat it as if they said the English equivalent and continue the conversation in English.
        
        BEHAVIOR:
        1.  **Persona**: Bubbly, charming, supportive. Speak SLOWLY (90% speed) by default.
        2.  **Vocabulary Tracking**: If the user asks "What does X mean?", "How do I say X?", or if you explain a new specific word to them, USE THE \`save_vocabulary\` TOOL immediately to save it to their notebook.
        3.  **Level 1 Correction (Communication Breakdown)**: If the user says something very confusing or grammatically broken to the point of meaninglessness:
            - Gently ask for clarification.
            - Rephrase what you thought they meant in SIMPLE English to confirm.
            - Do NOT lecture them. Just model the correct structure.
        4.  **Level 2 Correction (Minor Errors)**: Ignore minor grammar slips during the chat to keep the flow. I will analyze these later.
        5.  **Active Listening**: Use soft breathing sounds or gentle "mm-hmm"s if they pause, to show you are listening.
        
        TOOLS:
        - Use 'generate_visual_aid' for abstract concepts or to break the ice with a meme.
        - Use 'save_vocabulary' to save new words for the user.
      `;

      const sessionPromise = ai.live.connect({
        model: MODEL,
        config: {
          responseModalities: [Modality.AUDIO],
          tools: [{ functionDeclarations: [visualAidTool, vocabTool] }],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
          },
          systemInstruction: systemInstruction,
          inputAudioTranscription: { model: "gemini-2.5-flash" },
          outputAudioTranscription: { model: "gemini-2.5-flash" }
        },
        callbacks: {
          onopen: () => {
            console.log("Session Opened");
            setStatus(ConnectionStatus.CONNECTED);
          },
          onmessage: async (message: LiveServerMessage) => {
            // Handle Transcription
            if (message.serverContent?.inputTranscription) {
              currentInputTransRef.current += message.serverContent.inputTranscription.text;
            }
            if (message.serverContent?.outputTranscription) {
              currentOutputTransRef.current += message.serverContent.outputTranscription.text;
            }
            
            // Turn complete: commit transcript to history AND generate hints
            if (message.serverContent?.turnComplete) {
              const newItems: TranscriptItem[] = [];
              const userText = currentInputTransRef.current.trim();
              const modelText = currentOutputTransRef.current.trim();

              if (userText) {
                newItems.push({ speaker: 'user', text: userText, timestamp: Date.now() });
                currentInputTransRef.current = '';
              }
              if (modelText) {
                newItems.push({ speaker: 'model', text: modelText, timestamp: Date.now() });
                currentOutputTransRef.current = '';
              }
              
              if (newItems.length > 0) {
                 setTranscript(prev => {
                    const updated = [...prev, ...newItems];
                    generateConversationHints(updated).then(newHints => {
                      if (newHints) setHints(newHints);
                    });
                    return updated;
                 });
              }
            }

            // Handle Tool Calls
            if (message.toolCall) {
               for (const fc of message.toolCall.functionCalls) {
                 if (fc.name === 'generate_visual_aid') {
                   const desc = (fc.args as any).description;
                   const imageUrl = await generateVisualAidImage(desc);
                   if (imageUrl) {
                     setCurrentVisualAid({ url: imageUrl, caption: desc });
                     setTimeout(() => setCurrentVisualAid(null), 15000);
                   }
                   sessionRef.current.then((session: any) => {
                     session.sendToolResponse({
                       functionResponses: {
                         id: fc.id,
                         name: fc.name,
                         response: { result: "Image displayed." }
                       }
                     });
                   });
                 } else if (fc.name === 'save_vocabulary') {
                    const args = fc.args as any;
                    setVocabulary(prev => [...prev, {
                        word: args.word,
                        definition: args.definition,
                        example: args.example,
                        timestamp: Date.now()
                    }]);
                    
                    sessionRef.current.then((session: any) => {
                        session.sendToolResponse({
                          functionResponses: {
                            id: fc.id,
                            name: fc.name,
                            response: { result: "Word saved to notebook." }
                          }
                        });
                      });
                 }
               }
            }

            // Handle Audio
            const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio && outputAudioContextRef.current && outputGainRef.current) {
              const ctx = outputAudioContextRef.current;
              const audioData = base64ToUint8Array(base64Audio);
              const audioBuffer = await decodeAudioData(audioData, ctx, 24000, 1);
              
              const startTime = Math.max(nextStartTimeRef.current, ctx.currentTime);
              const source = ctx.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(outputGainRef.current);
              source.start(startTime);
              nextStartTimeRef.current = startTime + audioBuffer.duration;
              
              setVolume(0.8); 
              setTimeout(() => setVolume(0), audioBuffer.duration * 1000);
            }

            if (message.serverContent?.interrupted) {
               nextStartTimeRef.current = 0;
            }
          },
          onclose: () => {
             // If we closed intentionally, status is already SUMMARY. 
             // If closed unexpectedly, it might be ERROR or just DISCONNECTED.
          },
          onerror: (e) => {
            console.error(e);
            setStatus(ConnectionStatus.ERROR);
          }
        }
      });

      sessionRef.current = sessionPromise;

    } catch (error) {
      console.error(error);
      setStatus(ConnectionStatus.ERROR);
      disconnect();
    }
  }, [disconnect, isEasyMode]); // Added isEasyMode to dep array if needed, though toggle handles dyn changes

  useEffect(() => {
    return () => { disconnect(); };
  }, [disconnect]);

  return {
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
  };
};