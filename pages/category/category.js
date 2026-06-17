const app = getApp();
const {
  getCollections,
  getCollection
} = require('../../providers/shop/products/products');
const {
  formatPrice
} = require('../../utils/util.js');
const {
  getMockCategories,
  getMockProductsBySlug,
} = require('./mock-products.js');

Page({
  data: {
    categories: [],
    activeCategory: 0,
    products: [],
    currentPage: 0,
    pageSize: 10,
    hasMore: true,
    loading: false,
    filterType: '',
    showBackToTop: false,
    scrollTop: 0,
    isLogin: false,
    isLoading: true,
  },

  async onLoad(options) {
    await app.initPromise;
    if (app.loginPromise) {
      try {
        await app.loginPromise;
      } catch (e) {
        console.warn('category: loginPromise rejected, treat as not logged in', e);
      }
    }

    this.setData({
      isLogin: app.globalData.isLogin,
      isLoading: false,
      // 关键：初始就把 loading 设为 true，避免空状态短暂闪现
      // loadProductsBySlug 完成后才会在 finally 中把 loading 置回 false
      loading: true
    }, () => {
      this.loadCategories();
    });
  },

  onShow() {
    // await app.initPromise;
    // await app.loginPromise;
    this.setData({
      isLogin: app.globalData.isLogin
    });
    app.updateCartBadge();
    if (app.globalData.isLogin) {
      app.syncServerCartCount();
    }

    // 处理从 home 页面通过 switchTab 跳过来并希望定位到指定分类
    // 兼容两种来源：1) globalData.pendingCategorySlug（首次跳转） 2) page.data.pendingSlug（同 tab 内跳转）
    const pending = app.globalData.pendingCategorySlug || this.data.pendingSlug;
    if (pending) {
      app.globalData.pendingCategorySlug = null;
      this.setData({ pendingSlug: null });
      // 等分类加载完成后再切换（如果是首次进入）
      if (this.data.categories && this.data.categories.length > 0) {
        this.loadProductsBySlug(pending);
      } else {
        // 分类还没加载，把 slug 暂存，等 onLoad 完成后使用
        this._pendingCategoryAfterLoad = pending;
      }
    }
  },

  _consumePendingSlug() {
    let slug = null;
    if (this._pendingCategoryAfterLoad) {
      slug = this._pendingCategoryAfterLoad;
      this._pendingCategoryAfterLoad = null;
    } else if (app.globalData.pendingCategorySlug) {
      slug = app.globalData.pendingCategorySlug;
      app.globalData.pendingCategorySlug = null;
    }
    return slug;
  },

  async loadCategories() {
    if (!app.globalData.isLogin) {
      const mockCats = getMockCategories();
      this.setData({
        categories: mockCats,
      });
      if (mockCats.length > 0 && !this.data.currentSlug) {
        const slug = this._consumePendingSlug() || mockCats[0].slug;
        this.setData({ currentSlug: slug });
        this.loadProductsBySlug(slug);
      }
      return;
    }

    try {
      console.log('========== Loading categories from Vendure ==========');
      const collections = await getCollections();
      // console.log('Raw collections from Vendure:', JSON.stringify(collections, null, 2));

      if (collections.length === 0) {
        console.log('No collections returned from Vendure, using mock categories');
        const mockCats = getMockCategories();
        this.setData({ categories: mockCats });
        if (mockCats.length > 0 && !this.data.currentSlug) {
          const slug = this._consumePendingSlug() || mockCats[0].slug;
          this.setData({ currentSlug: slug });
          this.loadProductsBySlug(slug);
        }
        return;
      }

      const parentCollections = collections.filter(c => !c.parent || c.parent.id === '1' || c.parent.name === '__root_collection__');
      // console.log('Parent collections:', JSON.stringify(parentCollections, null, 2));

      const sortedCategories = [];
      parentCollections.forEach(parent => {
        sortedCategories.push({
          id: parent.id,
          name: parent.name,
          slug: parent.slug,
        });

        if (parent.children && parent.children.length > 0) {
          parent.children.forEach(child => {
            sortedCategories.push({
              id: child.id,
              name: child.name,
              slug: child.slug,
            });
          });
        }
      });

      // console.log('Sorted categories:', JSON.stringify(sortedCategories, null, 2));

      this.setData({
        categories: sortedCategories,
      });

      if (sortedCategories.length > 0 && !this.data.currentSlug) {
        const slug = this._consumePendingSlug() || sortedCategories[0].slug;
        this.setData({ currentSlug: slug });
        this.loadProductsBySlug(slug);
      }
    } catch (error) {
      console.error('Failed to load categories:', error);
      const mockCats = getMockCategories();
      this.setData({ categories: mockCats });
      if (mockCats.length > 0 && !this.data.currentSlug) {
        const slug = this._consumePendingSlug() || mockCats[0].slug;
        this.setData({ currentSlug: slug });
        this.loadProductsBySlug(slug);
      }
    }
  },

  loadSubCategories(categoryId) {
    this.setData({
      products: [],
      currentPage: 0,
      hasMore: true,
    });
    this.loadProducts(categoryId);
  },

  async loadProducts(categoryId) {
    if (this.data.loading || !this.data.hasMore) return;

    let slug = this.data.currentSlug;
    if (!slug && categoryId) {
      const category = this.data.categories.find(c => c.id == categoryId);
      if (category) {
        slug = category.slug;
      }
    }

    if (!slug) {
      return;
    }

    this.setData({
      loading: true
    });

    try {
      const page = this.data.currentPage + 1;
      const result = await getCollection(slug, page, this.data.pageSize);

      if (result && result.productVariants && result.productVariants.items.length > 0) {
        const newProducts = result.productVariants.items.map(item => {
          const product = item.product || {};
          const variantImage = item.featuredAsset && item.featuredAsset.preview;
          const productImage = product.featuredAsset && product.featuredAsset.preview;

          // 优先取 variant 自己的 options，否则从 product.optionGroups 提取
          let options = item.options || [];
          if (options.length === 0 && product.optionGroups && product.optionGroups.length > 0) {
            options = product.optionGroups.map(group => ({
              id: group.id,
              name: group.name,
            }));
          }

          return {
            id: item.id,
            name: item.name,
            productSlug: product.slug || '',
            brand: product.name || '',
            sku: item.sku || '',
            price: formatPrice(item.priceWithTax, item.currencyCode).replace('¥', ''),
            volumePrice: (item.priceWithTax * 0.85 / 100).toFixed(2),
            priceTag: this._getPriceTag(item),
            image: variantImage || productImage || 'https://via.placeholder.com/200x200',
            stock: item.stockLevel || '充足',
            moq: '1',
            leadTime: '3-5天',
            options: options,
          };
        });

        const existingIds = this.data.products.map(p => p.id);
        const uniqueProducts = newProducts.filter(p => !existingIds.includes(p.id));

        this.setData({
          products: [...this.data.products, ...uniqueProducts],
          currentPage: page,
          hasMore: uniqueProducts.length >= this.data.pageSize,
        });
      } else {
        this.setData({
          hasMore: false,
        });
      }
    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      this.setData({
        loading: false
      });
    }
  },

  async loadProductsBySlug(slug) {
    const catIndex = (this.data.categories || []).findIndex(c => c.slug === slug);
    this.setData({
      currentSlug: slug,
      products: [],
      currentPage: 0,
      hasMore: true,
      loading: true,
      activeCategory: catIndex > -1 ? catIndex : 0,
    });

    // 微信小程序审核要求：未登录用户展示静态商品数据
    if (!app.globalData.isLogin) {
      const mockResult = getMockProductsBySlug(slug, 1, this.data.pageSize);
      const mockProducts = (mockResult.productVariants.items || []).map(item => ({
        ...item,
        formattedUnitPrice: '',
        options: item.options || [],
      }));

      // 同步更新左侧分类高亮
      const index = (this.data.categories || []).findIndex(c => c.slug === slug);

      this.setData({
        products: mockProducts,
        currentPage: 1,
        hasMore: mockResult.productVariants.items.length >= this.data.pageSize,
        loading: false,
        activeCategory: index > -1 ? index : 0,
      });
      return;
    }

    const result = await getCollection(slug, 1, this.data.pageSize);

    if (result) {
      const categories = this.data.categories;
      const index = categories.findIndex(c => c.slug === slug);
      this.setData({
        activeCategory: index > -1 ? index : 0,
      });

      if (result.productVariants && result.productVariants.items && result.productVariants.items.length > 0) {
        const products = result.productVariants.items.map(item => {
          const product = item.product || {};
          const variantImage = item.featuredAsset && item.featuredAsset.preview;
          const productImage = product.featuredAsset && product.featuredAsset.preview;

          // 优先取 variant 自己的 options，否则从 product.optionGroups 提取
          let options = item.options || [];
          if (options.length === 0 && product.optionGroups && product.optionGroups.length > 0) {
            options = product.optionGroups.map(group => ({
              id: group.id,
              name: group.name,
            }));
          }

          return {
            id: item.id,
            name: item.name,
            productSlug: product.slug || '',
            brand: product.name || '',
            sku: item.sku || '',
            price: formatPrice(item.priceWithTax, item.currencyCode).replace('¥', ''),
            volumePrice: (item.priceWithTax * 0.85 / 100).toFixed(2),
            priceTag: this._getPriceTag(item),
            image: variantImage || productImage || 'https://via.placeholder.com/200x200',
            stock: item.stockLevel || '充足',
            moq: '1',
            leadTime: '3-5天',
            options: options,
          };
        });

        this.setData({
          products,
          loading: false,
          hasMore: result.productVariants.items.length >= this.data.pageSize,
          currentPage: 1,
        });
      } else {
        this.setData({
          products: [],
          loading: false,
          hasMore: false
        });
      }
    } else {
      this.setData({
        loading: false,
        hasMore: false
      });
    }
  },

  onCategoryTap(e) {
    const index = e.currentTarget.dataset.index;
    const category = this.data.categories[index];

    if (!category || !category.slug) {
      return;
    }

    this.setData({
      activeCategory: index,
      currentSlug: category.slug,
      products: [],
      currentPage: 0,
      hasMore: true,
      // 切分类时立刻设 loading: true，避免空状态闪烁
      loading: true,
    });

    this.loadProductsBySlug(category.slug);
  },

  toggleFilter(e) {
    const type = e.currentTarget.dataset.type;
    wx.showToast({
      title: `筛选: ${type}`,
      icon: 'none',
    });
  },

  goToProduct(e) {
    const productId = e.currentTarget.dataset.id;
    const productSlug = e.currentTarget.dataset.slug;

    if (!app.globalData.isLogin) {
      const clickedItem = (this.data.products || []).find(p => p.id === productId);
      if (clickedItem && clickedItem.isMock) {
        const collectionSlug = this.data.currentSlug || '';
        wx.navigateTo({
          url: `/pages/mock-variant/mock-variant?mockId=${encodeURIComponent(productId)}&collectionSlug=${encodeURIComponent(collectionSlug)}`,
        });
        return;
      }
    }

    if (productSlug) {
      wx.navigateTo({
        url: `/pages/variant/variant?productSlug=${productSlug}&variantId=${productId}`,
      });
    } else {
      wx.navigateTo({
        url: `/pages/product/product?id=${productId}`,
      });
    }
  },

  updateCartBadge() {
    app.updateCartBadge();
  },

  /**
   * 判断商品应展示的价格标签
   * @returns {'VIP'|'阶梯价'|''}
   */
  _getPriceTag(item) {
    if (item.isGroupPrice) return 'VIP';

    const customFields = item.customFields;
    if (!customFields) return '';

    const channelToken = getApp().globalData.activeChannelToken;

    if (customFields.volumePricesPerChannel) {
      try {
        const perChannel = JSON.parse(customFields.volumePricesPerChannel);
        if (channelToken && perChannel[channelToken]) {
          const config = perChannel[channelToken];
          if (config === 'close') return '';
          if (Array.isArray(config) && config.length > 0) return '阶梯价';
        }
      } catch (e) {}
    }

    if (customFields.volumePrices) {
      try {
        const parsed = JSON.parse(customFields.volumePrices);
        if (Array.isArray(parsed) && parsed.length > 0) return '阶梯价';
      } catch (e) {}
    }

    return '';
  },

  onAddToCart(e) {
    const productId = e.currentTarget.dataset.id;
    const product = this.data.products.find(p => p.id == productId);

    if (product) {
      app.addToCart({
        variantId: productId,
        name: product.name,
        price: product.price,
        image: product.image,
      });

      wx.showToast({
        title: '已加入采购车',
        icon: 'success',
      });

      this.updateCartBadge();
    }
  },

  loadMore() {
    if (this.data.currentSlug) {
      this.loadProductsBySlugMore(this.data.currentSlug);
    }
  },

  async loadProductsBySlugMore(slug) {
    if (this.data.loading || !this.data.hasMore) return;

    this.setData({
      loading: true
    });

    // 微信小程序审核要求：未登录用户走 mock
    if (!app.globalData.isLogin) {
      const page = this.data.currentPage + 1;
      const mockResult = getMockProductsBySlug(slug, page, this.data.pageSize);
      const mockProducts = (mockResult.productVariants.items || []).map(item => ({
        ...item,
        formattedUnitPrice: '',
        options: item.options || [],
      }));

      this.setData({
        products: [...this.data.products, ...mockProducts],
        currentPage: page,
        hasMore: mockResult.productVariants.items.length >= this.data.pageSize,
        loading: false,
      });
      return;
    }

    try {
      const page = this.data.currentPage + 1;
      const result = await getCollection(slug, page, this.data.pageSize);

      if (result && result.productVariants && result.productVariants.items.length > 0) {
        const newProducts = result.productVariants.items.map(item => {
          const product = item.product || {};
          const variantImage = item.featuredAsset && item.featuredAsset.preview;
          const productImage = product.featuredAsset && product.featuredAsset.preview;

          // 优先取 variant 自己的 options，否则从 product.optionGroups 提取
          let options = item.options || [];
          if (options.length === 0 && product.optionGroups && product.optionGroups.length > 0) {
            options = product.optionGroups.map(group => ({
              id: group.id,
              name: group.name,
            }));
          }

          return {
            id: item.id,
            name: item.name,
            productSlug: product.slug || '',
            brand: product.name || '',
            sku: item.sku || '',
            price: formatPrice(item.priceWithTax, item.currencyCode).replace('¥', ''),
            volumePrice: (item.priceWithTax * 0.85 / 100).toFixed(2),
            priceTag: this._getPriceTag(item),
            image: variantImage || productImage || 'https://via.placeholder.com/200x200',
            stock: item.stockLevel || '充足',
            moq: '1',
            leadTime: '3-5天',
            options: options,
          };
        });

        const existingIds = this.data.products.map(p => p.id);
        const uniqueProducts = newProducts.filter(p => !existingIds.includes(p.id));

        this.setData({
          products: [...this.data.products, ...uniqueProducts],
          currentPage: page,
          hasMore: uniqueProducts.length >= this.data.pageSize,
        });
      } else {
        this.setData({
          hasMore: false
        });
      }
    } catch (error) {
      console.error('Failed to load more products:', error);
    } finally {
      this.setData({
        loading: false
      });
    }
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadMore();
    } else if (!this.data.hasMore) {
      wx.showToast({
        title: '已经到底了...',
        icon: 'none',
      });
    }
  },

  onScroll(e) {
    if (e.detail.scrollTop > 500) {
      this.setData({
        showBackToTop: true
      });
    } else {
      this.setData({
        showBackToTop: false
      });
    }
  },

  scrollToTop() {
    this.setData({
      scrollTop: 0
    });
  },

  // goToSearch() {
  //   wx.navigateTo({
  //     url: '/pages/search/search',
  //   });
  // },

  goToSearch() {
    wx.switchTab({
      url: '/pages/search/search'
    })
  }


});




