import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Power, MessageSquare, X, Smartphone } from 'lucide-react';
import Orb from './components/Orb';
import WelcomeScreen from './components/WelcomeScreen';
import { useLiveSession } from './hooks/useLiveSession';

// Fallback if env not set (though instructions say assume it's there, for safety in this strict environment)
const API_KEY = process.env.API_KEY || '';

const App: React.FC = () => {
  const [hasStarted, setHasStarted] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [transcripts, setTranscripts] = useState<Array<{text: string, type: 'user' | 'model'}>>([]);
  
  const handleTranscription = (text: string, type: 'user' | 'model') => {
    setTranscripts(prev => [...prev.slice(-4), { text, type }]);
  };

  const handleError = (error: Error) => {
    alert(error.message);
    // In a real app, show a toast
  };

  const { connect, disconnect, isConnected, isSpeaking, volume } = useLiveSession({
    apiKey: API_KEY,
    onTranscription: handleTranscription,
    onError: handleError
  });

  const handleStart = async () => {
    try {
        await connect();
        setHasStarted(true);
    } catch (e) {
        console.error(e);
    }
  };

  const handleStop = () => {
    disconnect();
    setHasStarted(false);
    setTranscripts([]);
  };

  if (!hasStarted) {
    return <WelcomeScreen onStart={handleStart} />;
  }

  return (
    <div className="relative h-screen w-full bg-black overflow-hidden flex flex-col font-sans">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-gradient-to-b from-blue-900/10 to-black pointer-events-none" />

      {/* Header */}
      <header className="absolute top-0 w-full p-6 flex justify-between items-center z-20">
        <div className="flex items-center space-x-2 opacity-70">
           <Smartphone size={16} className="text-white" />
           <span className="text-xs text-white tracking-widest uppercase">Jarvis System</span>
        </div>
        <button 
            onClick={() => setShowChat(!showChat)}
            className={`p-3 rounded-full transition-all duration-300 ${showChat ? 'bg-white text-black' : 'bg-white/10 text-white'}`}
        >
            <MessageSquare size={20} />
        </button>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col items-center justify-center relative z-10">
        
        {/* The Orb */}
        <div className="mb-12 transition-transform duration-500">
           <Orb volume={volume} isActive={isConnected} isSpeaking={isSpeaking} />
        </div>

        {/* Status Text */}
        <div className="h-8 mb-8">
            {isConnected ? (
                isSpeaking ? (
                    <p className="text-cyan-400 font-medium tracking-widest text-sm animate-pulse">JARVIS IS SPEAKING...</p>
                ) : (
                    <p className="text-purple-400 font-medium tracking-widest text-sm animate-pulse">LISTENING...</p>
                )
            ) : (
                <p className="text-gray-500 font-medium tracking-widest text-sm">DISCONNECTED</p>
            )}
        </div>

        {/* Transcripts Overlay (Simulated Subtitles) */}
        {!showChat && transcripts.length > 0 && (
             <div className="absolute bottom-32 w-full px-8 text-center pointer-events-none">
                <p className="text-xl font-medium text-white/90 drop-shadow-lg leading-relaxed transition-all duration-300">
                    "{transcripts[transcripts.length - 1].text}"
                </p>
             </div>
        )}
      </main>

      {/* Chat History Drawer (Overlay) */}
      <div 
        className={`absolute inset-x-0 bottom-0 bg-gray-900/90 backdrop-blur-xl rounded-t-3xl transition-transform duration-500 ease-spring z-30 flex flex-col ${showChat ? 'translate-y-0 h-3/4' : 'translate-y-full h-0'}`}
      >
        <div className="p-4 flex justify-between items-center border-b border-white/10">
            <h2 className="text-white font-semibold">Conversation History</h2>
            <button onClick={() => setShowChat(false)} className="p-2 text-gray-400 hover:text-white">
                <X size={20} />
            </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {transcripts.map((t, i) => (
                <div key={i} className={`flex ${t.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${t.type === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-gray-800 text-gray-200 rounded-bl-none'}`}>
                        {t.text}
                    </div>
                </div>
            ))}
            {transcripts.length === 0 && (
                <div className="text-center text-gray-500 mt-10">No conversation yet.</div>
            )}
        </div>
      </div>

      {/* Bottom Controls */}
      <footer className="w-full p-8 flex justify-center items-center space-x-8 z-20 pb-12">
        <button 
            className="p-4 rounded-full bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all active:scale-95"
            onClick={() => {/* Toggle Mic Mute logic could go here */}}
        >
            <Mic size={24} />
        </button>

        <button 
            onClick={handleStop}
            className="w-16 h-16 rounded-full bg-red-500/20 border border-red-500/50 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all duration-300 shadow-[0_0_30px_rgba(239,68,68,0.3)] active:scale-90"
        >
            <Power size={28} />
        </button>
      </footer>
    </div>
  );
};

export default App;