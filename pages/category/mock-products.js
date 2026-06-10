// 微信小程序审核要求：未登录用户展示静态分类和商品数据
// 数据来源：static/mock_data/for-ver2.txt
// 分类 slug 与 home.js 的 MOCK_COLLECTIONS 保持一致：
//   general, polyester, epoxy, insulation, matte, glossy, anti-c

// 商品图片池（循环使用）
const MOCK_IMAGES = [
  'https://bkkschool-1304214433.cos.ap-guangzhou.myqcloud.com/1781060981414-9-ral_5010.jpg',
  'https://bkkschool-1304214433.cos.ap-guangzhou.myqcloud.com/1781060932518-574-ral_6027.jpg',
  'https://bkkschool-1304214433.cos.ap-guangzhou.myqcloud.com/1781060900651-496-ral_2003.jpg',
  'https://bkkschool-1304214433.cos.ap-guangzhou.myqcloud.com/1781060830381-595-ral_8023.jpg',
  'https://bkkschool-1304214433.cos.ap-guangzhou.myqcloud.com/1781060754772-347-ral_9003.jpg',
  'https://bkkschool-1304214433.cos.ap-guangzhou.myqcloud.com/1781060702303-493-ral_9005.jpg',
];

// 构造商品对象的简单工具函数
function buildProduct(index, sku, name, slug) {
  return {
    id: `mock-${slug}-${index}`,
    name: `[${sku}] ${name}`,
    sku: sku,
    productSlug: 'mock-product',
    brand: '工业粉末',
    price: '登录后查看',
    volumePrice: '登录后查看',
    image: MOCK_IMAGES[index % MOCK_IMAGES.length],
    stock: 'IN_STOCK',
    moq: '1',
    leadTime: '3-5天',
    collectionSlug: slug,
    options: [
      { id: `opt-${slug}-${index}-1`, code: 'WEIGHT', name: '每箱: 20kg' },
    ],
    isMock: true,
  };
}

// ==================== 每个分类的静态商品数据（简单数组，避免复杂函数） ====================

// 通用工业粉末 (slug: general) — 来自 for-ver2.txt
const RAW_GENERAL = [
  '[WX1007G-F19-001] 平光聚酯型粉末涂料',
  '[WX1906H-W3X-001] 皱纹聚酯型粉末涂料',
  '[WX1905A-W3X-001] 皱纹聚酯型粉末涂料',
  '[WX1905H-W3X-001] 皱纹聚酯型粉末涂料',
  '[WX1009H-A25-001] 亮光聚酯型粉末涂料',
  '[WX1009H-C21-001] 亮光聚酯型粉末涂料',
  '[WX1063T-A25-001] 消光聚酯型高硬度粉末涂料',
  '[WX1065T-A25-001] 平光聚酯型高硬度粉末涂料',
  '[WX1401H-Z6X-001] 砂纹聚酯型粉末涂料',
  '[WX1207A-C21-001] 闪银聚酯型粉末涂料',
  '[WX1905B-W3X-001] 皱纹聚酯型粉末涂料',
  '[WX1007B-F19-001] 平光聚酯型粉末涂料',
  '[WX1004L-A58-001] 平光聚酯型耐候粉末涂料-10年',
  '[WX1005H-A25-002] 平光聚酯型粉末涂料',
  '[WX1009R-A30-001] 亮光聚酯型粉末涂料',
];

// 聚酯粉末 (slug: polyester) — 来自 for-ver2.txt
const RAW_POLYESTER = [
  '[WX1007G-F19-001] 平光聚酯型粉末涂料',
  '[WX1906H-W3X-001] 皱纹聚酯型粉末涂料',
  '[WX1905A-W3X-001] 皱纹聚酯型粉末涂料',
  '[WX1905H-W3X-001] 皱纹聚酯型粉末涂料',
  '[WX1009H-A25-001] 亮光聚酯型粉末涂料',
  '[WX1009H-C21-001] 亮光聚酯型粉末涂料',
  '[WX1063T-A25-001] 消光聚酯型高硬度粉末涂料',
  '[WX1065T-A25-001] 平光聚酯型高硬度粉末涂料',
  '[WX1401H-Z6X-001] 砂纹聚酯型粉末涂料',
  '[WX1207A-C21-001] 闪银聚酯型粉末涂料',
  '[WX1905B-W3X-001] 皱纹聚酯型粉末涂料',
  '[WX1007B-F19-001] 平光聚酯型粉末涂料',
  '[WX1204A-W3X-001] 闪银聚酯型粉末涂料',
  '[WX1008A-Z6X-001] 亮光聚酯型粉末涂料',
  '[WX1004A-W3X-001] 平光聚酯型粉末涂料',
];

