const app = getApp();
const {
  getMockProductsBySlug,
} = require('../category/mock-products.js');

Page({
  data: {
    variant: null,
    quantity: 100,
    cartCount: 0,
  },

  onLoad(options) {
    const mockId = options.mockId || '';
    const collectionSlug = options.collectionSlug || '';

    if (!mockId || !collectionSlug) {
      this.setData({ variant: { name: '商品详情', brand: '' } });
      return;
    }

    const mockResult = getMockProductsBySlug(collectionSlug, 1, 100);
    const allItems = (mockResult.productVariants && mockResult.productVariants.items) || [];
    const found = allItems.find(item => item.id === mockId);

    if (found) {
      this.setData({ variant: found, quantity: 100 });
      wx.setNavigationBarTitle({ title: found.name || '商品详情' });
    } else {
      for (let page = 2; page <= 5; page++) {
        const more = getMockProductsBySlug(collectionSlug, page, 100);
        const items = (more.productVariants && more.productVariants.items) || [];
        const f = items.find(item => item.id === mockId);
        if (f) {
          this.setData({ variant: f, quantity: 100 });
          wx.setNavigationBarTitle({ title: f.name || '商品详情' });
          return;
        }
        if (items.length === 0) break;
      }
      this.setData({ variant: { name: '商品详情', brand: '' } });
    }
  },

  onMinus() {
    if (this.data.quantity > 1) {
      this.setData({ quantity: this.data.quantity - 1 });
    }
  },

  onPlus() {
    this.setData({ quantity: this.data.quantity + 1 });
  },

  onQuantityChange(e) {
    const quantity = parseInt(e.detail.value) || 1;
    if (quantity > 0) {
      this.setData({ quantity });
    }
  },

  goHome() {
    wx.switchTab({ url: '/pages/home/home' });
  },

  goToCart() {
    wx.switchTab({ url: '/pages/cart/cart' });
  },

  goToLogin() {
    wx.switchTab({ url: '/pages/mine/mine' });
    // wx.showModal({
    //   title: '请先登录',
    //   content: '登录后即可查看商品价格和购买',
    //   confirmText: '去登录',
    //   cancelText: '取消',
    //   success: (res) => {
    //     if (res.confirm) {
    //       wx.switchTab({ url: '/pages/mine/mine' });
    //     }
    //   },
    // });
  },

  onShow() {
    app.updateCartBadge();
  },
});
