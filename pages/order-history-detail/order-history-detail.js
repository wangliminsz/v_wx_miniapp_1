const app = getApp();
const { graphqlClient } = require('../../utils/api.js');

Page({
  data: {
    isLoading: true,
    orderId: '',
    orderCode: '',
    stateLabel: '',
    historyEntries: [],
  },

  onLoad(options) {
    this.setData({
      orderId: options.orderId || '',
      orderCode: options.orderCode || '',
    });
    this.loadOrderDetail();
  },

  goBack() {
    wx.navigateBack({
      fail: () => {
        wx.switchTab({ url: '/pages/mine/mine' });
      }
    });
  },

  async loadOrderDetail() {
    this.setData({ isLoading: true });

    try {
      const query = `
        query GetOrderHistory($id: ID!) {
          order(id: $id) {
            id
            code
            state
            history {
              totalItems
              items {
                id
                createdAt
                type
                data
              }
            }
          }
        }
      `;

      const data = await graphqlClient.query(query, { id: this.data.orderId });
      const order = data?.order;

      if (order) {
        const entries = (order.history?.items || []).map(entry => ({
          ...entry,
          formattedDate: this.formatDate(entry.createdAt),
          typeLabel: this.getTypeLabel(entry.type),
          detail: this.getEntryDetail(entry),
        }));

        // 按时间倒序
        entries.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        this.setData({
          historyEntries: entries,
          stateLabel: this.getStateLabel(order.state),
        });
      }
    } catch (error) {
      console.error('加载订单详情失败:', error);
      wx.showToast({ title: '加载失败', icon: 'none' });
    } finally {
      this.setData({ isLoading: false });
    }
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

  getTypeLabel(type) {
    const typeMap = {
      ORDER_STATE_TRANSITION: '订单状态变更',
      ORDER_FULFILLMENT: '发货',
      ORDER_PAYMENT: '支付',
      ORDER_CANCELLED: '订单取消',
      ORDER_FULLFILLED: '订单完成',
    };
    return typeMap[type] || type;
  },

  getStateLabel(state) {
    const stateMap = {
      PaymentSettled: '已结算',
      PaymentAuthorized: '已授权',
      Cancelled: '已取消',
      Fulfilled: '已发货',
      AddingItems: '待提交',
    };
    return stateMap[state] || state;
  },

  getEntryDetail(entry) {
    // data 是 JSON 字段，可能包含状态转换的 from/to 信息
    if (entry.data && typeof entry.data === 'object') {
      const parts = [];
      if (entry.data.from) parts.push('从 ' + this.getStateLabel(entry.data.from));
      if (entry.data.to) parts.push('到 ' + this.getStateLabel(entry.data.to));
      if (parts.length > 0) return parts.join(' ');
    }
    return '';
  },
});
