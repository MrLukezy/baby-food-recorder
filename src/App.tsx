// ============================
// 主应用入口（路由管理 + 返回键导航）
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
import TabBar, { type TabKey } from './components/TabBar';

type Page =
  | { type: 'onboarding_create' }
  | { type: 'onboarding_foods' }
  | { type: 'tab'; tab: TabKey }
  | { type: 'category_detail'; categoryId: string };

function App() {
  const [profile, setProfile] = useState<BabyProfile | null>(null);
  const [page, setPage] = useState<Page>({ type: 'onboarding_create' });
  // 记录最近一次由 popstate 恢复的状态，避免 useEffect 重复 push
  const lastPopStatePage = useRef<string | null>(null);

  // 初始化：检查是否已有宝宝数据
  useEffect(() => {
    const existing = getProfile();
    if (existing) {
      setProfile(existing);
      setPage({ type: 'tab', tab: 'home' });
    }
  }, []);

  // ============ 浏览器历史导航 ============

  // 监听浏览器返回键
  useEffect(() => {
    const handler = (e: PopStateEvent) => {
      const state = e.state as { tab?: TabKey; categoryId?: string } | null;
      if (!state) return;

      let newPage: Page;
      if (state.categoryId) {
        newPage = { type: 'category_detail', categoryId: state.categoryId };
      } else {
        newPage = { type: 'tab', tab: state.tab || 'home' };
      }

      // 标记这次 page 变化来自 popstate，阻止 useEffect 再次 push
      lastPopStatePage.current = JSON.stringify(state);
      setPage(newPage);
    };

    window.addEventListener('popstate', handler);
    return () => window.removeEventListener('popstate', handler);
  }, []);

  // 当 page 变化时，将导航状态推入浏览器历史
  useEffect(() => {
    let stateObj: { tab?: TabKey; categoryId?: string } | null = null;

    if (page.type === 'tab') {
      stateObj = { tab: page.tab };
    } else if (page.type === 'category_detail') {
      stateObj = { categoryId: page.categoryId };
    }

    if (!stateObj) return;

    const stateStr = JSON.stringify(stateObj);

    // 如果是 popstate 恢复的状态，只 replace（不 push 重复条目）
    if (lastPopStatePage.current === stateStr) {
      lastPopStatePage.current = null;
      window.history.replaceState(stateObj, '');
    } else {
      window.history.pushState(stateObj, '');
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
        <TabBar active={activeTab} onChange={handleTabChange} />
      </div>
    );
  }

  return null;
}

export default App;
