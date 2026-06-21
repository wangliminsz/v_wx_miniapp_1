const app = getApp();
const { graphqlClient } = require('../../utils/api.js');

Page({
  data: {
    productSlug: '',
    variantId: '',
    variant: null,
    product: null,
    loading: true,
    error: null,
    currentImageIndex: 0,
    images: [],
    quantity: 200,
    addToCartError: null,
    isAddingToCart: false,
    isLogin: false,
    cartCount: 0,
    techDocs: [],
    techDocsWithIcons: [],
    // 🔑 锁定的 base 价（首次 fetch 缓存），用于 variant 详情页展示。
    // 避免后端 PriceCalculationStrategy 随 activeOrder 数量变化重新计算 priceWithTax。
    // 购物车仍使用 line.linePriceWithTax（context-dependent）显示真实计算价。
    basePriceWithTax: 0,
    // 后端 dynamic tier 规则（JSON 字符串），
    // 形如 '[{"minQuantity": 1, "rate": 1.10}, {"minQuantity": 200, "rate": 1.00}]'
    volumePrices: '',
    // 后端 channel-specific tier 规则（JSON 字符串），
    // 形如 '{"the-channel-token-xinyk": "close"}' 或
    //     '{"the-channel-token-xinyk": [{"minQuantity": 1,"rate": 1.2},{"minQuantity": 10,"rate": 1.1}]}'
    volumePricesPerChannel: '',
    // 🔑 经 resolveEffectiveVolumePrices 解析后的有效 tier 规则
    // 优先取 channel-specific，其次 global volumePrices，null 表示已关闭阶梯价
    effectiveVolumePrices: '',
    // 🔑 是否为团购/集团价（后端 custom field）
    // true 时不展示阶梯价说明（按后端业务规则：团购一口价，不显示阶梯）
    isGroupPrice: false,
    // 🔑 根据 quantity 动态计算出的展示价（元，含税）
    // 公式：displayPriceWithTax = basePriceWithTax × tier.rate
    displayPriceWithTax: 0,
    // 解析后的 tier 列表（升序），用于在 UI 上显示阶梯价说明
    tierList: [],
    // 🔑 预计算的 tier 展示列表（包含 range 文本 + 整数化价格），WXML 直接渲染
    // 格式：[{ lower, upper, rangeText, price }, ...]
    //   例: [{lower: 1, upper: 200, rangeText: "1-200", price: 30.8},
    //        {lower: 200, upper: 500, rangeText: "200-500", price: 28},
    //        {lower: 500, upper: null, rangeText: "500-", price: 25.2}]
    tierDisplayList: [],
    // 🔑 渠道级开机费配置（custom fields，cents → yuan）
    // 来自 query GetChannelSetupFees
    // 0 / null / undefined = 该渠道未启用开机费，不显示提示
    minOrderAmountForSetupFee: 0,
    setupFeeAmount: 0,
    setupFeeAmountYuan: '0.00',  // 格式化后的元字符串，方便 WXML 直接展示

    // 🔑 来自 ProductVariant.customFields.perpetualInventory
    // true  → 该单品是常备现货，永远不收开机费（即便购买数量低于渠道阈值）
    // false → 受渠道级规则约束（数量低于 minOrderAmountForSetupFee 时收开机费）
    perpetualInventory: false,

    // 🔑 渠道级开机费提示文本（仅在两字段都 > 0 时计算）
    // 形如: "如采购数量低于 100，将收取开机费 ¥ 300.00"
    setupFeeHintText: '',
  },

  onLoad(options) {
    console.log('variant onLoad options:', options);

    this.setData({ quantity: 200 }, ()=>{
      console.log('quantity------------------------------>', this.data.quantity)
    })
    
    this.setData({
      productSlug: options.productSlug || '',
      variantId: options.variantId || options.id || '',
    });
    
    if (!this.data.variantId) {
      this.setData({
        error: '缺少商品参数',
        loading: false,
      });
      return;
    }
    
    this.initPage();
  },

  async initPage() {
    // 🔑 P2 Bug Fix：显式 await app.initPromise
    // 虽然 loginPromise 在 app.onLaunch 里已经隐式依赖 initPromise，
    // 但显式等 initPromise 更稳健，避免以后重构 app 时出 race condition
    // （initPromise 完成意味着 wx.cloud.* 已经可用）
    if (app.initPromise) {
      try { await app.initPromise; } catch (e) { console.warn('variant: initPromise rejected', e); }
    }
    await app.loginPromise;
    this.setData({ isLogin: app.globalData.isLogin });
    this.updateCartCount();
    this.fetchVariant();
    this.fetchChannelSetupFees();
  },

  updateCartCount() {
    const count = app.globalData.cartTotalCount || 0;
    this.setData({ cartCount: count });
  },

  // 🔑 拉取当前 channel 的开机费配置（custom fields）
  // 字段为 0 / null / undefined 时视为未启用，不显示提示
  // 数据来源：query GetChannelSetupFees
  //  - minOrderAmountForSetupFee: 数量阈值（kg）
  //  - setupFeeAmount: 开机费金额（cents，需 ÷ 100 转 yuan）
  async fetchChannelSetupFees() {
    const query = `
      query GetChannelSetupFees {
        activeChannel {
          id
          code
          customFields {
            minOrderAmountForSetupFee
            setupFeeAmount
          }
        }
      }
    `;
    try {
      const data = await graphqlClient.query(query);
      const channel = data?.activeChannel;
      const minAmount = (channel && channel.customFields && channel.customFields.minOrderAmountForSetupFee) || 0;
      const feeAmountCents = (channel && channel.customFields && channel.customFields.setupFeeAmount) || 0;
      console.log(`[VARIANT] channel=${channel && channel.code} minOrderAmountForSetupFee=${minAmount} setupFeeAmount=${feeAmountCents}cents`);

      // 重新计算 hint：考虑当前 variant 的 perpetualInventory
      //   - perpetualInventory=true → 该单品是常备现货，不显示提示
      //   - perpetualInventory=false → 按渠道级规则显示
      const hint = this.computeSetupFeeHintText({
        minOrderAmountForSetupFee: minAmount,
        setupFeeAmount: feeAmountCents,
        perpetualInventory: this.data.perpetualInventory,
      });

      this.setData({
        minOrderAmountForSetupFee: minAmount,
        setupFeeAmount: feeAmountCents,
        setupFeeAmountYuan: minAmount > 0 && feeAmountCents > 0
          ? (feeAmountCents / 100).toFixed(2)
          : '0.00',
        setupFeeHintText: hint,
      });
    } catch (err) {
      // GraphQL 失败（很可能是 activeChannel 上没加 custom fields）→ 静默失败，不显示提示
      console.warn('[VARIANT] fetchChannelSetupFees failed (probably customFields not defined on Channel):', err);
    }
  },

  // 🔑 计算 setup fee 提示文本（统一逻辑，两处调用）
  // 输入：渠道级配置（minOrderAmountForSetupFee + setupFeeAmount）+ variant 级开关 perpetualInventory
  // 输出：WXML 直接展示的提示文本（空字符串 = 不显示）
  //
  // 规则：
  //   1. variant.perpetualInventory === true  → 永远不显示（"常备现货免开机费"）
  //   2. 渠道级任一字段为 0/null              → 不显示（渠道未启用开机费）
  //   3. 上述都满足                           → 显示"数量 < 阈值, 开机费 ¥ 金额"
  computeSetupFeeHintText({ minOrderAmountForSetupFee, setupFeeAmount, perpetualInventory }) {
    // 常备现货直接短路，不显示提示
    if (perpetualInventory === true) {
      console.log('[VARIANT] perpetualInventory=true → 不显示开机费提示');
      return 'Perpetual, 无开机费'   //'Perpetual';
    }
    // 渠道未启用（任一字段为 0）→ 不显示
    if (!minOrderAmountForSetupFee || !setupFeeAmount) {
      return '';
    }
    // 显示标准渠道级提示
    const feeYuan = (setupFeeAmount / 100).toFixed(2);
    return `数量 < ${minOrderAmountForSetupFee}, 开机费 ¥ ${feeYuan}`;
  },

  async fetchVariant() {
    try {
      this.setData({ loading: true, error: null });

      // First, try to get all product data including techDocs
      const fullQuery = `
        query GetProductWithVariants($slug: String!) {
          product(slug: $slug) {
            id
            name
            slug
            description
            customFields {
              techDocs {
                id
                name
                source
                preview
              }
            }
            collections {
              id
              slug
              name
            }
            featuredAsset {
              id
              preview
            }
            assets {
              id
              preview
            }
            variants {
              id
              name
              sku
              price
              priceWithTax
              currencyCode
              stockLevel
              isGroupPrice
               customFields {
                volumePrices
                volumePricesPerChannel
                priceByLayer
                perpetualInventory
              }
              featuredAsset {
                id
                preview
              }
              assets {
                id
                preview
              }
              options {
                id
                name
                code
              }
            }
          }
        }
      `;

      let data;
      try {
        data = await graphqlClient.query(fullQuery, { slug: this.data.productSlug });
        console.log('fetchVariant full data:', data);
      } catch (err) {
        console.warn('Failed to get full product (maybe techDocs not available), falling back to basic query:', err);
        // Fallback to basic query without techDocs
        const basicQuery = `
          query GetProductWithVariants($slug: String!) {
            product(slug: $slug) {
              id
              name
              slug
              description
              collections {
                id
                slug
                name
              }
              featuredAsset {
                id
                preview
              }
              assets {
                id
                preview
              }
              variants {
                id
                name
                sku
                price
                priceWithTax
                currencyCode
                stockLevel
                isGroupPrice
                customFields {
                  volumePrices
                  volumePricesPerChannel
                  priceByLayer
                  perpetualInventory
                }
                featuredAsset {
                  id
                  preview
                }
                assets {
                  id
                  preview
                }
                options {
                  id
                  name
                  code
                }
              }
            }
          }
        `;
        data = await graphqlClient.query(basicQuery, { slug: this.data.productSlug });
        console.log('fetchVariant basic data:', data);
      }

      const product = data?.product;

      if (!product) {
        this.setData({
          error: '商品不存在',
          loading: false,
        });
        return;
      }

      console.log('variants:', product.variants);
      console.log('looking for variantId:', this.data.variantId);

      const foundVariant = product.variants.find(v => String(v.id) === String(this.data.variantId));
      console.log('foundVariant:', foundVariant);

      if (!foundVariant) {
        this.setData({
          error: '商品规格不存在',
          loading: false,
        });
        return;
      }

      console.log('🔍 Debug - variant featuredAsset:', foundVariant.featuredAsset);
      console.log('🔍 Debug - variant assets:', foundVariant.assets);
      console.log('🔍 Debug - product featuredAsset:', product.featuredAsset);
      console.log('🔍 Debug - product assets:', product.assets);

      const images = this.buildImagesArray(foundVariant, product);
      console.log('🔍 Built images array:', images);

      this.setVariantData(foundVariant, product, images);

    } catch (err) {
      console.error('加载商品失败:', err);
      this.setData({
        error: '加载商品失败，请重试: ' + err.message,
        loading: false,
      });
    }
  },

  buildImagesArray(variant, product) {
    const variantFeaturedAsset = variant.featuredAsset;
    const variantAssets = variant.assets || [];
    const productAssets = product?.assets || [];
    const productFeaturedAsset = product?.featuredAsset;

    let allImages = [];

    if (variantAssets.length > 0) {
      allImages = [...variantAssets];
      if (variantFeaturedAsset && !variantAssets.some(asset => asset.id === variantFeaturedAsset.id)) {
        allImages = [variantFeaturedAsset, ...allImages];
      }
    } else if (variantFeaturedAsset) {
      allImages = [variantFeaturedAsset];
    }

    if (allImages.length > 0) {
      productAssets.forEach(productAsset => {
        if (!allImages.some(variantAsset => variantAsset.id === productAsset.id)) {
          allImages.push(productAsset);
        }
      });
      if (productFeaturedAsset && !allImages.some(asset => asset.id === productFeaturedAsset.id)) {
        allImages.push(productFeaturedAsset);
      }
      return allImages;
    }

    if (productAssets.length > 0) {
      return productAssets;
    } else if (productFeaturedAsset) {
      return [productFeaturedAsset];
    }

    return [];
  },

  setVariantData(variant, product, images) {
    const variantData = { ...variant, product };

    // Check both possible locations for techDocs
    const techDocs = product.customFields?.techDocs || product.techDocs || [];
    const techDocsWithIcons = techDocs.map(doc => ({
      ...doc,
      icon: this.getIcon(doc.name || doc.preview || '')
    }));

    // 🔑 关键：锁死 variant 详情页的"展示价"为首次 fetch 的 base 价
    // 原因：Vendure 的 ProductVariant.priceWithTax 是 context-dependent 的，
    //      会根据 activeOrder 中该变体的数量重新计算（tiered pricing）。
    //      H5 的做法：不重新 fetch → 价格停留 base 价。
    //      wx miniapp 的做法：把首次 fetch 的 priceWithTax 缓存为 basePriceWithTax，
    //                        任何后续 setData / 重新 fetch 都不会覆盖该值。
    // 购物车页面继续使用 line.linePriceWithTax（context-dependent），不受影响。
    const basePriceWithTax = variant.priceWithTax;

    // 解析后端 dynamic tier 规则
    // volumePrices 是 ProductVariant 的 custom field（Vendure 3.6.x 一律要走 customFields.xxx）
    // 后端配置：
    //   ProductVariant: [{ name: 'volumePrices', type: 'string', public: true, ... }]
    // volumePrices 形如 '[{"minQuantity": 1, "rate": 1.10}, {"minQuantity": 200, "rate": 1.00}]'
    const volumePrices = (variant.customFields && variant.customFields.volumePrices) || '';
    // volumePricesPerChannel 渠道专属 tier 规则（JSON 字符串）
    // 形如 '{"the-channel-token-xinyk": "close"}' 或 '{"the-channel-token-xinyk": [...]}'
    const volumePricesPerChannel = (variant.customFields && variant.customFields.volumePricesPerChannel) || '';
    // isGroupPrice 是 ProductVariant 顶层字段（后端直接加的 entity field，不是 custom field）
    const isGroupPrice = !!variant.isGroupPrice;

    // 🔑 perpetualInventory 是 ProductVariant.customFields 字段
    // true → 常备现货，永远不收开机费
    // 后端 schema: ProductVariant: [{ name: 'perpetualInventory', type: 'boolean', public: true, defaultValue: false }]
    const perpetualInventory = !!(variant.customFields && variant.customFields.perpetualInventory);
    console.log(`[VARIANT] variant.sku=${variant.sku} perpetualInventory=${perpetualInventory}`);

    // 🔑 解析最终生效的 tier 规则：
    //   1. isGroupPrice=true      → 一口价，走 basePriceWithTax
    //   2. volumePricesPerChannel → 渠道专属（可能关闭阶梯价，也可能覆盖）
    //   3. volumePrices           → 全局阶梯价
    //   4. 以上均无               → 使用 base/standard 价
    const effectiveVolumePrices = this.resolveEffectiveVolumePrices(volumePrices, volumePricesPerChannel);

    let tierList;
    let displayPriceWithTax;
    let tierDisplayList;
    if (isGroupPrice) {
      tierList = [];
      displayPriceWithTax = basePriceWithTax;
      tierDisplayList = [];
    } else if (effectiveVolumePrices === null) {
      // volumePricesPerChannel 中当前渠道标记为 "close" → 禁用阶梯价，使用 base 价
      tierList = [];
      displayPriceWithTax = basePriceWithTax;
      tierDisplayList = [];
    } else {
      tierList = this.parseVolumePrices(effectiveVolumePrices);
      const defaultQuantity = 200;
      displayPriceWithTax = this.calcDisplayPrice(basePriceWithTax, effectiveVolumePrices, defaultQuantity);
      // 预计算展示用 tier 列表（区间文本 + 整数化价格），WXML 直接渲染，避免浮点
      tierDisplayList = this.buildTierDisplayList(tierList, basePriceWithTax);
    }

    // 🔑 重新计算 setup fee 提示：考虑当前 variant 的 perpetualInventory
    // 渠道级字段（minOrderAmountForSetupFee + setupFeeAmount）已经在 fetchChannelSetupFees 中存到 this.data
    const setupFeeHintText = this.computeSetupFeeHintText({
      minOrderAmountForSetupFee: this.data.minOrderAmountForSetupFee,
      setupFeeAmount: this.data.setupFeeAmount,
      perpetualInventory: perpetualInventory,
    });

    this.setData({
      variant: variantData,
      product: product,
      images: images,
      techDocs: techDocs,
      techDocsWithIcons: techDocsWithIcons,
      loading: false,
      quantity: 200,
      basePriceWithTax: basePriceWithTax,
      volumePrices: volumePrices,
      volumePricesPerChannel: volumePricesPerChannel,
      effectiveVolumePrices: isGroupPrice ? '' : (effectiveVolumePrices === null ? '' : effectiveVolumePrices),
      isGroupPrice: isGroupPrice,
      tierList: tierList,
      tierDisplayList: tierDisplayList,
      displayPriceWithTax: displayPriceWithTax,
      // 🔑 同步 variant 级别的 perpetualInventory 状态
      perpetualInventory: perpetualInventory,
      setupFeeHintText: setupFeeHintText,
    });

    wx.setNavigationBarTitle({
      title: variant.name || '商品详情',
    });
  },

  /**
   * 解析后端 volumePrices 自定义字段（JSON 字符串）
   * 返回按 minQuantity 升序的 tier 数组，便于 UI 展示阶梯价说明
   * @param {string} volumePricesJson
   * @returns {Array<{minQuantity: number, rate: number}>}
   */
  parseVolumePrices(volumePricesJson) {
    if (!volumePricesJson || typeof volumePricesJson !== 'string') {
      return [];
    }
    try {
      const arr = JSON.parse(volumePricesJson);
      if (!Array.isArray(arr)) return [];
      // 过滤 + 标准化
      const cleaned = arr
        .filter(t => t && typeof t.minQuantity === 'number' && typeof t.rate === 'number')
        .map(t => ({ minQuantity: t.minQuantity, rate: t.rate }))
        .sort((a, b) => a.minQuantity - b.minQuantity);
      return cleaned;
    } catch (e) {
      console.warn('parseVolumePrices failed:', e);
      return [];
    }
  },

  /**
   * 解析渠道级 volumePricesPerChannel，返回最终生效的 tier 规则
   *
   * 优先级：
   *   1. volumePricesPerChannel 中当前渠道 token = "close"  → return null（禁用阶梯价）
   *   2. volumePricesPerChannel 中当前渠道 token = [...]    → 使用渠道专属阶梯
   *   3. 无当前渠道配置                                         → 使用全局 volumePrices
   *
   * @param {string} volumePricesJson 全局 volumePrices JSON 字符串
   * @param {string} volumePricesPerChannelJson 渠道专属 volumePrices JSON 字符串
   * @returns {string|null} 有效 tier 规则的 JSON 字符串，null 表示关闭阶梯价
   */
  resolveEffectiveVolumePrices(volumePricesJson, volumePricesPerChannelJson) {
    if (!volumePricesPerChannelJson || typeof volumePricesPerChannelJson !== 'string') {
      return volumePricesJson;
    }
    try {
      const perChannel = JSON.parse(volumePricesPerChannelJson);
      if (typeof perChannel !== 'object' || perChannel === null || Array.isArray(perChannel)) {
        return volumePricesJson;
      }
      const channelToken = getApp().globalData.activeChannelToken;
      if (!channelToken) {
        return volumePricesJson;
      }
      const channelConfig = perChannel[channelToken];
      if (channelConfig === 'close') {
        return null;
      }
      if (Array.isArray(channelConfig)) {
        return JSON.stringify(channelConfig);
      }
      return volumePricesJson;
    } catch (e) {
      console.warn('resolveEffectiveVolumePrices failed:', e);
      return volumePricesJson;
    }
  },

  /**
   * 根据当前 basePriceWithTax 和已解析的 tierList，生成 UI 用的展示列表
   * 输出形如:
   *   [
   *     { lower: 1,   upper: 200, rangeText: "1-200",   price: 30.8 },
   *     { lower: 200, upper: 500, rangeText: "200-500", price: 28   },
   *     { lower: 500, upper: null, rangeText: "500-",   price: 25.2 },
   *   ]
   * 用整数算术 + Math.round 避免 IEEE 754 浮点误差
   *   (如 2800 * 1.10 = 3080.0000000000005，需 round 到 3080)
   *
   * @param {Array<{minQuantity: number, rate: number}>} tierList
   * @param {number} basePriceWithTax base 价（cents）
   * @returns {Array<{lower: number, upper: number|null, rangeText: string, price: number}>}
   */
  buildTierDisplayList(tierList, basePriceWithTax) {
    if (!tierList || tierList.length === 0 || !basePriceWithTax) {
      return [];
    }
    return tierList.map((tier, idx) => {
      const isLast = idx === tierList.length - 1;
      const upper = isLast ? null : tierList[idx + 1].minQuantity;
      // 整数算术：用 Math.round 把 IEEE 754 误差收掉
      const priceCents = Math.round(basePriceWithTax * tier.rate);
      const price = priceCents / 100;
      // 区间文本：最后一段用 `${min}-` 表示无上限
      const rangeText = upper === null
        ? `${tier.minQuantity}-`
        : `${tier.minQuantity}-${upper}`;
      return {
        lower: tier.minQuantity,
        upper: upper,
        rangeText: rangeText,
        price: price,
      };
    });
  },

  /**
   * 根据当前 quantity 计算展示价（含税）
   * 公式：displayPriceWithTax = basePriceWithTax × tier.rate
   * 其中 tier 为「最后一个 quantity >= minQuantity」的那条
   *
   * @param {number} basePriceWithTax 后端返回的 base 价（首次 fetch 锁定）
   * @param {string} volumePricesJson 后端 tier 规则 JSON
   * @param {number} quantity 当前用户输入的数量
   * @returns {number} 展示价（含税，单位：分）
   */
  calcDisplayPrice(basePriceWithTax, volumePricesJson, quantity) {
    if (!basePriceWithTax || basePriceWithTax <= 0) {
      return 0;
    }
    const tiers = this.parseVolumePrices(volumePricesJson);
    if (tiers.length === 0) {
      // 没有规则就显示 base 价
      return basePriceWithTax;
    }
    // 找到最后一个 quantity >= minQuantity 的 tier
    let rate = tiers[0].rate;  // fallback to first tier
    for (let i = 0; i < tiers.length; i++) {
      if (quantity >= tiers[i].minQuantity) {
        rate = tiers[i].rate;
      } else {
        break;
      }
    }
    return Math.round(basePriceWithTax * rate);
  },

  onPreviousImage() {
    const images = this.data.images;
    if (images.length <= 1) return;

    let newIndex = this.data.currentImageIndex - 1;
    if (newIndex < 0) {
      newIndex = images.length - 1;
    }
    this.setData({ currentImageIndex: newIndex });
  },

  onNextImage() {
    const images = this.data.images;
    if (images.length <= 1) return;

    let newIndex = this.data.currentImageIndex + 1;
    if (newIndex >= images.length) {
      newIndex = 0;
    }
    this.setData({ currentImageIndex: newIndex });
  },

  onImageTap(e) {
    const index = e.currentTarget.dataset.index;
    this.setData({ currentImageIndex: index });
  },

  onMinus() {
    if (this.data.quantity > 1) {
      const newQuantity = this.data.quantity - 1;
      this.setData({
        quantity: newQuantity,
        displayPriceWithTax: this.data.isGroupPrice
          ? this.data.basePriceWithTax
          : this.calcDisplayPrice(
              this.data.basePriceWithTax,
              this.data.effectiveVolumePrices,
              newQuantity
            ),
      });
    }
  },

  onPlus() {
    const stockLevel = this.data.variant?.stockLevel;
    if (typeof stockLevel === 'number' && this.data.quantity >= stockLevel) {
      wx.showToast({
        title: '库存不足',
        icon: 'none',
      });
      return;
    }
    const newQuantity = this.data.quantity + 1;
    this.setData({
      quantity: newQuantity,
      // 🔑 isGroupPrice=true 时（一口价/团购），价格不变
      displayPriceWithTax: this.data.isGroupPrice
        ? this.data.basePriceWithTax
        : this.calcDisplayPrice(
            this.data.basePriceWithTax,
            this.data.effectiveVolumePrices,
            newQuantity
          ),
    });
  },

  onQuantityChange(e) {
    const quantity = parseInt(e.detail.value) || 1;
    if (quantity > 0) {
      this.setData({
        quantity: quantity,
        // 🔑 isGroupPrice=true 时（一口价/团购），价格不变
        displayPriceWithTax: this.data.isGroupPrice
          ? this.data.basePriceWithTax
          : this.calcDisplayPrice(
              this.data.basePriceWithTax,
              this.data.effectiveVolumePrices,
              quantity
            ),
      });
    }
  },

  getStockLevelText(stockLevel) {
    if (typeof stockLevel === 'number') {
      if (stockLevel > 10) return '有货';
      if (stockLevel > 0) return `剩余 ${stockLevel} 件`;
      return '缺货';
    } else if (typeof stockLevel === 'string') {
      if (stockLevel === 'IN_STOCK') return '有货';
      if (stockLevel === 'OUT_OF_STOCK') return '缺货';
      if (stockLevel === 'LOW_STOCK') return '库存紧张';
      return stockLevel;
    }
    return '有货';
  },

  getStockLevelClass(stockLevel) {
    if (typeof stockLevel === 'number') {
      if (stockLevel > 10) return 'stock-in';
      if (stockLevel > 0) return 'stock-low';
      return 'stock-out';
    } else if (typeof stockLevel === 'string') {
      if (stockLevel === 'IN_STOCK') return 'stock-in';
      if (stockLevel === 'OUT_OF_STOCK') return 'stock-out';
      if (stockLevel === 'LOW_STOCK') return 'stock-low';
    }
    return 'stock-in';
  },

  getHumanFriendlyErrorMessage(errorCode, originalMessage) {
    const errorMessages = {
      'INSUFFICIENT_STOCK_ERROR': '该商品库存不足，无法加入采购车',
      'ORDER_LIMIT_ERROR': '已达到该商品的最大购买数量',
      'NEGATIVE_QUANTITY_ERROR': '数量无效',
      'INSUFFICIENT_STOCK': '抱歉，该商品requested数量暂无货',
    };
    const friendlyMessage = errorMessages[errorCode] || '加入采购车失败，请重试';
    // Include original message for debugging
    return originalMessage ? `${friendlyMessage} (${originalMessage})` : friendlyMessage;
  },

  closeError() {
    this.setData({ addToCartError: null });
  },

  async addToCart() {
    if (!this.data.variant) return;

    if (!app.globalData.isLogin) {
      wx.showToast({
        title: '请先登录',
        icon: 'none',
      });
      return;
    }

    const stockLevel = this.data.variant.stockLevel;
    if (typeof stockLevel === 'number' && stockLevel <= 0) {
      wx.showToast({
        title: '该商品已缺货',
        icon: 'none',
      });
      return;
    }

    this.setData({ addToCartError: null, isAddingToCart: true });

    try {
      await this.addToServerCart();
    } catch (error) {
      console.error('加入采购车失败:', error);
      this.setData({ addToCartError: '加入采购车失败，请重试' });
    } finally {
      this.setData({ isAddingToCart: false });
    }
  },

  async addToServerCart() {
    const token = wx.getStorageSync('vendure-auth-token');

    const query = `
      query GetActiveOrder {
        activeOrder {
          id
          state
          lines {
            id
            productVariant {
              id
            }
            quantity
          }
        }
      }
    `;

    try {
      const checkData = await graphqlClient.query(query, {}, token);
      const activeOrder = checkData?.activeOrder;

      if (activeOrder && activeOrder.state !== 'AddingItems') {
        if (activeOrder.state === 'ArrangingPayment') {
          wx.showToast({
            title: '请先确认现有订单（待付款状态）',
            icon: 'none',
            duration: 3000
          });
          return;
        }
        if (activeOrder.state === 'PaymentAuthorized') {
          wx.showToast({
            title: '请先确认现有订单（已授权状态）',
            icon: 'none',
            duration: 3000
          });
          return;
        }
        wx.showToast({
          title: '订单状态异常，请先处理现有订单',
          icon: 'none',
          duration: 3000
        });
        return;
      }

      const mutation = `
        mutation AddItemToOrder($productVariantId: ID!, $quantity: Int!) {
          addItemToOrder(productVariantId: $productVariantId, quantity: $quantity) {
            __typename
            ... on Order {
              id
            }
            ... on OrderLimitError {
              errorCode
              message
            }
            ... on InsufficientStockError {
              errorCode
              message
            }
          }
        }
      `;

      console.log(`[VARIANT] 📡 addItemToOrder mutation: variantId=${this.data.variant.id}, qty=${this.data.quantity}, sku=${this.data.variant.sku}`);
      const mutationStart = Date.now();
      const result = await graphqlClient.mutate(mutation, {
        productVariantId: this.data.variant.id,
        quantity: this.data.quantity,
      }, token);
      const mutationDuration = Date.now() - mutationStart;
      console.log(`[VARIANT] 📡 addItemToOrder 响应耗时 ${mutationDuration}ms:`, result);

      const addResult = result?.addItemToOrder;

      if (addResult?.__typename === 'OrderLimitError' || addResult?.__typename === 'InsufficientStockError') {
        this.setData({ addToCartError: this.getHumanFriendlyErrorMessage(addResult.errorCode, addResult.message) });
      } else {
        wx.showToast({
          title: '已加入采购车',
          icon: 'success',
        });
        await app.syncServerCartCount();
        this.updateCartCount();
        console.log(`[VARIANT] ✅ addItemToOrder 成功，用户即将跳转 cart 页`);
      }
    } catch (error) {
      console.error('[VARIANT] ❌ 加入采购车失败:', error);
      this.setData({ addToCartError: error.message || '加入采购车失败，请重试' });
    }
  },

  addToLocalCart() {
    const variant = this.data.variant;
    const images = this.data.images;

    const product = {
      variantId: variant.id,
      name: variant.name,
      price: variant.priceWithTax / 100,
      image: images[0]?.preview || '',
      sku: variant.sku || '',
      stock: variant.stockLevel,
    };

    app.addToCart(product, this.data.quantity);

    app.globalData.cartTotalCount = app.getCartCount();

    wx.showToast({
      title: '已加入采购车',
      icon: 'success',
    });

    app.updateCartBadge();
    this.updateCartCount();
  },

  updateCartBadge() {
    app.updateCartBadge();
  },

  goBack() {
    wx.navigateBack();
  },

  goHome() {
    wx.switchTab({
      url: '/pages/home/home',
    });
  },

  goToCart() {
    // Store current page (full path with query) so cart can navigate back
    const pages = getCurrentPages();
    const currentPage = pages[pages.length - 1];
    const currentPath = currentPage.route;
    const queryString = Object.keys(currentPage.options || {})
      .map(key => `${key}=${encodeURIComponent(currentPage.options[key])}`)
      .join('&');
    app.globalData.previousPage = queryString ? `${currentPath}?${queryString}` : currentPath;
    wx.switchTab({
      url: '/pages/cart/cart',
    });
  },

  onShow() {
    app.updateCartBadge();
    if (app.globalData.isLogin) {
      app.syncServerCartCount();
    }
    this.updateCartCount();
  },

  downloadFile: function (e) {
    const item = this.data.techDocs[e.currentTarget.dataset.index];
    let fileUrl = item.source || e.currentTarget.dataset.url;
    // Clean up URL (remove any backticks, quotes, and extra spaces
    fileUrl = fileUrl.replace(/[`"' ]/g, '');

    const fileName = item.name || '';
    const extension = fileName.split('.').pop().toLowerCase();
    
    // If it's an image file, use wx.previewImage
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(extension)) {
      wx.previewImage({
        current: fileUrl,
        urls: [fileUrl]
      });
      return;
    }
    
    // Otherwise, download and open as document
    wx.downloadFile({
      url: fileUrl,
      success: function (res) {
        const tempFilePath = res.tempFilePath;
        console.log('下载成功，临时文件路径:', tempFilePath);
        
        wx.showToast({
          title: '下载成功！',
          icon: 'success'
        });

        wx.openDocument({
          filePath: tempFilePath,
          showMenu: true,
          success: function () {
            console.log('文档打开成功');
          },
          fail: function (err) {
            console.error('文档打开失败:', err);
            wx.showToast({
              title: '文档打开失败！',
              icon: 'none'
            });
          }
        });
      },
      fail: function (err) {
        console.error('下载失败:', err);
        wx.showToast({
          title: '下载失败！',
          icon: 'none'
        });
      }
    });
  },

  getIcon: function (url) {
    const extension = url.split('.').pop().toLowerCase();
    switch (extension) {
      case 'xlsx':
      case 'xls':
        return '/static/images/file_icons/EXCEL.svg';
      case 'pdf':
        return '/static/images/file_icons/PDF.svg';
      case 'jpg':
      case 'jpeg':
        return '/static/images/file_icons/JPEG.svg';
      case 'png':
        return '/static/images/file_icons/PNG.svg';
      case 'mp4':
        return '/static/images/file_icons/MP4.svg';
      case 'pptx':
      case 'ppt':
        return '/static/images/file_icons/PPTX.svg';
      case 'txt':
        return '/static/images/file_icons/TXT.svg';
      case 'docx':
      case 'doc':
        return '/static/images/file_icons/WORD.svg';
      case 'zip':
        return '/static/images/file_icons/ZIP.svg';
      default:
        return '/static/images/file_icons/HTML.svg';
    }
  },
});