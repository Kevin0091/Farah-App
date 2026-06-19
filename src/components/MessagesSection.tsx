import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, Unlock, X } from 'lucide-react';
import { clsx } from 'clsx';
import { useGameState } from '../hooks/useGameState';

const MESSAGES = [
  "You are my sunshine today and always",
  "My love for you grows stronger every single day",
  "Every moment with you is a precious gift",
  "I cherish the smile that brightens my world",
  "You are the dream I never want to wake up from",
  "My heart beats only for you my beautiful wife",
  "Holding your hand makes everything feel perfect",
  "You make my life complete in every possible way",
  "I am so lucky to call you mine forever",
  "Your love gives me wings to fly",
  "Whenever I see your face all my worries disappear",
  "You are my safe place and my greatest adventure",
  "Loving you is the easiest thing I have ever done",
  "My soul found its perfect match in yours",
  "I will love you until the end of time",
  "Your voice is the sweetest melody I have ever heard",
  "I fall for you more every time our eyes meet",
  "You are the most beautiful part of my life",
  "Being with you is like a wonderful dream come true",
  "Thank you for being my everything"
];

interface Props {
  gameState: ReturnType<typeof useGameState>;
}

export default function MessagesSection({ gameState }: Props) {
  const [selectedMsgIndex, setSelectedMsgIndex] = useState<number | null>(null);

  const handleCardClick = (index: number) => {
    const isUnlocked = gameState.state.unlockedMessages[index];
    if (isUnlocked) {
      setSelectedMsgIndex(index);
    } else {
      if (gameState.state.tunaBalance >= 50) {
        gameState.unlockMessage(index, 50);
        setSelectedMsgIndex(index); // Auto open upon unlock
      } else {
        // Not enough tuna handling (could be a small toast, but we'll let it be visual)
      }
    }
  };

  return (
    <div className="px-4 py-6">
      <div className="text-center mb-8">
        <h2 className="font-script text-4xl text-pink-500 mb-2">Love Messages</h2>
        <p className="text-sm text-pink-400">Unlock a sweet note for 50 🐟</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {MESSAGES.map((msg, index) => {
          const isUnlocked = gameState.state.unlockedMessages[index];
          const canUnlock = !isUnlocked && gameState.state.tunaBalance >= 50;

          return (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              key={index}
              onClick={() => handleCardClick(index)}
              className={clsx(
                "relative h-24 rounded-2xl p-4 flex flex-col items-center justify-center transition-colors overflow-hidden border shadow-sm",
                isUnlocked 
                  ? "bg-pink-50 border-pink-200 text-pink-600" 
                  : "bg-gray-100 border-gray-200 text-gray-400"
              )}
            >
              {isUnlocked ? (
                <>
                  <Unlock size={24} className="mb-2 opacity-50" />
                  <span className="text-xs font-medium">Message #{index + 1}</span>
                </>
              ) : (
                <>
                  <Lock size={24} className="mb-2" />
                  <span className="text-xs font-medium bg-gray-200/80 px-2 py-1 rounded-full flex items-center gap-1">
                    50 🐟
                  </span>
                </>
              )}
              
              {!isUnlocked && canUnlock && (
                <div className="absolute inset-0 bg-pink-400/10 animate-pulse border-2 border-pink-300 rounded-2xl pointer-events-none" />
              )}
            </motion.button>
          );
        })}
      </div>

      <AnimatePresence>
        {selectedMsgIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-white/40 backdrop-blur-md p-4"
            onClick={() => setSelectedMsgIndex(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl relative border-2 border-pink-100 mx-auto"
            >
              <button 
                onClick={() => setSelectedMsgIndex(null)}
                className="absolute top-4 right-4 text-pink-300 hover:text-pink-500"
              >
                <X size={24} />
              </button>
              
              <div className="text-center mt-4">
                <div className="flex justify-center mb-6">
                  <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center text-3xl">
                    💌
                  </div>
                </div>
                <h3 className="font-script text-3xl text-pink-500 mb-6 px-4 leading-relaxed">
                  {MESSAGES[selectedMsgIndex]}
                </h3>
                <div className="mt-8 text-pink-300 font-medium text-sm">
                  Message #{selectedMsgIndex + 1}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
