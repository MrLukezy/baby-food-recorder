/**
 * AI 对话数据管理 - 多会话 + 记忆系统（localStorage 持久化 + 服务端同步）
 */

import type { ChatMessage } from './ai';

const SYNC_URL = import.meta.env.DEV
  ? 'http://127.0.0.1:3003/api'
  : '/babyfoodrecorder/api';

// ============ 初始化加载：从服务端拉取数据到本地 localStorage ============

export async function loadChatDataFromServer(): Promise<void> {
  try {
    const res = await fetch(`${SYNC_URL}/conversations`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        localStorage.setItem('ai_conversations', JSON.stringify(data));
      }
    }
    const res2 = await fetch(`${SYNC_URL}/memories`);
    if (res2.ok) {
      const data = await res2.json();
      if (Array.isArray(data)) {
        localStorage.setItem('ai_agent_memory', JSON.stringify(data));
      }
    }
    console.log('聊天数据从服务端强制刷新加载完成');
  } catch { /* ignore */ }
}

// ============ 服务端同步 ============

async function syncConversations(): Promise<void> {
  try {
    const convs = getConversations();
    await fetch(`${SYNC_URL}/conversations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'replace', data: convs }),
    });
  } catch { /* ignore */ }
}

async function syncMemories(): Promise<void> {
  try {
    const mems = getMemories();
    await fetch(`${SYNC_URL}/memories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mems),
    });
  } catch { /* ignore */ }
}

export interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface AIAgentMemory {
  key: string;      // 记忆关键词
  value: string;    // 记忆内容
  source: string;   // 来源会话 ID
  createdAt: string;
}

const KEY_CONVERSATIONS = 'ai_conversations';
const KEY_ACTIVE_CONVERSATION = 'ai_active_conversation';
const KEY_MEMORY = 'ai_agent_memory';

// ============ 系统提示词 ============

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
  try {
    const raw = localStorage.getItem(KEY_CONVERSATIONS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveConversations(list: Conversation[]): void {
  localStorage.setItem(KEY_CONVERSATIONS, JSON.stringify(list));
  syncConversations();
}

export function createConversation(title?: string): Conversation {
  const conv: Conversation = {
    id: 'conv_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
    title: title || '新对话',
    messages: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const all = getConversations();
  all.unshift(conv);
  saveConversations(all);
  setActiveConversationId(conv.id);
  return conv;
}

export function getConversation(id: string): Conversation | null {
  return getConversations().find(c => c.id === id) || null;
}

export function updateConversation(id: string, updates: Partial<Conversation>): void {
  const all = getConversations().map(c =>
    c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c
  );
  saveConversations(all);
}

export function deleteConversation(id: string): void {
  const all = getConversations().filter(c => c.id !== id);
  saveConversations(all);
  if (getActiveConversationId() === id) {
    localStorage.removeItem(KEY_ACTIVE_CONVERSATION);
  }
}

export function setActiveConversationId(id: string | null): void {
  if (id) localStorage.setItem(KEY_ACTIVE_CONVERSATION, id);
  else localStorage.removeItem(KEY_ACTIVE_CONVERSATION);
}

export function getActiveConversationId(): string | null {
  return localStorage.getItem(KEY_ACTIVE_CONVERSATION);
}

// ============ 记忆系统 ============

export function getMemories(): AIAgentMemory[] {
  try {
    const raw = localStorage.getItem(KEY_MEMORY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveMemories(list: AIAgentMemory[]): void {
  localStorage.setItem(KEY_MEMORY, JSON.stringify(list));
  syncMemories();
}

export function addMemory(key: string, value: string, source: string): void {
  const all = getMemories();
  all.push({
    key,
    value,
    source,
    createdAt: new Date().toISOString(),
  });
  saveMemories(all);
}

export function deleteMemory(key: string): void {
  const all = getMemories().filter(m => m.key !== key);
  saveMemories(all);
}

/** 生成记忆摘要，用于注入到对话上下文中 */
export function getMemorySummary(): string {
  const memories = getMemories();
  if (memories.length === 0) return '';

  return memories
    .map(m => `- ${m.key}：${m.value}`)
    .join('\n');
}

// ============ 宝宝数据整合（给 AI 上下文用） ============

export function buildBabyContext(): string {
  try {
    const profileRaw = localStorage.getItem('baby_profile');
    const recordsRaw = localStorage.getItem('food_records');
    const presetsRaw = localStorage.getItem('preset_allergens');

    if (!profileRaw) return '';

    const profile = JSON.parse(profileRaw);
    const records: any[] = recordsRaw ? JSON.parse(recordsRaw) : [];
    const presets: string[] = presetsRaw ? JSON.parse(presetsRaw) : [];

    // 计算月龄
    const birthday = new Date(profile.birthday);
    const now = new Date();
    let months = (now.getFullYear() - birthday.getFullYear()) * 12 + (now.getMonth() - birthday.getMonth());
    let days = now.getDate() - birthday.getDate();
    if (days < 0) {
      months -= 1;
      const prevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      days += prevMonth.getDate();
    }

    // 按食物分组
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

    // 预设食物
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

// ============ 唯一 ID 生成 ============

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}
