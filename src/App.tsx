// ============================
// 主应用入口（Hash 路由 + 微信兼容返回键）
// ============================

import { useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import type { BabyProfile } from './types';
import { getProfile, bootstrapFromServer } from './store';
import { bootstrapChatFromServer } from './utils/chatStore';
import { showError } from './store/feedback';
import CreateBaby from './pages/Onboarding/CreateBaby';
import SelectFoods from './pages/Onboarding/SelectFoods';
import Home from './pages/Home';
import CalendarPage from './pages/Calendar';
import FoodList from './pages/FoodList';
import ProfilePage from './pages/Profile';
import CategoryDetail from './pages/FoodList/CategoryDetail';
import ChatPage from './pages/Chat';
import TabBar, { type TabKey } from './components/TabBar';
import GlobalFeedback from './components/GlobalFeedback';
import { usePageFollowSwipe } from './hooks/useHorizontalSwipe';

type Page =
  | { type: 'boot' }
  | { type: 'boot_error'; message: string }
  | { type: 'onboarding_create' }
  | { type: 'onboarding_foods' }
  | { type: 'tab'; tab: TabKey }
  | { type: 'category_detail'; categoryId: string }
  | { type: 'chat' };

const TAB_ORDER: TabKey[] = ['home', 'calendar', 'food', 'profile'];

/** Tab 页：跟手横滑切换相邻 Tab（TabBar 不随页面移动） */
function TabSwipeShell({
  activeTab,
  onChange,
  tabBar,
  children,
}: {
  activeTab: TabKey;
  onChange: (tab: TabKey) => void;
  tabBar: ReactNode;
  children: ReactNode;
}) {
  const activeRef = useRef(activeTab);
  activeRef.current = activeTab;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const { containerRef, contentStyle, dragging } = usePageFollowSwipe({
    mode: 'both',
    canSwipeLeft: () => {
      const i = TAB_ORDER.indexOf(activeRef.current);
      return i >= 0 && i < TAB_ORDER.length - 1;
    },
    canSwipeRight: () => TAB_ORDER.indexOf(activeRef.current) > 0,
    onCommitLeft: () => {
      const i = TAB_ORDER.indexOf(activeRef.current);
      if (i >= 0 && i < TAB_ORDER.length - 1) onChangeRef.current(TAB_ORDER[i + 1]);
    },
    onCommitRight: () => {
      const i = TAB_ORDER.indexOf(activeRef.current);
      if (i > 0) onChangeRef.current(TAB_ORDER[i - 1]);
    },
  });

  return (
    <div
      ref={containerRef}
      className={`max-w-lg mx-auto relative min-h-screen overflow-x-hidden ${dragging ? 'select-none' : ''}`}
    >
      <div style={contentStyle} className="min-h-screen">
        {children}
      </div>
      {tabBar}
    </div>
  );
}

/** 子页：右滑跟手退出 */
function BackSwipeShell({
  onBack,
  children,
}: {
  onBack: () => void;
  children: ReactNode;
}) {
  const onBackRef = useRef(onBack);
  onBackRef.current = onBack;

  const { containerRef, contentStyle, dragging } = usePageFollowSwipe({
    mode: 'right-only',
    commitStyle: 'exit',
    canSwipeRight: () => true,
    onCommitRight: () => onBackRef.current(),
  });

  return (
    <div
      ref={containerRef}
      className={`min-h-screen overflow-x-hidden bg-[#FFF8F0] ${dragging ? 'select-none' : ''}`}
    >
      <div style={contentStyle} className="min-h-screen bg-[#FFF8F0]">
        {children}
      </div>
    </div>
  );
}

function parseHash(hash: string): { type: 'tab'; tab: TabKey } | { type: 'category_detail'; categoryId: string } | { type: 'chat' } | null {
  const cleanHash = hash.replace('#', '');

  if (!cleanHash) return null;

  if (['home', 'calendar', 'food', 'profile'].includes(cleanHash)) {
    return { type: 'tab', tab: cleanHash as TabKey };
  }

  if (cleanHash.startsWith('category-')) {
    return { type: 'category_detail', categoryId: cleanHash.replace('category-', '') };
  }

  if (cleanHash === 'chat') {
    return { type: 'chat' };
  }

  return null;
}

function pageToHash(page: Page): string {
  if (page.type === 'tab') return `#${page.tab}`;
  if (page.type === 'category_detail') return `#category-${page.categoryId}`;
  if (page.type === 'chat') return '#chat';
  return '#home';
}

function enterAfterBoot(
  setProfile: (p: BabyProfile | null) => void,
  setPage: (p: Page) => void,
) {
  const existing = getProfile();
  if (existing) {
    setProfile(existing);
    const hashPage = parseHash(window.location.hash);
    if (hashPage) {
      setPage(hashPage);
    } else {
      setPage({ type: 'tab', tab: 'home' });
      window.location.hash = '#home';
    }
  } else {
    setPage({ type: 'onboarding_create' });
  }
}

function App() {
  const [profile, setProfile] = useState<BabyProfile | null>(null);
  const [page, setPage] = useState<Page>({ type: 'boot' });
  const [chatAvailable, setChatAvailable] = useState(true);
  const currentPageRef = useRef<Page>(page);
  const bootGenRef = useRef(0);

  useEffect(() => {
    currentPageRef.current = page;
  }, [page]);

  useEffect(() => {
    const gen = ++bootGenRef.current;
    const init = async () => {
      try {
        await bootstrapFromServer();
        if (bootGenRef.current !== gen) return;

        try {
          await bootstrapChatFromServer();
          if (bootGenRef.current !== gen) return;
          setChatAvailable(true);
        } catch (chatErr: any) {
          setChatAvailable(false);
          showError(chatErr?.message || '对话数据加载失败，助手暂不可用');
        }

        enterAfterBoot(setProfile, setPage);
      } catch (e: any) {
        if (bootGenRef.current !== gen) return;
        setPage({
          type: 'boot_error',
          message: e?.message || '无法从服务器加载数据',
        });
      }
    };
    init();
  }, []);

  useEffect(() => {
    const handler = () => {
      const hash = window.location.hash;

      if (!hash || hash === '#') {
        const current = currentPageRef.current;
        if (current.type === 'tab' || current.type === 'category_detail') {
          setTimeout(() => {
            window.location.hash = pageToHash(current);
          }, 10);
        }
        return;
      }

      const newPage = parseHash(hash);
      if (newPage) {
        setPage(newPage);
      }
    };

    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);

  useEffect(() => {
    if (page.type === 'tab' || page.type === 'category_detail') {
      const newHash = pageToHash(page);
      if (window.location.hash !== newHash) {
        window.location.hash = newHash;
      }
    }
  }, [page]);

  const handleBabyCreated = useCallback((p: BabyProfile) => {
    setProfile(p);
    setPage({ type: 'onboarding_foods' });
  }, []);

  const handleFoodsDone = useCallback(() => {
    setPage({ type: 'tab', tab: 'home' });
  }, []);

  const handleNavigateCategory = useCallback((categoryId: string) => {
    setPage({ type: 'category_detail', categoryId });
  }, []);

  const handleTabChange = useCallback((tab: TabKey) => {
    setPage({ type: 'tab', tab });
  }, []);

  const handleProfileUpdate = useCallback((updated: BabyProfile) => {
    setProfile(updated);
  }, []);

  const handleClearData = useCallback(() => {
    setProfile(null);
    setPage({ type: 'onboarding_create' });
    window.location.hash = '';
  }, []);

  const handleOpenChat = useCallback(() => {
    if (!chatAvailable) {
      showError('对话数据未加载成功，请刷新页面后重试');
      return;
    }
    setPage({ type: 'chat' });
  }, [chatAvailable]);

  const handleRetryBoot = useCallback(() => {
    const gen = ++bootGenRef.current;
    setPage({ type: 'boot' });
    (async () => {
      try {
        await bootstrapFromServer();
        if (bootGenRef.current !== gen) return;
        try {
          await bootstrapChatFromServer();
          if (bootGenRef.current !== gen) return;
          setChatAvailable(true);
        } catch (chatErr: any) {
          setChatAvailable(false);
          showError(chatErr?.message || '对话数据加载失败，助手暂不可用');
        }
        enterAfterBoot(setProfile, setPage);
      } catch (e: any) {
        if (bootGenRef.current !== gen) return;
        setPage({
          type: 'boot_error',
          message: e?.message || '无法从服务器加载数据',
        });
      }
    })();
  }, []);

  let content: ReactNode = null;

  if (page.type === 'boot') {
    content = (
      <div className="min-h-screen bg-[#FFF8F0] flex items-center justify-center">
        <p className="text-amber-700 text-sm">正在从服务器加载...</p>
      </div>
    );
  } else if (page.type === 'boot_error') {
    content = (
      <div className="min-h-screen bg-[#FFF8F0] flex flex-col items-center justify-center px-6 gap-4">
        <div className="text-5xl">📡</div>
        <h1 className="text-lg font-bold text-amber-900">加载失败</h1>
        <p className="text-sm text-amber-700 text-center">{page.message}</p>
        <button
          type="button"
          onClick={handleRetryBoot}
          className="mt-2 px-6 py-3 rounded-xl bg-orange-400 text-white font-bold shadow-lg shadow-orange-200"
        >
          重试
        </button>
      </div>
    );
  } else if (page.type === 'onboarding_create') {
    content = <CreateBaby onNext={handleBabyCreated} />;
  } else if (page.type === 'onboarding_foods') {
    content = (
      <BackSwipeShell onBack={() => setPage({ type: 'onboarding_create' })}>
        <SelectFoods
          onBack={() => setPage({ type: 'onboarding_create' })}
          onDone={handleFoodsDone}
        />
      </BackSwipeShell>
    );
  } else if (page.type === 'category_detail') {
    content = (
      <BackSwipeShell onBack={() => setPage({ type: 'tab', tab: 'food' })}>
        <CategoryDetail
          categoryId={page.categoryId}
          onBack={() => setPage({ type: 'tab', tab: 'food' })}
        />
      </BackSwipeShell>
    );
  } else if (page.type === 'chat') {
    content = (
      <BackSwipeShell onBack={() => setPage({ type: 'tab', tab: 'home' })}>
        <ChatPage onBack={() => setPage({ type: 'tab', tab: 'home' })} />
      </BackSwipeShell>
    );
  } else if (page.type === 'tab' && profile) {
    const activeTab = page.tab;
    content = (
      <TabSwipeShell
        activeTab={activeTab}
        onChange={handleTabChange}
        tabBar={<TabBar active={activeTab} onChange={handleTabChange} onOpenChat={handleOpenChat} />}
      >
        {activeTab === 'home' && (
          <Home profile={profile} onNavigateCategory={handleNavigateCategory} />
        )}
        {activeTab === 'calendar' && <CalendarPage />}
        {activeTab === 'food' && (
          <FoodList onNavigateCategory={handleNavigateCategory} />
        )}
        {activeTab === 'profile' && (
          <ProfilePage
            profile={profile}
            onUpdate={handleProfileUpdate}
            onClearData={handleClearData}
          />
        )}
      </TabSwipeShell>
    );
  }

  return (
    <>
      {content}
      <GlobalFeedback />
    </>
  );
}

export default App;
