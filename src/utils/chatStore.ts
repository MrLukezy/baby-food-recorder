/**
 * AI 对话数据管理 - 多会话 + 记忆系统
 * 内存镜像 + 服务端读写，无 localStorage
 */

import type { ChatMessage } from './ai';
import { apiGet, apiPost } from '../store/api';
import { withFeedback } from '../store/feedback';
import { getProfile, getRecords, getPresetAllergens } from '../store';

export interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface AIAgentMemory {
  key: string;
  value: string;
  source: string;
  createdAt: string;
}

type ChatMemory = {
  conversations: Conversation[];
  memories: AIAgentMemory[];
  activeConversationId: string | null;
};

const chatMemory: ChatMemory = {
  conversations: [],
  memories: [],
  activeConversationId: null,
};

export async function bootstrapChatFromServer(): Promise<void> {
  return withFeedback('加载对话中...', async () => {
    const [conversations, memories] = await Promise.all([
      apiGet<Conversation[]>('/conversations'),
      apiGet<AIAgentMemory[]>('/memories'),
    ]);
    chatMemory.conversations = Array.isArray(conversations) ? conversations : [];
    chatMemory.memories = Array.isArray(memories) ? memories : [];
  });
}

export const SYSTEM_PROMPT = `你是一位专业的宝宝辅食规划管理师，拥有以下专业背景：

【专业知识】
- 精通婴儿辅食添加的科学指导（基于AAP、NHS、中国卫健委指南）
- 熟悉三天排敏法（每种新食物连续观察3天）
- 理解不同月龄的辅食添加建议（6月泥糊状→7-8月细碎→9-10月软颗粒→11-12月接近成人）
- 掌握食物致敏等级：低敏、中敏、高敏食物分类
- 了解回避触发实验流程：疑似过敏后回避2周，从极少量（1/8勺）开始重试

【你的职责】
1. 根据宝宝的月龄和已排敏食物，给出个性化的辅食添加建议
2. 解答家长关于排敏过程中的疑问
3. 处理疑似过敏/过敏的情况，给出科学的应对建议
4. 推荐下一步可以引入的食物
5. 识别常见过敏症状并给出就医建议

【回答风格】
- 温暖、耐心、不过度焦虑
- 给出具体可执行的建议（如"明天可以尝试加1/4勺南瓜泥"）
- 遇到需要就医的情况明确提示（如呼吸困难、大面积皮疹）
- 避免绝对化的说法，强调个体差异
- 涉及高风险决策时提醒咨询儿科医生

请在回答前先查看宝宝的排敏数据（如果提供），结合实际情况给出建议。`;

// ============ 会话管理 ============

export function getConversations(): Conversation[] {
  return chatMemory.conversations;
}

export async function saveConversations(list: Conversation[]): Promise<void> {
  return withFeedback('保存对话中...', async () => {
    await apiPost('/conversations', { action: 'replace', data: list });
    chatMemory.conversations = list;
  });
}

export async function createConversation(title?: string): Promise<Conversation> {
  const conv: Conversation = {
    id: 'conv_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
    title: title || '新对话',
    messages: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const all = [conv, ...chatMemory.conversations];
  await saveConversations(all);
  setActiveConversationId(conv.id);
  return conv;
}

export function getConversation(id: string): Conversation | null {
  return chatMemory.conversations.find(c => c.id === id) || null;
}

export async function updateConversation(id: string, updates: Partial<Conversation>): Promise<void> {
  const all = chatMemory.conversations.map(c =>
    c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c
  );
  await saveConversations(all);
}

export async function deleteConversation(id: string): Promise<void> {
  const all = chatMemory.conversations.filter(c => c.id !== id);
  await saveConversations(all);
  if (getActiveConversationId() === id) {
    chatMemory.activeConversationId = null;
  }
}

/** 当前会话 ID 仅作会话内 UI 状态，不持久化到本地/服务端 */
export function setActiveConversationId(id: string | null): void {
  chatMemory.activeConversationId = id;
}

export function getActiveConversationId(): string | null {
  return chatMemory.activeConversationId;
}

// ============ 记忆系统 ============

export function getMemories(): AIAgentMemory[] {
  return chatMemory.memories;
}

export async function saveMemories(list: AIAgentMemory[]): Promise<void> {
  return withFeedback('保存记忆中...', async () => {
    await apiPost('/memories', list);
    chatMemory.memories = list;
  });
}

export async function addMemory(key: string, value: string, source: string): Promise<void> {
  const all = [
    ...chatMemory.memories,
    {
      key,
      value,
      source,
      createdAt: new Date().toISOString(),
    },
  ];
  await saveMemories(all);
}

export async function deleteMemory(key: string): Promise<void> {
  await saveMemories(chatMemory.memories.filter(m => m.key !== key));
}

export function getMemorySummary(): string {
  const memories = getMemories();
  if (memories.length === 0) return '';
  return memories.map(m => `- ${m.key}：${m.value}`).join('\n');
}

// ============ 宝宝数据整合（给 AI 上下文用） ============

export function buildBabyContext(): string {
  try {
    const profile = getProfile();
    if (!profile) return '';

    const records = getRecords();
    const presets = getPresetAllergens();

    const birthday = new Date(profile.birthday);
    const now = new Date();
    let months = (now.getFullYear() - birthday.getFullYear()) * 12 + (now.getMonth() - birthday.getMonth());
    let days = now.getDate() - birthday.getDate();
    if (days < 0) {
      months -= 1;
      const prevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      days += prevMonth.getDate();
    }

    const foodMap = new Map<string, { name: string; days: Set<string>; reactions: string[] }>();
    for (const r of records) {
      if (!foodMap.has(r.foodId)) {
        foodMap.set(r.foodId, { name: r.foodName, days: new Set(), reactions: [] });
      }
      const item = foodMap.get(r.foodId)!;
      item.days.add(r.date);
      item.reactions.push(r.reaction);
    }

    const safe: string[] = [];
    const observing: string[] = [];
    const suspected: string[] = [];
    const allergic: string[] = [];

    for (const [, data] of foodMap) {
      const hasAllergic = data.reactions.includes('allergic');
      const hasSuspected = data.reactions.includes('suspected');
      const dayCount = data.days.size;

      if (hasAllergic) allergic.push(data.name);
      else if (hasSuspected) suspected.push(`${data.name}(${dayCount}天)`);
      else if (dayCount >= 3) safe.push(data.name);
      else observing.push(`${data.name}(${dayCount}/3天)`);
    }

    for (const id of presets) {
      if (!foodMap.has(id)) {
        safe.push(`[预设]${id}`);
      }
    }

    let context = `宝宝信息：\n`;
    context += `- 昵称：${profile.name}\n`;
    context += `- 出生日期：${profile.birthday}\n`;
    context += `- 当前月龄：${months}个月${days}天\n\n`;

    if (safe.length > 0) context += `已排敏（不过敏）食物（${safe.length}种）：${safe.slice(0, 15).join('、')}${safe.length > 15 ? ' 等' : ''}\n`;
    if (observing.length > 0) context += `排敏中（${observing.length}种）：${observing.join('、')}\n`;
    if (suspected.length > 0) context += `疑似过敏（${suspected.length}种）：${suspected.join('、')}\n`;
    if (allergic.length > 0) context += `确认过敏（${allergic.length}种）：${allergic.join('、')}\n`;

    return context;
  } catch {
    return '';
  }
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}
