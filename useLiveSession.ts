import { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { createBlob, decode, decodeAudioData } from '../utils/audioUtils';

interface UseLiveSessionProps {
  apiKey: string;
  onTranscription: (text: string, type: 'user' | 'model') => void;
  onError: (error: Error) => void;
}

export const useLiveSession = ({ apiKey, onTranscription, onError }: UseLiveSessionProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false); // Model is speaking
  const [volume, setVolume] = useState(0); // For visualization

  // Audio Contexts
  const inputContextRef = useRef<AudioContext | null>(null);
  const outputContextRef = useRef<AudioContext | null>(null);
  
  // Audio Nodes
  const inputProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const inputSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const outputAnalyserRef = useRef<AnalyserNode | null>(null);
  
  // Session & State
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const activeSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const mountedRef = useRef(true);

  // Initialize Audio Contexts
  const ensureAudioContexts = () => {
    if (!inputContextRef.current) {
      inputContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
    }
    if (!outputContextRef.current) {
      outputContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      // Setup Analyser for visualization
      const analyser = outputContextRef.current.createAnalyser();
      analyser.fftSize = 256;
      outputAnalyserRef.current = analyser;
    }
  };

  const connect = useCallback(async () => {
    if (!apiKey) {
      onError(new Error("API Key is missing."));
      return;
    }

    try {
      ensureAudioContexts();
      const ai = new GoogleGenAI({ apiKey });
      
      // Get Microphone Stream
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            console.log("Session opened");
            setIsConnected(true);

            // Start Input Streaming
            if (inputContextRef.current) {
              const ctx = inputContextRef.current;
              const source = ctx.createMediaStreamSource(stream);
              const processor = ctx.createScriptProcessor(4096, 1, 1);
              
              processor.onaudioprocess = (e) => {
                 const inputData = e.inputBuffer.getChannelData(0);
                 const pcmBlob = createBlob(inputData);
                 sessionPromiseRef.current?.then((session) => {
                   session.sendRealtimeInput({ media: pcmBlob });
                 });
                 
                 // Simple input volume visualization fallback if model isn't speaking
                 if (!isSpeaking) {
                    let sum = 0;
                    for(let i=0; i<inputData.length; i++) sum += inputData[i] * inputData[i];
                    const rms = Math.sqrt(sum / inputData.length);
                    setVolume(Math.min(rms * 5, 1)); // Amplify mic input for visual
                 }
              };

              source.connect(processor);
              processor.connect(ctx.destination);
              
              inputSourceRef.current = source;
              inputProcessorRef.current = processor;
            }
          },
          onmessage: async (message: LiveServerMessage) => {
            // Handle Transcriptions
            if (message.serverContent?.modelTurn?.parts[0]?.text) {
                onTranscription(message.serverContent.modelTurn.parts[0].text, 'model');
            }

            // Handle Audio Output
            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio && outputContextRef.current && outputAnalyserRef.current) {
              const ctx = outputContextRef.current;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
              
              const audioBuffer = await decodeAudioData(
                decode(base64Audio),
                ctx,
                24000,
                1
              );

              const source = ctx.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(outputAnalyserRef.current); // Connect to analyser
              outputAnalyserRef.current.connect(ctx.destination); // Connect analyser to speakers
              
              source.addEventListener('ended', () => {
                activeSourcesRef.current.delete(source);
                if (activeSourcesRef.current.size === 0) {
                    setIsSpeaking(false);
                }
              });

              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              activeSourcesRef.current.add(source);
              setIsSpeaking(true);
            }

            // Handle Interruptions
            if (message.serverContent?.interrupted) {
              console.log("Interrupted");
              activeSourcesRef.current.forEach(src => {
                  try { src.stop(); } catch(e) {}
              });
              activeSourcesRef.current.clear();
              nextStartTimeRef.current = 0;
              setIsSpeaking(false);
            }
          },
          onclose: () => {
            console.log("Session closed");
            setIsConnected(false);
            setIsSpeaking(false);
          },
          onerror: (err) => {
            console.error("Session error:", err);
            onError(new Error("Connection error occurred."));
            setIsConnected(false);
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
          },
          systemInstruction: "You are Jarvis, a highly intelligent, sophisticated, and helpful AI assistant designed to function like a native mobile operating system intelligence. You are concise, witty, and sound professional. Keep responses short and conversational, like a voice assistant.",
        }
      });

      sessionPromiseRef.current = sessionPromise;

    } catch (err) {
      console.error("Failed to connect:", err);
      onError(err instanceof Error ? err : new Error("Failed to initialize session"));
    }
  }, [apiKey, onError, onTranscription, isSpeaking]);

  const disconnect = useCallback(() => {
    // Stop input processing
    if (inputSourceRef.current) inputSourceRef.current.disconnect();
    if (inputProcessorRef.current) inputProcessorRef.current.disconnect();
    
    // Close session if possible (wrapper doesn't expose explicit close on promise, so we rely on stream/context cleanup mostly, or if the SDK exposed it)
    // The current SDK documentation uses session.close() in rules, but sessionPromise resolves to session.
    sessionPromiseRef.current?.then(session => {
        // Safe check if close exists
        if(session && typeof session.close === 'function') {
            session.close();
        }
    });

    // Stop output audio
    activeSourcesRef.current.forEach(src => {
        try { src.stop(); } catch(e) {}
    });
    activeSourcesRef.current.clear();
    
    setIsConnected(false);
    setIsSpeaking(false);
    setVolume(0);
  }, []);

  // Animation Loop for Volume Visualization
  useEffect(() => {
    let animationFrameId: number;
    
    const render = () => {
      if (isSpeaking && outputAnalyserRef.current) {
        const dataArray = new Uint8Array(outputAnalyserRef.current.frequencyBinCount);
        outputAnalyserRef.current.getByteFrequencyData(dataArray);
        
        // Calculate average volume
        let sum = 0;
        for(let i=0; i<dataArray.length; i++) sum += dataArray[i];
        const avg = sum / dataArray.length;
        
        // Normalize to 0-1 range roughly
        setVolume(avg / 128); 
      } else if (!isSpeaking && !isConnected) {
          setVolume(0);
      }
      // If listening (connected but not speaking), volume is handled in onaudioprocess
      
      animationFrameId = requestAnimationFrame(render);
    };
    
    render();
    
    return () => cancelAnimationFrame(animationFrameId);
  }, [isSpeaking, isConnected]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
        mountedRef.current = false;
        disconnect();
    }
  }, [disconnect]);

  return { connect, disconnect, isConnected, isSpeaking, volume };
};