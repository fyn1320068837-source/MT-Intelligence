
import React, { useState, useEffect, useCallback } from 'react';
import { TrendingUp, RefreshCcw, BookOpen, ExternalLink, Activity, Info, Calendar, AlertTriangle, Zap, Search } from 'lucide-react';
import { fetchMoutaiPrediction } from './services/gemini';
import { AppState, PriceData } from './types';
import MoutaiChart from './components/MoutaiChart';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    data: {
      currentPrice: 0,
      lastUpdate: "--:--",
      history: [],
      prediction: [],
      news: "",
      sources: [],
      isUpdating: false
    },
    error: null
  });

  const updateMarketData = useCallback(async () => {
    setState(prev => ({ ...prev, data: { ...prev.data, isUpdating: true }, error: null }));
    try {
      const { data, sources } = await fetchMoutaiPrediction();
      
      if (!data || !data.forecast || data.forecast.length === 0) {
        throw new Error("模型未返回有效的预测数据，请稍后刷新。");
      }

      setState(prev => ({
        ...prev,
        data: {
          ...prev.data,
          currentPrice: data.current_price,
          prediction: data.forecast,
          news: data.market_summary || "价格指数已校准至今日最新批价水平。",
          sources: sources,
          lastUpdate: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
          isUpdating: false
        },
        error: null
      }));
    } catch (err: any) {
      console.error("Update failed:", err);
      setState(prev => ({
        ...prev,
        error: `校准失败: ${err.message || '网络波动'}。`,
        data: { ...prev.data, isUpdating: false }
      }));
    }
  }, []);

  useEffect(() => {
    updateMarketData();
    const interval = setInterval(updateMarketData, 3600000); 
    return () => clearInterval(interval);
  }, [updateMarketData]);

  return (
    <div className="min-h-screen bg-[#050505] text-gray-200 selection:bg-[#C41E3A]/30">
      {state.error && (
        <div className="bg-red-600/20 border-b border-red-500/50 p-3 flex items-center justify-center gap-3 text-red-400 text-xs animate-in fade-in slide-in-from-top duration-300 z-[100] sticky top-0 backdrop-blur-md">
          <AlertTriangle className="w-4 h-4" />
          <span className="font-medium">{state.error}</span>
          <button 
            onClick={updateMarketData} 
            className="px-3 py-1 bg-red-500/20 hover:bg-red-500/40 rounded-full border border-red-500/50 transition-all font-bold"
          >
            强制刷新
          </button>
        </div>
      )}

      <header className="moutai-gradient border-b border-red-900/40 px-6 py-4 flex justify-between items-center sticky top-0 z-50 backdrop-blur-xl bg-opacity-80">
        <div className="flex items-center gap-4">
          <div className="bg-white p-1.5 rounded-lg shadow-xl ring-2 ring-white/20">
            <TrendingUp className="text-[#C41E3A] w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tighter text-white uppercase italic leading-none">Moutai 2026 Index</h1>
            <p className="text-[10px] text-red-100/60 flex items-center gap-1 mt-1">
              <Search className="w-2.5 h-2.5 text-blue-400" />
              参考批价校准：1495 - 1540 元 (散瓶)
            </p>
          </div>
        </div>
        <button 
          onClick={updateMarketData}
          disabled={state.data.isUpdating}
          className={`flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 transition-all rounded-full border border-white/10 text-xs font-bold tracking-wide active:scale-95 ${state.data.isUpdating ? 'opacity-50 cursor-wait' : ''}`}
        >
          <RefreshCcw className={`w-3.5 h-3.5 ${state.data.isUpdating ? 'animate-spin' : ''}`} />
          {state.data.isUpdating ? '正在重算行情...' : '同步 2026 行情'}
        </button>
      </header>

      <main className="max-w-7xl mx-auto p-4 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 pb-32">
        
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="bg-neutral-900/60 border border-neutral-800 p-7 rounded-[2rem] relative overflow-hidden backdrop-blur-sm">
             <div className="absolute top-0 right-0 p-4 opacity-10">
               <Zap className="w-20 h-20 text-[#D4AF37]" />
             </div>
             <p className="text-neutral-500 text-[10px] font-black uppercase tracking-[0.2em] mb-3">今日校准预测基准价</p>
             <div className="flex items-baseline gap-2 mb-6">
               <span className="text-5xl font-black text-white tabular-nums tracking-tighter">
                 {state.data.currentPrice > 0 ? `¥${state.data.currentPrice.toLocaleString()}` : '---'}
               </span>
               <span className="text-xs font-bold text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">CALIBRATED</span>
             </div>
             <div className="flex items-center justify-between text-[10px] text-neutral-500 font-mono border-t border-neutral-800 pt-5">
               <span className="flex items-center gap-1"><Activity className="w-3 h-3 text-[#C41E3A]" /> 26-FT INDEX</span>
               <span>SYNC: {state.data.lastUpdate}</span>
             </div>
          </div>

          <div className="bg-neutral-900/60 border border-neutral-800 p-6 rounded-[2rem] shadow-sm backdrop-blur-sm">
            <h3 className="text-white text-[10px] font-black mb-5 flex items-center gap-2 opacity-60 uppercase tracking-widest">
              <BookOpen className="w-3 h-3 text-[#D4AF37]" />
              行情信源参考
            </h3>
            <div className="space-y-3 overflow-y-auto max-h-[250px] no-scrollbar pr-1">
              {state.data.sources.length > 0 ? state.data.sources.map((source, i) => (
                <a 
                  key={i} 
                  href={source.uri} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block p-4 bg-white/[0.03] hover:bg-white/[0.08] rounded-2xl border border-white/[0.05] transition-all group active:scale-[0.98]"
                >
                  <div className="flex justify-between items-start gap-4">
                    <p className="text-[11px] text-neutral-400 group-hover:text-neutral-200 line-clamp-2 leading-relaxed transition-colors">{source.title}</p>
                    <ExternalLink className="w-3.5 h-3.5 text-neutral-600 group-hover:text-[#D4AF37] flex-shrink-0" />
                  </div>
                </a>
              )) : (
                <div className="py-10 text-center opacity-30">
                  <Activity className="w-5 h-5 mx-auto mb-3 animate-pulse text-neutral-700" />
                  <p className="text-[10px] font-mono tracking-widest uppercase">Fetching Grounding Data...</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-[#C41E3A]/5 border border-[#C41E3A]/10 p-5 rounded-[2rem]">
             <div className="flex items-start gap-4">
               <Info className="w-5 h-5 text-[#C41E3A] mt-0.5 shrink-0" />
               <div className="text-[10px] text-neutral-500 leading-relaxed">
                 <strong className="text-neutral-300 font-black block mb-2 text-xs uppercase tracking-tight">校准声明：</strong>
                 系统已结合用户反馈的 1495-1540 元散瓶批价进行强制校准。预测逻辑已调整为基于此“零售回归”价位的长期价值推演，排除虚高水分。
               </div>
             </div>
          </div>
        </div>

        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="bg-neutral-900/60 border border-neutral-800 p-6 lg:p-10 rounded-[2.5rem] shadow-2xl backdrop-blur-md relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#C41E3A]/50 to-transparent"></div>
             
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
              <div>
                <h3 className="text-xl font-black text-white flex items-center gap-3 tracking-tight">
                  <Calendar className="w-6 h-6 text-[#C41E3A]" />
                  未来 30 天报价趋势 (已校准)
                </h3>
                <p className="text-[11px] text-neutral-500 mt-1 uppercase tracking-widest font-mono">Calibrated Forecasting Engine (2026 Index)</p>
              </div>
            </div>
            
            <div className="relative">
               <MoutaiChart data={[]} prediction={state.data.prediction} />
               {state.data.isUpdating && (
                 <div className="absolute inset-0 bg-black/50 backdrop-blur-[6px] rounded-2xl flex items-center justify-center z-20">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-12 h-12 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin shadow-lg"></div>
                      <p className="text-[11px] text-[#D4AF37] font-black uppercase tracking-[0.3em] animate-pulse">Syncing New Baseline...</p>
                    </div>
                 </div>
               )}
            </div>
            
            <div className="mt-12 pt-8 border-t border-neutral-800/80">
              <h4 className="text-[#D4AF37] font-black text-[11px] uppercase tracking-[0.3em] mb-5 flex items-center gap-3">
                <span className="w-2 h-2 bg-[#C41E3A] rounded-full animate-ping"></span>
                今日行情深度研判 (AI Insight)
              </h4>
              <div className="prose prose-invert prose-sm max-w-none">
                {state.data.news ? (
                   <div className="bg-white/[0.02] p-6 rounded-3xl border border-white/[0.05] text-[13px] leading-relaxed text-neutral-300 font-normal shadow-inner relative">
                     <div className="absolute top-0 right-0 p-4 opacity-5 italic font-black text-4xl">ANALYSIS</div>
                     {state.data.news}
                   </div>
                ) : (
                  <div className="space-y-3 p-4 bg-neutral-800/20 rounded-2xl">
                    <div className="h-3 bg-neutral-800 rounded w-full animate-pulse"></div>
                    <div className="h-3 bg-neutral-800 rounded w-4/5 animate-pulse delay-75"></div>
                    <div className="h-3 bg-neutral-800 rounded w-5/6 animate-pulse delay-150"></div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-black/95 border-t border-neutral-800 px-6 py-4 flex gap-10 overflow-hidden items-center fixed bottom-0 w-full z-40 backdrop-blur-2xl shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
        <div className="flex-shrink-0 text-[#C41E3A] text-[10px] font-black uppercase bg-[#C41E3A]/10 px-3 py-1 rounded-lg border border-[#C41E3A]/20 tracking-widest">
          SYSTEM TERMINAL
        </div>
        <div className="flex gap-16 animate-scroll whitespace-nowrap text-[10px] text-neutral-500 font-mono items-center uppercase font-bold tracking-tight">
          <span className="flex items-center gap-2">26-FT BENCHMARK: <b className="text-white">CNY {state.data.currentPrice || '---'}</b></span>
          <span className="flex items-center gap-2 text-blue-400">CALIBRATION: <b className="text-white">1495-1540 REF</b></span>
          <span className="flex items-center gap-2 text-[#D4AF37]">SCHEMA: <b className="text-white">ENFORCED</b></span>
          <span className="flex items-center gap-2 text-green-500 text-xs animate-pulse">● LIVE SYNC</span>
          <span className="opacity-30 italic">Disclaimer: Prices represent a simulated index based on real-world retail回归 baseline.</span>
        </div>
      </footer>

      <style>{`
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-scroll {
          display: flex;
          animation: scroll 60s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default App;
