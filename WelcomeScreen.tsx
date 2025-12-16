import React from 'react';
import { ShieldCheck, Mic } from 'lucide-react';

interface WelcomeScreenProps {
  onStart: () => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onStart }) => {
  return (
    <div className="h-full w-full flex flex-col items-center justify-center p-8 text-center space-y-8 bg-black">
      <div className="relative">
        <div className="w-24 h-24 bg-gradient-to-tr from-cyan-500 to-blue-600 rounded-full animate-pulse blur-xl absolute top-0 left-0"></div>
        <div className="w-24 h-24 bg-gray-900 rounded-full flex items-center justify-center relative border border-gray-700 z-10">
           <span className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">J</span>
        </div>
      </div>

      <div className="space-y-4 max-w-sm">
        <h1 className="text-3xl font-bold text-white tracking-tight">Meet Jarvis</h1>
        <p className="text-gray-400 text-sm leading-relaxed">
          Your intelligent voice assistant. Capable of real-time conversation, reasoning, and assistance.
        </p>
      </div>

      <div className="w-full max-w-xs space-y-4">
        <div className="flex items-center space-x-4 p-4 rounded-2xl bg-white/5 border border-white/10">
          <div className="p-2 bg-blue-500/20 rounded-full text-blue-400">
            <Mic size={20} />
          </div>
          <div className="text-left">
            <h3 className="text-sm font-medium text-white">Microphone Access</h3>
            <p className="text-xs text-gray-500">Required for voice interaction</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4 p-4 rounded-2xl bg-white/5 border border-white/10">
          <div className="p-2 bg-green-500/20 rounded-full text-green-400">
             <ShieldCheck size={20} />
          </div>
          <div className="text-left">
            <h3 className="text-sm font-medium text-white">Secure Connection</h3>
            <p className="text-xs text-gray-500">Powered by Gemini Live API</p>
          </div>
        </div>
      </div>

      <button 
        onClick={onStart}
        className="w-full max-w-xs py-4 bg-white text-black font-semibold rounded-full hover:bg-gray-200 transition-colors active:scale-95 duration-200"
      >
        Initialize Jarvis
      </button>
      
      <p className="text-[10px] text-gray-600">
        By continuing, you agree to allow audio recording for the duration of the session.
      </p>
    </div>
  );
};

export default WelcomeScreen;