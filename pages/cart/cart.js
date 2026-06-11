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
  },

  onLoad() {
    this.initCart();
    this.setData({
      isLogin: app.globalData.isLogin
    });
  },

  async onShow() {
    await app.initPromise;
    await app.loginPromise;
    this.loadCart();
    this.setData({
      isLogin: app.globalData.isLogin
    });
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
    }
  },

  async loadServerCart() {
    this.setData({
      isLoading: true
    });

    try {
      const query = `
        query GetActiveOrder {
          activeOrder {
            id
            code
            state
            totalQuantity
            subTotalWithTax
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

      const data = await graphqlClient.query(query);
      console.log('loadServerCart data:', data);

      if (data?.activeOrder) {
        const serverCart = data.activeOrder;
        const cartItems = serverCart.lines.map(line => ({
          id: line.id,
          variantId: line.productVariant.id,
          name: line.productVariant.name,
          sku: line.productVariant.sku,
          price: (line.linePriceWithTax / line.quantity / 100).toFixed(2),
          originalPrice: (line.linePriceWithTax / line.quantity / 100).toFixed(2),
          quantity: line.quantity,
          image: line.featuredAsset?.preview || line.productVariant.featuredAsset?.preview || '',
          stock: line.productVariant.stockLevel,
        }));
        this.updateCartDisplay(cartItems);

        await this.syncLocalCartToServer(cartItems);
      } else {
        this.checkLocalCartAndSync();
      }
    } catch (error) {
      console.error('加载服务器购物车失败:', error);
      this.checkLocalCartAndSync();
    } finally {
      this.setData({
        isLoading: false
      });
    }
  },

  async syncLocalCartToServer(serverItems) {
    const localItems = wx.getStorageSync('cart_items') || [];
    if (localItems.length === 0) return;

    this.setData({
      syncStatus: '正在同步本地商品...'
    });

    for (const localItem of localItems) {
      const existsInServer = serverItems.some(item => item.variantId === localItem.variantId);
      if (!existsInServer) {
        await this.addToServerCart(localItem.variantId, localItem.quantity);
      }
    }

    wx.removeStorageSync('cart_items');
    this.setData({
      syncStatus: ''
    });

    const cartItems = app.getCartItems();
    this.updateCartDisplay(cartItems);
  },

  async checkLocalCartAndSync() {
    const localItems = wx.getStorageSync('cart_items') || [];
    if (localItems.length > 0 && app.globalData.isLogin) {      this.setData({ syncStatus: '正在同步购物车...' });

      for (const item of localItems) {
        await this.addToServerCart(item.variantId, item.quantity);
      }

      wx.removeStorageSync('cart_items');
      this.setData({ syncStatus: '' });
    }

    const cartItems = app.getCartItems();
    this.updateCartDisplay(cartItems);
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

    this.setData({
      cartItems: itemsWithLineTotal,
      totalPrice: totalPrice.toFixed(2),
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
    const index = e.currentTarget.dataset.index;
    const cartItems = [...this.data.cartItems];

    if (cartItems[index].quantity > 1) {
      cartItems[index].quantity -= 1;
      await this.updateCart(cartItems);
    }
  },

  async onPlus(e) {
    const index = e.currentTarget.dataset.index;
    const cartItems = [...this.data.cartItems];

    const item = cartItems[index];
    if (item.stock !== undefined && typeof item.stock === 'number' && item.quantity >= item.stock) {
      wx.showToast({
        title: '库存不足',
        icon: 'none',
      });
      return;
    }

    cartItems[index].quantity += 1;
    await this.updateCart(cartItems);
  },

  async onQuantityChange(e) {
    const index = e.currentTarget.dataset.index;
    const quantity = parseInt(e.detail.value) || 1;
    const cartItems = [...this.data.cartItems];

    if (quantity > 0) {
      cartItems[index].quantity = quantity;
      await this.updateCart(cartItems);
    }
  },

  async onDelete(e) {
    const index = e.currentTarget.dataset.index;
    const cartItems = [...this.data.cartItems];
    const itemToDelete = cartItems[index];

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

  async updateCart(cartItems, isDelete = false, deletedItem = null) {
    if (app.globalData.isLogin) {
      this.setData({
        isLoading: true
      });

      try {
        if (isDelete && deletedItem) {
          await this.removeFromServerCart(deletedItem.id);
        } else if (cartItems.length > 0) {
          for (const item of cartItems) {
            await this.adjustServerCartQuantity(item.id, item.quantity);
          }
        }
        await this.loadServerCart();
      } catch (error) {
        console.error('更新服务器购物车失败:', error);
        this.updateCartDisplay(cartItems);
      } finally {
        this.setData({
          isLoading: false
        });
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
    if (quantity <= 0) return;

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

      if (result?.adjustOrderLine?.__typename === 'ErrorResult') {
        wx.showToast({
          title: result.adjustOrderLine.message || '调整失败',
          icon: 'none',
        });
      }
    } catch (error) {
      console.error('调整数量失败:', error);
    }
  },

  updateCartBadge() {
    app.updateCartBadge();
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