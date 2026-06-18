const app = getApp();
const {
  graphqlClient
} = require('../../utils/api.js');

Page({
  data: {
    cartItems: [],
    totalPrice: '0.00',
    totalCount: 0,
    isLogin: false,
    isLoading: true,
    syncStatus: '',
    // 🔑 后端订单级数据（subTotal / surcharges / shipping / totalWithTax）
    // 登录用户从 activeOrder 拿到，未登录用户为 null（继续用本地 totalPrice）
    serverOrder: null,
  },

  // 🔑 防止并发的 _fetchAndDisplayCart 写入覆盖（用户快速点击 +/- 时会出现）
  // 机制：版本号 +1 → retry 中的旧 fetch 在回调时若发现 version 不匹配则放弃写入
  // 防止 stale 数据覆盖最新的 fetch 结果
  _fetchVersion: 0,

  onLoad() {
    console.log(`[CART] 📱 onLoad`);
    this.initCart();
    this.setData({
      isLogin: app.globalData.isLogin
    });
  },

  async onShow() {
    console.log(`[CART] 📱 onShow START, isLogin=${app.globalData.isLogin}, _fetchVersion=${this._fetchVersion}`);
    await app.initPromise;
    await app.loginPromise;
    this.loadCart();
    this.setData({
      isLogin: app.globalData.isLogin
    });
    console.log(`[CART] 📱 onShow END, dispatched loadCart()`);
  },

  async initCart() {

    await app.initPromise;
    await app.loginPromise;

    this.setData({
      isLogin: app.globalData.isLogin
    }, () => {
      this.loadCart();
    });

  },

  async loadCart() {
    console.log(`[CART] 📋 loadCart START, isLogin=${app.globalData.isLogin}`);
    // wx.showLoading({ title: '加载中...' });
    this.setData({
      isLoading: true
    });

    try {
      if (app.globalData.isLogin) {
        await this.loadServerCart();
      } else {
        const cartItems = app.getCartItems();
        this.updateCartDisplay(cartItems);
      }
    } finally {
      // wx.hideLoading();
      this.setData({
        isLoading: false
      });
      console.log(`[CART] 📋 loadCart END`);
    }
  },

  async loadServerCart() {
    console.log(`[CART] 🚀 loadServerCart START`);
    this.setData({
      isLoading: true
    });

    // 🔑 关键修复：递增 version，使旧 fetch（若有）放弃写入
    this._fetchVersion += 1;
    const myVersion = this._fetchVersion;
    console.log(`[CART] 🔢 新 fetch version = v${myVersion}（递增自 ${myVersion - 1}）`);

    try {
      // 🔑 关键修复：先同步本地 items 到服务端，再拉取数据
      // 原因：本地 cart_items 里**没有 setupFee 字段**（来自 app.addToCart），
      // 如果在拉取后再同步并覆盖，会丢失后端返回的开机费/起批费等附加费明细
      // 把同步放在前面：先确保服务端数据完整，再单次拉取作为权威数据
      await this.syncLocalItemsToServer();

      await this._fetchAndDisplayCart(0, myVersion);
    } catch (error) {
      console.error('[CART] ❌ 加载服务器购物车失败:', error);
      // 出错时也清空（不要用本地 items 覆盖，否则会丢 setupFee）
      this.setData({
        serverOrder: null,
        cartItems: [],
        totalCount: 0,
        totalPrice: '0.00',
      });
    } finally {
      this.setData({
        isLoading: false
      });
      console.log(`[CART] 🏁 loadServerCart END (v${myVersion})`);
    }
  },

  // 🔑 单独抽出的"拉取 + 展示"逻辑
  // 支持检测服务端 surcharges 计算延迟的 bug，自动重试
  // 严格按照 static\tabbar\refer-async-setup-fee.txt 方案：
  //   - 后端 Surcharge strategy 用 setTimeout(..., 50) 异步写入
  //   - 前端必须在 mutation 成功后等 >50ms 再 refetch
  //   - 检测到 missing surcharge（total > sum(分项)）自动 retry
  async _fetchAndDisplayCart(retryCount = 0, version = 0) {
    const MAX_RETRIES = 5;            // 增加到 5 次（之前 3 次不够）
    const INITIAL_DELAY = 250;        // 初始延迟：250ms（> 100ms，参考 refer-async-setup-fee.txt）
    const RETRY_DELAY = 1000;         // retry 间隔：1000ms（> 50ms，给后端充分时间）

    const TAG = `[FETCH v${version} attempt ${retryCount + 1}/${MAX_RETRIES + 1}]`;
    console.log(`========== ${TAG} START ==========`);

    // 🔑 关键修复（参考 static\tabbar\refer-async-setup-fee.txt）：
    // 后端 Vendure Surcharge strategy 使用了 setTimeout(..., 50) 异步写入
    // 立即 fetch 会拿到 stale surcharges（特别是新加车、改数量后）
    // 解决方案：每次 fetch 前等 250ms（> 后端 50ms + 网络往返余量）
    //
    // 适用场景：
    // 1. 从 variant 页加车后回 cart：variant 已经发了 addItemToOrder mutation
    //    cart 立即 fetch → 撞在 50ms 窗口 → surcharges 缺失
    // 2. cart 改数量（adjustOrderLine）：mutation 返回时 50ms 还没到
    //    立即 refetch → surcharges 是上一次的旧值
    if (retryCount === 0) {
      console.log(`${TAG} ⏱ 初始延迟 ${INITIAL_DELAY}ms（等待后端 setTimeout 50ms 写入 surcharges）...`);
      await new Promise(resolve => setTimeout(resolve, INITIAL_DELAY));
      console.log(`${TAG} ⏱ 初始延迟结束，开始 fetch`);
    } else {
      console.log(`${TAG} ⏱ retry 延迟 ${RETRY_DELAY}ms...`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      console.log(`${TAG} ⏱ retry 延迟结束，开始 fetch`);
    }

    // 🔑 版本守卫：若在等待/请求过程中用户又触发了新 fetch，
    // 旧 fetch 拿到响应后检查 version，若不一致则放弃写入（防止 stale 数据覆盖）
    if (version !== this._fetchVersion) {
      console.log(`${TAG} ⛔ v${version} 已过期（当前 v${this._fetchVersion}），放弃写入`);
      return;
    }

    const query = `
        query GetActiveOrder {
          activeOrder {
            id
            code
            state
            totalQuantity
            subTotalWithTax
            shippingWithTax
            totalWithTax
            # 🔑 附加费（开机费/起批费等动态加价），后端 Surcharge 插件/strategy 注入
            # 形如：[{
            #   id: '1', description: '小额开机费 (商品: [HA1401B-S19-018] ...)',
            #   priceWithTax: 30000
            # }]
            surcharges {
              id
              description
              priceWithTax
            }
            lines {
              id
              unitPriceWithTax
              linePriceWithTax
              quantity
              featuredAsset {
                id
                  preview
              }
              productVariant {
                id
                name
                sku
                price
                stockLevel
                featuredAsset {
                  preview
                }
              }
            }
          }
        }
      `;

    console.log(`${TAG} 🌐 发送 GraphQL query GetActiveOrder...`);
    const requestStartTime = Date.now();
    const data = await graphqlClient.query(query);
    const requestDuration = Date.now() - requestStartTime;
    console.log(`${TAG} 🌐 GraphQL 响应耗时 ${requestDuration}ms`);

    // 🔑 再次检查版本：网络请求期间可能被新 fetch 取代
    if (version !== this._fetchVersion) {
      console.log(`${TAG} ⛔ v${version} 网络返回时已过期，放弃写入`);
      return;
    }

    if (!data?.activeOrder) {
      console.log(`${TAG} 📭 activeOrder 为空（用户没加任何商品），清空 cartItems`);
      this.setData({
        serverOrder: null,
        cartItems: [],
        totalCount: 0,
        totalPrice: '0.00',
      });
      return;
    }

    const serverCart = data.activeOrder;
    const subTotalWithTax = serverCart.subTotalWithTax || 0;
    const shippingWithTax = serverCart.shippingWithTax || 0;
    const totalWithTax = serverCart.totalWithTax || 0;

    console.log(`${TAG} 📦 原始数据:`);
    console.log(`${TAG}    order.id = ${serverCart.id}`);
    console.log(`${TAG}    order.state = ${serverCart.state}`);
    console.log(`${TAG}    order.totalQuantity = ${serverCart.totalQuantity}`);
    console.log(`${TAG}    order.subTotalWithTax = ${subTotalWithTax} (${(subTotalWithTax / 100).toFixed(2)} 元)`);
    console.log(`${TAG}    order.shippingWithTax = ${shippingWithTax} (${(shippingWithTax / 100).toFixed(2)} 元)`);
    console.log(`${TAG}    order.totalWithTax = ${totalWithTax} (${(totalWithTax / 100).toFixed(2)} 元)`);
    console.log(`${TAG}    order.lines.length = ${serverCart.lines.length}`);

    // 详细打印每个 line
    serverCart.lines.forEach((line, idx) => {
      console.log(`${TAG}    line[${idx}]: id=${line.id}, sku=${line.productVariant.sku}, qty=${line.quantity}, ` +
        `linePriceWithTax=${line.linePriceWithTax} (${(line.linePriceWithTax / 100).toFixed(2)} 元)`);
    });

    // 详细打印每个 surcharge
    console.log(`${TAG} 💰 原始 surcharges (后端返回): length = ${(serverCart.surcharges || []).length}`);
    (serverCart.surcharges || []).forEach((s, idx) => {
      console.log(`${TAG}    surcharge[${idx}]: id=${s.id}, description="${s.description}", priceWithTax=${s.priceWithTax} (${(s.priceWithTax / 100).toFixed(2)} 元)`);
    });

    // 附加费列表（开机费等）— 格式化成展示用
    const currency = serverCart.currencyCode || 'CNY';
    const surcharges = (serverCart.surcharges || []).map(s => ({
      id: s.id,
      description: s.description,
      priceWithTax: s.priceWithTax,
      formattedPrice: this.formatPrice(Math.round(s.priceWithTax), currency),
    }));
    const surchargesTotal = surcharges.reduce((sum, s) => sum + (s.priceWithTax || 0), 0);
    console.log(`${TAG} 💰 格式化后 surcharges: length = ${surcharges.length}, surchargesTotal = ${surchargesTotal} (${(surchargesTotal / 100).toFixed(2)} 元)`);

    // 🔑 把附加费按 SKU 关联到行项目（让 cart 列表里每个触发了开机费的商品都能显示）
    // 后端 description 形如："小额开机费 (商品: [HA1401B-S19-018] ...)"
    // 提取 [] 包裹的 SKU 字符串做匹配
    const surchargeBySku = new Map();
    console.log(`${TAG} 🔗 构建 surchargeBySku 映射:`);
    surcharges.forEach(s => {
      if (s.description) {
        const match = s.description.match(/\[([^\]]+)\]/);
        if (match && match[1]) {
          surchargeBySku.set(match[1], s);
          console.log(`${TAG}    → SKU "${match[1]}" 匹配到 surcharge: id=${s.id}, price=${(s.priceWithTax / 100).toFixed(2)} 元`);
        } else {
          console.log(`${TAG}    ⚠️ surcharge description 无法解析 SKU: "${s.description}"`);
        }
      }
    });
    console.log(`${TAG} 🔗 surchargeBySku.size = ${surchargeBySku.size}`);

    const cartItems = serverCart.lines.map(line => {
      // 找到触发该商品的附加费（开机费）
      const setupFeeSurcharge = surchargeBySku.get(line.productVariant.sku);
      const hasSetupFee = !!setupFeeSurcharge;
      console.log(`${TAG}    📋 line ${line.productVariant.sku} (qty=${line.quantity}): ` +
        `setupFeeSurcharge = ${hasSetupFee ? `${(setupFeeSurcharge.priceWithTax / 100).toFixed(2)} 元` : 'null'}`);
      return {
        id: line.id,
        variantId: line.productVariant.id,
        name: line.productVariant.name,
        sku: line.productVariant.sku,
        price: (line.linePriceWithTax / line.quantity / 100).toFixed(2),
        originalPrice: (line.linePriceWithTax / line.quantity / 100).toFixed(2),
        quantity: line.quantity,
        image: line.featuredAsset?.preview || line.productVariant.featuredAsset?.preview || '',
        stock: line.productVariant.stockLevel,
        // 🔑 该行触发的附加费（开机费）— 用于在 line total 上方显示
        setupFee: setupFeeSurcharge ? setupFeeSurcharge.formattedPrice : null,
        setupFeePrice: setupFeeSurcharge ? setupFeeSurcharge.priceWithTax : 0,
      };
    });

    // 🔑 兜底修复：检测服务端 surcharges 异步计算延迟
    // 即使加了 250ms 延迟，边缘 case 下后端可能更慢，再用检测+重试兜底
    // 现象：totalWithTax 已经包含了 N 个 surcharge 的金额（正确），
    // 但 surcharges 数组只有 < N 个（stale / 异步计算中）
    // 解决：检测到差额时，再等待后重试
    // 公式：totalWithTax 应等于 subTotalWithTax + sum(surcharges) + shippingWithTax
    const expectedTotal = subTotalWithTax + surchargesTotal + shippingWithTax;
    const totalDelta = totalWithTax - expectedTotal;
    const hasMissingSurcharges = totalDelta > 0;  // 总价 > 各项之和 = 有 missing surcharge

    console.log(`${TAG} 🧮 总额校验:`);
    console.log(`${TAG}    subTotalWithTax (${(subTotalWithTax / 100).toFixed(2)} 元) + ` +
      `surchargesTotal (${(surchargesTotal / 100).toFixed(2)} 元) + ` +
      `shippingWithTax (${(shippingWithTax / 100).toFixed(2)} 元) = ` +
      `expectedTotal (${(expectedTotal / 100).toFixed(2)} 元)`);
    console.log(`${TAG}    totalWithTax (实际) = ${(totalWithTax / 100).toFixed(2)} 元`);
    console.log(`${TAG}    totalDelta (差额) = ${totalDelta} = ${(totalDelta / 100).toFixed(2)} 元`);
    console.log(`${TAG}    hasMissingSurcharges = ${hasMissingSurcharges}`);

    if (hasMissingSurcharges && retryCount < MAX_RETRIES) {
      console.warn(`${TAG} ⚠️ 检测到 missing surcharges（差额 ${(totalDelta / 100).toFixed(2)} 元）。` +
        `这通常意味着后端的 setTimeout(50ms) 还没把 surcharge 写进 DB。`);
      console.warn(`${TAG} ⏳ 等待 ${RETRY_DELAY}ms 后重试 (${retryCount + 1}/${MAX_RETRIES})...`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));

      // 🔑 retry 前再次检查版本
      if (version !== this._fetchVersion) {
        console.log(`${TAG} ⛔ v${version} retry 时已过期，放弃重试`);
        return;
      }
      return this._fetchAndDisplayCart(retryCount + 1, version);
    }

    if (hasMissingSurcharges) {
      console.warn(`${TAG} ❌ 重试 ${MAX_RETRIES} 次后仍有 missing surcharges (delta=${totalDelta})，` +
        `放弃。后端 Surcharge strategy 可能需要排查。`);
    } else {
      console.log(`${TAG} ✅ 数据完整 (surcharges=${surcharges.length}, delta=0)，写入 UI`);
    }

    // 🔑 最后一次写入前检查版本
    if (version !== this._fetchVersion) {
      console.log(`${TAG} ⛔ v${version} 即将写入时已过期，放弃`);
      return;
    }

    this.setData({
      serverOrder: {
        subTotalWithTax,
        shippingWithTax,
        totalWithTax,
        surcharges,
        surchargesTotal,
        currency,
      },
    });

    this.updateCartDisplay(cartItems);
    console.log(`========== ${TAG} END (写入完成) ==========`);
  },

  // 🔑 单独抽出"同步本地 items 到服务端"逻辑
  // 放在 loadServerCart 之前调用，确保拉取的数据是完整的（含本地刚加的商品）
  async syncLocalItemsToServer() {
    if (!app.globalData.isLogin) return;

    const localItems = wx.getStorageSync('cart_items') || [];
    console.log(`[CART] 🔄 syncLocalItemsToServer: localItems.length = ${localItems.length}`);
    if (localItems.length === 0) return;

    this.setData({
      syncStatus: '正在同步本地商品...'
    });

    for (const localItem of localItems) {
      // 🔑 不依赖 serverItems 参数，直接调用 addToServerCart
      // 后端会自动处理重复添加（合并 quantity 或忽略）
      console.log(`[CART] 🔄 syncLocalItemsToServer: addToServerCart variantId=${localItem.variantId}, qty=${localItem.quantity}`);
      await this.addToServerCart(localItem.variantId, localItem.quantity);
    }

    wx.removeStorageSync('cart_items');
    this.setData({
      syncStatus: ''
    });
    console.log(`[CART] ✅ syncLocalItemsToServer 完成`);
  },


  // async checkLocalCartAndSync() {
  //   // 1. Add loading state to prevent duplicate operations
  //   if (this.data.isLoading) return;

  //   const localItems = wx.getStorageSync('cart_items') || [];

  //   // 2. Add guard clauses for empty/local login state
  //   if (localItems.length === 0 || !app.globalData.isLogin) {
  //     // Still update display even if no sync needed
  //     const cartItems = app.getCartItems();
  //     this.updateCartDisplay(cartItems);
  //     return;
  //   }

  //   try {
  //     this.setData({ 
  //       isLoading: true,  // 3. Add loading state
  //       syncStatus: '正在同步购物车...' 
  //     });

  //     // 4. Add batch operation + error handling for each item
  //     const syncPromises = localItems.map(async (item) => {
  //       try {
  //         // Validate item data before sync
  //         if (!item.variantId || !item.quantity || item.quantity <= 0) {
  //           console.warn('无效的本地购物车商品，跳过同步:', item);
  //           return;
  //         }
  //         await this.addToServerCart(item.variantId, item.quantity);
  //       } catch (error) {
  //         console.error(`同步商品 ${item.variantId} 失败:`, error);
  //         // Optionally: collect failed items instead of failing all
  //         // failedItems.push(item);
  //       }
  //     });

  //     // Wait for all items to sync (even if some fail)
  //     await Promise.all(syncPromises);

  //     // 5. Only clear storage if sync completes (avoid data loss)
  //     wx.removeStorageSync('cart_items');
  //     this.setData({ syncStatus: '' });

  //     // 6. Reload server cart to get latest data (instead of local)
  //     await this.loadServerCart();
  //   } catch (error) {
  //     console.error('购物车同步整体失败:', error);
  //     this.setData({ syncStatus: '同步失败，请稍后重试' });
  //     // Fallback: update display with local data
  //     const cartItems = app.getCartItems();
  //     this.updateCartDisplay(cartItems);
  //   } finally {
  //     // 7. Ensure loading state is reset
  //     this.setData({ isLoading: false });
  //   }
  // },



  // async checkLocalCartAndSync() {
  //   // 1. 防止重复操作锁
  //   if (this.data.isLoading) return;

  //   const localItems = wx.getStorageSync('cart_items') || [];

  //   // 2. 守卫守则：空数据或未登录直接放行
  //   if (localItems.length === 0 || !app.globalData.isLogin) {
  //     const cartItems = app.getCartItems();
  //     this.updateCartDisplay(cartItems);
  //     return;
  //   }

  //   try {
  //     this.setData({
  //       isLoading: true,
  //       syncStatus: '正在同步购物车...'
  //     });

  //     // 3. 🔥 核心修复：抛弃 Promise.all，改用 for...of 串行安全同步
  //     // 这样请求会一个接一个排队发送，彻底杜绝微信底层并发请求产生的 Cannot read property '0' of null 错误
  //     for (const item of localItems) {
  //       // 验证单项数据
  //       if (!item || !item.variantId || !item.quantity || item.quantity <= 0) {
  //         console.warn('无效的本地购物车商品，跳过同步:', item);
  //         continue; // 跳过，继续下一个
  //       }

  //       try {
  //         // 精准等待上一个请求完成后，再发起下一个
  //         await this.addToServerCart(item.variantId, item.quantity);
  //       } catch (singleError) {
  //         // 单个商品同步失败，不影响后续商品的同步
  //         console.error(`同步单个商品 ${item.variantId} 失败:`, singleError);
  //       }
  //     }

  //     // 4. 同步全部完成后，一次性清空本地缓存
  //     wx.removeStorageSync('cart_items');
  //     this.setData({
  //       syncStatus: ''
  //     });

  //     // 5. 重新加载服务器购物车以刷新 UI
  //     await this.loadServerCart();
  //   } catch (error) {
  //     console.error('购物车同步整体流程发生错误:', error);
  //     this.setData({
  //       syncStatus: '同步失败，请稍后重试'
  //     });
  //     // 降级：依然用本地数据展示
  //     const cartItems = app.getCartItems();
  //     this.updateCartDisplay(cartItems);
  //   } finally {
  //     // 6. 务必释放加载状态锁
  //     this.setData({
  //       isLoading: false
  //     });
  //   }
  // },

  async addToServerCart(variantId, quantity) {
    try {
      const mutation = `
        mutation AddItemToOrder($productVariantId: ID!, $quantity: Int!) {
          addItemToOrder(productVariantId: $productVariantId, quantity: $quantity) {
            __typename
            ... on Order {
              id
            }
            ... on ErrorResult {
              errorCode
              message
            }
          }
        }
      `;

      const result = await graphqlClient.mutate(mutation, {
        productVariantId: variantId,
        quantity
      });
      return result?.addItemToOrder;
    } catch (error) {
      console.error('添加商品到服务器购物车失败:', error);
    }
  },

  updateCartDisplay(cartItems) {
    // Calculate line totals for each item
    const itemsWithLineTotal = cartItems.map(item => ({
      ...item,
      lineTotal: (parseFloat(item.price) * item.quantity).toFixed(2)
    }));

    const totalPrice = this.calculateTotal(cartItems);
    const totalCount = this.calculateTotalCount(cartItems);

    // 🔑 合计金额：用后端 totalWithTax
    // 用户要求使用后端原始返回的数字（即使它可能跟 surcharges 数组对不上，也是后端的权威数据）
    // 已知问题（参考 console 日志 refer-console.txt）：
    //   后端的 Order.totalWithTax 经常**不包含** surcharges 数组里的开机费金额！
    //   例：subTotalWithTax=2877.00, surcharges=600.00, totalWithTax=2877.00 (按后端的逻辑)
    //   由此产生的差异由后端团队处理，前端保持忠实显示后端数据
    // 未登录用户用本地合计（仅商品行小计）
    let displayTotal = totalPrice.toFixed(2);
    if (this.data.isLogin && this.data.serverOrder) {
      displayTotal = (this.data.serverOrder.totalWithTax / 100).toFixed(2);
    }

    this.setData({
      cartItems: itemsWithLineTotal,
      totalPrice: displayTotal,
      totalCount: totalCount,
    });

    app.globalData.cartTotalCount = cartItems.length; // Set cart badge to number of distinct items
    this.updateCartBadge();
  },

  calculateTotal(items) {
    return items.reduce((total, item) => {
      return total + (parseFloat(item.price) * item.quantity);
    }, 0);
  },

  calculateTotalCount(items) {
    return items.reduce((count, item) => {
      return count + item.quantity;
    }, 0);
  },

  async onMinus(e) {
    // 🔑 用 line id（业务唯一键）查找 item，避免 race condition 时 index 越界
    const lineId = e.currentTarget.dataset.lineId;
    console.log(`[CART] 👉 onMinus triggered, lineId=${lineId}`);
    const cartItems = [...this.data.cartItems];
    const target = cartItems.find(item => item.id === lineId);

    // 兜底：如果找不到（数据刚好被 retry 重新 setData 替换），跳过这次操作
    if (!target) {
      console.warn(`[CART] ⚠️ onMinus: 找不到 lineId=${lineId} 的 item（cartItems length: ${cartItems.length}），跳过`);
      return;
    }

    console.log(`[CART] 👉 onMinus: ${target.sku} qty ${target.quantity} → ${target.quantity - 1}`);
    if (target.quantity > 1) {
      target.quantity -= 1;
      // 🔑 传 lineId 给 updateCart，只发一次 adjustOrderLine（不要 N 次）
      await this.updateCart(cartItems, false, null, lineId);
    }
  },

  async onPlus(e) {
    const lineId = e.currentTarget.dataset.lineId;
    console.log(`[CART] 👉 onPlus triggered, lineId=${lineId}`);
    const cartItems = [...this.data.cartItems];
    const target = cartItems.find(item => item.id === lineId);

    if (!target) {
      console.warn(`[CART] ⚠️ onPlus: 找不到 lineId=${lineId} 的 item（cartItems length: ${cartItems.length}），跳过`);
      return;
    }

    if (target.stock !== undefined && typeof target.stock === 'number' && target.quantity >= target.stock) {
      console.warn(`[CART] ⚠️ onPlus: ${target.sku} 库存不足 (qty=${target.quantity}, stock=${target.stock})`);
      wx.showToast({
        title: '库存不足',
        icon: 'none',
      });
      return;
    }

    console.log(`[CART] 👉 onPlus: ${target.sku} qty ${target.quantity} → ${target.quantity + 1}`);
    target.quantity += 1;
    // 🔑 传 lineId 给 updateCart，只发一次 adjustOrderLine（不要 N 次）
    await this.updateCart(cartItems, false, null, lineId);
  },

  async onQuantityChange(e) {
    const lineId = e.currentTarget.dataset.lineId;
    const quantity = parseInt(e.detail.value) || 1;
    console.log(`[CART] 👉 onQuantityChange triggered, lineId=${lineId}, newQty=${quantity}`);
    const cartItems = [...this.data.cartItems];
    const target = cartItems.find(item => item.id === lineId);

    if (!target) {
      console.warn(`[CART] ⚠️ onQuantityChange: 找不到 lineId=${lineId} 的 item（cartItems length: ${cartItems.length}），跳过`);
      return;
    }

    if (quantity > 0) {
      console.log(`[CART] 👉 onQuantityChange: ${target.sku} qty ${target.quantity} → ${quantity}`);
      target.quantity = quantity;
      // 🔑 传 lineId 给 updateCart，只发一次 adjustOrderLine（不要 N 次）
      await this.updateCart(cartItems, false, null, lineId);
    }
  },

  async onDelete(e) {
    const lineId = e.currentTarget.dataset.lineId;
    const cartItems = [...this.data.cartItems];
    const index = cartItems.findIndex(item => item.id === lineId);
    const itemToDelete = cartItems[index];

    if (index === -1 || !itemToDelete) {
      console.warn(`onDelete: 找不到 lineId=${lineId} 的 item，跳过`);
      return;
    }

    wx.showModal({
      title: '提示',
      content: '确定要删除该商品吗？',
      success: async (res) => {
        if (res.confirm) {
          cartItems.splice(index, 1);
          await this.updateCart(cartItems, true, itemToDelete);
        }
      },
    });
  },

  async updateCart(cartItems, isDelete = false, deletedItem = null, changedLineId = null) {
    console.log(`[CART] 🛠 updateCart START, isDelete=${isDelete}, changedLineId=${changedLineId}, deletedItem=${deletedItem ? deletedItem.id : 'null'}`);
    if (app.globalData.isLogin) {
      this.setData({
        isLoading: true
      });

      try {
        if (isDelete && deletedItem) {
          console.log(`[CART] 🗑 removeOrderLine lineId=${deletedItem.id}`);
          await this.removeFromServerCart(deletedItem.id);
        } else if (changedLineId) {
          // 🔑 关键修复：只调整"实际改变"的那一个商品行，不要对 cartItems 全部行都发 adjustOrderLine
          // 原因：每次 adjustOrderLine 都会触发后端 setTimeout(50ms) 重算 surcharges
          //      如果有 N 个商品，就会有 N 个 50ms 计时器排队，最后一个的 setTimeout 可能
          //      撞在 loadServerCart 的 250ms 等待窗口内，导致 surcharges 写入不及时
          //      → 前端拿到 stale 数据，setup-fee 显示不出来
          // 修复：只对用户操作的那一行发 mutation，N 个 setTimeout → 1 个 setTimeout
          const changedItem = cartItems.find(item => item.id === changedLineId);
          if (changedItem) {
            console.log(`[CART] ✏️ adjustOrderLine lineId=${changedItem.id} (${changedItem.sku}) → qty=${changedItem.quantity}`);
            await this.adjustServerCartQuantity(changedItem.id, changedItem.quantity);
          } else {
            console.warn(`[CART] ⚠️ [updateCart] 找不到 changedLineId=${changedLineId} 的 item，跳过 adjust`);
          }
        }
        console.log(`[CART] 🛠 updateCart mutation 完成，开始 loadServerCart`);
        await this.loadServerCart();
      } catch (error) {
        console.error('[CART] ❌ 更新服务器购物车失败:', error);
        this.updateCartDisplay(cartItems);
      } finally {
        this.setData({
          isLoading: false
        });
        console.log(`[CART] 🏁 updateCart END`);
      }
    } else {
      this.updateCartDisplay(cartItems);
      app.setCartItems(cartItems);
    }
  },

  async removeFromServerCart(lineId) {
    try {
      const mutation = `
        mutation RemoveOrderLine($orderLineId: ID!) {
          removeOrderLine(orderLineId: $orderLineId) {
            __typename
            ... on Order {
              id
            }
          }
        }
      `;

      await graphqlClient.mutate(mutation, {
        orderLineId: lineId
      });
    } catch (error) {
      console.error('删除商品失败:', error);
    }
  },

  async adjustServerCartQuantity(lineId, quantity) {
    if (quantity <= 0) {
      console.warn(`[CART] ⚠️ adjustServerCartQuantity: qty <= 0, skip. lineId=${lineId}`);
      return;
    }

    console.log(`[CART] 📡 adjustServerCartQuantity mutation: lineId=${lineId}, qty=${quantity}`);
    const mutationStart = Date.now();
    try {
      const mutation = `
        mutation AdjustOrderLine($orderLineId: ID!, $quantity: Int!) {
          adjustOrderLine(orderLineId: $orderLineId, quantity: $quantity) {
            __typename
            ... on Order {
              id
            }
            ... on ErrorResult {
              errorCode
              message
            }
          }
        }
      `;

      const result = await graphqlClient.mutate(mutation, {
        orderLineId: lineId,
        quantity
      });
      const mutationDuration = Date.now() - mutationStart;
      console.log(`[CART] 📡 adjustOrderLine mutation 响应耗时 ${mutationDuration}ms:`, result);

      if (result?.adjustOrderLine?.__typename === 'ErrorResult') {
        console.warn(`[CART] ⚠️ adjustOrderLine ErrorResult: ${result.adjustOrderLine.message}`);
        wx.showToast({
          title: result.adjustOrderLine.message || '调整失败',
          icon: 'none',
        });
      }
    } catch (error) {
      console.error('[CART] ❌ 调整数量失败:', error);
    }
  },

  updateCartBadge() {
    app.updateCartBadge();
  },

  // 价格格式化（与 checkout-* 页面保持一致）
  formatPrice(price, currencyCode) {
    if (price === undefined || price === null || price === '') {
      return '';
    }
    const currency = currencyCode || 'CNY';
    const symbol = currency === 'CNY' ? '¥ ' : currency;
    const cleanCents = Math.round(Number(price));
    const formattedPrice = (cleanCents / 100).toFixed(2);
    return `${symbol}${formattedPrice}`;
  },

  onCheckout() {
    if (this.data.totalCount === 0) {
      wx.showToast({
        title: '购物车是空的',
        icon: 'none',
      });
      return;
    }

    if (!app.globalData.isLogin) {
      wx.showModal({
        title: '提示',
        content: '请先注册/登录',
        success: (res) => {
          if (res.confirm) {
            // ✅ 跳 tabBar 页面必须用 switchTab
            wx.switchTab({
              url: '/pages/mine/mine',
            });
          }
        },
      });
      return;
    }

    wx.navigateTo({
      url: '/pages/checkout-shipping/checkout-shipping',
    });
  },

  goShopping() {
    wx.switchTab({
      url: '/pages/home/home',
    });
  },

  onNavBack() {
    // First check if there's a stored previous page
    if (app.globalData.previousPage) {
      const previousPage = app.globalData.previousPage;
      // Clear the stored previous page
      app.globalData.previousPage = null;
      // Navigate back to the previous page
      wx.navigateTo({
        url: `/${previousPage}`,
        fail: () => {
          // If navigateTo fails (e.g. it's a tabBar page), use switchTab or go home
          wx.switchTab({
            url: '/pages/home/home',
          });
        }
      });
    } else {
      // Try normal navigateBack first
      wx.navigateBack({
        delta: 1,
        fail: () => {
          wx.switchTab({
            url: '/pages/home/home',
          });
        }
      });
    }
  },
});