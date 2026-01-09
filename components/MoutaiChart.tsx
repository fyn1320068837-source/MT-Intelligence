
import React, { useMemo } from 'react';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, AreaChart, Area, ReferenceLine
} from 'recharts';
import { PriceData } from '../types';
import { AlertTriangle, RefreshCcw, BarChart3 } from 'lucide-react';

interface Props {
  data: PriceData[]; 
  prediction: PriceData[];
  onRetry?: () => void;
  isLoading?: boolean;
}

const MoutaiChart: React.FC<Props> = ({ data, prediction, onRetry, isLoading }) => {
  const combinedData = useMemo(() => {
    if (!data.length && !prediction.length) return [];

    const historical = data.map(item => ({ 
      ...item, 
      type: 'history', 
      displayDate: item.date.split('-').slice(1).join('-') 
    }));
    
    const predicted = prediction.map(item => ({ 
      ...item, 
      type: 'prediction', 
      displayDate: item.date.split('-').slice(1).join('-') 
    }));

    const allData = [...historical, ...predicted];
    return allData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [data, prediction]);

  const todayStr = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return today.split('-').slice(1).join('-');
  }, []);

  const chartData = useMemo(() => {
    const lastHistoryDate = data.length > 0 ? data[data.length - 1].date : null;

    return combinedData.map((item) => {
      const isHistory = item.type === 'history';
      const isPrediction = item.type === 'prediction';
      
      return {
        ...item,
        historyPrice: isHistory ? item.price : null,
        predictionPrice: (isPrediction || (lastHistoryDate && item.date === lastHistoryDate)) ? item.price : null
      };
    });
  }, [combinedData, data]);

  if (chartData.length === 0 && !isLoading) {
    return (
      <div className="w-full h-[420px] bg-neutral-900/40 border border-neutral-800/40 rounded-[2.5rem] flex flex-col items-center justify-center p-8 text-center backdrop-blur-sm">
        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
          <AlertTriangle className="w-8 h-8 text-red-500/50" />
        </div>
        <h3 className="text-white font-bold mb-2">行情图表渲染失败</h3>
        <p className="text-neutral-500 text-xs mb-8 max-w-xs leading-relaxed">
          未检测到有效的历史批价或预测数据。这可能是由于网络同步异常或行业报价源暂不可用导致的。
        </p>
        <button 
          onClick={onRetry}
          className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-xs font-black tracking-widest text-[#D4AF37] transition-all active:scale-95 group"
        >
          <RefreshCcw className="w-3.5 h-3.5 group-hover:rotate-180 transition-transform duration-500" />
          立即尝试重新挂载
        </button>
      </div>
    );
  }

  return (
    <div className="w-full h-[420px] bg-black/40 p-4 rounded-3xl border border-neutral-800/40 relative group overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none duration-1000"></div>
      
      {chartData.length > 0 && (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 20, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorHistory" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorPred" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.6}/>
                <stop offset="60%" stopColor="#D4AF37" stopOpacity={0.15}/>
                <stop offset="95%" stopColor="#D4AF37" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="4 4" stroke="#222" vertical={false} />
            <XAxis 
              dataKey="displayDate" 
              stroke="#444" 
              tick={{fontSize: 9, fill: '#666', fontWeight: 600}}
              interval={Math.floor(chartData.length / 10)}
              axisLine={false}
              tickLine={false}
              dy={15}
            />
            <YAxis 
              stroke="#444" 
              domain={['auto', 'auto']} 
              tickFormatter={(value) => `¥${value}`}
              tick={{fontSize: 10, fill: '#666', fontWeight: 600}}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'rgba(5, 5, 5, 0.95)', 
                border: '1px solid rgba(212, 175, 55, 0.3)', 
                borderRadius: '16px',
                backdropFilter: 'blur(12px)',
                boxShadow: '0 20px 25px -5px rgba(0,0,0,0.8)',
                padding: '12px'
              }}
              itemStyle={{ fontWeight: '900', fontSize: '14px' }}
              labelStyle={{ color: '#666', marginBottom: '8px', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em' }}
              cursor={{ stroke: '#D4AF37', strokeWidth: 1.5, strokeDasharray: '5 5' }}
              formatter={(value: any, name: string, props: any) => {
                const isPred = props.dataKey === 'predictionPrice';
                const color = isPred ? '#D4AF37' : '#3b82f6';
                const label = isPred ? 'AI 预测批价' : '市场真实批价';
                return [`¥${value.toLocaleString()}`, label, { color }];
              }}
              labelFormatter={(label) => `周期: ${label}`}
            />
            
            <Area 
              type="monotone" 
              dataKey="historyPrice"
              stroke="#3b82f6" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorHistory)" 
              isAnimationActive={true}
              animationDuration={800}
              connectNulls={false}
              dot={{ r: 2, fill: '#3b82f6', strokeWidth: 0 }}
              activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2, fill: '#000' }}
            />
            
            <Area 
              type="monotone" 
              dataKey="predictionPrice"
              stroke="#D4AF37" 
              strokeWidth={4}
              fillOpacity={1} 
              fill="url(#colorPred)" 
              isAnimationActive={true}
              animationDuration={1500}
              animationEasing="ease-in-out"
              connectNulls={true}
              activeDot={{ r: 7, stroke: '#D4AF37', strokeWidth: 3, fill: '#000' }}
            />
            
            <ReferenceLine 
              x={todayStr} 
              stroke="#C41E3A" 
              strokeWidth={1.5}
              strokeDasharray="4 4" 
              label={{ position: 'top', value: '今日行情', fill: '#C41E3A', fontSize: 10, fontWeight: 'black', letterSpacing: '0.1em' }} 
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default MoutaiChart;