// 环氧粉末 (slug: epoxy) — 来自 for-ver2.txt
const RAW_EPOXY = [
  '[WX2082L-G25-001] 平光混合型绝缘粉末涂料',
  '[WX2097A-G50-001] 平光环氧型防腐粉末涂料',
  '[WX2097G-G11-001] 平光环氧型防腐粉末涂料',
  '[WX2098B-G11-001] 亮光环氧型防腐粉末涂料',
  '[WX3085L-G25-001] 平光环氧型绝缘粉末涂料',
  '[WX3085X-G20-001] 平光环氧型绝缘粉末涂料',
  '[WX3086B-G20-001] 平光环氧型绝缘粉末涂料',
  '[WX3086G-G20-001] 平光环氧型绝缘粉末涂料',
  '[WX3086L-G20-001] 平光环氧型绝缘粉末涂料',
  '[WX3087B-G20-001] 平光环氧型绝缘粉末涂料',
  '[WX3087R-G23-001] 平光环氧型绝缘粉末涂料',
  '[WX3087X-G20-001] 平光环氧型绝缘粉末涂料',
  '[WX4086G-G25-001] 平光环氧型绝缘粉末涂料',
  '[WX2092G-G30-001] 亮光环氧型防腐粉末涂料',
  '[WX2095A-G50-001] 平光环氧型防腐粉末涂料',
];

// 绝缘粉末 (slug: insulation) — 来自 for-ver2.txt
const RAW_INSULATION = [
  '[WX2082L-G25-001] 平光混合型绝缘粉末涂料',
  '[WX2097A-G50-001] 平光环氧型防腐粉末涂料',
  '[WX2097G-G11-001] 平光环氧型防腐粉末涂料',
  '[WX2098B-G11-001] 亮光环氧型防腐粉末涂料',
  '[WX3085L-G25-001] 平光环氧型绝缘粉末涂料',
  '[WX3085X-G20-001] 平光环氧型绝缘粉末涂料',
  '[WX3086B-G20-001] 平光环氧型绝缘粉末涂料',
  '[WX3086G-G20-001] 平光环氧型绝缘粉末涂料',
  '[WX3086L-G20-001] 平光环氧型绝缘粉末涂料',
  '[WX3087B-G20-001] 平光环氧型绝缘粉末涂料',
  '[WX3087R-G23-001] 平光环氧型绝缘粉末涂料',
  '[WX3087X-G20-001] 平光环氧型绝缘粉末涂料',
];

// 平光环氧绝缘粉末 (slug: matte) — 来自 for-ver2.txt
const RAW_MATTE = [
  '[WX2082L-G25-001] 平光混合型绝缘粉末涂料',
  '[WX2097A-G50-001] 平光环氧型防腐粉末涂料',
  '[WX2097G-G11-001] 平光环氧型防腐粉末涂料',
  '[WX2098B-G11-001] 亮光环氧型防腐粉末涂料',
  '[WX3085L-G25-001] 平光环氧型绝缘粉末涂料',
  '[WX3085X-G20-001] 平光环氧型绝缘粉末涂料',
  '[WX3086B-G20-001] 平光环氧型绝缘粉末涂料',
  '[WX3086G-G20-001] 平光环氧型绝缘粉末涂料',
  '[WX3086L-G20-001] 平光环氧型绝缘粉末涂料',
  '[WX3087B-G20-001] 平光环氧型绝缘粉末涂料',
];

