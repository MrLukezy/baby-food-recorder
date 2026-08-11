/**
 * 下次排敏推荐：状态指纹 + DeepSeek 分析 + 周期缓存
 */

const https = require('https');
const foodDb = require('./food-database');
const logger = require('./logger');

const TWO_HOURS_MS = 2 * 60 * 60 * 1000;
const NON_ALLERGEN_IDS = new Set([
  'dc_shui', 'dc_wenkaishui', 'dc_liangbaikai', 'dc_muru', 'dc_yan',
]);

function getFoodAllergenStatus(foodId, records, presets) {
  const foodRecords = records.filter(r => r.foodId === foodId);
  if (foodRecords.length === 0) {
    if (presets.includes(foodId)) return 'safe';
    return null;
  }
  if (foodRecords.some(r => r.reaction === 'allergic')) return 'allergic';
  if (foodRecords.some(r => r.reaction === 'suspected')) return 'suspected';
  if (foodRecords.some(r => r.dayCount === 'day3' && r.reaction === 'safe')) return 'safe';
  const days = new Set(foodRecords.map(r => r.date)).size;
  return days >= 3 ? 'safe' : 'observing';
}

function getMonthAge(birthday) {
  if (!birthday) return null;
  const birth = new Date(birthday);
  if (Number.isNaN(birth.getTime())) return null;
  const now = new Date();
  let months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
  if (now.getDate() < birth.getDate()) months -= 1;
  return Math.max(0, months);
}

function localDateKey(d = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function buildStatusMap(records, presets, allFoods) {
  const map = {};
  const foodIds = new Set([
    ...allFoods.map(f => f.id),
    ...presets,
    ...records.map(r => r.foodId),
  ]);
  for (const id of foodIds) {
    const status = getFoodAllergenStatus(id, records, presets);
    if (status) map[id] = status;
  }
  return map;
}

function buildFingerprint(statusMap, monthAge) {
  const parts = Object.keys(statusMap).sort().map(id => `${id}:${statusMap[id]}`);
  const ageBucket = monthAge == null ? 'na' : String(Math.min(24, monthAge));
  // 简单稳定哈希，避免 cycleKey 过长
  const raw = `${ageBucket}|${parts.join(',')}`;
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    hash = ((hash << 5) - hash + raw.charCodeAt(i)) | 0;
  }
  return `${ageBucket}_${(hash >>> 0).toString(16)}`;
}

function buildCandidates(allFoods, statusMap, monthAge) {
  const observing = [];
  const fresh = [];

  for (const food of allFoods) {
    if (NON_ALLERGEN_IDS.has(food.id)) continue;
    const status = statusMap[food.id] || null;
    if (status === 'allergic' || status === 'suspected' || status === 'safe') continue;
    if (status === 'observing') {
      observing.push(food);
      continue;
    }
    const ageOk = monthAge == null || food.recommendedAge == null || monthAge + 1 >= food.recommendedAge;
    if (!ageOk) continue;
    fresh.push(food);
  }

  // 已有排敏中：优先继续当前食物
  const pool = observing.length > 0 ? observing : fresh;
  const levelOrder = { low: 0, medium: 1, high: 2 };
  pool.sort((a, b) => (levelOrder[a.allergenLevel] ?? 9) - (levelOrder[b.allergenLevel] ?? 9));
  return pool.slice(0, 40);
}

function summarizeContext(profile, records, statusMap, candidates, monthAge) {
  const byStatus = { safe: [], observing: [], suspected: [], allergic: [] };
  for (const [id, status] of Object.entries(statusMap)) {
    const food = foodDb.getAllFoods().find(f => f.id === id);
    const name = food?.name || records.find(r => r.foodId === id)?.foodName || id;
    if (byStatus[status]) byStatus[status].push(name);
  }

  const recent = [...records]
    .sort((a, b) => String(b.date).localeCompare(String(a.date)))
    .slice(0, 25)
    .map(r => `${r.date} ${r.foodName} ${r.reaction} ${r.dayCount || ''}${r.note ? ` 备注:${r.note}` : ''}`);

  return {
    babyName: profile?.name || '宝宝',
    monthAge,
    birthday: profile?.birthday || '',
    safe: byStatus.safe.slice(0, 40),
    observing: byStatus.observing,
    suspected: byStatus.suspected,
    allergic: byStatus.allergic,
    recentRecords: recent,
    candidates: candidates.map(c => ({
      id: c.id,
      name: c.name,
      allergenLevel: c.allergenLevel,
      recommendedAge: c.recommendedAge,
      notes: c.notes || '',
      categoryName: c.categoryName,
    })),
  };
}

