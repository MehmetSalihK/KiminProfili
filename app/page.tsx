'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Briefcase, Siren, Globe, RefreshCw, X, Check, ExternalLink, ArrowRight, Timer, ListOrdered, Trophy, Play, Settings2 } from 'lucide-react';
import { GameData } from './types';

export default function Home() {
  const [gameState, setGameState] = useState<'MENU' | 'LOADING' | 'PLAYING' | 'RESULT' | 'SUMMARY' | 'ERROR'>('MENU');
  const [gameMode, setGameMode] = useState<'TIMED' | 'QUANTITY'>('QUANTITY');
  const [targetValue, setTargetValue] = useState<number>(20); 
  const [progress, setProgress] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [score, setScore] = useState<number>(0);
  
  const [data, setData] = useState<GameData | null>(null);
  const [userGuess, setUserGuess] = useState<'INTERPOL' | 'LINKEDIN' | null>(null);
  const [isFetching, setIsFetching] = useState<boolean>(false);

  // Timer Logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (gameState === 'PLAYING' && gameMode === 'TIMED') {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setGameState('SUMMARY'); 
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [gameState, gameMode]);

  // Data Fetching
  const fetchData = async () => {
    setIsFetching(true);
    
    // Only show full loading screen if NOT in Timed mode rapid-fire
    // If we are starting fresh (MENU/SUMMARY), we show LOADING but maybe fast.
    if (gameMode !== 'TIMED' || gameState !== 'PLAYING') {
        setGameState('LOADING');
    }

    try {
      const res = await axios.get<GameData>('/api/game');
      setData(res.data);
      
      if (gameMode === 'TIMED') {
          setGameState('PLAYING'); // Instant
      } else {
          // Cinematic delay for Quantity Mode
          setTimeout(() => setGameState('PLAYING'), 800);
      }
    } catch (error) {
      console.error('API Error:', error);
      setGameState('ERROR');
    } finally {
      setIsFetching(false);
    }
  };

  // Game Handlers
  const handleStartGame = () => {
    setProgress(0);
    setScore(0);
    if (gameMode === 'TIMED') setTimeLeft(60);
    fetchData();
  };

  const handleMainMenu = () => {
    setGameState('MENU');
    setData(null);
    setIsFetching(false);
  };

  const handleRetry = () => fetchData();

  const handleGuess = (guess: 'INTERPOL' | 'LINKEDIN') => {
    if (isFetching) return; // Prevent double clicks

    const isCorrect = guess === data?.type;
    
    if (isCorrect) {
        setScore(s => s + 100);
    }

    if (gameMode === 'TIMED') {
        // FAST FLOW for Time Mode
        const newProgress = progress + 1;
        setProgress(newProgress);
        fetchData();
    } else {
        // Normal Flow for Quantity Mode
        setUserGuess(guess);
        setGameState('RESULT');
    }
  };

  const handleNext = () => {
    const newProgress = progress + 1;
    setProgress(newProgress);

    if (gameMode === 'QUANTITY' && newProgress >= targetValue) {
         setGameState('SUMMARY');
         return;
    }
    
    if (gameMode === 'TIMED' && timeLeft <= 0) {
        setGameState('SUMMARY');
        return;
    }

    setUserGuess(null);
    fetchData();
  };

  const isCorrect = userGuess === data?.type;

  // Stats for Summary
  const correctCount = score / 100;
  const wrongCount = progress - correctCount;

  return (
    <main className="min-h-screen bg-slate-950 text-white font-sans overflow-hidden selection:bg-cyan-500/30">
      
      {/* BACKGROUND ELEMENTS */}
      <div className="fixed inset-0 z-0 pointer-events-none">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#1e293b_0%,_#020617_100%)]"></div>
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03]"></div>
          <div className="absolute top-0 left-0 w-full h-full bg-grid-white/[0.02] bg-[length:50px_50px]"></div>
      </div>

      {/* HEADER */}
      <motion.header 
        initial={{ y: -100 }} animate={{ y: 0 }}
        className="fixed top-0 left-0 w-full z-50 h-20 bg-slate-900/80 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-6 shadow-2xl"
      >
      <button 
        onClick={handleMainMenu} 
        className="flex items-center gap-4 cursor-pointer group hover:opacity-90 transition-all focus:outline-none"
      >
            <div className="relative">
                <div className="absolute -inset-1 bg-cyan-500 rounded-full opacity-20 group-hover:opacity-40 blur transition-all"></div>
                <Image src="/KiminProfili.png" alt="Logo" width={40} height={40} className="relative h-10 w-auto" priority />
            </div>
            <div className="text-left">
                <h1 className="text-xl font-orbitron font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 group-hover:to-white transition-all">
                    Kimin Profili?
                </h1>
                <p className="text-[10px] text-cyan-500 font-mono tracking-[0.2em] uppercase">Vatandaş Kontrol Sistemi</p>
            </div>
      </button>
      </motion.header>

      {/* MAIN CONTENT AREA */}
      <div className="relative z-10 w-full min-h-screen flex flex-col items-center justify-center p-4 pt-24 md:pt-28 pb-8">
        <AnimatePresence mode="wait">

          {/* === MENU STATE === */}
          {gameState === 'MENU' && (
            <motion.div 
              key="menu"
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05, filter: "blur(10px)" }}
              className="w-full max-w-lg"
            >
              <div className="bg-slate-900/80 backdrop-blur-2xl border border-slate-700/50 p-8 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                <div className="text-center mb-6">
                    <h2 className="text-3xl font-orbitron font-black text-white mb-2">GÖREV SEÇİMİ</h2>
                    <p className="text-slate-400 text-sm">Lütfen operasyon modunu belirleyin.</p>
                </div>

                {/* INFO & DISCLAIMER - MOVED TO TOP */}
                <div className="space-y-4 mb-8">
                    <div className="grid grid-cols-2 gap-4 text-center">
                         <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-800">
                             <Briefcase size={20} className="text-cyan-400 mx-auto mb-1"/>
                             <div className="text-[10px] font-bold text-cyan-400">LINKEDIN</div>
                             <div className="text-[9px] text-slate-500">Sivil Profesyonel</div>
                         </div>
                         <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-800">
                             <Siren size={20} className="text-red-500 mx-auto mb-1"/>
                             <div className="text-[10px] font-bold text-red-500">INTERPOL</div>
                             <div className="text-[9px] text-slate-500">Aranan Şahıs</div>
                         </div>
                    </div>
                    
                    <div className="bg-slate-950/30 p-3 rounded-lg text-left border-l-2 border-yellow-500/50">
                        <p className="text-[10px] text-slate-400 font-mono leading-relaxed opacity-70">
                            <span className="text-yellow-500 font-bold">⚠️ SİSTEM NOTU:</span> Veriler LinkedIn ve Interpol API&apos;lerinden anlık çekilmektedir. Bu site bir eğitim/demo projesidir (GDPR/KVKK uyumlu). Gerçek istihbarat aracı değildir.
                        </p>
                    </div>
                </div>

                {/* Mode Selectors */}
                <div className="grid grid-cols-2 gap-4 mb-8">
                    <button 
                        onClick={() => setGameMode('QUANTITY')}
                        className={`p-6 rounded-2xl border transition-all duration-300 relative overflow-hidden group ${gameMode === 'QUANTITY' ? 'bg-cyan-950/30 border-cyan-500 ring-1 ring-cyan-500/50' : 'bg-slate-800/30 border-slate-700 hover:border-slate-500'}`}
                    >
                        <ListOrdered className={`w-8 h-8 mb-3 ${gameMode === 'QUANTITY' ? 'text-cyan-400' : 'text-slate-500'}`} />
                        <span className={`block font-bold text-sm mb-1 ${gameMode === 'QUANTITY' ? 'text-white' : 'text-slate-400'}`}>HEDEF MODU</span>
                        <span className="text-[10px] text-slate-500">Belirli sayıda analiz</span>
                    </button>

                    <button 
                        onClick={() => setGameMode('TIMED')}
                        className={`p-6 rounded-2xl border transition-all duration-300 relative overflow-hidden group ${gameMode === 'TIMED' ? 'bg-red-950/30 border-red-500 ring-1 ring-red-500/50' : 'bg-slate-800/30 border-slate-700 hover:border-slate-500'}`}
                    >
                        <Timer className={`w-8 h-8 mb-3 ${gameMode === 'TIMED' ? 'text-red-400' : 'text-slate-500'}`} />
                        <span className={`block font-bold text-sm mb-1 ${gameMode === 'TIMED' ? 'text-white' : 'text-slate-400'}`}>ZAMAN MODU</span>
                        <span className="text-[10px] text-slate-500">Zamana karşı yarış</span>
                    </button>
                </div>

                {/* Settings Panel */}
                <div className="bg-slate-950/30 rounded-xl p-6 border border-white/5 mb-8">
                    {gameMode === 'QUANTITY' ? (
                        <>
                            <div className="flex justify-between items-center mb-4">
                                <span className="text-xs font-bold text-cyan-400 tracking-widest flex items-center gap-2">
                                    <Settings2 size={14}/> HEDEF SAYISI
                                </span>
                                <span className="text-xl font-mono font-bold text-white">{targetValue}</span>
                            </div>
                            <input 
                                type="range" min="5" max="50" step="5"
                                value={targetValue} onChange={(e) => setTargetValue(Number(e.target.value))}
                                className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500 hover:accent-cyan-400"
                            />
                            <div className="flex justify-between text-[10px] text-slate-600 mt-2 font-mono">
                                <span>5</span><span>50</span>
                            </div>
                        </>
                    ) : (
                        <div className="flex items-center gap-4 text-slate-400">
                             <div className="p-3 bg-red-500/10 rounded-lg text-red-400"><Timer size={20}/></div>
                             <div className="flex-1">
                                 <p className="text-sm font-bold text-white mb-0.5">60 Saniye</p>
                                 <p className="text-xs opacity-70">En yüksek skoru elde etmeye çalış!</p>
                             </div>
                        </div>
                    )}
                </div>

                <button 
                    onClick={handleStartGame}
                    disabled={isFetching}
                    className="w-full py-5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-xl shadow-lg shadow-cyan-900/20 active:scale-[0.98] transition-all flex items-center justify-center gap-3 text-lg tracking-widest font-orbitron disabled:opacity-50"
                >
                    {isFetching ? <RefreshCw className="animate-spin" /> : <><Play size={20} fill="currentColor" /> BAŞLAT</>}
                </button>
              </div>
            </motion.div>
          )}

          {/* === LOADING STATE === */}
          {gameState === 'LOADING' && (
            <motion.div 
               key="loading"
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               className="flex flex-col items-center gap-8"
            >
                <div className="relative w-32 h-32">
                    <div className="absolute inset-0 border-4 border-slate-700/30 rounded-full"></div>
                    <div className="absolute inset-0 border-t-4 border-cyan-500 rounded-full animate-spin"></div>
                    <div className="absolute inset-4 bg-slate-800 rounded-full flex items-center justify-center shadow-inner">
                        <RefreshCw className="text-cyan-500 animate-spin" size={32} />
                    </div>
                </div>
                <div className="text-center space-y-2">
                    <p className="text-cyan-400 text-sm font-bold tracking-[0.3em] animate-pulse">VERİTABANI EŞLEŞTİRİLİYOR</p>
                    <p className="text-slate-500 text-xs font-mono">Şifreli bağlantı kuruluyor...</p>
                </div>
            </motion.div>
          )}

          {/* === PLAYING / RESULT STATE === */}
          {(gameState === 'PLAYING' || gameState === 'RESULT') && data && (
            <motion.div 
              key="game"
              initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -50, opacity: 0 }}
              className="w-full max-w-md flex flex-col gap-6"
            >
              {/* HUD */}
              <div className="flex items-center justify-between w-full max-w-sm mx-auto mb-6 bg-slate-950/50 backdrop-blur-md border border-white/10 p-4 rounded-2xl shadow-2xl relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500/50"></div>
                  
                  {/* Progress / Target */}
                  <div className="flex flex-col pl-2">
                      <span className="text-[10px] font-bold text-cyan-500 tracking-[0.2em] mb-1 font-mono uppercase">ANALİZ SAYISI</span>
                      <div className="flex items-baseline gap-1">
                          <span className="text-3xl font-black font-orbitron text-white">{progress}</span>
                          <span className="text-sm font-bold text-slate-600 font-mono">/ {gameMode === 'TIMED' ? '∞' : targetValue}</span>
                      </div>
                  </div>
                  
                  {/* Timer (Only in Timed Mode) */}
                  {gameMode === 'TIMED' && (
                     <div className={`flex items-center gap-3 px-4 py-2 rounded-xl border ${timeLeft < 10 ? 'bg-red-500/20 border-red-500 animate-pulse' : 'bg-slate-900 border-slate-700'}`}>
                         <Timer className={`w-5 h-5 ${timeLeft < 10 ? 'text-red-500' : 'text-slate-400'}`} />
                         <span className={`text-2xl font-black font-orbitron tabular-nums ${timeLeft < 10 ? 'text-red-500' : 'text-white'}`}>
                            {timeLeft}<span className="text-xs font-bold opacity-50 ml-0.5">s</span>
                         </span>
                     </div>
                  )}
              </div>

              {/* CARD */}
              <div className="relative group perspective-1000">
                  <div className="relative bg-slate-900 border border-slate-700 rounded-[2rem] overflow-hidden shadow-2xl aspect-[4/5] transform transition-transform duration-500 group-hover:scale-[1.01]">
                      {/* Image */}
                      <Image 
                        src={data.data.photoUrl} 
                        alt="Target"
                        fill
                        className="w-full h-full object-cover transition-all duration-700 grayscale-[0.2] group-hover:grayscale-0"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                      
                      {/* Overlays */}
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-90"></div>
                      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay"></div>
                      
                      {/* Fetching Overlay for Timed Mode */}
                      {isFetching && gameMode === 'TIMED' && (
                         <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-30 flex items-center justify-center">
                             <RefreshCw className="text-cyan-500 animate-spin w-12 h-12"/>
                         </div>
                      )}

                      {/* Info */}
                      <div className="absolute bottom-0 left-0 w-full p-6 z-20 bg-gradient-to-t from-black/90 via-black/60 to-transparent pt-20">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                              {/* Country Badge */}
                              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-cyan-950/60 backdrop-blur-md border border-cyan-500/30 text-cyan-400 text-[10px] font-bold tracking-wider uppercase shadow-[0_0_10px_rgba(34,211,238,0.2)]">
                                  <Globe size={10} /> {data.data.country}
                              </div>
                          </div>
                          
                          <h2 className="text-3xl font-black font-orbitron text-white drop-shadow-xl leading-none mb-2">{data.data.fullName}</h2>
                          
                          {/* Decorative Lines */}
                          <div className="flex gap-1">
                              <div className="w-16 h-1 bg-cyan-500 rounded-full shadow-[0_0_10px_#22d3ee]"></div>
                              <div className="w-4 h-1 bg-slate-600 rounded-full"></div>
                              <div className="w-2 h-1 bg-slate-700 rounded-full"></div>
                          </div>
                      </div>
                  </div>
              </div>

              {/* ACTIONS */}
              <div className="grid grid-cols-2 gap-4">
                  <button 
                    disabled={gameState === 'RESULT' || isFetching}
                    onClick={() => handleGuess('LINKEDIN')}
                    className="relative overflow-hidden bg-slate-800/50 hover:bg-cyan-900/20 border border-slate-700 hover:border-cyan-500/50 p-4 rounded-2xl flex flex-col items-center gap-2 transition-all group disabled:opacity-50"
                  >
                      <Briefcase className="w-8 h-8 text-cyan-400 group-hover:scale-110 transition-transform" />
                      <span className="text-xs font-bold tracking-widest text-cyan-100">LINKEDIN</span>
                  </button>

                  <button 
                    disabled={gameState === 'RESULT' || isFetching}
                    onClick={() => handleGuess('INTERPOL')}
                    className="relative overflow-hidden bg-slate-800/50 hover:bg-red-900/20 border border-slate-700 hover:border-red-500/50 p-4 rounded-2xl flex flex-col items-center gap-2 transition-all group disabled:opacity-50"
                  >
                      <Siren className="w-8 h-8 text-red-500 group-hover:scale-110 transition-transform" />
                      <span className="text-xs font-bold tracking-widest text-red-100">INTERPOL</span>
                  </button>
              </div>

              {/* FOOTER NOTE */}
              <p className="text-[9px] text-center text-slate-600 font-mono uppercase tracking-widest">
                  ⚠️ Bu bir simülasyon oyunudur. Veriler temsilidir.
              </p>

              {/* RESULT OVERLAY */}
              <AnimatePresence>
                {gameState === 'RESULT' && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-sm p-6 rounded-3xl backdrop-blur-xl border shadow-2xl flex flex-col items-center text-center z-50 ${isCorrect ? 'bg-cyan-950/95 border-cyan-500' : 'bg-red-950/95 border-red-500'}`}
                    >
                        {isCorrect ? <Check className="w-16 h-16 text-cyan-400 mb-2 drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]" /> : <X className="w-16 h-16 text-red-500 mb-2 drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]" />}
                        <h3 className="text-2xl font-black font-orbitron text-white mb-1">{isCorrect ? 'DOĞRU TESPİT' : 'HATALI ANALİZ'}</h3>
                        <p className="text-sm font-bold opacity-80 mb-2">{data?.type === 'INTERPOL' ? 'ARANAN ŞAHIS' : 'SİVİL PROFİL'}</p>
                        
                        {/* Revealed Detail */}
                        <div className="bg-black/30 px-4 py-2 rounded-xl mb-6 border border-white/5 backdrop-blur-sm">
                            <span className="text-[10px] uppercase tracking-widest opacity-60 block mb-1">
                                {data?.type === 'INTERPOL' ? 'SUÇ' : 'MESLEK'}
                            </span>
                            <span className="text-sm font-bold text-white leading-tight block">
                                {data?.data.detail}
                            </span>
                        </div>
                        
                        <div className="w-full space-y-3">
                            <button onClick={handleNext} className="w-full py-4 bg-white text-slate-900 font-bold rounded-xl flex justify-center items-center gap-2 hover:bg-slate-200 transition-colors">
                                SONRAKİ <ArrowRight size={18} />
                            </button>
                            <a href={data?.data.realLink} target="_blank" className="block w-full py-3 text-xs font-bold text-white/70 hover:text-white border border-white/20 rounded-xl hover:bg-white/10 transition-all">
                                PROFİLİ İNCELE <ExternalLink size={16} className="inline ml-2" />
                            </a>
                        </div>
                    </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* === SUMMARY STATE === */}
          {gameState === 'SUMMARY' && (
            <motion.div 
              key="summary"
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              className="w-full max-w-sm"
            >
               <div className="bg-slate-900/90 backdrop-blur-2xl border border-white/10 p-8 rounded-3xl text-center shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-cyan-500 to-blue-500"></div>
                    
                    <Trophy className="w-16 h-16 text-yellow-400 mx-auto mb-6 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]" />
                    <h2 className="text-3xl font-orbitron font-black text-white mb-2">OPERASYON TAMAMLANDI</h2>
                    <p className="text-slate-400 text-sm mb-8">Görev raporu hazırlandı.</p>

                    <div className="grid grid-cols-2 gap-4 mb-8">
                        <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
                             <div className="text-xs font-bold text-slate-500 mb-1">DOĞRU</div>
                             <div className="text-2xl font-black text-green-400">{correctCount}</div>
                        </div>
                        <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
                             <div className="text-xs font-bold text-slate-500 mb-1">YANLIŞ</div>
                             <div className="text-2xl font-black text-red-400">{wrongCount}</div>
                        </div>
                    </div>
                
                    <div className="bg-slate-800/50 p-2 rounded-lg text-xs text-slate-400 mb-6">
                        Toplam Analiz: <span className="text-white font-bold">{progress}</span>
                    </div>

                    <button 
                        onClick={handleMainMenu}
                        className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-all border border-slate-600"
                    >
                        YENİ GÖREV
                    </button>
               </div>
            </motion.div>
          )}

          {/* === ERROR STATE === */}
          {gameState === 'ERROR' && (
             <motion.div className="bg-red-950/50 border border-red-500/30 p-8 rounded-2xl text-center max-w-xs">
                 <X className="w-12 h-12 text-red-500 mx-auto mb-4" />
                 <h3 className="text-xl font-bold text-red-200 mb-2">BAĞLANTI HATASI</h3>
                 <button onClick={handleRetry} className="px-6 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-500 transition-colors">
                     TEKRAR DENE
                 </button>
             </motion.div>
          )}

        </AnimatePresence>
      </div>
    </main>
  );
}
