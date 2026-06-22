const app = getApp();
const { graphqlClient } = require('../../utils/api.js');

Page({
  data: {
    orders: [],
    filteredOrders: [],
    isLoading: true,
    currentFilter: 'InProgress',
    sortOrder: 'desc',
    filters: [
      { key: 'InProgress', label: '待发' },
      { key: 'Shipping', label: '已发' },
      { key: 'Cancelled', label: '取消' },
      { key: 'all', label: '全部' },
    ],
    // 🔑 不再使用 isInitialLoad 标志
    // 原因：之前 onShow 会在每次页面回到前台时都重新拉数据（loadOrders），
    //      这导致 wx.previewImage（图片预览）关闭后回到本页会触发一次 loading spinner
    // 现在的策略：只在 onLoad（首次进入）和用户主动操作（搜索/切 tab/pull-to-refresh）时拉取
    // 与 variant 页一致：onShow 只做轻量级的 cart badge 更新
    searchKeyword: '',
  },

  async onLoad() {
    // 🔑 P0 Bug Fix：必须 await app 的两个 promise
    // order-history 调 activeCustomer.orders 需要登录态，
    // 渠道切换后 loginPromise 被重置过，没等的话会用老 token 拉老渠道的订单
    await app.initPromise;
    if (app.loginPromise) {
      try { await app.loginPromise; } catch (e) { console.warn('order-history: loginPromise rejected', e); }
    }
    this.loadOrders();
  },

  goBack() {
    wx.switchTab({
      url: '/pages/mine/mine',
    });
  },

  // 🔑 关键修复：onShow 不再重新拉数据
  // 之前的行为：每次页面回到前台（包括 wx.previewImage 关闭后）都触发 loadOrders → 出现 loading spinner
  // 现在的行为：与 variant 页一致，只做轻量级更新（购物车角标）
  // 触发重新加载的场景：
  //   1) 首次进入（onLoad）
  //   2) 用户点击搜索按钮（onSearchClick）
  //   3) 用户清空搜索（onSearchClear）
  //   4) 用户切换 tab（onFilterTap 中的特殊处理）
  //   5) 用户下拉刷新（onPullDownRefresh）
  onShow() {
    app.updateCartBadge();
  },

  // 🔑 用户下拉刷新（onPullDownRefresh）— 替代之前 onShow 自动刷新的能力
  // 触发场景：用户主动从页面顶部下拉
  // 为什么这样设计：之前 onShow 自动刷新会在 wx.previewImage 关闭后误触发 loading，
  //                改成用户主动下拉才刷新，UI 更稳定
  async onPullDownRefresh() {
    console.log('[ORDER-HISTORY] onPullDownRefresh → 重新拉取订单');
    try {
      // 🔑 showLoading=false：不显示全屏 loading-overlay（用下拉刷新的小转圈）
      await this.loadOrders({ showLoading: false });
    } catch (e) {
      console.error('[ORDER-HISTORY] onPullDownRefresh failed:', e);
    } finally {
      // 停止下拉刷新动画（无论成功失败都要停止）
      wx.stopPullDownRefresh();
    }
  },

  // 🔑 loadOrders 增加 showLoading 参数
  //  - showLoading=true（默认）: 显示全屏 loading-overlay（用于 onLoad、搜索、切换 tab）
  //  - showLoading=false: 不显示全屏 overlay（用于 onPullDownRefresh，用下拉刷新的小转圈）
  // 这样可以避免下拉刷新时出现"全屏 spinner + 小转圈"的双重 loading
  async loadOrders({ showLoading = true } = {}) {
    if (showLoading) {
      this.setData({ isLoading: true });
    }

    try {
      const keyword = (this.data.searchKeyword || '').trim();
      let orders = [];

      if (keyword) {
        // 搜索模式：
        //   1) 用 searchMyOrdersByLine 找到匹配的订单 ID
        //   2) 用这些 ID 走标准 activeCustomer.orders 查询（带 id.in 过滤）
        //      拿到 currencyCode / shippingWithTax / fulfillments / unitPriceWithTax 等完整字段
        const orderIds = await this.searchOrderIdsByKeyword(keyword);
        if (orderIds.length === 0) {
          orders = [];
        } else {
          orders = await this.fetchOrdersByIds(orderIds);
        }
      } else {
        // 正常模式：拉取当前用户所有订单
        orders = await this.fetchAllOrders();
      }

      const formattedOrders = orders.map(order => this.formatOrder(order));

      formattedOrders.sort((a, b) => {
        return this.data.sortOrder === 'desc'
          ? new Date(b.createdAt) - new Date(a.createdAt)
          : new Date(a.createdAt) - new Date(b.createdAt);
      });

      this.setData({ orders: formattedOrders });
      this.applyFilter();
    } catch (error) {
      console.error('加载订单失败:', error);
      wx.showToast({ title: '加载失败', icon: 'none' });
    } finally {
      // 🔑 仅在 showLoading=true 时才关 overlay
      // showLoading=false（pull-to-refresh）时不要碰 isLoading，避免与下拉刷新的小转圈冲突
      if (showLoading) {
        this.setData({ isLoading: false });
      }
    }
  },

  // 拉取当前用户所有订单
  async fetchAllOrders() {
    const query = `
      query GetCustomerOrders {
        activeCustomer {
          orders {
            items {
              id
              code
              state
              totalWithTax
              currencyCode
              createdAt
              shippingWithTax
              # 🔑 订单级 custom fields（用户留言等）
              customFields {
                customerMessage
              }
              # 🔑 附加费（开机费/起批费等动态加价）— 与 cart/checkout 同款
              surcharges {
                id
                description
                priceWithTax
              }
              fulfillments {
                id
                createdAt
                state
                method
                trackingCode
                customFields {
                  fulfillDocs {
                    id
                    preview
                  }
                  # 🔑 Fulfillment.customFields.fulfillPdfs: 运单/送货单 PDF 附件
                  #  - relation → Asset, list: false: 每个 fulfillment 最多 1 个 PDF
                  #  - 一般是送货通知/对账单/COA
                  #  - 与 line 级别的 orderLinePdfs 共享 onAttachmentTap handler
                  fulfillPdfs {
                    id
                    name
                    preview
                    source
                    mimeType
                  }
                }
                lines {
                  quantity
                  orderLine {
                    id
                    productVariant {
                      name
                      sku
                    }
                    # 🔑 取 OrderLine.customFields.samplePlate 以便在 fulfillment 徽章上累加
                    customFields {
                      samplePlate
                    }
                  }
                }
              }
              lines {
                id
                quantity
                unitPriceWithTax
                productVariant {
                  name
                  sku
                }
                # 🔑 单行 custom fields：随货样板 + 附件
                #  - samplePlate: int 类型，后端默认 0
                #  - orderLinePdfs: relation → Asset, list: false, 每个 line 至多 1 个附件
                customFields {
                  samplePlate
                  orderLinePdfs {
                    id
                    name
                    preview
                    source
                    mimeType
                  }
                }
              }
            }
          }
        }
      }
    `;
    const data = await graphqlClient.query(query);
    return data?.activeCustomer?.orders?.items || [];
  },

  // 按订单 ID 列表拉取完整订单数据（带 fulfillments、单价等所有字段）
  async fetchOrdersByIds(orderIds) {
    const query = `
      query GetCustomerOrdersByIds($filter: OrderFilterParameter) {
        activeCustomer {
          orders(options: { filter: $filter }) {
            items {
              id
              code
              state
              totalWithTax
              currencyCode
              createdAt
              shippingWithTax
              # 🔑 订单级 custom fields（用户留言等）
              customFields {
                customerMessage
              }
              # 🔑 附加费（开机费/起批费等动态加价）— 与 cart/checkout 同款
              surcharges {
                id
                description
                priceWithTax
              }
              fulfillments {
                id
                createdAt
                state
                method
                trackingCode
                customFields {
                  fulfillDocs {
                    id
                    preview
                  }
                  # 🔑 Fulfillment.customFields.fulfillPdfs: 运单/送货单 PDF 附件
                  #  - relation → Asset, list: false: 每个 fulfillment 最多 1 个 PDF
                  #  - 一般是送货通知/对账单/COA
                  #  - 与 line 级别的 orderLinePdfs 共享 onAttachmentTap handler
                  fulfillPdfs {
                    id
                    name
                    preview
                    source
                    mimeType
                  }
                }
                lines {
                  quantity
                  orderLine {
                    id
                    productVariant {
                      name
                      sku
                    }
                    # 🔑 取 OrderLine.customFields.samplePlate 以便在 fulfillment 徽章上累加
                    customFields {
                      samplePlate
                    }
                  }
                }
              }
              lines {
                id
                quantity
                unitPriceWithTax
                productVariant {
                  name
                  sku
                }
                # 🔑 单行 custom fields：随货样板 + 附件
                #  - samplePlate: int 类型，后端默认 0
                #  - orderLinePdfs: relation → Asset, list: false, 每个 line 至多 1 个附件
                customFields {
                  samplePlate
                  orderLinePdfs {
                    id
                    name
                    preview
                    source
                    mimeType
                  }
                }
              }
            }
          }
        }
      }
    `;
    const variables = {
      filter: { id: { in: orderIds } },
    };
    const data = await graphqlClient.query(query, variables);
    return data?.activeCustomer?.orders?.items || [];
  },

  // 用 searchMyOrdersByLine 搜索匹配的订单 ID（订单号 / SKU / 商品名）
  async searchOrderIdsByKeyword(keyword) {
    const query = `
      query SearchMyOrdersByLine($searchTerm: String!, $take: Int, $skip: Int) {
        searchMyOrdersByLine(searchTerm: $searchTerm, take: $take, skip: $skip) {
          items {
            id
          }
          totalItems
        }
      }
    `;
    const variables = {
      searchTerm: keyword,
      take: 50,
      skip: 0,
    };
    const data = await graphqlClient.query(query, variables);
    const items = data?.searchMyOrdersByLine?.items || [];
    return items.map(item => item.id);
  },

  // 格式化单个订单，补充 UI 需要的派生字段
  formatOrder(order) {
    const currencyCode = order.currencyCode || 'CNY';
    // 🔑 与 cart/checkout 页面保持一致：用 surcharge.description 中的 [SKU] 标记反查该行是否触发了开机费
    // 例："小额开机费 (商品: [HA1401H-S19-026] 白色砂纹聚酯型粉末涂料)" → SKU = "HA1401H-S19-026"
    const surchargeBySku = new Map();
    (order.surcharges || []).forEach(s => {
      if (s.description) {
        const match = s.description.match(/\[([^\]]+)\]/);
        if (match && match[1]) {
          // 同 SKU 多个 surcharge 时保留第一个（与 cart 的 Map 行为一致）
          if (!surchargeBySku.has(match[1])) {
            surchargeBySku.set(match[1], s);
          }
        }
      }
    });
    return {
      ...order,
      currencyCode,
      shippingWithTax: order.shippingWithTax || 0,
      fulfillments: order.fulfillments || [],
      formattedTotal: this.formatPrice(order.totalWithTax, currencyCode),
      formattedShipping: this.formatPrice(order.shippingWithTax || 0, currencyCode),
      formattedDate: this.formatDate(order.createdAt),
      stateLabel: this.getStateLabel(order.state),
      itemCount: (order.lines || []).reduce((sum, line) => sum + line.quantity, 0),
      productNames: (order.lines || []).map(line => line.productVariant.name).join(', '),
      // 🔑 订单级 custom fields
      //  - customerMessage: 用户在下单时填的留言（Order.customFields）
      //  - 后端 schema: Order: [{ name: 'customerMessage', type: 'text', public: true, nullable: true }]
      //  - 防御处理：customFields 可能为 null（老订单没有该字段），需降级到 ''
      customerMessage: (order.customFields && typeof order.customFields.customerMessage === 'string')
        ? order.customFields.customerMessage.trim()
        : '',
      formattedLines: (order.lines || []).map(line => {
        const setupFeeSurcharge = surchargeBySku.get(line.productVariant.sku);
        // 🔑 单行 custom fields 提取
        //  - samplePlate: 数字类型，0 表示"无随货样板"
        //  - orderLinePdfs: 防御性读取 + 推断文件类型（用于显示图标和决定点击行为）
        //    类型有 4 种：image / pdf / doc / other
        const cf = (line && line.customFields) || {};
        const samplePlate = Number(cf.samplePlate) || 0;
        const orderLinePdfs = (cf.orderLinePdfs && cf.orderLinePdfs.id) ? {
          id: cf.orderLinePdfs.id,
          name: cf.orderLinePdfs.name || '附件',
          // preview 通常是缩略图（图片可显示，PDF 是 icon），source 是原始下载链接
          preview: cf.orderLinePdfs.preview || cf.orderLinePdfs.source,
          source: cf.orderLinePdfs.source || cf.orderLinePdfs.preview,
          mimeType: cf.orderLinePdfs.mimeType || '',
        } : null;
        const orderLinePdfsFileType = this._getFileType(orderLinePdfs && orderLinePdfs.name, orderLinePdfs && orderLinePdfs.mimeType);
        return {
          ...line,
          formattedUnitPrice: this.formatPrice(line.unitPriceWithTax, currencyCode),
          // 🔑 该行触发的附加费（开机费）— 与 cart/checkout 页面同款，display in line 下方
          setupFee: setupFeeSurcharge ? this.formatPrice(setupFeeSurcharge.priceWithTax, currencyCode) : null,
          setupFeePrice: setupFeeSurcharge ? setupFeeSurcharge.priceWithTax : 0,
          // 🔑 随货样板（仅 > 0 时显示）
          samplePlate: samplePlate,
          // 🔑 单行 PDF 附件（仅非空时显示）
          orderLinePdfs: orderLinePdfs,
          orderLinePdfsFileType: orderLinePdfsFileType,
          // 🔑 使用 SVG 路径（与 variant 详情页"技术文档"同款）
          //    与 emoji 相比视觉更精致，资源复用以减小 bundle
          orderLinePdfsIconPath: this._getFileIconPath(
            (orderLinePdfs && (orderLinePdfs.name || orderLinePdfs.preview)) || ''
          ),
          // 🔑 序列化整个附件对象 → 传给 WXML 的 data-line-pdf-json
          //    原因：dataset 只支持 string/number，把对象传过去需要在 dataset 中序列化
          orderLinePdfsJson: orderLinePdfs ? JSON.stringify(orderLinePdfs) : '',
        };
      }),
      fulfillmentSummary: this.getFulfillmentSummary(order.fulfillments || []),
    };
  },

  // 输入时仅更新本地值，绝不触发搜索
  onSearchInput(e) {
    const value = e.detail.value || '';
    this.setData({ searchKeyword: value });
  },

  // 点击搜索图标按钮时触发搜索
  onSearchClick() {
    this.loadOrders();
  },

  // 清空搜索
  onSearchClear() {
    this.setData({ searchKeyword: '' });
    this.loadOrders();
  },

  formatPrice(price, currencyCode) {
    const currency = currencyCode || 'CNY';
    const symbol = currency === 'CNY' ? '¥ ' : currency;
    const cleanCents = Math.round(Number(price));
    const formattedPrice = (cleanCents / 100).toFixed(2);
    return `${symbol}${formattedPrice}`;
  },

  formatDate(dateString) {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  },

  getStateLabel(state) {
    const stateMap = {
      AddingItems: '待提交',
      ArrangingPayment: '待支付',
      PaymentAuthorized: '已授权',
      PaymentSettled: '已结算',
      PartiallyShipped: '部分发货',
      Shipped: '已发货',
      PartiallyDelivered: '部分送达',
      Delivered: '已送达',
      Modifying: '修改中',
      ArrangingAdditionalPayment: '待追加支付',
      Cancelled: '已取消',
    };
    return stateMap[state] || state;
  },

  getFulfillmentSummary(fulfillments) {
    if (!fulfillments || fulfillments.length === 0) {
      return {
        statusText: '未发货',
        details: [],
      };
    }
    const stateMap = {
      Pending: '待处理',
      Shipped: '已发货',
      Delivered: '已送达',
      Cancelled: '已取消',
    };
    const details = [];
    let totalFulfilledQty = 0;
    let validFIdx = 0;
    fulfillments.forEach((f, fIdx) => {
      // 跳过 Cancelled 状态的发货
      if (f.state === 'Cancelled') return;
      validFIdx += 1;
      const methodPart = f.method ? `${f.method}` : '';
      const baseStatus = stateMap[f.state] || f.state;
      // 拼接 statusText 仍保持完整
      const statusText = baseStatus + (methodPart ? ` ${methodPart}` : '') + (f.trackingCode ? ` ${f.trackingCode}` : '');
      // statusTextBeforeTracking 用于 WXML 渲染（不含运单号部分）
      // baseStatus +
      const statusTextBeforeTracking =  (methodPart ? ` ${methodPart}` : '');
      const items = (f.lines || []).map(line => {
        totalFulfilledQty += line.quantity;
        return {
          name: line.orderLine?.productVariant?.name || '未知商品',
          sku: line.orderLine?.productVariant?.sku || 'N/A',
          quantity: line.quantity,
        };
      });
      // 🔑 累加该 fulfillment 下的所有 OrderLine.customFields.samplePlate
      //   与 reference (zzz-refer-1.txt) 同款：徽章显示"该次发货一共多少块样板"
      //   防御读取：f.lines[].orderLine?.customFields?.samplePlate 任意一层缺失都视为 0
      const samplePlateSum = (f.lines || []).reduce((sum, fl) => {
        const v = fl?.orderLine?.customFields?.samplePlate;
        return sum + (Number(v) || 0);
      }, 0);
      const fulfillDocsPreview = (f.customFields && f.customFields.fulfillDocs && f.customFields.fulfillDocs.preview) || '';
      // 🔑 防御性读取 fulfillPdfs（运单/送货单 PDF 附件）
      //  - 防御性：customFields 为空、fulfillPdfs 为 null、缺字段 都视为"无附件"
      //  - 与 line 级别 orderLinePdfs 完全相同的对象结构（{id, name, preview, source, mimeType}）
      //  - 共享 onAttachmentTap handler（统一处理 image/PDF/doc 点击行为）
      const fulfillPdfsRaw = (f.customFields && f.customFields.fulfillPdfs && f.customFields.fulfillPdfs.id)
        ? f.customFields.fulfillPdfs
        : null;
      const fulfillPdfs = fulfillPdfsRaw ? {
        id: fulfillPdfsRaw.id,
        name: fulfillPdfsRaw.name || '附件',
        preview: fulfillPdfsRaw.preview || fulfillPdfsRaw.source,
        source: fulfillPdfsRaw.source || fulfillPdfsRaw.preview,
        mimeType: fulfillPdfsRaw.mimeType || '',
      } : null;
      const fulfillPdfsFileType = this._getFileType(fulfillPdfs && fulfillPdfs.name, fulfillPdfs && fulfillPdfs.mimeType);
      const fulfillPdfsIconPath = this._getFileIconPath(
        (fulfillPdfs && (fulfillPdfs.name || fulfillPdfs.preview)) || ''
      );
      const fulfillPdfsJson = fulfillPdfs ? JSON.stringify(fulfillPdfs) : '';
      const fulfillmentDate = f.createdAt ? this.formatDate(f.createdAt) : '';
      details.push({
        fulfillmentIndex: validFIdx,
        statusText,
        statusTextBeforeTracking,
        method: f.method || '',
        trackingCode: f.trackingCode || '',
        fulfillDocsPreview,
        // 🟦 Fulfillment 级 PDF 附件（与 line 级同款 → 共享 onAttachmentTap）
        fulfillPdfs: fulfillPdfs,
        fulfillPdfsFileType: fulfillPdfsFileType,
        fulfillPdfsIconPath: fulfillPdfsIconPath,
        fulfillPdfsJson: fulfillPdfsJson,
        fulfillmentDate,
        items,
        // 🟠 随货样板块徽章：仅在 > 0 时 WXML 才会显示
        samplePlateSum: samplePlateSum,
      });
    });
    return {
      statusText: `已发货 ${totalFulfilledQty} kg`,
      details,
    };
  },

  applyFilter() {
    const key = this.data.currentFilter;
    if (key === 'all') {
      this.setData({ filteredOrders: this.data.orders });
    } else if (key === 'InProgress') {
      // 进行中: PaymentAuthorized, PaymentSettled, PartiallyShipped
      const inProgressStates = [
        'PaymentAuthorized',
        'PaymentSettled',
        'PartiallyShipped',
      ];
      const filtered = this.data.orders.filter(order =>
        inProgressStates.includes(order.state)
      );
      this.setData({ filteredOrders: filtered });
    } else if (key === 'Shipping') {
      // 物流中: Shipped, PartiallyDelivered, Delivered
      const shippingStates = [
        'Shipped',
        'PartiallyDelivered',
        'Delivered',
      ];
      const filtered = this.data.orders.filter(order =>
        shippingStates.includes(order.state)
      );
      this.setData({ filteredOrders: filtered });
    } else {
      const filtered = this.data.orders.filter(order => order.state === key);
      this.setData({ filteredOrders: filtered });
    }
  },

  onFilterTap(e) {
    const key = e.currentTarget.dataset.key;
    // 切到非"全部" tab 时，清空搜索关键字，回到正常订单列表
    if (key !== 'all' && this.data.searchKeyword) {
      this.setData({ currentFilter: key, searchKeyword: '' });
      this.loadOrders();
      return;
    }
    this.setData({ currentFilter: key });
    this.applyFilter();
  },

  toggleSortOrder() {
    const newOrder = this.data.sortOrder === 'desc' ? 'asc' : 'desc';
    this.setData({ sortOrder: newOrder });
    this.loadOrders();
  },

  onHistoryTap(e) {
    const { orderId, orderCode } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/order-history-detail/order-history-detail?orderId=${orderId}&orderCode=${orderCode}`,
    });
  },

  onCopyOrderCode(e) {
    const code = e.currentTarget.dataset.code;
    if (!code) return;
    wx.setClipboardData({
      data: code,
      success: () => {
        wx.showToast({
          title: '订单号已复制',
          icon: 'success',
          duration: 1500,
        });
      },
      fail: () => {
        wx.showToast({
          title: '复制失败',
          icon: 'none',
        });
      },
    });
  },

  previewFulfillDoc(e) {
    const preview = e.currentTarget.dataset.preview;
    if (preview) {
      wx.previewImage({
        urls: [preview],
        current: preview,
      });
    }
  },

  // =============================================================
  // 🔑 单行 PDF 附件（orderLinePdfs）相关 helpers
  // =============================================================
  // 1) _getFileType: 根据文件名和 mimeType 推断文件分类
  //   返回值：'image' | 'pdf' | 'doc' | 'other'
  //   用法：根据类型决定点击行为
  //     - image → wx.previewImage 全屏预览
  //     - pdf/doc/other → wx.downloadFile + wx.openDocument
  _getFileType(name, mimeType) {
    if (!name && !mimeType) return 'other';
    const lowerName = (name || '').toLowerCase();
    const lowerMime = (mimeType || '').toLowerCase();
    if (lowerMime.startsWith('image/') || /\.(jpe?g|png|gif|bmp|webp|svg)$/i.test(lowerName)) return 'image';
    if (lowerMime === 'application/pdf' || /\.pdf$/i.test(lowerName)) return 'pdf';
    if (lowerMime.includes('word') || lowerMime.includes('officedocument') || /\.(docx?|rtf)$/i.test(lowerName)) return 'doc';
    if (lowerMime.includes('sheet') || lowerMime.includes('excel') || /\.(xlsx?|csv)$/i.test(lowerName)) return 'doc';
    if (/\.(jpe?g|png|gif|bmp|webp|svg|pdf|docx?|xlsx?)$/i.test(lowerName)) {
      return lowerName.match(/\.(jpe?g|png|gif|bmp|webp|svg)$/i) ? 'image' : (lowerName.match(/\.pdf$/i) ? 'pdf' : 'doc');
    }
    return 'other';
  },
  // 2) _getFileIconPath: 根据文件名/URL 返回对应的 SVG icon 路径
  //   - 与 pages/variant/variant.js 的 getIcon 保持完全一致
  //   - 共用 /static/images/file_icons/ 目录下的 SVG（与 variant 详情页"技术文档"同款图标）
  //   - 通过 url 后缀（不是 fileType）匹配 → 同一份资源能复用，减小 bundle
  //   - 找不到明确后缀时 fallback 到 HTML.svg（与 variant 一致）
  _getFileIconPath(url) {
    if (!url || typeof url !== 'string') return '/static/images/file_icons/HTML.svg';
    // 去掉可能的 query string，取后缀
    const cleanUrl = url.split('?')[0].split('#')[0];
    const extension = (cleanUrl.split('.').pop() || '').toLowerCase();
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
  // 3) onAttachmentTap: 通用附件点击 handler（同时支持 line 级别和 fulfillment 级别）
  //   - image → wx.previewImage 全屏预览（用户可以左右滑动查看大图）
  //   - pdf/doc/other → 下载到本地临时路径 → wx.openDocument 调用系统查看器
  //   - 关键：要在 data-* 里传完整对象（attachment），所以 WXML 用
  //     data-attachment-json='{{...}}' 把对象序列化到 dataset
  //   - WXML 调用方式（line 级别）：
  //       <view bindtap="onAttachmentTap" data-attachment-json="{{line.orderLinePdfsJson}}">
  //   - WXML 调用方式（fulfillment 级别）：
  //       <view bindtap="onAttachmentTap" data-attachment-json="{{fl.fulfillPdfsJson}}">
  onAttachmentTap(e) {
    const fileJson = e.currentTarget.dataset.attachmentJson;
    if (!fileJson) return;
    let file;
    try {
      file = typeof fileJson === 'string' ? JSON.parse(fileJson) : fileJson;
    } catch (err) {
      console.error('[ORDER-HISTORY] onAttachmentTap: invalid attachmentJson', err);
      return;
    }
    const url = file.source || file.preview;
    if (!url) {
      wx.showToast({ title: '附件链接无效', icon: 'none' });
      return;
    }
    const fileType = this._getFileType(file.name, file.mimeType);
    // 🖼️ 图片走 previewImage
    if (fileType === 'image') {
      wx.previewImage({
        urls: [url],
        current: url,
      });
      return;
    }
    // 📄/📝/📎 其他走 downloadFile + openDocument
    //    openDocument 在 PC/真机上会调用系统 PDF 阅读器，在模拟器会提示下载
    wx.showLoading({ title: '正在打开...', mask: true });
    wx.downloadFile({
      url: url,
      success: (res) => {
        wx.hideLoading();
        if (res.statusCode !== 200) {
          wx.showToast({ title: `下载失败 (${res.statusCode})`, icon: 'none' });
          return;
        }
        const filePath = res.tempFilePath;
        // openDocument 仅支持特定后缀，对未知类型也尝试一次（不报错即可）
        wx.openDocument({
          filePath: filePath,
          showMenu: true,           // 长按可转发/收藏
          success: () => {
            console.log('[ORDER-HISTORY] openDocument ok:', file.name);
          },
          fail: (err) => {
            console.warn('[ORDER-HISTORY] openDocument failed, fallback to copy link', err);
            // 降级：复制链接到剪贴板
            wx.setClipboardData({
              data: url,
              success: () => wx.showToast({ title: '已复制链接', icon: 'success' }),
            });
          },
        });
      },
      fail: (err) => {
        wx.hideLoading();
        console.error('[ORDER-HISTORY] downloadFile failed:', err);
        wx.showToast({ title: '下载失败', icon: 'none' });
      },
    });
  },

  // 兼容旧名 → 直接 delegate 到通用 handler（避免破坏现有 line 级别调用方）
  onLinePdfTap(e) {
    return this.onAttachmentTap(e);
  },

  onCopyTrackingCode(e) {
    const code = e.currentTarget.dataset.code;
    if (!code) return;
    wx.setClipboardData({
      data: code,
      success: () => {
        wx.showToast({
          title: '运单号已复制',
          icon: 'success',
          duration: 1500,
        });
      },
      fail: () => {
        wx.showToast({
          title: '复制失败',
          icon: 'none',
        });
      },
    });
  },
});