function callDeepSeek(apiKey, messages, maxTokens = 1200) {
  const postData = JSON.stringify({
    model: 'deepseek-chat',
    messages,
    max_tokens: maxTokens,
    temperature: 0.3,
    stream: false,
  });

  const options = {
    hostname: 'api.deepseek.com',
    path: '/v1/chat/completions',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: apiKey.startsWith('Bearer ') ? apiKey : `Bearer ${apiKey}`,
      'Content-Length': Buffer.byteLength(postData),
    },
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let raw = '';
      res.on('data', (chunk) => { raw += chunk; });
      res.on('end', () => {
        if ((res.statusCode || 500) >= 400) {
          reject(new Error(`DeepSeek HTTP ${res.statusCode}: ${raw.slice(0, 300)}`));
          return;
        }
        try {
          const data = JSON.parse(raw);
          const content = data?.choices?.[0]?.message?.content;
          if (!content) reject(new Error('DeepSeek 无有效内容'));
          else resolve(String(content));
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(45000, () => {
      req.destroy(new Error('DeepSeek 请求超时'));
    });
    req.write(postData);
    req.end();
  });
}

function extractJson(text) {
  const trimmed = String(text || '').trim();
  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const body = fence ? fence[1].trim() : trimmed;
  const start = body.indexOf('{');
  const end = body.lastIndexOf('}');
  if (start < 0 || end <= start) throw new Error('无法解析推荐 JSON');
  return JSON.parse(body.slice(start, end + 1));
}

async function analyzeWithLlm(apiKey, context, excludedNames = []) {
  const system = `你是专业的婴幼儿辅食排敏顾问（参考 AAP / NHS / 中国卫健委辅食添加原则）。
请根据宝宝历史排敏与过敏情况，从候选食物中选出「下一次最适合引入或继续观察」的一种食物，并给出专业分析。

硬性规则：
1. 必须从候选列表的 id 中选择 foodId，禁止编造。
2. 若已有「排敏中」食物，优先建议继续完成该食物的三天观察，不要同时引入新食物。
3. 有过敏/疑似史时，避开同类高风险食物并在分析中说明。
4. 水、温开水、母乳、盐等通常不是排敏对象；若出现在候选中也不应优先推荐。
5. 只返回 JSON，不要 markdown，字段：
{"foodId":"...","foodName":"...","summary":"一句话推荐","analysis":"多段专业分析，用换行分段：现状判断、推荐理由、结合过敏史注意事项、建议吃法与观察要点"}`;

  const excludedLine = excludedNames.length
    ? `\n请勿再推荐这些已看过的食物：${excludedNames.join('、')}\n`
    : '';

  const user = `宝宝：${context.babyName}，月龄约 ${context.monthAge ?? '未知'} 个月，生日 ${context.birthday || '未知'}

已排敏（不过敏）：${context.safe.join('、') || '无'}
排敏中：${context.observing.join('、') || '无'}
疑似过敏：${context.suspected.join('、') || '无'}
确认过敏：${context.allergic.join('、') || '无'}
${excludedLine}
近期记录：
${context.recentRecords.join('\n') || '无'}

候选食物（只能从中选）：
${context.candidates.map(c => `- ${c.id} | ${c.name} | ${c.allergenLevel} | ${c.recommendedAge}+月 | ${c.categoryName} | ${c.notes}`).join('\n')}`;

  const content = await callDeepSeek(apiKey, [
    { role: 'system', content: system },
    { role: 'user', content: user },
  ], 1400);

  const parsed = extractJson(content);
  return parsed;
}

function fallbackPick(candidates, statusMap) {
  if (!candidates.length) return null;
  const food = candidates[0];
  const observing = Object.entries(statusMap).filter(([, s]) => s === 'observing');
  const analysis = observing.length > 0
    ? `当前仍有食物处于排敏观察中。建议优先完成「${food.name}」的连续观察（通常 3 天），暂不引入其他新食物。\n\n推荐理由：一次只引入一种新食物，便于判断过敏源。\n\n注意事项：观察皮疹、呕吐、腹泻、哭闹等反应；异常立即停喂并记录。\n\n建议吃法：安排在上午少量试吃，便于白天观察。`
    : `综合当前月龄与致敏等级，建议下一步尝试「${food.name}」。\n\n推荐理由：该食物在候选中致敏等级相对更适合现阶段引入。\n\n注意事项：首次少量，连续观察约 3 天；期间不引入其他新食物。\n\n建议吃法：上午试吃，记录反应。`;
  return {
    foodId: food.id,
    foodName: food.name,
    summary: observing.length > 0 ? `继续排敏观察：${food.name}` : `建议引入：${food.name}`,
    analysis,
  };
}

let inFlight = null;

/**
 * @param {object} deps
 */
async function getRecommendation(deps) {
  if (inFlight) return inFlight;
  inFlight = (async () => {
    try {
      return await getRecommendationInner(deps);
    } finally {
      inFlight = null;
    }
  })();
  return inFlight;
}

async function getRecommendationInner(deps) {
  const profile = deps.profile && typeof deps.profile === 'object' ? deps.profile : null;
  const records = Array.isArray(deps.records) ? deps.records : [];
  const presets = Array.isArray(deps.presets) ? deps.presets : [];
  const prev = deps.cache && typeof deps.cache === 'object' ? deps.cache : null;
  const forceRefresh = !!deps.forceRefresh;
  const now = new Date();
  const nowIso = now.toISOString();

  const prevLastOpenAt = prev?.lastOpenAt || null;
  const shouldAutoOpen = forceRefresh
    ? false
    : (!prevLastOpenAt || (now.getTime() - new Date(prevLastOpenAt).getTime() >= TWO_HOURS_MS));

  const allFoods = foodDb.getAllFoods();
  const monthAge = getMonthAge(profile?.birthday);
  const statusMap = buildStatusMap(records, presets, allFoods);
  const fingerprint = buildFingerprint(statusMap, monthAge);
  const cycleKey = `${localDateKey(now)}__${fingerprint}`;

  const excludeIds = new Set(
    Array.isArray(deps.excludeIds) ? deps.excludeIds.filter(Boolean) : [],
  );
  // 同一周期内「推荐其他」累积排除；跨周期清空
  if (prev && prev.cycleKey === cycleKey && Array.isArray(prev.excludedIds)) {
    for (const id of prev.excludedIds) excludeIds.add(id);
  }

  const baseMeta = {
    cycleKey,
    shouldAutoOpen,
    lastOpenAt: forceRefresh ? (prev?.lastOpenAt || nowIso) : nowIso,
  };

  if (!forceRefresh && prev && prev.cycleKey === cycleKey && prev.foodId && prev.analysis) {
    const next = {
      ...prev,
      ...baseMeta,
      lastShownAt: shouldAutoOpen ? nowIso : (prev.lastShownAt || nowIso),
      fromCache: true,
    };
    await deps.saveCache(next);
    return next;
  }

  let candidates = buildCandidates(allFoods, statusMap, monthAge)
    .filter(c => !excludeIds.has(c.id));

  if (candidates.length === 0) {
    return {
      ...baseMeta,
      foodId: null,
      foodName: null,
      summary: null,
      analysis: null,
      createdAt: nowIso,
      lastShownAt: null,
      fromCache: false,
      noMore: true,
      excludedIds: [...excludeIds],
      message: '暂无其他可推荐食材',
    };
  }

  let result = null;
  const excludedNames = [...excludeIds]
    .map(id => allFoods.find(f => f.id === id)?.name || id)
    .filter(Boolean);
  const context = summarizeContext(profile, records, statusMap, candidates, monthAge);

  if (deps.apiKey) {
    try {
      const parsed = await analyzeWithLlm(deps.apiKey, context, excludedNames);
      const allowed = new Set(candidates.map(c => c.id));
      if (parsed?.foodId && allowed.has(parsed.foodId)) {
        const food = candidates.find(c => c.id === parsed.foodId);
        result = {
          foodId: parsed.foodId,
          foodName: food?.name || parsed.foodName || parsed.foodId,
          summary: String(parsed.summary || `推荐：${food?.name || parsed.foodId}`).slice(0, 80),
          analysis: String(parsed.analysis || '').slice(0, 4000),
        };
      } else {
        logger.warn('推荐 foodId 不在候选集，使用兜底');
      }
    } catch (e) {
      logger.error('推荐 LLM 失败', { error: e.message });
    }
  } else {
    logger.warn('DeepSeek key 未配置，使用规则兜底推荐');
  }

  if (!result) {
    result = fallbackPick(candidates, statusMap);
  }

  // LLM 失败：非「换一个」时可降级旧缓存；换一个时不要退回旧推荐
  if ((!result || !result.analysis) && !forceRefresh && prev?.foodId && prev?.analysis) {
    const next = {
      ...prev,
      ...baseMeta,
      lastShownAt: shouldAutoOpen ? nowIso : (prev.lastShownAt || nowIso),
      fromCache: true,
      degraded: true,
    };
    await deps.saveCache(next);
    return next;
  }

  if (!result || !result.analysis) {
    return {
      ...baseMeta,
      foodId: null,
      foodName: null,
      summary: null,
      analysis: null,
      createdAt: nowIso,
      lastShownAt: null,
      fromCache: false,
      noMore: true,
      excludedIds: [...excludeIds],
      message: '暂时无法生成新推荐，请稍后再试',
    };
  }

  const nextExcluded = [...excludeIds];
  // 当前这条保留在推荐位，不立刻加入排除；「推荐其他」时由调用方把旧 foodId 放进 excludeIds

  const next = {
    ...baseMeta,
    foodId: result.foodId,
    foodName: result.foodName,
    summary: result.summary,
    analysis: result.analysis,
    createdAt: nowIso,
    lastShownAt: forceRefresh ? nowIso : (shouldAutoOpen ? nowIso : null),
    fromCache: false,
    excludedIds: nextExcluded,
  };
  await deps.saveCache(next);
  return next;
}

module.exports = {
  getRecommendation,
  TWO_HOURS_MS,
};
