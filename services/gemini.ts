
import { GoogleGenAI, Type } from "@google/genai";

// 切换为 Flash 模型以获得极速响应，同时保持搜索增强能力
const MODEL_NAME = 'gemini-3-flash-preview'; 

// 简单的内存缓存
let cache: { data: any, sources: any, timestamp: number } | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5分钟缓存

export const fetchMoutaiPrediction = async (forceRefresh = false) => {
  const now = Date.now();
  if (!forceRefresh && cache && (now - cache.timestamp < CACHE_DURATION)) {
    console.log("Using cached market data...");
    return { data: cache.data, sources: cache.sources };
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0];

  const prompt = `
    作为首席分析师，请极速校准飞天茅台（53度500ml散瓶）价格模型。
    
    1. 搜索“今日酒价”或“不瓶瓶”过去7天的真实批价。
    2. 检索今日（${dateStr}）最新批价。
    3. 预测未来30天趋势（包含置信区间）。
    4. 评估市场情绪（-100到100）。
    
    输出严格 JSON 格式。
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0.1, // 略微增加确定性以提升生成速度
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            market_summary: { type: Type.STRING },
            sentiment_score: { type: Type.NUMBER },
            current_price: { type: Type.NUMBER },
            history: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  date: { type: Type.STRING },
                  price: { type: Type.NUMBER }
                },
                required: ["date", "price"]
              }
            },
            forecast: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  date: { type: Type.STRING },
                  price: { type: Type.NUMBER },
                  upper_bound: { type: Type.NUMBER },
                  lower_bound: { type: Type.NUMBER }
                },
                required: ["date", "price", "upper_bound", "lower_bound"]
              }
            }
          },
          required: ["market_summary", "sentiment_score", "current_price", "history", "forecast"]
        }
      },
    });

    const rawText = response.text || "{}";
    let data;
    try {
        const parsed = JSON.parse(rawText);
        data = {
          market_summary: parsed.market_summary || "",
          sentiment_score: parsed.sentiment_score || 0,
          current_price: parsed.current_price || 0,
          history: (parsed.history || []).map((h: any) => ({
            date: h.date,
            price: h.price
          })),
          prediction: (parsed.forecast || []).map((f: any) => ({
            date: f.date,
            price: f.price,
            upperBound: f.upper_bound,
            lowerBound: f.lower_bound
          }))
        };
    } catch (e) {
        throw new Error("解析异常");
    }

    if (!data.current_price || data.history.length === 0) {
        throw new Error("数据不全");
    }

    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks
      ?.filter(chunk => chunk.web)
      .map((chunk: any) => ({
        title: chunk.web?.title || '数据源',
        uri: chunk.web?.uri || '#'
      })) || [];

    // 更新缓存
    cache = { data, sources, timestamp: Date.now() };

    return { data, sources };
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
};
