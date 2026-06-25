// ============================
// 主应用入口（路由管理）
// ============================

import { useState, useEffect, useCallback } from 'react';
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

  // 初始化：检查是否已有宝宝数据
  useEffect(() => {
    const existing = getProfile();
    if (existing) {
      setProfile(existing);
      setPage({ type: 'tab', tab: 'home' });
    }
  }, []);

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
