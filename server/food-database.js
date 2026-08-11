/**
 * 婴儿辅食排敏食物知识库
 * 来源：BabyCenter、AAP、WHO、中国居民膳食指南
 * 每种食物包含：致敏等级、推荐月龄、排敏观察建议、营养价值、烹饪建议
 */

const foodDatabase = {
  vegetable: {
    id: 'vegetable',
    name: '蔬菜',
    icon: '🥬',
    foods: [
      { id: 'v_nangua', name: '南瓜', emoji: '🎃', allergenLevel: 'low', recommendedAge: 6, notes: '低致敏，适合作为初期辅食，富含β-胡萝卜素', observeDays: 3 },
      { id: 'v_huluobo', name: '胡萝卜', emoji: '🥕', allergenLevel: 'low', recommendedAge: 6, notes: '低致敏，建议蒸熟打泥，富含维生素A', observeDays: 3 },
      { id: 'v_tudou', name: '土豆', emoji: '🥔', allergenLevel: 'low', recommendedAge: 6, notes: '低致敏，高碳水提供能量', observeDays: 3 },
      { id: 'v_hongshu', name: '红薯', emoji: '🍠', allergenLevel: 'low', recommendedAge: 6, notes: '低致敏，富含膳食纤维，注意通便作用', observeDays: 3 },
      { id: 'v_shanyao', name: '山药', emoji: '🍽️', allergenLevel: 'low', recommendedAge: 6, notes: '低致敏，健脾养胃，接触生山药皮注意手部过敏', observeDays: 3 },
      { id: 'v_xilanhua', name: '西蓝花', emoji: '🥦', allergenLevel: 'low', recommendedAge: 7, notes: '低致敏，十字花科，易产气注意腹胀', observeDays: 3 },
      { id: 'v_bocai', name: '菠菜', emoji: '🥬', allergenLevel: 'low', recommendedAge: 7, notes: '低致敏，草酸高建议焯水再烹调', observeDays: 3 },
      { id: 'v_xihongshi', name: '西红柿', emoji: '🍅', allergenLevel: 'medium', recommendedAge: 8, notes: '中致敏，酸味重可搭配其他食材', observeDays: 3 },
      { id: 'v_qiezi', name: '茄子', emoji: '🍆', allergenLevel: 'low', recommendedAge: 8, notes: '低致敏，建议蒸熟去皮', observeDays: 3 },
      { id: 'v_huanggua', name: '黄瓜', emoji: '🥒', allergenLevel: 'low', recommendedAge: 8, notes: '低致敏，10个月后可做手指食物', observeDays: 3 },
      { id: 'v_wandou', name: '豌豆', emoji: '🫛', allergenLevel: 'low', recommendedAge: 7, notes: '低致敏，豆类注意充分煮熟', observeDays: 3 },
      { id: 'v_yumi', name: '玉米', emoji: '🌽', allergenLevel: 'low', recommendedAge: 8, notes: '低致敏，玉米粒不易消化需打泥', observeDays: 3 },
      { id: 'v_lianou', name: '莲藕', emoji: '🍽️', allergenLevel: 'low', recommendedAge: 8, notes: '低致敏，淀粉含量高', observeDays: 3 },
      { id: 'v_donggua', name: '冬瓜', emoji: '🍽️', allergenLevel: 'low', recommendedAge: 7, notes: '低致敏，水分高适合夏天', observeDays: 3 },
      { id: 'v_baicai', name: '白菜', emoji: '🥬', allergenLevel: 'low', recommendedAge: 7, notes: '低致敏，清淡易消化', observeDays: 3 },
      { id: 'v_shengcai', name: '生菜', emoji: '🥗', allergenLevel: 'low', recommendedAge: 8, notes: '低致敏，10个月后可做生食手指食物', observeDays: 3 },
      { id: 'v_caijiao', name: '彩椒', emoji: '🫑', allergenLevel: 'medium', recommendedAge: 8, notes: '中致敏，茄科，建议蒸软去皮', observeDays: 3 },
      { id: 'v_xihulu', name: '西葫芦', emoji: '🥒', allergenLevel: 'low', recommendedAge: 6, notes: '低致敏，水分高易打泥', observeDays: 3 },
      { id: 'v_qincai', name: '芹菜', emoji: '🥬', allergenLevel: 'medium', recommendedAge: 8, notes: '中致敏，纤维粗需切碎煮软', observeDays: 3 },
      { id: 'v_xianggu', name: '香菇', emoji: '🍄', allergenLevel: 'low', recommendedAge: 8, notes: '低致敏，菌菇类充分煮熟', observeDays: 3 },
      { id: 'v_jinzhen', name: '金针菇', emoji: '🍄', allergenLevel: 'low', recommendedAge: 8, notes: '低致敏，切碎防噎', observeDays: 3 },
      { id: 'v_xingbaogu', name: '杏鲍菇', emoji: '🍄', allergenLevel: 'low', recommendedAge: 8, notes: '低致敏，质地韧需充分煮软', observeDays: 3 },
      { id: 'v_yangcong', name: '洋葱', emoji: '🧅', allergenLevel: 'medium', recommendedAge: 8, notes: '中致敏，辛辣刺激，建议少量炖软', observeDays: 3 },
      { id: 'v_suanmiao', name: '蒜苗', emoji: '🌿', allergenLevel: 'medium', recommendedAge: 10, notes: '中致敏，辛香料，大月龄少量', observeDays: 3 },
      { id: 'v_caihua', name: '菜花', emoji: '🥦', allergenLevel: 'low', recommendedAge: 7, notes: '低致敏，十字花科，易产气', observeDays: 3 },
      { id: 'v_youcai', name: '油菜', emoji: '🥬', allergenLevel: 'low', recommendedAge: 7, notes: '低致敏，焯水后切碎', observeDays: 3 },
      { id: 'v_xiaobaicai', name: '小白菜', emoji: '🥬', allergenLevel: 'low', recommendedAge: 7, notes: '低致敏，清淡易消化', observeDays: 3 },
      { id: 'v_qingcai', name: '青菜', emoji: '🥬', allergenLevel: 'low', recommendedAge: 7, notes: '低致敏，常见绿叶菜', observeDays: 3 },
      { id: 'v_doujiao', name: '豆角', emoji: '🫛', allergenLevel: 'low', recommendedAge: 8, notes: '低致敏，必须充分煮熟', observeDays: 3 },
      { id: 'v_jiangdou', name: '豇豆', emoji: '🫛', allergenLevel: 'low', recommendedAge: 8, notes: '低致敏，充分煮软切碎', observeDays: 3 },
      { id: 'v_lusun', name: '芦笋', emoji: '🌿', allergenLevel: 'low', recommendedAge: 8, notes: '低致敏，嫩茎蒸软', observeDays: 3 },
      { id: 'v_wosun', name: '莴笋', emoji: '🥬', allergenLevel: 'low', recommendedAge: 8, notes: '低致敏，去皮切丝煮软', observeDays: 3 },
      { id: 'v_luobo', name: '萝卜', emoji: '🥕', allergenLevel: 'low', recommendedAge: 7, notes: '低致敏，可红萝卜或心里美', observeDays: 3 },
      { id: 'v_bailuobo', name: '白萝卜', emoji: '🥕', allergenLevel: 'low', recommendedAge: 7, notes: '低致敏，水分高易消化', observeDays: 3 },
      { id: 'v_zishu', name: '紫薯', emoji: '🍠', allergenLevel: 'low', recommendedAge: 6, notes: '低致敏，富含花青素', observeDays: 3 },
      { id: 'v_yutou', name: '芋头', emoji: '🍽️', allergenLevel: 'medium', recommendedAge: 8, notes: '中致敏，生芋头刺激皮肤，必须煮透', observeDays: 3 },
      { id: 'v_qiukui', name: '秋葵', emoji: '🌿', allergenLevel: 'low', recommendedAge: 8, notes: '低致敏，黏液质，切碎煮软', observeDays: 3 },
      { id: 'v_muer', name: '木耳', emoji: '🍄', allergenLevel: 'low', recommendedAge: 8, notes: '低致敏，泡发洗净切碎', observeDays: 3 },
    ],
  },
  fruit: {
    id: 'fruit',
    name: '水果',
    icon: '🍎',
    foods: [
      { id: 'f_pingguo', name: '苹果', emoji: '🍎', allergenLevel: 'low', recommendedAge: 6, notes: '低致敏，建议蒸熟防呛噎', observeDays: 3 },
      { id: 'f_xiangjiao', name: '香蕉', emoji: '🍌', allergenLevel: 'low', recommendedAge: 6, notes: '低致敏，富含钾，注意不要过生（鞣酸致便秘）', observeDays: 3 },
      { id: 'f_li', name: '梨', emoji: '🍐', allergenLevel: 'low', recommendedAge: 6, notes: '低致敏，有润肺作用，可缓解咳嗽', observeDays: 3 },
      { id: 'f_niuyouguo', name: '牛油果', emoji: '🥑', allergenLevel: 'low', recommendedAge: 6, notes: '低致敏，优质脂肪来源', observeDays: 3 },
      { id: 'f_lanmei', name: '蓝莓', emoji: '🫐', allergenLevel: 'medium', recommendedAge: 7, notes: '中致敏，富含花青素，注意籽', observeDays: 3 },
      { id: 'f_taozi', name: '桃子', emoji: '🍑', allergenLevel: 'medium', recommendedAge: 8, notes: '中致敏，桃毛需彻底清洗或去皮', observeDays: 3 },
      { id: 'f_mihoutao', name: '猕猴桃', emoji: '🥝', allergenLevel: 'high', recommendedAge: 10, notes: '高致敏，含猕猴桃蛋白酶，首次少量试', observeDays: 5 },
      { id: 'f_caomei', name: '草莓', emoji: '🍓', allergenLevel: 'high', recommendedAge: 10, notes: '高致敏，表面易残留农药需充分浸泡清洗', observeDays: 5 },
      { id: 'f_mangguo', name: '芒果', emoji: '🥭', allergenLevel: 'high', recommendedAge: 10, notes: '高致敏，漆酚类致敏物，注意口周皮疹', observeDays: 5 },
      { id: 'f_chengzi', name: '橙子', emoji: '🍊', allergenLevel: 'medium', recommendedAge: 10, notes: '中致敏，柑橘类果汁酸度高', observeDays: 3 },
      { id: 'f_youzi', name: '柚子', emoji: '🍋', allergenLevel: 'medium', recommendedAge: 10, notes: '中致敏，注意与药物相互作用', observeDays: 3 },
      { id: 'f_huolongguo', name: '火龙果', emoji: '🍽️', allergenLevel: 'low', recommendedAge: 8, notes: '低致敏，通便效果好，注意红色火龙果染色', observeDays: 3 },
      { id: 'f_hamigua', name: '哈密瓜', emoji: '🍈', allergenLevel: 'low', recommendedAge: 8, notes: '低致敏，含糖量高适量', observeDays: 3 },
      { id: 'f_yingtao', name: '樱桃', emoji: '🍒', allergenLevel: 'medium', recommendedAge: 10, notes: '中致敏，去核防窒息', observeDays: 3 },
      { id: 'f_putao', name: '葡萄', emoji: '🍇', allergenLevel: 'medium', recommendedAge: 10, notes: '中致敏，去皮去籽切成四分之一', observeDays: 3 },
      { id: 'f_xigua', name: '西瓜', emoji: '🍉', allergenLevel: 'low', recommendedAge: 8, notes: '低致敏，水分多消暑，去籽', observeDays: 3 },
      { id: 'f_mugua', name: '木瓜', emoji: '🍈', allergenLevel: 'low', recommendedAge: 7, notes: '低致敏，含木瓜蛋白酶，熟透食用', observeDays: 3 },
      { id: 'f_boluo', name: '菠萝', emoji: '🍍', allergenLevel: 'high', recommendedAge: 10, notes: '高致敏，建议盐水浸泡去刺激', observeDays: 5 },
      { id: 'f_longyan', name: '龙眼', emoji: '🍇', allergenLevel: 'medium', recommendedAge: 10, notes: '中致敏，去核防噎，含糖高适量', observeDays: 3 },
      { id: 'f_lizhi', name: '荔枝', emoji: '🍒', allergenLevel: 'medium', recommendedAge: 10, notes: '中致敏，去核，不宜过量', observeDays: 3 },
      { id: 'f_shiliu', name: '石榴', emoji: '🍎', allergenLevel: 'medium', recommendedAge: 10, notes: '中致敏，籽多注意呛噎', observeDays: 3 },
      { id: 'f_shizi', name: '柿子', emoji: '🍊', allergenLevel: 'medium', recommendedAge: 10, notes: '中致敏，选软柿，空腹慎食', observeDays: 3 },
      { id: 'f_zao', name: '枣', emoji: '🍎', allergenLevel: 'low', recommendedAge: 8, notes: '低致敏，红枣煮软去核捣泥', observeDays: 3 },
      { id: 'f_sangshen', name: '桑葚', emoji: '🫐', allergenLevel: 'medium', recommendedAge: 10, notes: '中致敏，充分清洗', observeDays: 3 },
      { id: 'f_yezi', name: '椰子', emoji: '🥥', allergenLevel: 'medium', recommendedAge: 10, notes: '中致敏，可用椰奶/椰肉泥少量试', observeDays: 3 },
      { id: 'f_ningmeng', name: '柠檬', emoji: '🍋', allergenLevel: 'medium', recommendedAge: 10, notes: '中致敏，柑橘类，酸度高少量调味', observeDays: 3 },
      { id: 'f_pipa', name: '枇杷', emoji: '🍑', allergenLevel: 'low', recommendedAge: 8, notes: '低致敏，去皮去核', observeDays: 3 },
      { id: 'f_lizi', name: '李子', emoji: '🍑', allergenLevel: 'medium', recommendedAge: 8, notes: '中致敏，核果类，去核去皮', observeDays: 3 },
      { id: 'f_xing', name: '杏', emoji: '🍑', allergenLevel: 'medium', recommendedAge: 8, notes: '中致敏，核果类，去核', observeDays: 3 },
    ],
  },
  meat: {
    id: 'meat',
    name: '肉蛋',
    icon: '🥩',
    foods: [
      { id: 'm_jirou', name: '鸡肉', emoji: '🍗', allergenLevel: 'low', recommendedAge: 7, notes: '低致敏，优选鸡胸肉去筋膜，铁含量低于红肉', observeDays: 3 },
      { id: 'm_zhurou', name: '猪肉', emoji: '🥩', allergenLevel: 'low', recommendedAge: 7, notes: '低致敏，建议选瘦猪肉，富含B族维生素', observeDays: 3 },
      { id: 'm_niurou', name: '牛肉', emoji: '🥩', allergenLevel: 'low', recommendedAge: 8, notes: '低致敏，高铁高蛋白首选，建议炖至酥烂', observeDays: 3 },
      { id: 'm_yangrou', name: '羊肉', emoji: '🍖', allergenLevel: 'medium', recommendedAge: 10, notes: '中致敏，膻味较重建议搭配蔬菜', observeDays: 3 },
      { id: 'm_jidanhuang', name: '鸡蛋黄', emoji: '🥚', allergenLevel: 'medium', recommendedAge: 7, notes: '中致敏，营养密度高，从1/4蛋黄开始，观察3天后加量', observeDays: 3 },
      { id: 'm_jidanbai', name: '鸡蛋白', emoji: '🥚', allergenLevel: 'high', recommendedAge: 10, notes: '高致敏，蛋清蛋白是最常见过敏原之一，建议10个月后尝试', observeDays: 5 },
      { id: 'm_yarou', name: '鸭肉', emoji: '🦆', allergenLevel: 'low', recommendedAge: 10, notes: '低致敏，凉性食材', observeDays: 3 },
      { id: 'm_zhugan', name: '猪肝', emoji: '🍽️', allergenLevel: 'low', recommendedAge: 8, notes: '低致敏，高铁高维生素A，每周1-2次，不可过量', observeDays: 3 },
      { id: 'm_jigan', name: '鸡肝', emoji: '🍽️', allergenLevel: 'low', recommendedAge: 8, notes: '低致敏，铁含量高，注意清洗', observeDays: 3 },
      { id: 'm_anchundan', name: '鹌鹑蛋', emoji: '🥚', allergenLevel: 'medium', recommendedAge: 8, notes: '中致敏，与鸡蛋可能交叉过敏', observeDays: 3 },
      { id: 'm_zhengjidan', name: '整鸡蛋', emoji: '🥚', allergenLevel: 'high', recommendedAge: 10, notes: '高致敏，含蛋清蛋白，需蛋黄排敏后再试整蛋', observeDays: 5 },
      { id: 'm_jixin', name: '鸡心', emoji: '🍽️', allergenLevel: 'low', recommendedAge: 8, notes: '低致敏，富含铁与B族维生素，煮软剁碎', observeDays: 3 },
    ],
  },
  seafood: {
    id: 'seafood',
    name: '海鲜',
    icon: '🐟',
    foods: [
      { id: 's_sanwenyu', name: '三文鱼', emoji: '🐟', allergenLevel: 'medium', recommendedAge: 8, notes: '中致敏，富含DHA优质脂肪，建议选新鲜非腌制', observeDays: 3 },
      { id: 's_xueyu', name: '鳕鱼', emoji: '🐟', allergenLevel: 'medium', recommendedAge: 8, notes: '中致敏，肉嫩刺少，注意区分真假鳕鱼（银鳕鱼含油量高）', observeDays: 3 },
      { id: 's_luyu', name: '鲈鱼', emoji: '🐟', allergenLevel: 'medium', recommendedAge: 8, notes: '中致敏，淡水鱼致敏性低于海鱼', observeDays: 3 },
      { id: 's_xiaren', name: '虾仁', emoji: '🦐', allergenLevel: 'high', recommendedAge: 10, notes: '高致敏，甲壳类过敏常见，需彻底煮熟', observeDays: 5 },
      { id: 's_xiapi', name: '虾皮', emoji: '🦐', allergenLevel: 'high', recommendedAge: 10, notes: '高致敏，含盐量高建议清水浸泡', observeDays: 5 },
      { id: 's_youyu', name: '鱿鱼', emoji: '🦑', allergenLevel: 'high', recommendedAge: 12, notes: '高致敏，咀嚼难度大建议周岁后', observeDays: 5 },
      { id: 's_beike', name: '贝壳类', emoji: '🐚', allergenLevel: 'high', recommendedAge: 12, notes: '高致敏，贝类是强过敏原，建议12月龄后', observeDays: 5 },
      { id: 's_haidai', name: '海带', emoji: '🍽️', allergenLevel: 'low', recommendedAge: 8, notes: '低致敏，富含碘，注意盐分', observeDays: 3 },
      { id: 's_zicai', name: '紫菜', emoji: '🍽️', allergenLevel: 'low', recommendedAge: 8, notes: '低致敏，碘含量高，少量即可', observeDays: 3 },
      { id: 's_daiyu', name: '带鱼', emoji: '🐟', allergenLevel: 'medium', recommendedAge: 8, notes: '中致敏，刺少肉嫩，充分去刺', observeDays: 3 },
      { id: 's_huanghuayu', name: '黄花鱼', emoji: '🐟', allergenLevel: 'medium', recommendedAge: 8, notes: '中致敏，注意细刺', observeDays: 3 },
      { id: 's_bashayu', name: '巴沙鱼', emoji: '🐟', allergenLevel: 'medium', recommendedAge: 8, notes: '中致敏，刺少易处理', observeDays: 3 },
      { id: 's_shanbei', name: '扇贝', emoji: '🐚', allergenLevel: 'high', recommendedAge: 12, notes: '高致敏，贝类强过敏原', observeDays: 5 },
      { id: 's_xierou', name: '蟹肉', emoji: '🦀', allergenLevel: 'high', recommendedAge: 12, notes: '高致敏，甲壳类，周岁后少量试', observeDays: 5 },
      { id: 's_haishen', name: '海参', emoji: '🍽️', allergenLevel: 'medium', recommendedAge: 12, notes: '中致敏，周岁后，需充分发制煮软', observeDays: 3 },
    ],
  },
  grain: {
    id: 'grain',
    name: '谷物主食',
    icon: '🌾',
    foods: [
      { id: 'g_mifen', name: '米粉', emoji: '🍚', allergenLevel: 'low', recommendedAge: 6, notes: '低致敏，首选高铁米粉', observeDays: 3 },
      { id: 'g_yanmai', name: '燕麦', emoji: '🥣', allergenLevel: 'low', recommendedAge: 6, notes: '低致敏，注意选择无添加纯燕麦', observeDays: 3 },
      { id: 'g_xiaomai', name: '面条/小麦', emoji: '🍜', allergenLevel: 'high', recommendedAge: 8, notes: '高致敏，麸质过敏较常见，建议8个月后引入', observeDays: 5 },
      { id: 'g_xiaomi', name: '小米', emoji: '🍽️', allergenLevel: 'low', recommendedAge: 7, notes: '低致敏，易消化，脾胃虚弱宝宝友好', observeDays: 3 },
      { id: 'g_damizhou', name: '大米粥', emoji: '🥣', allergenLevel: 'low', recommendedAge: 6, notes: '低致敏，最安全的基础辅食', observeDays: 3 },
      { id: 'g_limai', name: '藜麦', emoji: '🍽️', allergenLevel: 'low', recommendedAge: 8, notes: '低致敏，全蛋白谷物', observeDays: 3 },
      { id: 'g_quanmaimianbao', name: '全麦面包', emoji: '🍞', allergenLevel: 'high', recommendedAge: 10, notes: '高致敏，麸质过敏，注意小块防噎', observeDays: 5 },
      { id: 'g_yumimian', name: '玉米面', emoji: '🍽️', allergenLevel: 'low', recommendedAge: 8, notes: '低致敏，细玉米面易消化', observeDays: 3 },
      { id: 'g_mantou', name: '馒头', emoji: '🍞', allergenLevel: 'high', recommendedAge: 8, notes: '高致敏，小麦粉制品', observeDays: 5 },
      { id: 'g_mifan', name: '米饭', emoji: '🍚', allergenLevel: 'low', recommendedAge: 7, notes: '低致敏，可压成米糊或软饭', observeDays: 3 },
      { id: 'g_yimian', name: '意面', emoji: '🍝', allergenLevel: 'high', recommendedAge: 8, notes: '高致敏，小麦麸质，煮软切短', observeDays: 5 },
      { id: 'g_guamian', name: '挂面', emoji: '🍜', allergenLevel: 'high', recommendedAge: 8, notes: '高致敏，小麦制品，选无盐细面', observeDays: 5 },
      { id: 'g_mifentiao', name: '米粉条', emoji: '🍜', allergenLevel: 'low', recommendedAge: 8, notes: '低致敏，大米制品，煮软', observeDays: 3 },
      { id: 'g_heimi', name: '黑米', emoji: '🍚', allergenLevel: 'low', recommendedAge: 8, notes: '低致敏，煮软或打泥', observeDays: 3 },
      { id: 'g_qiaomai', name: '荞麦', emoji: '🌾', allergenLevel: 'medium', recommendedAge: 8, notes: '中致敏，非麸质但仍需观察', observeDays: 3 },
      { id: 'g_hongshufeng', name: '红薯粉', emoji: '🍠', allergenLevel: 'low', recommendedAge: 8, notes: '低致敏，可做羹汤增稠', observeDays: 3 },
      { id: 'g_tudounifen', name: '土豆泥粉', emoji: '🥔', allergenLevel: 'low', recommendedAge: 6, notes: '低致敏，初期辅食增稠可用', observeDays: 3 },
    ],
  },
  beans_nuts: {
    id: 'beans_nuts',
    name: '豆坚果',
    icon: '🥜',
    foods: [
      { id: 'bn_doufu', name: '豆腐', emoji: '🧈', allergenLevel: 'medium', recommendedAge: 8, notes: '中致敏，大豆过敏较常见，建议8个月后', observeDays: 3 },
      { id: 'bn_doujiang', name: '豆浆', emoji: '🥛', allergenLevel: 'medium', recommendedAge: 10, notes: '中致敏，大豆制品注意浓度', observeDays: 3 },
      { id: 'bn_hongdou', name: '红豆', emoji: '🫘', allergenLevel: 'low', recommendedAge: 8, notes: '低致敏，豆类充分煮熟', observeDays: 3 },
      { id: 'bn_lvdou', name: '绿豆', emoji: '🫘', allergenLevel: 'low', recommendedAge: 8, notes: '低致敏，消暑', observeDays: 3 },
      { id: 'bn_heidou', name: '黑豆', emoji: '🫘', allergenLevel: 'low', recommendedAge: 8, notes: '低致敏', observeDays: 3 },
      { id: 'bn_huasheng', name: '花生', emoji: '🥜', allergenLevel: 'high', recommendedAge: 12, notes: '高致敏，花生是最常见的强过敏原之一，建议12月龄后引入', observeDays: 5 },
      { id: 'bn_hetao', name: '核桃', emoji: '🌰', allergenLevel: 'high', recommendedAge: 12, notes: '高致敏，树坚果类，注意做成糊状防呛', observeDays: 5 },
      { id: 'bn_zhimajiang', name: '芝麻酱', emoji: '🍽️', allergenLevel: 'high', recommendedAge: 10, notes: '高致敏，芝麻过敏，建议10个月后少量试', observeDays: 5 },
      { id: 'bn_yaoguo', name: '腰果', emoji: '🥜', allergenLevel: 'high', recommendedAge: 12, notes: '高致敏，树坚果，与花生交叉过敏概率高', observeDays: 5 },
      { id: 'bn_xingren', name: '杏仁', emoji: '🥜', allergenLevel: 'high', recommendedAge: 12, notes: '高致敏，树坚果', observeDays: 5 },
      { id: 'bn_maodou', name: '毛豆', emoji: '🫛', allergenLevel: 'medium', recommendedAge: 8, notes: '中致敏，大豆类，充分煮软去皮', observeDays: 3 },
      { id: 'bn_yingzuidou', name: '鹰嘴豆', emoji: '🫘', allergenLevel: 'medium', recommendedAge: 8, notes: '中致敏，充分煮软捣泥', observeDays: 3 },
      { id: 'bn_yundou', name: '芸豆', emoji: '🫘', allergenLevel: 'medium', recommendedAge: 8, notes: '中致敏，必须充分煮熟破坏毒素', observeDays: 3 },
      { id: 'bn_yamazifen', name: '亚麻籽粉', emoji: '🌾', allergenLevel: 'medium', recommendedAge: 10, notes: '中致敏，少量拌入辅食', observeDays: 3 },
      { id: 'bn_xingrenfen', name: '杏仁粉', emoji: '🥜', allergenLevel: 'high', recommendedAge: 12, notes: '高致敏，树坚果粉，防呛', observeDays: 5 },
    ],
  },
  dairy: {
    id: 'dairy',
    name: '奶制品',
    icon: '🧀',
    foods: [
      { id: 'd_suannai', name: '原味酸奶', emoji: '🥛', allergenLevel: 'medium', recommendedAge: 7, notes: '中致敏，发酵乳制品致敏性低于纯牛奶，选择无添加糖', observeDays: 3 },
      { id: 'd_nailao', name: '奶酪', emoji: '🧀', allergenLevel: 'medium', recommendedAge: 8, notes: '中致敏，注意选低钠原制奶酪', observeDays: 3 },
      { id: 'd_niunai', name: '牛奶（饮品）', emoji: '🥛', allergenLevel: 'high', recommendedAge: 12, notes: '高致敏，牛奶蛋白是最常见婴儿过敏原之一，建议12月龄后引入鲜牛奶，6-12月以配方奶为主', observeDays: 5 },
      { id: 'd_huangyou', name: '黄油', emoji: '🧈', allergenLevel: 'medium', recommendedAge: 8, notes: '中致敏，乳制品，少量使用', observeDays: 3 },
      { id: 'd_wutangsuannai', name: '无糖酸奶', emoji: '🥛', allergenLevel: 'medium', recommendedAge: 7, notes: '中致敏，无添加糖酸奶更适合辅食期', observeDays: 3 },
      { id: 'd_zhishipian', name: '芝士片', emoji: '🧀', allergenLevel: 'medium', recommendedAge: 8, notes: '中致敏，注意钠含量，选儿童低钠款', observeDays: 3 },
    ],
  },
  drink_condiment: {
    id: 'drink_condiment',
    name: '饮品调味',
    icon: '💧',
    foods: [
      { id: 'dc_shui', name: '水', emoji: '💧', allergenLevel: 'low', recommendedAge: 6, notes: '非传统排敏对象，可记录饮用；辅食期可适量温水', observeDays: 1 },
      { id: 'dc_wenkaishui', name: '温开水', emoji: '💧', allergenLevel: 'low', recommendedAge: 6, notes: '记录饮水用，注意温度适宜', observeDays: 1 },
      { id: 'dc_liangbaikai', name: '凉白开', emoji: '💧', allergenLevel: 'low', recommendedAge: 6, notes: '记录饮水用', observeDays: 1 },
      { id: 'dc_peifangnai', name: '配方奶', emoji: '🍼', allergenLevel: 'medium', recommendedAge: 6, notes: '中致敏，含牛乳蛋白（特殊配方除外），换奶需观察', observeDays: 3 },
      { id: 'dc_muru', name: '母乳', emoji: '🍼', allergenLevel: 'low', recommendedAge: 0, notes: '记录用，非排敏对象', observeDays: 1 },
      { id: 'dc_fushiyou', name: '辅食油', emoji: '🫒', allergenLevel: 'low', recommendedAge: 6, notes: '低致敏，初期辅食可加几滴植物油', observeDays: 3 },
      { id: 'dc_ganlanyou', name: '橄榄油', emoji: '🫒', allergenLevel: 'low', recommendedAge: 6, notes: '低致敏，优选特级初榨少量', observeDays: 3 },
      { id: 'dc_zhimayou', name: '芝麻油', emoji: '🫒', allergenLevel: 'high', recommendedAge: 10, notes: '高致敏，含芝麻，与芝麻酱同类观察', observeDays: 5 },
      { id: 'dc_yan', name: '盐', emoji: '🧂', allergenLevel: 'low', recommendedAge: 12, notes: '1岁前原则上不加盐；此处供大月龄记录', observeDays: 1 },
    ],
  },
  other: {
    id: 'other',
    name: '其他',
    icon: '📦',
    foods: [],
  },
};

/** 获取所有食物扁平列表 */
function getAllFoods() {
  const all = [];
  for (const catId in foodDatabase) {
    const cat = foodDatabase[catId];
    for (const food of cat.foods) {
      all.push({
        ...food,
        categoryId: cat.id,
        categoryName: cat.name,
        categoryIcon: cat.icon,
      });
    }
  }
  return all;
}

/** 按致敏等级分组 */
function getFoodsByAllergenLevel() {
  const grouped = { low: [], medium: [], high: [] };
  for (const food of getAllFoods()) {
    if (grouped[food.allergenLevel]) {
      grouped[food.allergenLevel].push(food);
    }
  }
  return grouped;
}

module.exports = {
  foodDatabase,
  getAllFoods,
  getFoodsByAllergenLevel,
};
