// ============================
// 主应用入口（Hash 路由 + 微信兼容返回键）
// ============================

import { useState, useEffect, useCallback, useRef } from 'react';
import type { BabyProfile } from './types';
import { getProfile } from './store';
import CreateBaby from './pages/Onboarding/CreateBaby';
import SelectFoods from './pages/Onboarding/SelectFoods';
import Home from './pages/Home';
import CalendarPage from './pages/Calendar';
import FoodList from './pages/FoodList';
import ProfilePage from './pages/Profile';
import CategoryDetail from './pages/FoodList/CategoryDetail';
import ChatPage from './pages/Chat';
import TabBar, { type TabKey } from './components/TabBar';

type Page =
  | { type: 'onboarding_create' }
  | { type: 'onboarding_foods' }
  | { type: 'tab'; tab: TabKey }
  | { type: 'category_detail'; categoryId: string }
  | { type: 'chat' };

// Hash 路由工具函数
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

function App() {
  const [profile, setProfile] = useState<BabyProfile | null>(null);
  const [page, setPage] = useState<Page>({ type: 'onboarding_create' });
  const currentPageRef = useRef<Page>(page);

  // 同步 ref
  useEffect(() => {
    currentPageRef.current = page;
  }, [page]);

  // ============ 初始化 ============
  useEffect(() => {
    const existing = getProfile();
    if (existing) {
      setProfile(existing);
      // 检查 URL hash，如果有则使用，否则设置默认
      const hashPage = parseHash(window.location.hash);
      if (hashPage) {
        setPage(hashPage);
      } else {
        setPage({ type: 'tab', tab: 'home' });
        window.location.hash = '#home';
      }
    }
  }, []);

  // ============ Hash 路由监听 ============
  useEffect(() => {
    const handler = () => {
      const hash = window.location.hash;
      
      // 如果 hash 为空（用户按了返回键试图退出），重新设置当前页面的 hash
      if (!hash || hash === '#') {
        const current = currentPageRef.current;
        if (current.type === 'tab' || current.type === 'category_detail') {
          // 恢复 hash，阻止关闭页面
          setTimeout(() => {
            window.location.hash = pageToHash(current);
          }, 10);
        }
        return;
      }
      
      // 解析新的 hash
      const newPage = parseHash(hash);
      if (newPage) {
        setPage(newPage);
      }
    };

    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);

  // ============ 页面变化时更新 hash ============
  useEffect(() => {
    if (page.type === 'tab' || page.type === 'category_detail') {
      const newHash = pageToHash(page);
      // 只在 hash 不同时更新，避免循环
      if (window.location.hash !== newHash) {
        window.location.hash = newHash;
      }
    }
  }, [page]);

  // ============ 导航回调 ============

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
    setPage({ type: 'chat' });
  }, []);

  // ============ 路由渲染 ============

  // 引导页：创建宝宝
  if (page.type === 'onboarding_create') {
    return <CreateBaby onNext={handleBabyCreated} />;
  }

  // 引导页：选择食物
  if (page.type === 'onboarding_foods') {
    return (
      <SelectFoods
        onBack={() => setPage({ type: 'onboarding_create' })}
        onDone={handleFoodsDone}
      />
    );
  }

  // 分类详情页
  if (page.type === 'category_detail') {
    return (
      <CategoryDetail
        categoryId={page.categoryId}
        onBack={() => setPage({ type: 'tab', tab: 'food' })}
      />
    );
  }

  // AI 助手页
  if (page.type === 'chat') {
    return (
      <ChatPage
        onBack={() => setPage({ type: 'tab', tab: 'home' })}
      />
    );
  }

  // 主页面（Tab）
  if (page.type === 'tab' && profile) {
    const activeTab = page.tab;

    return (
      <div className="max-w-lg mx-auto relative">
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
        <TabBar active={activeTab} onChange={handleTabChange} onOpenChat={handleOpenChat} />
      </div>
    );
  }

  return null;
}

export default App;