// 亮光环氧绝缘粉末 (slug: glossy) — 来自 for-ver2.txt
const RAW_GLOSSY = [
  '[WX4089G-G23-001] 亮光环氧型绝缘粉末涂料',
  '[WX4089G-G23-002] 亮光环氧型绝缘粉末涂料',
  '[WX4089T-G23-001] 透明亮光环氧型绝缘粉末涂料',
  '[WX4089T-G23-002] 透明亮光环氧型绝缘粉末涂料',
  '[WX4089T-G23-003T] 透明亮光环氧型绝缘粉末涂料',
];

// 重防腐粉末 (slug: anti-c) — 来自 for-ver2.txt
const RAW_ANTI_C = [
  '[WX2097G-G11-001] 平光环氧型防腐粉末涂料',
  '[WX2098B-G11-001] 亮光环氧型防腐粉末涂料',
  '[WX2097A-G50-001] 平光环氧型防腐粉末涂料',
  '[WX2092G-G30-001] 亮光环氧型防腐粉末涂料',
  '[WX2096A-G11-001] 平光环氧型防腐粉末涂料',
  '[WX2095G-G11-001] 平光环氧型防腐粉末涂料',
  '[WX2095A-G50-001] 平光环氧型防腐粉末涂料',
  '[WX2096G-G50-001] 平光环氧型防腐粉末涂料',
  '[WX2097L-S19-001] 平光环氧型防腐粉末涂料',
  '[WX2098G-G50-001] 平光环氧型防腐粉末涂料',
  '[WX1097A-D22-001] 平光环氧型防腐粉末涂料',
  '[WX1095A-G49-001] 平光环氧型防腐粉末涂料',
  '[WX1091L-B12-001] 消光环氧型防腐粉末涂料',
  '[WX2098A-G50-001] 平光环氧型防腐粉末涂料',
  '[WX1095A-D62-001] 平光环氧型防腐粉末涂料',
];

// ==================== 解析为结构化商品对象 ====================

function parseLines(lines, slug) {
  const result = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = line.match(/^\[([^\]]+)\]\s*(.+)$/);
    if (match) {
      result.push(buildProduct(i, match[1], match[2].trim(), slug));
    }
  }
  return result;
}

// 按 slug 直接映射，避免错误的关键词判断
const PRODUCTS_BY_SLUG = {
  'general': parseLines(RAW_GENERAL, 'general'),
  'polyester': parseLines(RAW_POLYESTER, 'polyester'),
  'epoxy': parseLines(RAW_EPOXY, 'epoxy'),
  'insulation': parseLines(RAW_INSULATION, 'insulation'),
  'matte': parseLines(RAW_MATTE, 'matte'),
  'glossy': parseLines(RAW_GLOSSY, 'glossy'),
  'anti-c': parseLines(RAW_ANTI_C, 'anti-c'),
};

// 静态分类列表（与 home.js 的 MOCK_COLLECTIONS 一一对应，slug 完全一致）
const MOCK_CATEGORIES = [
  { id: 1, name: '通用工业粉末', slug: 'general' },
  { id: 2, name: '聚酯粉末', slug: 'polyester' },
  { id: 3, name: '环氧粉末', slug: 'epoxy' },
  { id: 4, name: '绝缘粉末', slug: 'insulation' },
  { id: 5, name: '平光环氧绝缘粉末', slug: 'matte' },
  { id: 6, name: '亮光环氧绝缘粉末', slug: 'glossy' },
  { id: 7, name: '重防腐粉末', slug: 'anti-c' },
];

/**
 * 获取所有 mock 分类列表
 */
function getMockCategories() {
  return MOCK_CATEGORIES.map(c => ({ ...c }));
}

/**
 * 按 slug 获取 mock 商品列表（支持分页）
 */
function getMockProductsBySlug(slug, page, pageSize) {
  const p = page || 1;
  const size = pageSize || 10;
  const allItems = PRODUCTS_BY_SLUG[slug] || [];
  const start = (p - 1) * size;
  const items = allItems.slice(start, start + size);
  return {
    productVariants: {
      totalItems: allItems.length,
      items: items,
    },
  };
}

module.exports = {
  getMockCategories,
  getMockProductsBySlug,
};
