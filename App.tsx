
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { TrendingUp, RefreshCcw, ExternalLink, Activity, History, BrainCircuit, MessageSquareText, ShieldCheck, BarChart3, CheckCircle2, Globe, Zap, Edit3, Save, X, RotateCcw, AlertTriangle } from 'lucide-react';
import { fetchMoutaiPrediction } from './services/gemini';
import { AppState, PriceData } from './types';
import MoutaiChart from './components/MoutaiChart';

const App: React.FC = () => {
  const [isEditingHistory, setIsEditingHistory] = useState(false);
  const [tempHistory, setTempHistory] = useState<PriceData[]>([]);
  
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
          prediction: data.prediction || [],
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

  const handleStartEdit = () => {
    setTempHistory(JSON.parse(JSON.stringify(state.data.history)));
    setIsEditingHistory(true);
  };

  const handleCancelEdit = () => {
    setIsEditingHistory(false);
  };

  const handleSaveEdit = () => {
    setState(prev => ({
      ...prev,
      data: {
        ...prev.data,
        history: tempHistory,
        currentPrice: tempHistory.length > 0 ? tempHistory[tempHistory.length - 1].price : prev.data.currentPrice
      }
    }));
    setIsEditingHistory(false);
  };

  const handlePriceChange = (index: number, value: string) => {
    const numValue = parseInt(value) || 0;
    const newHistory = [...tempHistory];
    newHistory[index] = { ...newHistory[index], price: numValue };
    setTempHistory(newHistory);
  };

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
    <div className="min-h-screen bg-[#050505] text-gray-200 selection:bg-[#C41E3A]/30 pb-20">
      {/* Added AlertTriangle to lucide-react imports above */}
      {state.error && (
        <div className="bg-red-600/20 border-b border-red-500/50 p-3 flex items-center justify-center gap-3 text-red-400 text-xs animate-in fade-in slide-in-from-top duration-300 z-[100] sticky top-0 backdrop-blur-md">
          <AlertTriangle className="w-4 h-4" />
          <span className="font-medium">{state.error}</span>
          <button onClick={updateMarketData} className="px-3 py-1 bg-red-500/20 hover:bg-red-500/40 rounded-full border border-red-500/50 transition-all font-bold">刷新终端</button>
        </div>
      )}

      <header className="moutai-gradient border-b border-red-900/40 sticky top-0 z-50 backdrop-blur-xl bg-opacity-80">
        <div className="max-w-[1800px] mx-auto px-6 xl:px-12 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
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
              {state.data.isUpdating ? '同步中...' : '同步实时行情'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1800px] mx-auto p-4 xl:p-12 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        
        <div className="lg:col-span-4 xl:col-span-3 flex flex-col gap-6 lg:sticky lg:top-28 self-start">
          <section className="bg-neutral-900/60 border border-neutral-800 p-7 rounded-[2.5rem] relative overflow-hidden backdrop-blur-sm group hover:border-[#C41E3A]/30 transition-colors">
             <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
               <Zap className="w-24 h-24 text-[#D4AF37]" />
             </div>
             <p className="text-neutral-500 text-[10px] font-black uppercase tracking-[0.2em] mb-3">今日行业基准批价</p>
             <div className="flex items-baseline gap-2 mb-6">
               <span className="text-5xl xl:text-6xl font-black text-white tabular-nums tracking-tighter">
                 {state.data.currentPrice > 0 ? `¥${state.data.currentPrice.toLocaleString()}` : '---'}
               </span>
               <span className="text-[10px] font-bold text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded border border-blue-400/20 uppercase">CNY</span>
             </div>
             <div className="flex flex-col gap-4 border-t border-neutral-800 pt-5">
               <div className="flex items-center justify-between text-[10px] text-neutral-500 font-mono">
                 <span className="flex items-center gap-1"><ShieldCheck className="w-3 h-3 text-[#C41E3A]" /> 预测置信度</span>
                 <span className="text-[#D4AF37] font-bold">{confidenceLevel}%</span>
               </div>
               <div className="h-1.5 w-full bg-neutral-800 rounded-full overflow-hidden">
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

          <section className="bg-neutral-900/40 border border-neutral-800 p-6 rounded-[2.5rem] shadow-sm backdrop-blur-sm">
             <div className="flex items-center justify-between mb-6">
               <div className="flex items-center gap-2">
                 <History className="w-4 h-4 text-blue-400" />
                 <h3 className="text-white text-[10px] font-black uppercase tracking-widest opacity-60">过去7日实盘行情</h3>
               </div>
               
               {!isEditingHistory ? (
                 <button 
                  onClick={handleStartEdit}
                  className="p-2 hover:bg-white/5 rounded-full transition-colors group"
                  title="手动校准价格"
                 >
                   <Edit3 className="w-3.5 h-3.5 text-neutral-500 group-hover:text-[#D4AF37]" />
                 </button>
               ) : (
                 <div className="flex items-center gap-2">
                    <button onClick={handleSaveEdit} className="p-1.5 bg-green-500/10 text-green-400 rounded-md hover:bg-green-500/20 transition-all">
                      <Save className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={handleCancelEdit} className="p-1.5 bg-red-500/10 text-red-400 rounded-md hover:bg-red-500/20 transition-all">
                      <X className="w-3.5 h-3.5" />
                    </button>
                 </div>
               )}
             </div>

             <div className="space-y-2">
                {(isEditingHistory ? tempHistory : state.data.history).length > 0 ? 
                  (isEditingHistory ? tempHistory : state.data.history).slice(-7).reverse().map((h, i) => {
                    const originalIndex = (isEditingHistory ? tempHistory : state.data.history).length - 1 - i;
                    return (
                      <div key={i} className={`flex justify-between items-center p-4 rounded-2xl bg-white/[0.02] border transition-all ${isEditingHistory ? 'border-[#D4AF37]/30 bg-[#D4AF37]/5' : 'border-white/[0.03] hover:bg-white/[0.05]'}`}>
                        <div className="flex items-center gap-3">
                          <span className="text-[11px] text-neutral-400 font-mono">{h.date}</span>
                          {!isEditingHistory && <CheckCircle2 className="w-3 h-3 text-green-500/50" />}
                        </div>
                        
                        {isEditingHistory ? (
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-neutral-500 font-bold">¥</span>
                            <input 
                              type="number"
                              value={h.price}
                              onChange={(e) => handlePriceChange(originalIndex, e.target.value)}
                              className="w-20 bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-xs font-black text-[#D4AF37] focus:outline-none focus:border-[#C41E3A] text-right"
                            />
                          </div>
                        ) : (
                          <span className="font-black text-blue-400 text-xs">¥{h.price.toLocaleString()}</span>
                        )}
                      </div>
                    );
                  }) : (
                  <div className="py-2 space-y-2">
                    {[1,2,3,4,5].map(n => <div key={n} className="h-12 bg-neutral-800/20 rounded-2xl animate-pulse"></div>)}
                  </div>
                )}
             </div>

             {isEditingHistory && (
               <p className="mt-4 text-[9px] text-neutral-500 text-center italic font-medium">
                 注意：修改历史价格将立即影响图表趋势。
               </p>
             )}
          </section>
        </div>

        <div className="lg:col-span-8 xl:col-span-9 flex flex-col gap-6">
          <section className="bg-neutral-900/60 border border-neutral-800 p-6 lg:p-10 xl:p-12 rounded-[3.5rem] shadow-2xl backdrop-blur-md relative overflow-hidden flex flex-col min-h-[800px]">
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#C41E3A]/50 to-transparent"></div>
             
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-12 gap-8">
              <div>
                <h2 className="text-3xl font-black text-white flex items-center gap-4 tracking-tight">
                  <BarChart3 className="w-8 h-8 text-[#C41E3A]" />
                  飞天茅台价格指数预测终端
                </h2>
                <p className="text-[11px] text-neutral-500 mt-2 uppercase tracking-[0.3em] font-mono opacity-60">Strategic Market Calibration Engine • 30-Day Forecast</p>
              </div>
              <div className="flex flex-wrap items-center gap-4 sm:gap-6 bg-black/40 px-8 py-4 rounded-full border border-white/5 backdrop-blur-lg">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.6)]"></div>
                  <span className="text-[10px] text-neutral-400 font-black uppercase tracking-widest">历史实盘</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-[#D4AF37] rounded-full shadow-[0_0_8px_rgba(212,175,55,0.6)]"></div>
                  <span className="text-[10px] text-neutral-400 font-black uppercase tracking-widest">AI 预测线</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-[#D4AF37]/30 rounded-full"></div>
                  <span className="text-[10px] text-neutral-400 font-black uppercase tracking-widest">置信空间</span>
                </div>
              </div>
            </div>
            
            <div className="relative mb-12 flex-1">
               <MoutaiChart 
                  data={state.data.history} 
                  prediction={state.data.prediction} 
                  onRetry={updateMarketData}
                  isLoading={state.data.isUpdating}
               />
               {state.data.isUpdating && (
                 <div className="absolute inset-0 bg-black/60 backdrop-blur-[12px] rounded-[3rem] flex items-center justify-center z-20">
                    <div className="flex flex-col items-center gap-6">
                      <div className="w-16 h-16 border-4 border-[#C41E3A] border-t-transparent rounded-full animate-spin"></div>
                      <div className="text-center">
                        <p className="text-[14px] text-[#D4AF37] font-black uppercase tracking-[0.5em] animate-pulse">Synchronizing Global Liquidity Data...</p>
                        <p className="text-[10px] text-neutral-500 mt-3 uppercase font-mono tracking-widest">正在聚合行业垂直报价源，请稍候</p>
                      </div>
                    </div>
                 </div>
               )}
            </div>
            
            <div className="pt-12 border-t border-neutral-800/80">
              <h4 className="text-[#D4AF37] font-black text-[12px] uppercase tracking-[0.4em] mb-8 flex items-center gap-3">
                <MessageSquareText className="w-5 h-5" />
                行情深度研判 (Strategic Insights)
              </h4>
              <div className="relative">
                {state.data.news ? (
                   <div className="relative bg-white/[0.02] p-10 rounded-[3rem] border border-white/[0.05] text-base leading-relaxed text-neutral-300 shadow-inner">
                     <p className="indent-10">{state.data.news}</p>
                   </div>
                ) : (
                  <div className="h-40 bg-neutral-800/10 rounded-[3rem] animate-pulse"></div>
                )}
              </div>
            </div>

            <div className="mt-12">
              <h4 className="text-white text-[10px] font-black mb-6 uppercase tracking-[0.3em] opacity-40">数据信源架构 (Oracle Network Sources)</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                 {state.data.sources.map((s, i) => (
                   <a key={i} href={s.uri} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between gap-4 px-6 py-3 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 text-[11px] text-neutral-400 transition-all hover:-translate-y-1">
                     <span className="truncate flex-1">{s.title}</span>
                     <ExternalLink className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                   </a>
                 ))}
                 {state.data.sources.length === 0 && !state.data.isUpdating && (
                   <div className="col-span-full py-4 text-center border border-dashed border-neutral-800 rounded-2xl text-neutral-600 text-[10px] font-mono uppercase">
                     正在等待数据节点同步...
                   </div>
                 )}
              </div>
            </div>
          </section>
        </div>
      </main>

      <footer className="bg-black/95 border-t border-neutral-800 px-6 py-5 flex flex-col md:flex-row gap-6 md:gap-12 overflow-hidden items-center fixed bottom-0 w-full z-40 backdrop-blur-3xl shadow-[0_-20px_40px_rgba(0,0,0,0.8)]">
        <div className="flex-shrink-0 flex items-center gap-3 text-[#C41E3A] text-[12px] font-black uppercase bg-[#C41E3A]/10 px-6 py-2 rounded-full border border-[#C41E3A]/20 tracking-[0.2em]">
          <Activity className="w-4 h-4" />
          Quant Terminal v3.0
        </div>
        <div className="flex-1 w-full overflow-hidden">
          <div className="flex gap-24 animate-scroll whitespace-nowrap text-[10px] text-neutral-500 font-mono items-center uppercase font-bold">
            <span className="flex items-center gap-2 text-white">实时批价基准: ¥{state.data.currentPrice || '---'}</span>
            <span className="flex items-center gap-2 text-blue-400">行情校准源: 垂直白酒报价聚合</span>
            <span className="flex items-center gap-2 text-[#D4AF37]">神经网络模型: GEMINI-3 PRO-INDEX</span>
            <span className="flex items-center gap-2 text-green-500">● 连接状态: 已加密连接</span>
            <span className="opacity-30 italic">免责声明：本预测仅基于市场情绪与历史趋势分析，不构成任何投资建议。</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
