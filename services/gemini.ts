
import { GoogleGenAI, Type } from "@google/genai";

// Use gemini-3-pro-preview for complex reasoning and data forecasting tasks.
const MODEL_NAME = 'gemini-3-pro-preview'; 

export const fetchMoutaiPrediction = async () => {
  // Always use process.env.API_KEY directly as per SDK guidelines.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0];

  const prompt = `
    你是一名白酒行业首席数据分析师。当前任务是为飞天茅台（53度/500ml/散瓶）建立精准的价格模型。
    
    【核心指令：历史价格校准】
    1. 利用 Google Search 检索过去 7 天（从昨日倒推）每日的行业公认批发价（批价）。
    2. 请搜索“今日酒价”、“酒价行情”、“不瓶瓶”或“酒说”等专业垂直媒体的每日报价单。
    3. **严禁生成估算数据**。如果某日数据缺失，请根据每日报价进行合理比对。
    
    【实时基准】
    - 获取今日（${dateStr}）的实时批价。
    
    【多维度分析】
    - 结合社会库存、酒厂投放节奏、以及当前金融环境进行 30 天预测。
    - 为每日预测提供“置信区间”（上限与下限），反映市场波动风险。
    - 计算基于搜索结果的市场情绪分值（-100 到 100）。
    
    【输出要求】
    - 历史数据（history）必须反映真实的每日波动。
    - 预测数据（forecast）必须从今日（${dateStr}）的价格开始衔接，并包含上限 (upper_bound) 和下限 (lower_bound)。
    
    要求输出 JSON 格式。
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0, 
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

    // Access the .text property directly (do not call it as a function).
    const rawText = response.text || "{}";
    let data;
    try {
        const parsed = JSON.parse(rawText);
        // Explicitly map keys and ensure arrays exist to prevent .map() errors
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
        throw new Error("AI 数据终端解析异常。");
    }

    if (!data.current_price || data.history.length === 0) {
        throw new Error("检索到的数据不完整。");
    }

    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks
      ?.filter(chunk => chunk.web)
      .map((chunk: any) => ({
        title: chunk.web?.title || '行业数据来源',
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
