import React from 'react';

interface OrbProps {
  volume: number; // 0 to 1
  isActive: boolean;
  isSpeaking: boolean;
}

const Orb: React.FC<OrbProps> = ({ volume, isActive, isSpeaking }) => {
  // Base scale is 1, expands with volume
  const scale = 1 + volume * 1.5;
  
  // Colors change based on state
  const coreColor = isSpeaking 
    ? 'bg-cyan-400' 
    : isActive 
      ? 'bg-purple-500' 
      : 'bg-gray-600';

  const glowColor = isSpeaking
    ? 'shadow-[0_0_100px_rgba(34,211,238,0.6)]'
    : isActive
      ? 'shadow-[0_0_80px_rgba(168,85,247,0.5)]'
      : 'shadow-[0_0_50px_rgba(75,85,99,0.3)]';

  return (
    <div className="relative flex items-center justify-center w-64 h-64">
      {/* Outer Ring 1 */}
      <div 
        className={`absolute w-full h-full rounded-full border-2 border-opacity-20 border-white transition-all duration-75 ease-out`}
        style={{ transform: `scale(${1 + volume * 0.5})` }}
      />
      
      {/* Outer Ring 2 (Delayed) */}
      <div 
        className={`absolute w-48 h-48 rounded-full border border-opacity-30 border-white transition-all duration-150 ease-out`}
        style={{ transform: `scale(${1 + volume * 0.8})` }}
      />

      {/* Main Glowing Core */}
      <div 
        className={`relative w-32 h-32 rounded-full ${coreColor} ${glowColor} transition-all duration-75 ease-out blur-md opacity-90`}
        style={{ transform: `scale(${scale})` }}
      >
        <div className="absolute inset-0 bg-white opacity-30 rounded-full animate-pulse"></div>
      </div>
      
      {/* Inner White Core */}
      <div 
        className="absolute w-24 h-24 bg-white rounded-full blur-xl opacity-80 mix-blend-overlay transition-transform duration-75"
        style={{ transform: `scale(${scale * 0.8})` }}
      />
    </div>
  );
};

export default Orb;