// const app = getApp();
// const config = require('../../config.js');
// const {
//   getCollections,
//   getCollection
// } = require('../../providers/shop/products/products');
// const {
//   formatPrice
// } = require('../../utils/util.js');

// Page({
//   data: {
//     categories: [],
//     activeCategory: 0,
//     products: [],
//     currentPage: 0,
//     pageSize: 10,
//     hasMore: true,
//     loading: false,
//     filterType: '',
//     showBackToTop: false,
//     scrollTop: 0,
//     isLogin: false,
//     isLoading: true,
//   },

//   async onLoad(options) {
//     // 等待应用全局初始化完成 (确保渠道 token 已获取)
//     await app.initPromise;
//     await app.loginPromise;

//     this.setData({
//       isLogin: app.globalData.isLogin,
//       isLoading: false
//     }, () => {
//       this.loadCategories();
//       if (options.id) {
//         const index = this.data.categories.findIndex(c => c.id == options.id);
//         if (index > -1) {
//           this.setData({
//             activeCategory: index
//           });
//           this.loadSubCategories(options.id);
//         }
//       }
//     });

//   },

//   onShow() {
//     // await app.initPromise;
//     // await app.loginPromise;
//     this.setData({
//       isLogin: app.globalData.isLogin
//     });
//     app.updateCartBadge();
//     if (app.globalData.isLogin) {
//       app.syncServerCartCount();
//     }
//   },

