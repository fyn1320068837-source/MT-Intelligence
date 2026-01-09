
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { TrendingUp, RefreshCcw, BookOpen, ExternalLink, Activity, Info, Calendar, AlertTriangle, Zap, Search, Globe, History, BrainCircuit, MessageSquareText, ShieldCheck, BarChart3, CheckCircle2, ShieldHalf } from 'lucide-react';
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
      sentimentScore: 0,
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
      
      setState(prev => ({
        ...prev,
        data: {
          currentPrice: data.current_price,
          history: data.history || [],
          prediction: data.prediction || [], // Ensure this matches PredictionState key
          sentimentScore: data.sentiment_score,
          news: data.market_summary || "多维行情实时同步成功。",
          sources: sources || [],
          lastUpdate: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
          isUpdating: false
        },
        error: null
      }));
    } catch (err: any) {
      console.error("Update failed:", err);
      setState(prev => ({
        ...prev,
        error: `连接终端失败: ${err.message || '网络通讯异常'}。请重试。`,
        data: { ...prev.data, isUpdating: false }
      }));
    }
  }, []);

  useEffect(() => {
    updateMarketData();
    const interval = setInterval(updateMarketData, 3600000); 
    return () => clearInterval(interval);
  }, [updateMarketData]);

  const sentInfo = useMemo(() => {
    const score = state.data.sentimentScore;
    if (score >= 40) return { label: '情绪乐观', color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/30' };
    if (score <= -40) return { label: '情绪悲观', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30' };
    return { label: '中性观望', color: 'text-neutral-400', bg: 'bg-neutral-500/10', border: 'border-neutral-500/30' };
  }, [state.data.sentimentScore]);

  const confidenceLevel = useMemo(() => {
    if (state.data.sources.length === 0) return 0;
    return Math.min(98, 85 + (state.data.sources.length * 2));
  }, [state.data.sources]);

  return (
    <div className="min-h-screen bg-[#050505] text-gray-200 selection:bg-[#C41E3A]/30">
      {state.error && (
        <div className="bg-red-600/20 border-b border-red-500/50 p-3 flex items-center justify-center gap-3 text-red-400 text-xs animate-in fade-in slide-in-from-top duration-300 z-[100] sticky top-0 backdrop-blur-md">
          <AlertTriangle className="w-4 h-4" />
          <span className="font-medium">{state.error}</span>
          <button onClick={updateMarketData} className="px-3 py-1 bg-red-500/20 hover:bg-red-500/40 rounded-full border border-red-500/50 transition-all font-bold">刷新终端</button>
        </div>
      )}

      <header className="moutai-gradient border-b border-red-900/40 px-6 py-4 flex flex-col sm:flex-row justify-between items-center sticky top-0 z-50 backdrop-blur-xl bg-opacity-80 gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-white p-1.5 rounded-lg shadow-xl ring-2 ring-white/20">
            <TrendingUp className="text-[#C41E3A] w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tighter text-white uppercase italic leading-none">Moutai Intelligence</h1>
            <p className="text-[10px] text-red-100/60 flex items-center gap-1 mt-1 font-mono uppercase tracking-wider">
              <Globe className="w-2.5 h-2.5 text-blue-400" />
              Real-time Market Calibration Engine
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={updateMarketData}
            disabled={state.data.isUpdating}
            className={`flex items-center gap-2 px-6 py-2.5 bg-white/5 hover:bg-white/10 transition-all rounded-full border border-white/10 text-xs font-black tracking-wide active:scale-95 ${state.data.isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <RefreshCcw className={`w-3.5 h-3.5 ${state.data.isUpdating ? 'animate-spin' : ''}`} />
            {state.data.isUpdating ? '正在比对真实批价...' : '同步实时行情'}
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 pb-32">
        
        <div className="lg:col-span-4 flex flex-col gap-6">
          <section className="bg-neutral-900/60 border border-neutral-800 p-7 rounded-[2.5rem] relative overflow-hidden backdrop-blur-sm group hover:border-[#C41E3A]/30 transition-colors">
             <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
               <Zap className="w-24 h-24 text-[#D4AF37]" />
             </div>
             <p className="text-neutral-500 text-[10px] font-black uppercase tracking-[0.2em] mb-3">今日行业基准批价</p>
             <div className="flex items-baseline gap-2 mb-6">
               <span className="text-6xl font-black text-white tabular-nums tracking-tighter">
                 {state.data.currentPrice > 0 ? `¥${state.data.currentPrice.toLocaleString()}` : '---'}
               </span>
               <span className="text-[10px] font-bold text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded border border-blue-400/20 uppercase">CNY</span>
             </div>
             <div className="flex flex-col gap-4 border-t border-neutral-800 pt-5">
               <div className="flex items-center justify-between text-[10px] text-neutral-500 font-mono">
                 <span className="flex items-center gap-1"><ShieldCheck className="w-3 h-3 text-[#C41E3A]" /> 预测置信度</span>
                 <span className="text-[#D4AF37] font-bold">{confidenceLevel}%</span>
               </div>
               <div className="h-1 w-full bg-neutral-800 rounded-full overflow-hidden">
                 <div 
                   className="h-full bg-gradient-to-r from-[#C41E3A] to-[#D4AF37] transition-all duration-1000"
                   style={{ width: `${confidenceLevel}%` }}
                 ></div>
               </div>
             </div>
          </section>

          <section className="bg-neutral-900/60 border border-neutral-800 p-6 rounded-[2.5rem] shadow-sm backdrop-blur-sm">
             <div className="flex items-center justify-between mb-4">
               <div className="flex items-center gap-2">
                 <BrainCircuit className="w-4 h-4 text-[#D4AF37]" />
                 <h3 className="text-white text-[10px] font-black uppercase tracking-widest opacity-60">市场情绪雷达</h3>
               </div>
               <span className={`text-[10px] font-bold px-3 py-1 rounded-full border ${sentInfo.bg} ${sentInfo.color} ${sentInfo.border} transition-all`}>
                 {sentInfo.label}
               </span>
             </div>
             <div className="relative pt-2 pb-6">
                <div className="h-2 w-full bg-neutral-800/50 rounded-full overflow-hidden border border-neutral-800/30">
                   <div 
                     className={`h-full transition-all duration-1000 ease-out ${state.data.sentimentScore >= 0 ? 'bg-gradient-to-r from-neutral-600 to-green-500' : 'bg-gradient-to-r from-[#C41E3A] to-neutral-600'}`}
                     style={{ 
                       width: `${Math.abs(state.data.sentimentScore)}%`, 
                       marginLeft: state.data.sentimentScore >= 0 ? '50%' : `${50 + state.data.sentimentScore}%` 
                     }}
                   ></div>
                </div>
                <div className="absolute top-0 left-1/2 -ml-[1px] h-5 w-[2px] bg-neutral-600/50"></div>
                <div className="flex justify-between mt-3 text-[9px] font-mono text-neutral-600 font-bold uppercase">
                  <span>悲观 -100</span>
                  <span>情绪分 {state.data.sentimentScore}</span>
                  <span>乐观 +100</span>
                </div>
             </div>
          </section>

          <section className="bg-neutral-900/40 border border-neutral-800 p-6 rounded-[2.5rem] shadow-sm backdrop-blur-sm flex-1">
             <div className="flex items-center gap-2 mb-4">
               <History className="w-4 h-4 text-blue-400" />
               <h3 className="text-white text-[10px] font-black uppercase tracking-widest opacity-60">实盘行情（过去7日校准）</h3>
             </div>
             <div className="space-y-2">
                {state.data.history.length > 0 ? state.data.history.slice(-7).reverse().map((h, i) => (
                  <div key={i} className="flex justify-between items-center p-3 rounded-2xl bg-white/[0.02] border border-white/[0.03] transition-colors hover:bg-white/[0.05]">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-neutral-400 font-mono">{h.date}</span>
                      <CheckCircle2 className="w-3 h-3 text-green-500/50" />
                    </div>
                    <span className="font-black text-blue-400 text-xs">¥{h.price.toLocaleString()}</span>
                  </div>
                )) : (
                  <div className="py-2 space-y-2">
                    {[1,2,3].map(n => <div key={n} className="h-10 bg-neutral-800/20 rounded-2xl animate-pulse"></div>)}
                  </div>
                )}
             </div>
          </section>
        </div>

        <div className="lg:col-span-8 flex flex-col gap-6">
          <section className="bg-neutral-900/60 border border-neutral-800 p-6 lg:p-10 rounded-[3rem] shadow-2xl backdrop-blur-md relative overflow-hidden flex flex-col">
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#C41E3A]/50 to-transparent"></div>
             
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-6">
              <div>
                <h2 className="text-2xl font-black text-white flex items-center gap-4 tracking-tight">
                  <BarChart3 className="w-7 h-7 text-[#C41E3A]" />
                  飞天茅台价格指数预测
                </h2>
                <p className="text-[11px] text-neutral-500 mt-2 uppercase tracking-[0.3em] font-mono opacity-60">Search-Based Market Calibration</p>
              </div>
              <div className="flex flex-wrap items-center gap-4 sm:gap-6 bg-black/40 px-6 py-3 rounded-full border border-white/5 backdrop-blur-lg">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.6)]"></div>
                  <span className="text-[10px] text-neutral-400 font-black uppercase tracking-widest">真实批价</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-[#D4AF37] rounded-full shadow-[0_0_8px_rgba(212,175,55,0.6)]"></div>
                  <span className="text-[10px] text-neutral-400 font-black uppercase tracking-widest">AI 预测</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-[#D4AF37]/30 rounded-full"></div>
                  <span className="text-[10px] text-neutral-400 font-black uppercase tracking-widest">置信区间</span>
                </div>
              </div>
            </div>
            
            <div className="relative mb-8">
               <MoutaiChart 
                  data={state.data.history} 
                  prediction={state.data.prediction} 
                  onRetry={updateMarketData}
                  isLoading={state.data.isUpdating}
               />
               {state.data.isUpdating && (
                 <div className="absolute inset-0 bg-black/60 backdrop-blur-[12px] rounded-[2.5rem] flex items-center justify-center z-20">
                    <div className="flex flex-col items-center gap-6">
                      <div className="w-16 h-16 border-4 border-[#C41E3A] border-t-transparent rounded-full animate-spin"></div>
                      <div className="text-center">
                        <p className="text-[12px] text-[#D4AF37] font-black uppercase tracking-[0.5em] animate-pulse">Verifying Price History...</p>
                        <p className="text-[10px] text-neutral-500 mt-2 uppercase font-mono tracking-widest">正在检索行业专业报价平台数据</p>
                      </div>
                    </div>
                 </div>
               )}
            </div>
            
            <div className="pt-10 border-t border-neutral-800/80">
              <h4 className="text-[#D4AF37] font-black text-[12px] uppercase tracking-[0.4em] mb-6 flex items-center gap-3">
                <MessageSquareText className="w-4 h-4" />
                行情深度分析 (Insights)
              </h4>
              <div className="relative">
                {state.data.news ? (
                   <div className="relative bg-white/[0.02] p-8 rounded-[2.5rem] border border-white/[0.05] text-sm leading-relaxed text-neutral-300">
                     <p className="indent-8">{state.data.news}</p>
                   </div>
                ) : (
                  <div className="h-32 bg-neutral-800/10 rounded-[2.5rem] animate-pulse"></div>
                )}
              </div>
            </div>

            <div className="mt-10">
              <h4 className="text-white text-[10px] font-black mb-5 uppercase tracking-[0.3em] opacity-40">实时信源参考 (Data Sources)</h4>
              <div className="flex flex-wrap gap-3">
                 {state.data.sources.map((s, i) => (
                   <a key={i} href={s.uri} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-full border border-white/5 text-[10px] text-neutral-400 transition-all">
                     <ExternalLink className="w-3 h-3 text-blue-400" />
                     {s.title.length > 30 ? s.title.substring(0, 30) + '...' : s.title}
                   </a>
                 ))}
              </div>
            </div>
          </section>
        </div>
      </main>

      <footer className="bg-black/95 border-t border-neutral-800 px-6 py-4 flex flex-col md:flex-row gap-6 md:gap-10 overflow-hidden items-center fixed bottom-0 w-full z-40 backdrop-blur-3xl shadow-[0_-20px_40px_rgba(0,0,0,0.7)]">
        <div className="flex-shrink-0 flex items-center gap-3 text-[#C41E3A] text-[11px] font-black uppercase bg-[#C41E3A]/10 px-4 py-1.5 rounded-full border border-[#C41E3A]/20 tracking-[0.2em]">
          <Activity className="w-4 h-4" />
          Quant Terminal
        </div>
        <div className="flex-1 w-full overflow-hidden">
          <div className="flex gap-20 animate-scroll whitespace-nowrap text-[10px] text-neutral-500 font-mono items-center uppercase font-bold">
            <span className="flex items-center gap-2 text-white">今日基准: ¥{state.data.currentPrice || '---'}</span>
            <span className="flex items-center gap-2 text-blue-400">历史校准: 垂直平台搜索</span>
            <span className="flex items-center gap-2 text-[#D4AF37]">模型: GEMINI-3 PRO-INDEX</span>
            <span className="flex items-center gap-2 text-green-500">● 数据同步: 实时</span>
            <span className="opacity-30 italic">数据仅供参考。基于搜索结果中垂直白酒报价平台的聚合分析得出。</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
