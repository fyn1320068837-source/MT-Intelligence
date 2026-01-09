
import React from 'react';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, AreaChart, Area 
} from 'recharts';
import { PriceData } from '../types';

interface Props {
  data: PriceData[]; 
  prediction: PriceData[];
}

const MoutaiChart: React.FC<Props> = ({ prediction }) => {
  // Format dates for display (e.g., "MM-DD")
  const formattedData = prediction.map(item => ({
    ...item,
    displayDate: item.date.split('-').slice(1).join('-')
  }));

  return (
    <div className="w-full h-[380px] bg-black/40 p-2 rounded-2xl border border-neutral-800/50">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={formattedData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorPred" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.5}/>
              <stop offset="60%" stopColor="#D4AF37" stopOpacity={0.1}/>
              <stop offset="95%" stopColor="#D4AF37" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
          <XAxis 
            dataKey="displayDate" 
            stroke="#444" 
            tick={{fontSize: 9, fill: '#666'}}
            interval={3}
            axisLine={false}
            tickLine={false}
            dy={10}
          />
          <YAxis 
            stroke="#444" 
            domain={['auto', 'auto']} 
            tickFormatter={(value) => `¥${value}`}
            tick={{fontSize: 10, fill: '#666'}}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'rgba(0,0,0,0.95)', 
              border: '1px solid #D4AF37', 
              borderRadius: '12px',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 10px 15px -3px rgba(0,0,0,0.8)'
            }}
            itemStyle={{ color: '#D4AF37', fontWeight: 'bold' }}
            labelStyle={{ color: '#888', marginBottom: '4px', fontSize: '10px' }}
            cursor={{ stroke: '#D4AF37', strokeWidth: 1, strokeDasharray: '4 4' }}
            formatter={(value: any) => [`¥${value.toLocaleString()}`, "预测报价"]}
            labelFormatter={(label) => `日期: ${label}`}
          />
          <Area 
            type="monotone" 
            dataKey="price" 
            stroke="#D4AF37" 
            strokeWidth={3}
            fillOpacity={1} 
            fill="url(#colorPred)" 
            isAnimationActive={true}
            animationDuration={1500}
            animationEasing="ease-out"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default MoutaiChart;
