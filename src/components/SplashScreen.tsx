import { motion } from 'motion/react';

export default function SplashScreen() {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-white to-pink-100"
    >
      <div className="flex-1 flex items-center justify-center">
        <motion.h1
          animate={{ opacity: [0.2, 1, 0.2] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          className="font-script text-6xl md:text-8xl text-pink-500 drop-shadow-sm"
        >
          Wait 7abibi
        </motion.h1>
      </div>
      
      <div className="pb-12">
        <p className="font-script text-2xl md:text-3xl text-pink-400">
          Made With Love By Omar
        </p>
      </div>
    </motion.div>
  );
}
