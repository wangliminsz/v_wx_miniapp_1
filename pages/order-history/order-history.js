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
    isInitialLoad: true,
    searchKeyword: '',
  },

  onLoad() {
    this.loadOrders();
  },

  goBack() {
    wx.switchTab({
      url: '/pages/mine/mine',
    });
  },

  onShow() {
    // Only load orders if it's not the initial load (initial load handled by onLoad)
    if (!this.data.isInitialLoad) {
      this.loadOrders();
    } else {
      this.setData({ isInitialLoad: false });
    }
  },

  async loadOrders() {
    this.setData({ isLoading: true });

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
      this.setData({ isLoading: false });
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
                }
                lines {
                  quantity
                  orderLine {
                    id
                    productVariant {
                      name
                      sku
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
                }
                lines {
                  quantity
                  orderLine {
                    id
                    productVariant {
                      name
                      sku
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
      formattedLines: (order.lines || []).map(line => {
        const setupFeeSurcharge = surchargeBySku.get(line.productVariant.sku);
        return {
          ...line,
          formattedUnitPrice: this.formatPrice(line.unitPriceWithTax, currencyCode),
          // 🔑 该行触发的附加费（开机费）— 与 cart/checkout 页面同款，display in line 下方
          setupFee: setupFeeSurcharge ? this.formatPrice(setupFeeSurcharge.priceWithTax, currencyCode) : null,
          setupFeePrice: setupFeeSurcharge ? setupFeeSurcharge.priceWithTax : 0,
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
      const fulfillDocsPreview = (f.customFields && f.customFields.fulfillDocs && f.customFields.fulfillDocs.preview) || '';
      const fulfillmentDate = f.createdAt ? this.formatDate(f.createdAt) : '';
      details.push({
        fulfillmentIndex: validFIdx,
        statusText,
        statusTextBeforeTracking,
        method: f.method || '',
        trackingCode: f.trackingCode || '',
        fulfillDocsPreview,
        fulfillmentDate,
        items,
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