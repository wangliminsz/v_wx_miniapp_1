const { graphqlClient } = require('../../utils/api.js');

Page({
  data: {
    orders: [],
    filteredOrders: [],
    isLoading: true,
    currentFilter: 'PaymentSettled',
    sortOrder: 'desc',
    filters: [
      { key: 'PaymentSettled', label: '已授权' },
      { key: 'Cancelled', label: '已取消' },
      { key: 'all', label: '全部' },
    ],
  },

  onLoad() {
    this.loadOrders();
  },

  onShow() {
    this.loadOrders();
  },

  async loadOrders() {
    this.setData({ isLoading: true });
    wx.showLoading({ title: '加载中...' });

    try {
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
                lines {
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
      const orders = data?.activeCustomer?.orders?.items || [];

      const filtered = orders.filter(order => 
        order.state?.toLowerCase() === 'paymentsettled' || 
        order.state?.toLowerCase() === 'paymentauthorized' ||
        order.state?.toLowerCase() === 'cancelled'
      );

      const formattedOrders = filtered.map(order => ({
        ...order,
        formattedTotal: this.formatPrice(order.totalWithTax, order.currencyCode),
        formattedShipping: this.formatPrice(order.shippingWithTax, order.currencyCode),
        formattedDate: this.formatDate(order.createdAt),
        stateLabel: this.getStateLabel(order.state),
        itemCount: order.lines.reduce((sum, line) => sum + line.quantity, 0),
        productNames: order.lines.map(line => line.productVariant.name).join(', '),
        formattedLines: order.lines.map(line => ({
          ...line,
          formattedUnitPrice: this.formatPrice(line.unitPriceWithTax, order.currencyCode)
        }))
      }));

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
      wx.hideLoading();
      this.setData({ isLoading: false });
    }
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
      PaymentSettled: '已结算',
      PaymentAuthorized: '已授权',
      Cancelled: '已取消',
    };
    return stateMap[state] || state;
  },

  applyFilter() {
    const key = this.data.currentFilter;
    if (key === 'all') {
      this.setData({ filteredOrders: this.data.orders });
    } else if (key === 'PaymentSettled') {
      const filtered = this.data.orders.filter(order => 
        order.state === 'PaymentSettled' || order.state === 'PaymentAuthorized'
      );
      this.setData({ filteredOrders: filtered });
    } else {
      const filtered = this.data.orders.filter(order => order.state === key);
      this.setData({ filteredOrders: filtered });
    }
  },

  onFilterTap(e) {
    const key = e.currentTarget.dataset.key;
    this.setData({ currentFilter: key });
    this.applyFilter();
  },

  toggleSortOrder() {
    const newOrder = this.data.sortOrder === 'desc' ? 'asc' : 'desc';
    this.setData({ sortOrder: newOrder });
    this.loadOrders();
  },
});