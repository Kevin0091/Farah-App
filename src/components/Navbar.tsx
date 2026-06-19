import React from 'react';
import { Gamepad2, Heart, Gift } from 'lucide-react';
import { clsx } from 'clsx';

type Tab = 'game' | 'messages' | 'rewards';

interface NavbarProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
}

export default function Navbar({ activeTab, setActiveTab }: NavbarProps) {
  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'game', label: 'Game', icon: <Gamepad2 size={24} /> },
    { id: 'messages', label: 'Messages', icon: <Heart size={24} /> },
    { id: 'rewards', label: 'Rewards', icon: <Gift size={24} /> },
  ];

  return (
    <div className="absolute bottom-4 left-4 right-4 z-50">
      <div className="bg-white/60 backdrop-blur-lg border border-white/40 rounded-3xl p-2 shadow-xl flex justify-between items-center px-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={clsx(
              "flex flex-col items-center justify-center p-2 rounded-2xl transition-all duration-300 w-20",
              activeTab === tab.id 
                ? "bg-pink-100/80 text-pink-600 scale-105 shadow-sm" 
                : "text-gray-400 hover:text-pink-400"
            )}
          >
            {tab.icon}
            <span className="text-[10px] font-medium mt-1">{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