//   async loadCategories() {
//     try {
//       console.log('========== Loading categories from Vendure ==========');
//       const collections = await getCollections();
//       // console.log('Raw collections from Vendure:', JSON.stringify(collections, null, 2));

//       if (collections.length === 0) {
//         console.log('No collections returned from Vendure, using default categories');
//         this.setData({
//           categories: config.CATEGORIES
//         });
//         return;
//       }

//       const parentCollections = collections.filter(c => !c.parent || c.parent.id === '1' || c.parent.name === '__root_collection__');
//       // console.log('Parent collections:', JSON.stringify(parentCollections, null, 2));

//       const sortedCategories = [];
//       parentCollections.forEach(parent => {
//         sortedCategories.push({
//           id: parent.id,
//           name: parent.name,
//           slug: parent.slug,
//         });

//         if (parent.children && parent.children.length > 0) {
//           parent.children.forEach(child => {
//             sortedCategories.push({
//               id: child.id,
//               name: child.name,
//               slug: child.slug,
//             });
//           });
//         }
//       });

//       // console.log('Sorted categories:', JSON.stringify(sortedCategories, null, 2));

//       this.setData({
//         categories: sortedCategories,
//       });

//       if (sortedCategories.length > 0 && !this.data.currentSlug) {
//         this.setData({
//           currentSlug: sortedCategories[0].slug
//         });
//         this.loadProductsBySlug(sortedCategories[0].slug);
//       }
//     } catch (error) {
//       console.error('Failed to load categories:', error);
//       this.setData({
//         categories: config.CATEGORIES,
//       });
//     }
//   },

