/**
 * AI API 客户端 - 封装 OpenAI-compatible API 调用
 * 基于 hfsyapi 配置
 */

const AI_CONFIG = {
  baseUrl: 'https://www.hfsyapi.cn/v1',
  apiKey: 'sk-grfStCDsmKjz1sDaqTZ4494kX2cGPQHDrZChvTjdECHUZx02',
  model: 'gpt-5.4',
};

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatCompletionResponse {
  id: string;
  choices: Array<{
    message: ChatMessage;
    finish_reason: string;
  }>;
}

/**
 * 调用 AI 聊天完成接口
 */
export async function chatCompletion(
  messages: ChatMessage[],
  onProgress?: (text: string) => void,
  abortSignal?: AbortSignal
): Promise<string> {
  const body = {
    model: AI_CONFIG.model,
    messages,
    temperature: 0.7,
    stream: !!onProgress, // 启用流式输出
  };

  const response = await fetch(`${AI_CONFIG.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${AI_CONFIG.apiKey}`,
    },
    body: JSON.stringify(body),
    signal: abortSignal,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`AI 服务请求失败 (${response.status}): ${errorText}`);
  }

  // 非流式：直接返回
  if (!onProgress) {
    const data: ChatCompletionResponse = await response.json();
    return data.choices[0]?.message?.content || '';
  }

  // 流式：逐行解析 SSE
  if (!response.body) {
    throw new Error('流式响应不支持');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let accumulated = '';
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || ''; // 最后一行可能不完整，留到下次

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith('data: ')) continue;
      const jsonStr = trimmed.slice(6); // 去掉 'data: '
      if (jsonStr === '[DONE]') return accumulated;
      try {
        const chunk = JSON.parse(jsonStr);
        const delta = chunk.choices?.[0]?.delta?.content || '';
        if (delta) {
          accumulated += delta;
          onProgress(accumulated);
        }
      } catch {
        // 跳过解析错误的行
      }
    }
  }

  return accumulated;
}

/**
 * 获取 AI 配置信息（用于 UI 显示）
 */
export function getAIInfo() {
  return {
    provider: 'hfsyapi',
    model: AI_CONFIG.model,
  };
}
