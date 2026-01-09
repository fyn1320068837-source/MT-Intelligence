
import { GoogleGenAI, Type } from "@google/genai";

const MODEL_NAME = 'gemini-3-flash-preview'; 

export const fetchMoutaiPrediction = async () => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0];

  const prompt = `
    你是一名顶级白酒行业分析师。
    
    【核心基准校准】
    当前市场反馈“2024/2025年飞天茅台 53度 500ml 散瓶”的真实批价已回落至约 1495元 - 1540元/瓶 区间。
    
    任务目标：
    1. 实时检索：通过 Google Search 检索今日最新的“茅台批价”、“茅台价格走势”以及白酒行业去库存相关的最新新闻。
    2. 基准设定：以搜到的今日真实批价（参考 1495-1540 元区间）为起点，推演【2026年份飞天茅台】（作为未来核心流通指数标的）未来30天的价格走势。
    3. 深度分析：必须分析为何价格处于当前低位（如：需求端变化、渠道库存、金融属性减弱等），并预测未来30天的筑底或波动逻辑。
    4. 严禁幻觉：如果搜索结果显示价格有企稳迹象，请如实反映。
    
    当前真实日期：${dateStr}。
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0.1,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            market_summary: {
              type: Type.STRING,
              description: "简短的市场分析报告，重点解释当前 1500 元价格位附近的成因及未来30天趋势（120字内）。"
            },
            current_price: {
              type: Type.NUMBER,
              description: "今日校准后的 24/25 年飞天茅台真实批价。"
            },
            forecast: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  date: { type: Type.STRING, description: "日期，格式为 YYYY-MM-DD" },
                  price: { type: Type.NUMBER, description: "该日期的预测价格" }
                },
                required: ["date", "price"]
              }
            }
          },
          required: ["market_summary", "current_price", "forecast"]
        }
      },
    });

    const data = JSON.parse(response.text || "{}");
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks
      ?.filter(chunk => chunk.web)
      .map((chunk: any) => ({
        title: chunk.web?.title || '行业行情参考',
        uri: chunk.web?.uri || '#'
      })) || [];

    return { 
      data,
      sources 
    };
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};
