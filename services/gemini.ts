
import { GoogleGenAI, Type } from "@google/genai";

const MODEL_NAME = 'gemini-3-flash-preview'; 

export const fetchMoutaiPrediction = async () => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0];

  const prompt = `
    你是一名白酒行业首席数据分析师。当前任务是为飞天茅台（53度/500ml/散瓶）建立精准的价格模型。
    
    【核心指令：历史价格校准】
    1. 利用 Google Search 检索过去 7 天（从昨日倒推）每日的行业公认批发价（批价）。
    2. 请搜索“今日酒价”、“酒价行情”、“不瓶瓶”或“酒说”等专业垂直媒体的每日报价单。
    3. **严禁生成估算数据**。如果某日数据缺失，请根据前后两日的搜索结果进行加权平均。
    
    【实时基准】
    - 获取今日（${dateStr}）的实时批价。
    
    【多维度分析】
    - 结合社会库存、酒厂投放节奏（如电商节投放）、以及当前的金融环境进行 30 天预测。
    - 计算基于搜索结果的市场情绪分值（-100 到 100）。
    
    【输出要求】
    - 历史数据（history）必须反映真实的每日波动。
    - 预测数据（forecast）必须从今日（${dateStr}）的价格开始无缝衔接。
    
    要求输出 JSON 格式。
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0, // 降低随机性，确保数据严谨
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            market_summary: { type: Type.STRING, description: "今日行情研判及波动原因。" },
            sentiment_score: { type: Type.NUMBER, description: "量化市场情绪分值。" },
            current_price: { type: Type.NUMBER, description: "今日实时校准批价。" },
            history: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  date: { type: Type.STRING, description: "YYYY-MM-DD" },
                  price: { type: Type.NUMBER, description: "当日真实批价" }
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
                  price: { type: Type.NUMBER }
                },
                required: ["date", "price"]
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
        data = JSON.parse(rawText);
    } catch (e) {
        throw new Error("AI 数据终端解析异常，请尝试重置。");
    }

    if (!data.current_price || !Array.isArray(data.history) || data.history.length < 5) {
        throw new Error("检索到的历史价格样本不足，无法生成高精度曲线。");
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
