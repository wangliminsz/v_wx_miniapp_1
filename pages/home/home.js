const app = getApp();
const config = require('../../config.js');
const { getCollections } = require('../../providers/shop/products/products');

Page({
  data: {
    banners: config.banners,
    bannerInterval: config.BANNER_INTERVAL || 6000,

    collections: [],
    collectionsLoading: true,
  },

  async onLoad() {
    await app.initPromise;
    this.loadCollections();
  },

  onShow() {
    app.updateCartBadge();
    if (app.globalData.isLogin) {
      app.syncServerCartCount();
    }
  },

  onPullDownRefresh() {
    this.setData({
      collections: [],
      collectionsLoading: true,
    });
    this.loadCollections();
    wx.stopPullDownRefresh();
  },

  goToSearch() {
    wx.navigateTo({
      url: '/pages/search/search',
    });
  },

  // goToOrderHistory() {
  //   console.log('pressed---')
  //   wx.navigateTo({
  //     url: '/pages/order-history/order-history',
  //   });
  // },

  goToOrderHistory() {
    console.log('pressed---')
    wx.navigateTo({
      url: '/pages/order-history/order-history',
      fail: (err) => {
        // This will print WHY navigation failed
        console.error('Jump failed:', err)
      }
    });
  },

  onCollectionTap(e) {
    const slug = e.currentTarget.dataset.slug;
    if (slug) {
      wx.switchTab({
        url: '/pages/category/category',
        success: () => {
          const pages = getCurrentPages();
          const categoryPage = pages[pages.length - 1];
          if (categoryPage && categoryPage.loadProductsBySlug) {
            categoryPage.loadProductsBySlug(slug);
          }
        }
      });
    }
  },

  async loadCollections() {
    this.setData({ collectionsLoading: true });

    try {
      const result = await getCollections();
      
      if (result && result.length > 0) {
        const parentCollections = result.filter(c => !c.parent || c.parent.id === '1' || c.parent.name === '__root_collection__');
        
        const sortedCollections = [];
        parentCollections.forEach(parent => {
          if (parent.featuredAsset) {
            sortedCollections.push({
              id: parent.id,
              name: parent.name,
              slug: parent.slug,
              image: parent.featuredAsset && parent.featuredAsset.preview || '',
              count: parent.productCount || 0,
            });
          }
          
          if (parent.children && parent.children.length > 0) {
            parent.children.forEach(child => {
              if (child.featuredAsset) {
                sortedCollections.push({
                  id: child.id,
                  name: child.name,
                  slug: child.slug,
                  image: child.featuredAsset && child.featuredAsset.preview || '',
                  count: child.productCount || 0,
                });
              }
            });
          }
        });
        
        this.setData({ collections: sortedCollections });
      } else {
        const mockCollections = [
          { id: 1, name: '通用工业粉末', slug: 'fasteners', image: 'https://bkkschool-1304214433.cos.ap-guangzhou.myqcloud.com/1781061031149-34-ral_3011.jpg', count: 12 },
          { id: 2, name: '平光聚酯粉末', slug: 'bearings', image: 'https://bkkschool-1304214433.cos.ap-guangzhou.myqcloud.com/1781060981414-9-ral_5010.jpg', count: 8 },
          { id: 3, name: '环氧粉末', slug: 'tools', image: 'https://bkkschool-1304214433.cos.ap-guangzhou.myqcloud.com/1781060932518-574-ral_6027.jpg', count: 15 },
          { id: 4, name: '绝缘粉末', slug: 'electronics', image: 'https://bkkschool-1304214433.cos.ap-guangzhou.myqcloud.com/1781060900651-496-ral_2003.jpg', count: 9 },
          { id: 5, name: '平光环氧绝缘粉末', slug: 'safety', image: 'https://bkkschool-1304214433.cos.ap-guangzhou.myqcloud.com/1781060830381-595-ral_8023.jpg', count: 6 },
          { id: 6, name: '透明亮光绝缘粉末', slug: 'hydraulic', image: 'https://bkkschool-1304214433.cos.ap-guangzhou.myqcloud.com/1781060754772-347-ral_9003.jpg', count: 7 },
          { id: 7, name: '重防腐粉末', slug: 'anti-c', image: 'https://bkkschool-1304214433.cos.ap-guangzhou.myqcloud.com/1781060702303-493-ral_9005.jpg', count: 18 },
        ];
        this.setData({ collections: mockCollections });
      }
    } catch (error) {
      console.error('Failed to load collections:', error);
      const mockCollections = [
        { id: 1, name: '通用工业粉末', slug: 'fasteners', image: 'https://bkkschool-1304214433.cos.ap-guangzhou.myqcloud.com/1781061031149-34-ral_3011.jpg', count: 12 },
          { id: 2, name: '平光聚酯粉末', slug: 'bearings', image: 'https://bkkschool-1304214433.cos.ap-guangzhou.myqcloud.com/1781060981414-9-ral_5010.jpg', count: 8 },
          { id: 3, name: '环氧粉末', slug: 'tools', image: 'https://bkkschool-1304214433.cos.ap-guangzhou.myqcloud.com/1781060932518-574-ral_6027.jpg', count: 15 },
          { id: 4, name: '绝缘粉末', slug: 'electronics', image: 'https://bkkschool-1304214433.cos.ap-guangzhou.myqcloud.com/1781060900651-496-ral_2003.jpg', count: 9 },
          { id: 5, name: '平光环氧绝缘粉末', slug: 'safety', image: 'https://bkkschool-1304214433.cos.ap-guangzhou.myqcloud.com/1781060830381-595-ral_8023.jpg', count: 6 },
          { id: 6, name: '透明亮光绝缘粉末', slug: 'hydraulic', image: 'https://bkkschool-1304214433.cos.ap-guangzhou.myqcloud.com/1781060754772-347-ral_9003.jpg', count: 7 },
          { id: 7, name: '重防腐粉末', slug: 'anti-c', image: 'https://bkkschool-1304214433.cos.ap-guangzhou.myqcloud.com/1781060702303-493-ral_9005.jpg', count: 18 },
      ];
      this.setData({ collections: mockCollections });
    } finally {
      this.setData({ collectionsLoading: false });
    }
  },
});