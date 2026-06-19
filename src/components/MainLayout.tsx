import { useState } from 'react';
import { motion } from 'motion/react';
import { useGameState } from '../hooks/useGameState';
import GameSection from './GameSection';
import MessagesSection from './MessagesSection';
import RewardsSection from './RewardsSection';
import Navbar from './Navbar';

type Tab = 'game' | 'messages' | 'rewards';

export default function MainLayout() {
  const [activeTab, setActiveTab] = useState<Tab>('game');
  const gameState = useGameState();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      className="flex flex-col h-screen w-full max-w-md mx-auto bg-white shadow-xl relative overflow-hidden"
    >
      {/* Top Bar for Tuna / Hearts display globally? Or maybe inside sections */}
      <div className="absolute top-0 left-0 w-full z-10 flex justify-between p-4 pointer-events-none">
        <div className="bg-white/70 backdrop-blur-md px-3 py-1.5 rounded-full shadow-sm text-pink-600 font-medium flex items-center gap-1">
          <span className="text-xl">🐟</span> {gameState.state.tunaBalance}
        </div>
        <div className="bg-white/70 backdrop-blur-md px-3 py-1.5 rounded-full shadow-sm text-red-500 font-medium flex items-center gap-1">
          <span className="text-xl">❤️</span> {gameState.state.hearts}/3
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-24 pt-16 flex flex-col">
        {activeTab === 'game' && <GameSection gameState={gameState} />}
        {activeTab === 'messages' && <MessagesSection gameState={gameState} />}
        {activeTab === 'rewards' && <RewardsSection gameState={gameState} />}
      </div>

      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
    </motion.div>
  );
}
