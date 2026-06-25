// ============================
// AI 智能助手页面
// ============================

import React, { useState, useEffect, useRef } from 'react';
import { chatCompletion, type ChatMessage, getAIInfo } from '../../utils/ai';
import {
  getConversations, createConversation, getConversation,
  updateConversation, deleteConversation, getActiveConversationId,
  setActiveConversationId, type Conversation,
  SYSTEM_PROMPT, buildBabyContext, getMemorySummary,
  addMemory, getMemories, deleteMemory,
} from '../../utils/chatStore';

interface ChatPageProps {
  onBack: () => void;
}

const ChatPage: React.FC<ChatPageProps> = ({ onBack }) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [showSidebar, setShowSidebar] = useState(false);
  const [showMemory, setShowMemory] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSupported, setRecordingSupported] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);
  const abortRef = useRef<AbortController | null>(null);

  const aiInfo = getAIInfo();

  // 初始化会话列表
  useEffect(() => {
    const list = getConversations();
    setConversations(list);

    const active = getActiveConversationId();
    if (active && list.some(c => c.id === active)) {
      setActiveId(active);
      setActiveConv(getConversation(active));
    } else if (list.length > 0) {
      setActiveId(list[0].id);
      setActiveConv(list[0]);
      setActiveConversationId(list[0].id);
    }
  }, []);

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConv?.messages, streamingText]);

  // 检测语音识别支持
  useEffect(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      setRecordingSupported(false);
      return;
    }
    const recognition = new SR();
    recognition.lang = 'zh-CN';
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onresult = (event: any) => {
      let transcript = '';
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setInput(prev => prev + transcript);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognition.onerror = (event: any) => {
      console.error('语音识别错误:', event.error);
      setIsRecording(false);
    };

    recognitionRef.current = recognition;
  }, []);

  const handleNewConversation = () => {
    const conv = createConversation('新对话 ' + new Date().toLocaleDateString('zh-CN'));
    setConversations(getConversations());
    setActiveId(conv.id);
    setActiveConv(conv);
    setShowSidebar(false);
  };

  const handleSelectConversation = (id: string) => {
    setActiveId(id);
    setActiveConv(getConversation(id));
    setActiveConversationId(id);
    setShowSidebar(false);
  };

  const handleDeleteConversation = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('确定删除这个对话？')) return;
    deleteConversation(id);
    const list = getConversations();
    setConversations(list);
    if (activeId === id) {
      if (list.length > 0) {
        setActiveId(list[0].id);
        setActiveConv(list[0]);
        setActiveConversationId(list[0].id);
      } else {
        setActiveId(null);
        setActiveConv(null);
      }
    }
  };

  // ============ 发送消息 ============

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isStreaming) return;

    // 如果没有当前会话，创建一个
    let conv = activeConv;
    let convId = activeId;
    if (!conv || !convId) {
      const newConv = createConversation(text.slice(0, 20));
      setConversations(getConversations());
      conv = newConv;
      convId = newConv.id;
      setActiveId(convId);
      setActiveConv(newConv);
    }

    // 添加用户消息
    const userMsg: ChatMessage = { role: 'user', content: text };
    const newMessages = [...conv.messages, userMsg];
    updateConversation(convId, {
      messages: newMessages,
      title: conv.messages.length === 0 ? text.slice(0, 20) : conv.title,
    });
    setInput('');

    // 刷新本地显示
    const updatedConv = { ...conv, messages: newMessages, title: conv.messages.length === 0 ? text.slice(0, 20) : conv.title };
    setActiveConv(updatedConv);

    // 构建 AI 消息（系统提示 + 宝宝数据 + 记忆 + 历史）
    const babyContext = buildBabyContext();
    const memorySummary = getMemorySummary();

    const systemContent = [
      SYSTEM_PROMPT,
      babyContext ? `\n\n【当前宝宝数据】\n${babyContext}` : '',
      memorySummary ? `\n\n【历史记忆】\n${memorySummary}` : '',
    ].join('');

    const apiMessages: ChatMessage[] = [
      { role: 'system', content: systemContent },
      // 只取最近 10 条消息作为上下文
      ...newMessages.slice(-10),
    ];

    // 流式调用
    setIsStreaming(true);
    setStreamingText('');
    abortRef.current = new AbortController();

    try {
      const finalText = await chatCompletion(
        apiMessages,
        (partial) => {
          setStreamingText(partial);
        },
        abortRef.current.signal
      );

      const assistantMsg: ChatMessage = { role: 'assistant', content: finalText };
      const finalMessages = [...newMessages, assistantMsg];
      updateConversation(convId, { messages: finalMessages });
      setActiveConv({ ...updatedConv, messages: finalMessages });
      setConversations(getConversations());

      // 自动保存重要信息到记忆
      autoExtractMemory(text, finalText, convId);
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        const errorMsg: ChatMessage = {
          role: 'assistant',
          content: `⚠️ 抱歉，AI 响应失败：${err.message}\n\n请检查网络连接或稍后重试。`,
        };
        const finalMessages = [...newMessages, errorMsg];
        updateConversation(convId, { messages: finalMessages });
        setActiveConv({ ...updatedConv, messages: finalMessages });
      }
    } finally {
      setIsStreaming(false);
      setStreamingText('');
      abortRef.current = null;
    }
  };

  const handleStop = () => {
    abortRef.current?.abort();
  };

  // 自动从对话中提取记忆（简单启发式）
  const autoExtractMemory = (userText: string, _aiText: string, convId: string) => {
    const lower = userText.toLowerCase();
    // 如果用户提到宝宝相关信息，保存为记忆
    const memoryPatterns = [
      { match: /宝宝.*出生/, key: '宝宝出生日期' },
      { match: /宝宝.*月/, key: '宝宝月龄' },
      { match: /过敏/, key: '过敏记录' },
      { match: /体重/, key: '宝宝体重' },
      { match: /身高/, key: '宝宝身高' },
    ];

    for (const pattern of memoryPatterns) {
      if (pattern.match.test(lower)) {
        // 简单提取：把用户原文作为记忆
        const existing = getMemories().find(m => m.key === pattern.key);
        if (!existing) {
          addMemory(pattern.key, userText, convId);
        }
      }
    }
  };

  // ============ 语音输入 ============

  const handleVoiceInput = () => {
    if (!recognitionRef.current) return;
    if (isRecording) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
      setIsRecording(true);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const displayMessages = activeConv?.messages || [];
  const memories = getMemories();

  return (
    <div className="h-screen bg-[#FFF8F0] flex flex-col max-w-lg mx-auto relative">
      {/* 顶部导航 */}
      <div className="bg-gradient-to-b from-orange-100 to-[#FFF8F0] px-4 py-3 flex items-center justify-between shadow-sm z-10">
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="w-9 h-9 rounded-full bg-white shadow-sm flex items-center justify-center text-amber-700"
          >
            ←
          </button>
          <div>
            <h1 className="text-lg font-bold text-amber-900">🤖 辅食规划助手</h1>
            <p className="text-xs text-amber-500">基于 {aiInfo.model} · 专业宝宝辅食规划</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowMemory(true)}
            className="w-9 h-9 rounded-full bg-white shadow-sm flex items-center justify-center text-amber-700"
            title="记忆管理"
          >
            🧠
          </button>
          <button
            onClick={() => setShowSidebar(true)}
            className="w-9 h-9 rounded-full bg-white shadow-sm flex items-center justify-center text-amber-700"
            title="对话列表"
          >
            💬
          </button>
        </div>
      </div>

      {/* 主对话区 */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {displayMessages.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">👶</div>
            <h2 className="text-lg font-bold text-amber-900 mb-2">宝宝辅食规划助手</h2>
            <p className="text-sm text-amber-600 mb-6 mx-4">
              你好！我是你的专业辅食规划助手。我可以：
            </p>
            <div className="space-y-2 mx-4 text-left">
              {[
                '根据宝宝月龄推荐适合的食物',
                '解答排敏过程中的疑问',
                '处理疑似过敏/过敏的情况',
                '规划下一步辅食引入计划',
              ].map((item, i) => (
                <div key={i} className="bg-white rounded-xl px-4 py-2.5 flex items-start gap-2">
                  <span className="text-amber-500">✓</span>
                  <span className="text-sm text-amber-800">{item}</span>
                </div>
              ))}
            </div>
            <div className="mt-6 flex flex-wrap gap-2 justify-center px-4">
              {['宝宝今天该加什么辅食？', '疑似过敏怎么办？', '排敏中可以吃别的吗？'].map((q, i) => (
                <button
                  key={i}
                  onClick={() => setInput(q)}
                  className="text-xs bg-orange-100 text-orange-700 px-3 py-1.5 rounded-full hover:bg-orange-200"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          displayMessages.map((msg, i) => (
            <MessageBubble key={i} message={msg} />
          ))
        )}

        {/* 流式输出中 */}
        {isStreaming && streamingText && (
          <MessageBubble
            message={{ role: 'assistant', content: streamingText + ' ▍' }}
          />
        )}
        {isStreaming && !streamingText && (
          <div className="flex items-start gap-2">
            <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center text-sm flex-shrink-0">
              🤖
            </div>
            <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-orange-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-orange-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-orange-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 输入区 */}
      <div className="px-4 py-3 bg-white border-t border-amber-100 flex-shrink-0">
        <div className="flex items-end gap-2">
          {recordingSupported && (
            <button
              onClick={handleVoiceInput}
              className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-amber-100 text-amber-700'
              }`}
              title={isRecording ? '停止录音' : '语音输入'}
            >
              🎤
            </button>
          )}
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isRecording ? '正在听你说话...' : '输入问题，按 Enter 发送'}
            rows={1}
            className="flex-1 px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 placeholder-amber-300 resize-none"
            style={{ minHeight: '40px', maxHeight: '120px' }}
            disabled={isRecording}
          />
          {isStreaming ? (
            <button
              onClick={handleStop}
              className="w-10 h-10 rounded-full bg-red-500 text-white flex items-center justify-center flex-shrink-0"
              title="停止"
            >
              ■
            </button>
          ) : (
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className="w-10 h-10 rounded-full bg-orange-400 text-white flex items-center justify-center flex-shrink-0 disabled:opacity-50"
              title="发送"
            >
              ➤
            </button>
          )}
        </div>
        {isRecording && (
          <p className="text-xs text-red-500 mt-1 text-center">🎙️ 正在录音，再次点击麦克风结束</p>
        )}
      </div>

      {/* ============ 会话列表浮层 ============ */}
      {showSidebar && (
        <>
          <div className="fixed inset-0 bg-black/40 z-[55]" onClick={() => setShowSidebar(false)} />
          <div className="fixed inset-y-0 right-0 z-[60] bg-white w-80 max-w-[85vw] flex flex-col animate-slide-up">
            <div className="px-4 py-3 border-b border-amber-100 flex items-center justify-between">
              <h2 className="font-bold text-amber-900">💬 对话列表</h2>
              <button onClick={() => setShowSidebar(false)} className="text-gray-400 text-xl">✕</button>
            </div>
            <button
              onClick={handleNewConversation}
              className="m-3 py-2.5 bg-orange-400 text-white rounded-xl font-medium"
            >
              ＋ 新建对话
            </button>
            <div className="flex-1 overflow-y-auto px-3">
              {conversations.length === 0 ? (
                <div className="text-center text-amber-400 py-8 text-sm">
                  暂无对话
                </div>
              ) : (
                <div className="space-y-1.5 pb-3">
                  {conversations.map(c => (
                    <button
                      key={c.id}
                      onClick={() => handleSelectConversation(c.id)}
                      className={`w-full text-left rounded-xl px-3 py-2.5 transition-colors ${
                        c.id === activeId ? 'bg-orange-100' : 'bg-amber-50 hover:bg-amber-100'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-amber-900 truncate">
                            {c.title}
                          </div>
                          <div className="text-xs text-amber-400 mt-0.5">
                            {c.messages.length} 条 · {new Date(c.updatedAt).toLocaleDateString('zh-CN')}
                          </div>
                        </div>
                        <button
                          onClick={(e) => handleDeleteConversation(c.id, e)}
                          className="text-amber-300 hover:text-red-500 text-xs flex-shrink-0"
                        >
                          删除
                        </button>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* ============ 记忆管理浮层 ============ */}
      {showMemory && (
        <>
          <div className="fixed inset-0 bg-black/40 z-[55]" onClick={() => setShowMemory(false)} />
          <div className="fixed inset-x-0 bottom-0 z-[60] bg-white rounded-t-2xl max-h-[70vh] flex flex-col animate-slide-up">
            <div className="px-5 py-4 border-b border-amber-100 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-amber-900">🧠 AI 记忆库</h2>
                <p className="text-xs text-amber-500">AI 会记住与你对话的重要信息</p>
              </div>
              <button onClick={() => setShowMemory(false)} className="text-gray-400 text-2xl">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-3">
              {memories.length === 0 ? (
                <div className="text-center py-8 text-amber-400 text-sm">
                  <div className="text-3xl mb-2">🧠</div>
                  <p>暂无记忆</p>
                  <p className="text-xs mt-1">AI 会在对话中自动记住重要信息</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {memories.map((m, i) => (
                    <div key={i} className="bg-amber-50 rounded-xl px-3 py-2.5 flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-amber-900">{m.key}</div>
                        <div className="text-xs text-amber-700 mt-0.5">{m.value}</div>
                        <div className="text-xs text-amber-400 mt-1">
                          {new Date(m.createdAt).toLocaleDateString('zh-CN')}
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          deleteMemory(m.key);
                          // 强制刷新
                          setConversations([...getConversations()]);
                        }}
                        className="text-amber-300 hover:text-red-500 text-xs flex-shrink-0"
                      >
                        删除
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="px-5 py-3 border-t border-amber-100 text-xs text-amber-400">
              💡 AI 的记忆保存在本地，不会上传到服务器，可随时删除。
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// ============ 消息气泡组件 ============

const MessageBubble: React.FC<{ message: ChatMessage }> = ({ message }) => {
  if (message.role === 'user') {
    return (
      <div className="flex items-start justify-end gap-2">
        <div className="bg-orange-400 text-white rounded-2xl rounded-tr-sm px-4 py-2.5 shadow-sm max-w-[80%]">
          <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
        </div>
        <div className="w-8 h-8 bg-orange-200 rounded-full flex items-center justify-center text-sm flex-shrink-0">
          👤
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-2">
      <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center text-sm flex-shrink-0">
        🤖
      </div>
      <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-2.5 shadow-sm max-w-[80%]">
        <div className="text-sm text-amber-900 whitespace-pre-wrap break-words leading-relaxed">
          {message.content}
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
