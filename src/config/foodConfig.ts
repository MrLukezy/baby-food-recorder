// ============================
// 食物分类配置表（静态数据）
// 来源：BabyCenter、AAP 等权威机构建议
// 每种食物配有专属 emoji，无对应 emoji 的使用 🍽️
// ============================

import type { FoodCategory } from '../types';

export const foodCategories: FoodCategory[] = [
  {
    id: 'vegetable',
    name: '蔬菜',
    icon: '🥬',
    foods: [
      { id: 'v_nangua', name: '南瓜', emoji: '🎃', allergenLevel: 'low', recommendedAge: '6+' },
      { id: 'v_huluobo', name: '胡萝卜', emoji: '🥕', allergenLevel: 'low', recommendedAge: '6+' },
      { id: 'v_tudou', name: '土豆', emoji: '🥔', allergenLevel: 'low', recommendedAge: '6+' },
      { id: 'v_hongshu', name: '红薯', emoji: '🍠', allergenLevel: 'low', recommendedAge: '6+' },
      { id: 'v_shanyao', name: '山药', emoji: '🍽️', allergenLevel: 'low', recommendedAge: '6+' },
      { id: 'v_xilanhua', name: '西蓝花', emoji: '🥦', allergenLevel: 'low', recommendedAge: '7+' },
      { id: 'v_bocai', name: '菠菜', emoji: '🥬', allergenLevel: 'low', recommendedAge: '7+' },
      { id: 'v_xihongshi', name: '西红柿', emoji: '🍅', allergenLevel: 'medium', recommendedAge: '8+' },
      { id: 'v_qiezi', name: '茄子', emoji: '🍆', allergenLevel: 'low', recommendedAge: '8+' },
      { id: 'v_huanggua', name: '黄瓜', emoji: '🥒', allergenLevel: 'low', recommendedAge: '8+' },
      { id: 'v_wandou', name: '豌豆', emoji: '🫛', allergenLevel: 'low', recommendedAge: '7+' },
      { id: 'v_yumi', name: '玉米', emoji: '🌽', allergenLevel: 'low', recommendedAge: '8+' },
      { id: 'v_lianou', name: '莲藕', emoji: '🍽️', allergenLevel: 'low', recommendedAge: '8+' },
      { id: 'v_donggua', name: '冬瓜', emoji: '🍽️', allergenLevel: 'low', recommendedAge: '7+' },
      { id: 'v_baicai', name: '白菜', emoji: '🥬', allergenLevel: 'low', recommendedAge: '7+' },
      { id: 'v_shengcai', name: '生菜', emoji: '🥗', allergenLevel: 'low', recommendedAge: '8+' },
      { id: 'v_caijiao', name: '彩椒', emoji: '🫑', allergenLevel: 'medium', recommendedAge: '8+' },
      { id: 'v_xihulu', name: '西葫芦', emoji: '🥒', allergenLevel: 'low', recommendedAge: '6+' },
      { id: 'v_qincai', name: '芹菜', emoji: '🥬', allergenLevel: 'medium', recommendedAge: '8+' },
      { id: 'v_xianggu', name: '香菇', emoji: '🍄', allergenLevel: 'low', recommendedAge: '8+' },
      { id: 'v_jinzhen', name: '金针菇', emoji: '🍄', allergenLevel: 'low', recommendedAge: '8+' },
      { id: 'v_xingbaogu', name: '杏鲍菇', emoji: '🍄', allergenLevel: 'low', recommendedAge: '8+' },
      { id: 'v_yangcong', name: '洋葱', emoji: '🧅', allergenLevel: 'medium', recommendedAge: '8+' },
      { id: 'v_suanmiao', name: '蒜苗', emoji: '🌿', allergenLevel: 'medium', recommendedAge: '10+' },
      { id: 'v_caihua', name: '菜花', emoji: '🥦', allergenLevel: 'low', recommendedAge: '7+' },
      { id: 'v_youcai', name: '油菜', emoji: '🥬', allergenLevel: 'low', recommendedAge: '7+' },
      { id: 'v_xiaobaicai', name: '小白菜', emoji: '🥬', allergenLevel: 'low', recommendedAge: '7+' },
      { id: 'v_qingcai', name: '青菜', emoji: '🥬', allergenLevel: 'low', recommendedAge: '7+' },
      { id: 'v_doujiao', name: '豆角', emoji: '🫛', allergenLevel: 'low', recommendedAge: '8+' },
      { id: 'v_jiangdou', name: '豇豆', emoji: '🫛', allergenLevel: 'low', recommendedAge: '8+' },
      { id: 'v_lusun', name: '芦笋', emoji: '🌿', allergenLevel: 'low', recommendedAge: '8+' },
      { id: 'v_wosun', name: '莴笋', emoji: '🥬', allergenLevel: 'low', recommendedAge: '8+' },
      { id: 'v_luobo', name: '萝卜', emoji: '🥕', allergenLevel: 'low', recommendedAge: '7+' },
      { id: 'v_bailuobo', name: '白萝卜', emoji: '🥕', allergenLevel: 'low', recommendedAge: '7+' },
      { id: 'v_zishu', name: '紫薯', emoji: '🍠', allergenLevel: 'low', recommendedAge: '6+' },
      { id: 'v_yutou', name: '芋头', emoji: '🍽️', allergenLevel: 'medium', recommendedAge: '8+' },
      { id: 'v_qiukui', name: '秋葵', emoji: '🌿', allergenLevel: 'low', recommendedAge: '8+' },
      { id: 'v_muer', name: '木耳', emoji: '🍄', allergenLevel: 'low', recommendedAge: '8+' },
    ],
  },
  {
    id: 'fruit',
    name: '水果',
    icon: '🍎',
    foods: [
      { id: 'f_pingguo', name: '苹果', emoji: '🍎', allergenLevel: 'low', recommendedAge: '6+' },
      { id: 'f_xiangjiao', name: '香蕉', emoji: '🍌', allergenLevel: 'low', recommendedAge: '6+' },
      { id: 'f_li', name: '梨', emoji: '🍐', allergenLevel: 'low', recommendedAge: '6+' },
      { id: 'f_niuyouguo', name: '牛油果', emoji: '🥑', allergenLevel: 'low', recommendedAge: '6+' },
      { id: 'f_lanmei', name: '蓝莓', emoji: '🫐', allergenLevel: 'medium', recommendedAge: '7+' },
      { id: 'f_taozi', name: '桃子', emoji: '🍑', allergenLevel: 'medium', recommendedAge: '8+' },
      { id: 'f_mihoutao', name: '猕猴桃', emoji: '🥝', allergenLevel: 'high', recommendedAge: '10+' },
      { id: 'f_caomei', name: '草莓', emoji: '🍓', allergenLevel: 'high', recommendedAge: '10+' },
      { id: 'f_mangguo', name: '芒果', emoji: '🥭', allergenLevel: 'high', recommendedAge: '10+' },
      { id: 'f_chengzi', name: '橙子', emoji: '🍊', allergenLevel: 'medium', recommendedAge: '10+' },
      { id: 'f_youzi', name: '柚子', emoji: '🍋', allergenLevel: 'medium', recommendedAge: '10+' },
      { id: 'f_huolongguo', name: '火龙果', emoji: '🍽️', allergenLevel: 'low', recommendedAge: '8+' },
      { id: 'f_hamigua', name: '哈密瓜', emoji: '🍈', allergenLevel: 'low', recommendedAge: '8+' },
      { id: 'f_yingtao', name: '樱桃', emoji: '🍒', allergenLevel: 'medium', recommendedAge: '10+' },
      { id: 'f_putao', name: '葡萄', emoji: '🍇', allergenLevel: 'medium', recommendedAge: '10+' },
      { id: 'f_xigua', name: '西瓜', emoji: '🍉', allergenLevel: 'low', recommendedAge: '8+' },
      { id: 'f_mugua', name: '木瓜', emoji: '🍈', allergenLevel: 'low', recommendedAge: '7+' },
      { id: 'f_boluo', name: '菠萝', emoji: '🍍', allergenLevel: 'high', recommendedAge: '10+' },
      { id: 'f_longyan', name: '龙眼', emoji: '🍇', allergenLevel: 'medium', recommendedAge: '10+' },
      { id: 'f_lizhi', name: '荔枝', emoji: '🍒', allergenLevel: 'medium', recommendedAge: '10+' },
      { id: 'f_shiliu', name: '石榴', emoji: '🍎', allergenLevel: 'medium', recommendedAge: '10+' },
      { id: 'f_shizi', name: '柿子', emoji: '🍊', allergenLevel: 'medium', recommendedAge: '10+' },
      { id: 'f_zao', name: '枣', emoji: '🍎', allergenLevel: 'low', recommendedAge: '8+' },
      { id: 'f_sangshen', name: '桑葚', emoji: '🫐', allergenLevel: 'medium', recommendedAge: '10+' },
      { id: 'f_yezi', name: '椰子', emoji: '🥥', allergenLevel: 'medium', recommendedAge: '10+' },
      { id: 'f_ningmeng', name: '柠檬', emoji: '🍋', allergenLevel: 'medium', recommendedAge: '10+' },
      { id: 'f_pipa', name: '枇杷', emoji: '🍑', allergenLevel: 'low', recommendedAge: '8+' },
      { id: 'f_lizi', name: '李子', emoji: '🍑', allergenLevel: 'medium', recommendedAge: '8+' },
      { id: 'f_xing', name: '杏', emoji: '🍑', allergenLevel: 'medium', recommendedAge: '8+' },
    ],
  },
  {
    id: 'meat',
    name: '肉蛋',
    icon: '🥩',
    foods: [
      { id: 'm_jirou', name: '鸡肉', emoji: '🍗', allergenLevel: 'low', recommendedAge: '7+' },
      { id: 'm_zhurou', name: '猪肉', emoji: '🥩', allergenLevel: 'low', recommendedAge: '7+' },
      { id: 'm_niurou', name: '牛肉', emoji: '🥩', allergenLevel: 'low', recommendedAge: '8+' },
      { id: 'm_yangrou', name: '羊肉', emoji: '🍖', allergenLevel: 'medium', recommendedAge: '10+' },
      { id: 'm_jidanhuang', name: '鸡蛋黄', emoji: '🥚', allergenLevel: 'medium', recommendedAge: '7+' },
      { id: 'm_jidanbai', name: '鸡蛋白', emoji: '🥚', allergenLevel: 'high', recommendedAge: '10+' },
      { id: 'm_yarou', name: '鸭肉', emoji: '🦆', allergenLevel: 'low', recommendedAge: '10+' },
      { id: 'm_zhugan', name: '猪肝', emoji: '🍽️', allergenLevel: 'low', recommendedAge: '8+' },
      { id: 'm_jigan', name: '鸡肝', emoji: '🍽️', allergenLevel: 'low', recommendedAge: '8+' },
      { id: 'm_anchundan', name: '鹌鹑蛋', emoji: '🥚', allergenLevel: 'medium', recommendedAge: '8+' },
      { id: 'm_zhengjidan', name: '整鸡蛋', emoji: '🥚', allergenLevel: 'high', recommendedAge: '10+' },
      { id: 'm_jixin', name: '鸡心', emoji: '🍽️', allergenLevel: 'low', recommendedAge: '8+' },
    ],
  },
  {
    id: 'seafood',
    name: '海鲜',
    icon: '🐟',
    foods: [
      { id: 's_sanwenyu', name: '三文鱼', emoji: '🐟', allergenLevel: 'medium', recommendedAge: '8+' },
      { id: 's_xueyu', name: '鳕鱼', emoji: '🐟', allergenLevel: 'medium', recommendedAge: '8+' },
      { id: 's_luyu', name: '鲈鱼', emoji: '🐟', allergenLevel: 'medium', recommendedAge: '8+' },
      { id: 's_xiaren', name: '虾仁', emoji: '🦐', allergenLevel: 'high', recommendedAge: '10+' },
      { id: 's_xiapi', name: '虾皮', emoji: '🦐', allergenLevel: 'high', recommendedAge: '10+' },
      { id: 's_youyu', name: '鱿鱼', emoji: '🦑', allergenLevel: 'high', recommendedAge: '12+' },
      { id: 's_beike', name: '贝壳类', emoji: '🐚', allergenLevel: 'high', recommendedAge: '12+' },
      { id: 's_haidai', name: '海带', emoji: '🍽️', allergenLevel: 'low', recommendedAge: '8+' },
      { id: 's_zicai', name: '紫菜', emoji: '🍽️', allergenLevel: 'low', recommendedAge: '8+' },
      { id: 's_daiyu', name: '带鱼', emoji: '🐟', allergenLevel: 'medium', recommendedAge: '8+' },
      { id: 's_huanghuayu', name: '黄花鱼', emoji: '🐟', allergenLevel: 'medium', recommendedAge: '8+' },
      { id: 's_bashayu', name: '巴沙鱼', emoji: '🐟', allergenLevel: 'medium', recommendedAge: '8+' },
      { id: 's_shanbei', name: '扇贝', emoji: '🐚', allergenLevel: 'high', recommendedAge: '12+' },
      { id: 's_xierou', name: '蟹肉', emoji: '🦀', allergenLevel: 'high', recommendedAge: '12+' },
      { id: 's_haishen', name: '海参', emoji: '🍽️', allergenLevel: 'medium', recommendedAge: '12+' },
    ],
  },
  {
    id: 'grain',
    name: '谷物主食',
    icon: '🌾',
    foods: [
      { id: 'g_mifen', name: '米粉', emoji: '🍚', allergenLevel: 'low', recommendedAge: '6+' },
      { id: 'g_yanmai', name: '燕麦', emoji: '🥣', allergenLevel: 'low', recommendedAge: '6+' },
      { id: 'g_xiaomai', name: '面条', emoji: '🍜', allergenLevel: 'high', recommendedAge: '8+' },
      { id: 'g_xiaomi', name: '小米', emoji: '🍽️', allergenLevel: 'low', recommendedAge: '7+' },
      { id: 'g_damizhou', name: '大米粥', emoji: '🥣', allergenLevel: 'low', recommendedAge: '6+' },
      { id: 'g_limai', name: '藜麦', emoji: '🍽️', allergenLevel: 'low', recommendedAge: '8+' },
      { id: 'g_quanmaimianbao', name: '全麦面包', emoji: '🍞', allergenLevel: 'high', recommendedAge: '10+' },
      { id: 'g_yumimian', name: '玉米面', emoji: '🍽️', allergenLevel: 'low', recommendedAge: '8+' },
      { id: 'g_mantou', name: '馒头', emoji: '🍞', allergenLevel: 'high', recommendedAge: '8+' },
      { id: 'g_mifan', name: '米饭', emoji: '🍚', allergenLevel: 'low', recommendedAge: '7+' },
      { id: 'g_yimian', name: '意面', emoji: '🍝', allergenLevel: 'high', recommendedAge: '8+' },
      { id: 'g_guamian', name: '挂面', emoji: '🍜', allergenLevel: 'high', recommendedAge: '8+' },
      { id: 'g_mifentiao', name: '米粉条', emoji: '🍜', allergenLevel: 'low', recommendedAge: '8+' },
      { id: 'g_heimi', name: '黑米', emoji: '🍚', allergenLevel: 'low', recommendedAge: '8+' },
      { id: 'g_qiaomai', name: '荞麦', emoji: '🌾', allergenLevel: 'medium', recommendedAge: '8+' },
      { id: 'g_hongshufeng', name: '红薯粉', emoji: '🍠', allergenLevel: 'low', recommendedAge: '8+' },
      { id: 'g_tudounifen', name: '土豆泥粉', emoji: '🥔', allergenLevel: 'low', recommendedAge: '6+' },
    ],
  },
  {
    id: 'beans_nuts',
    name: '豆坚果',
    icon: '🥜',
    foods: [
      { id: 'bn_doufu', name: '豆腐', emoji: '🧈', allergenLevel: 'medium', recommendedAge: '8+' },
      { id: 'bn_doujiang', name: '豆浆', emoji: '🥛', allergenLevel: 'medium', recommendedAge: '10+' },
      { id: 'bn_hongdou', name: '红豆', emoji: '🫘', allergenLevel: 'low', recommendedAge: '8+' },
      { id: 'bn_lvdou', name: '绿豆', emoji: '🫘', allergenLevel: 'low', recommendedAge: '8+' },
      { id: 'bn_heidou', name: '黑豆', emoji: '🫘', allergenLevel: 'low', recommendedAge: '8+' },
      { id: 'bn_huasheng', name: '花生', emoji: '🥜', allergenLevel: 'high', recommendedAge: '12+' },
      { id: 'bn_hetao', name: '核桃', emoji: '🌰', allergenLevel: 'high', recommendedAge: '12+' },
      { id: 'bn_zhimajiang', name: '芝麻酱', emoji: '🍽️', allergenLevel: 'high', recommendedAge: '10+' },
      { id: 'bn_yaoguo', name: '腰果', emoji: '🥜', allergenLevel: 'high', recommendedAge: '12+' },
      { id: 'bn_xingren', name: '杏仁', emoji: '🥜', allergenLevel: 'high', recommendedAge: '12+' },
      { id: 'bn_maodou', name: '毛豆', emoji: '🫛', allergenLevel: 'medium', recommendedAge: '8+' },
      { id: 'bn_yingzuidou', name: '鹰嘴豆', emoji: '🫘', allergenLevel: 'medium', recommendedAge: '8+' },
      { id: 'bn_yundou', name: '芸豆', emoji: '🫘', allergenLevel: 'medium', recommendedAge: '8+' },
      { id: 'bn_yamazifen', name: '亚麻籽粉', emoji: '🌾', allergenLevel: 'medium', recommendedAge: '10+' },
      { id: 'bn_xingrenfen', name: '杏仁粉', emoji: '🥜', allergenLevel: 'high', recommendedAge: '12+' },
    ],
  },
  {
    id: 'dairy',
    name: '奶制品',
    icon: '🧀',
    foods: [
      { id: 'd_suannai', name: '原味酸奶', emoji: '🥛', allergenLevel: 'medium', recommendedAge: '7+' },
      { id: 'd_nailao', name: '奶酪', emoji: '🧀', allergenLevel: 'medium', recommendedAge: '8+' },
      { id: 'd_niunai', name: '牛奶', emoji: '🥛', allergenLevel: 'high', recommendedAge: '12+' },
      { id: 'd_huangyou', name: '黄油', emoji: '🧈', allergenLevel: 'medium', recommendedAge: '8+' },
      { id: 'd_wutangsuannai', name: '无糖酸奶', emoji: '🥛', allergenLevel: 'medium', recommendedAge: '7+' },
      { id: 'd_zhishipian', name: '芝士片', emoji: '🧀', allergenLevel: 'medium', recommendedAge: '8+' },
    ],
  },
  {
    id: 'drink_condiment',
    name: '饮品调味',
    icon: '💧',
    foods: [
      { id: 'dc_shui', name: '水', emoji: '💧', allergenLevel: 'low', recommendedAge: '6+' },
      { id: 'dc_wenkaishui', name: '温开水', emoji: '💧', allergenLevel: 'low', recommendedAge: '6+' },
      { id: 'dc_liangbaikai', name: '凉白开', emoji: '💧', allergenLevel: 'low', recommendedAge: '6+' },
      { id: 'dc_peifangnai', name: '配方奶', emoji: '🍼', allergenLevel: 'medium', recommendedAge: '6+' },
      { id: 'dc_muru', name: '母乳', emoji: '🍼', allergenLevel: 'low', recommendedAge: '0+' },
      { id: 'dc_fushiyou', name: '辅食油', emoji: '🫒', allergenLevel: 'low', recommendedAge: '6+' },
      { id: 'dc_ganlanyou', name: '橄榄油', emoji: '🫒', allergenLevel: 'low', recommendedAge: '6+' },
      { id: 'dc_zhimayou', name: '芝麻油', emoji: '🫒', allergenLevel: 'high', recommendedAge: '10+' },
      { id: 'dc_yan', name: '盐', emoji: '🧂', allergenLevel: 'low', recommendedAge: '12+' },
    ],
  },
  {
    id: 'other',
    name: '其他',
    icon: '📦',
    foods: [],
  },
];

/** 获取所有食物的扁平列表 */
export function getAllFoods() {
  return foodCategories.flatMap(cat =>
    cat.foods.map(food => ({ ...food, categoryId: cat.id, categoryName: cat.name, categoryIcon: cat.icon }))
  );
}

/** 通过 ID 查找食物 */
export function getFoodById(foodId: string) {
  for (const cat of foodCategories) {
    const food = cat.foods.find(f => f.id === foodId);
    if (food) {
      return { ...food, categoryId: cat.id, categoryName: cat.name, categoryIcon: cat.icon };
    }
  }
  return null;
}

/** 搜索食物 */
export function searchFoods(keyword: string) {
  const lower = keyword.toLowerCase();
  return getAllFoods().filter(f => f.name.toLowerCase().includes(lower));
}

/** 获取食物 emoji（带 fallback） */
export function getFoodEmoji(foodId: string): string {
  const food = getFoodById(foodId);
  return food?.emoji || '🍽️';
}

// ============ 自定义食物管理（服务端，经 store 内存镜像）============

export {
  addCustomFood,
  deleteCustomFood,
  updateCustomFood,
  getCustomFoodAllergenLevel,
  getCustomFoodsByCategory,
  isCustomFood,
} from '../store';