//   loadSubCategories(categoryId) {
//     this.setData({
//       products: [],
//       currentPage: 0,
//       hasMore: true,
//     });
//     this.loadProducts(categoryId);
//   },

//   async loadProducts(categoryId) {
//     if (this.data.loading || !this.data.hasMore) return;

//     let slug = this.data.currentSlug;
//     if (!slug && categoryId) {
//       const category = this.data.categories.find(c => c.id == categoryId);
//       if (category) {
//         slug = category.slug;
//       }
//     }

//     if (!slug) {
//       return;
//     }

//     this.setData({
//       loading: true
//     });

//     try {
//       const page = this.data.currentPage + 1;
//       const result = await getCollection(slug, page, this.data.pageSize);

//       if (result && result.productVariants && result.productVariants.items.length > 0) {
//         const newProducts = result.productVariants.items.map(item => {
//           const product = item.product || {};
//           const variantImage = item.featuredAsset && item.featuredAsset.preview;
//           const productImage = product.featuredAsset && product.featuredAsset.preview;

//           return {
//             id: item.id,
//             name: item.name,
//             productSlug: product.slug || '',
//             brand: product.name || '',
//             sku: item.sku || '',
//             price: formatPrice(item.priceWithTax, item.currencyCode).replace('¥', ''),
//             volumePrice: (item.priceWithTax * 0.85 / 100).toFixed(2),
//             image: variantImage || productImage || 'https://via.placeholder.com/200x200',
//             stock: item.stockLevel || '充足',
//             moq: '1',
//             leadTime: '3-5天',
//           };
//         });

