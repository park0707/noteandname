// ============================================================================
// Dual Free AI Failover Service (Google AI Studio & Groq Cloud)
// 1순위: Google AI Studio (Gemini 3.5 Flash Lite) - VITE_GEMINI_API_KEY (1일 1,500회 100% 무료, 초고속)
// 2순위: Groq Cloud (LLaMA 3.3 70B) - VITE_GROQ_API_KEY (1일 14,400회 100% 무료 백업)
// ============================================================================

export interface MultiAiResult<T> {
  data: T;
  providerName: string;
  isFallbackUsed: boolean;
}

// ----------------------------------------------------------------------------
// 헬퍼: 환경 변수 추출
// ----------------------------------------------------------------------------
function getEnv(key: string): string {
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return (import.meta.env[key] as string) || '';
  }
  return '';
}

// ----------------------------------------------------------------------------
// 1. Google Gemini API 호출 클라이언트
// ----------------------------------------------------------------------------
async function callGeminiRaw(prompt: string, apiKey: string, modelName: string = 'gemini-3.5-flash-lite', systemInstruction?: string): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

  const bodyPayload: any = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: 'application/json'
    }
  };

  if (systemInstruction) {
    bodyPayload.systemInstruction = {
      parts: [{ text: systemInstruction }]
    };
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(bodyPayload)
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini Error (${response.status}) [${modelName}]: ${errText}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error(`Gemini [${modelName}] returned empty text`);
  return text;
}

// ----------------------------------------------------------------------------
// 2. Groq Cloud (LLaMA 3.3 70B) 호출 클라이언트
// ----------------------------------------------------------------------------
async function callGroqRaw(
  apiKey: string,
  model: string,
  prompt: string,
  systemInstruction?: string
): Promise<string> {
  const messages = [];
  if (systemInstruction) {
    messages.push({ role: 'system', content: systemInstruction });
  }
  messages.push({ role: 'user', content: prompt });

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      messages,
      response_format: { type: 'json_object' }
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Groq API Error (${response.status}) [${model}]: ${errText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error(`Groq [${model}] returned empty content`);
  return content;
}

// ----------------------------------------------------------------------------
// 3. 계층형 AI 호출 체인 (Google Gemini -> Groq)
// ----------------------------------------------------------------------------
export async function executeMultiAiChain<T>(
  prompt: string,
  systemInstruction?: string,
  parseFn?: (rawText: string) => T
): Promise<MultiAiResult<T>> {
  const geminiKey = getEnv('VITE_GEMINI_API_KEY') || getEnv('VITE_GEMINI_API_KEY2') || localStorage.getItem('novelflow_ai_api_key') || '';
  const groqKey = getEnv('VITE_GROQ_API_KEY') || localStorage.getItem('novelflow_groq_api_key') || '';

  const errorsLogged: string[] = [];
  const parse = parseFn || ((text: string) => JSON.parse(text) as T);

  // 1순위: Google AI Studio (Gemini 3.5 Flash Lite -> 3.6 Flash)
  if (geminiKey) {
    try {
      const rawText = await callGeminiRaw(prompt, geminiKey, 'gemini-3.5-flash-lite', systemInstruction);
      return { data: parse(rawText), providerName: 'Google Gemini 3.5 Flash Lite', isFallbackUsed: false };
    } catch (err: any) {
      errorsLogged.push(`Gemini 3.5 Flash Lite: ${err.message}`);
      try {
        const rawText = await callGeminiRaw(prompt, geminiKey, 'gemini-3.6-flash', systemInstruction);
        return { data: parse(rawText), providerName: 'Google Gemini 3.6 Flash', isFallbackUsed: true };
      } catch (err2: any) {
        errorsLogged.push(`Gemini 3.6 Flash: ${err2.message}`);
      }
    }
  }

  // 2순위 백업: Groq Cloud (LLaMA 3.3 70B)
  if (groqKey) {
    try {
      const rawText = await callGroqRaw(
        groqKey,
        'llama-3.3-70b-versatile',
        prompt,
        systemInstruction
      );
      return { data: parse(rawText), providerName: 'Groq LLaMA 3.3 70B (백업망)', isFallbackUsed: true };
    } catch (err: any) {
      errorsLogged.push(`Groq LLaMA 3.3: ${err.message}`);
    }
  }

  throw new Error(`Google AI Studio 및 Groq API 연결 실패 또는 API 키 미설정. 상세:\n${errorsLogged.join('\n')}`);
}