//         const existingIds = this.data.products.map(p => p.id);
//         const uniqueProducts = newProducts.filter(p => !existingIds.includes(p.id));

//         this.setData({
//           products: [...this.data.products, ...uniqueProducts],
//           currentPage: page,
//           hasMore: uniqueProducts.length >= this.data.pageSize,
//         });
//       } else {
//         this.setData({
//           hasMore: false,
//         });
//       }
//     } catch (error) {
//       console.error('Failed to load products:', error);
//     } finally {
//       this.setData({
//         loading: false
//       });
//     }
//   },

//   async loadProductsBySlug(slug) {
//     this.setData({
//       currentSlug: slug,
//       products: [],
//       currentPage: 0,
//       hasMore: true,
//       loading: true,
//     });

//     const result = await getCollection(slug, 1, this.data.pageSize);

//     if (result) {
//       const categories = this.data.categories;
//       const index = categories.findIndex(c => c.slug === slug);
//       if (index > -1) {
//         this.setData({
//           activeCategory: index
//         });
//       }

//       if (result.productVariants && result.productVariants.items && result.productVariants.items.length > 0) {
//         const products = result.productVariants.items.map(item => {
//           const product = item.product || {};
//           const variantImage = item.featuredAsset && item.featuredAsset.preview;
//           const productImage = product.featuredAsset && product.featuredAsset.preview;

//           return {
//             id: item.id,
//             name: item.name,
//             productSlug: product.slug || '',
//             brand: product.name || '',
//             sku: item.sku || '',
//             price: formatPrice(item.priceWithTax, item.currencyCode).replace('¥', ''),
//             volumePrice: (item.priceWithTax * 0.85 / 100).toFixed(2),
//             image: variantImage || productImage || 'https://via.placeholder.com/200x200',
//             stock: item.stockLevel || '充足',
//             moq: '1',
//             leadTime: '3-5天',
//           };
//         });

//         this.setData({
//           products,
//           loading: false,
//           hasMore: result.productVariants.items.length >= this.data.pageSize,
//           currentPage: 1,
//         });
//       } else {
//         this.setData({
//           products: [],
//           loading: false,
//           hasMore: false
//         });
//       }
//     } else {
//       this.setData({
//         loading: false,
//         hasMore: false
//       });
//     }
//   },

//   onCategoryTap(e) {
//     const index = e.currentTarget.dataset.index;
//     const category = this.data.categories[index];

//     if (!category || !category.slug) {
//       return;
//     }

//     this.setData({
//       activeCategory: index,
//       currentSlug: category.slug,
//       products: [],
//       currentPage: 0,
//       hasMore: true,
//       loading: false,
//     });

//     this.loadProductsBySlug(category.slug);
//   },

//   toggleFilter(e) {
//     const type = e.currentTarget.dataset.type;
//     wx.showToast({
//       title: `筛选: ${type}`,
//       icon: 'none',
//     });
//   },

//   goToProduct(e) {
//     const productId = e.currentTarget.dataset.id;
//     const productSlug = e.currentTarget.dataset.slug;

//     if (productSlug) {
//       wx.navigateTo({
//         url: `/pages/variant/variant?productSlug=${productSlug}&variantId=${productId}`,
//       });
//     } else {
//       wx.navigateTo({
//         url: `/pages/product/product?id=${productId}`,
//       });
//     }
//   },

//   updateCartBadge() {
//     app.updateCartBadge();
//   },

//   onAddToCart(e) {
//     const productId = e.currentTarget.dataset.id;
//     const product = this.data.products.find(p => p.id == productId);

//     if (product) {
//       app.addToCart({
//         variantId: productId,
//         name: product.name,
//         price: product.price,
//         image: product.image,
//       });

//       wx.showToast({
//         title: '已加入采购车',
//         icon: 'success',
//       });

//       this.updateCartBadge();
//     }
//   },

//   loadMore() {
//     if (this.data.currentSlug) {
//       this.loadProductsBySlugMore(this.data.currentSlug);
//     }
//   },

//   async loadProductsBySlugMore(slug) {
//     if (this.data.loading || !this.data.hasMore) return;

//     this.setData({
//       loading: true
//     });

//     try {
//       const page = this.data.currentPage + 1;
//       const result = await getCollection(slug, page, this.data.pageSize);

//       if (result && result.productVariants && result.productVariants.items.length > 0) {
//         const newProducts = result.productVariants.items.map(item => {
//           const product = item.product || {};
//           const variantImage = item.featuredAsset && item.featuredAsset.preview;
//           const productImage = product.featuredAsset && product.featuredAsset.preview;

//           return {
//             id: item.id,
//             name: item.name,
//             productSlug: product.slug || '',
//             brand: product.name || '',
//             sku: item.sku || '',
//             price: formatPrice(item.priceWithTax, item.currencyCode).replace('¥', ''),
//             volumePrice: (item.priceWithTax * 0.85 / 100).toFixed(2),
//             image: variantImage || productImage || 'https://via.placeholder.com/200x200',
//             stock: item.stockLevel || '充足',
//             moq: '1',
//             leadTime: '3-5天',
//           };
//         });

//         const existingIds = this.data.products.map(p => p.id);
//         const uniqueProducts = newProducts.filter(p => !existingIds.includes(p.id));

//         this.setData({
//           products: [...this.data.products, ...uniqueProducts],
//           currentPage: page,
//           hasMore: uniqueProducts.length >= this.data.pageSize,
//         });
//       } else {
//         this.setData({
//           hasMore: false
//         });
//       }
//     } catch (error) {
//       console.error('Failed to load more products:', error);
//     } finally {
//       this.setData({
//         loading: false
//       });
//     }
//   },

//   onReachBottom() {
//     if (this.data.hasMore && !this.data.loading) {
//       this.loadMore();
//     } else if (!this.data.hasMore) {
//       wx.showToast({
//         title: '已经到底了...',
//         icon: 'none',
//       });
//     }
//   },

//   onScroll(e) {
//     if (e.detail.scrollTop > 500) {
//       this.setData({
//         showBackToTop: true
//       });
//     } else {
//       this.setData({
//         showBackToTop: false
//       });
//     }
//   },

//   scrollToTop() {
//     this.setData({
//       scrollTop: 0
//     });
//   },

//   // goToSearch() {
//   //   wx.navigateTo({
//   //     url: '/pages/search/search',
//   //   });
//   // },

//   goToSearch() {
//     wx.switchTab({
//       url: '/pages/search/search'
//     })
//   }


// });