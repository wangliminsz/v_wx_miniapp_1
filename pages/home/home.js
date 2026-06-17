const app = getApp();
const config = require('../../config.js');
const { getCollections } = require('../../providers/shop/products/products');

// 微信小程序审核要求：未登录用户展示静态分类（避免触发实际业务数据请求）
const MOCK_COLLECTIONS = [
  { id: 1, name: '通用工业粉末', slug: 'general', image: 'https://bkkschool-1304214433.cos.ap-guangzhou.myqcloud.com/1781061031149-34-ral_3011.jpg', count: 12 },
  { id: 2, name: '聚酯粉末', slug: 'polyester', image: 'https://bkkschool-1304214433.cos.ap-guangzhou.myqcloud.com/1781060981414-9-ral_5010.jpg', count: 8 },
  { id: 3, name: '环氧粉末', slug: 'epoxy', image: 'https://bkkschool-1304214433.cos.ap-guangzhou.myqcloud.com/1781060932518-574-ral_6027.jpg', count: 15 },
  { id: 4, name: '绝缘粉末', slug: 'insulation', image: 'https://bkkschool-1304214433.cos.ap-guangzhou.myqcloud.com/1781060900651-496-ral_2003.jpg', count: 9 },
  { id: 5, name: '平光环氧绝缘粉末', slug: 'matte', image: 'https://bkkschool-1304214433.cos.ap-guangzhou.myqcloud.com/1781060830381-595-ral_8023.jpg', count: 6 },
  { id: 6, name: '亮光环氧绝缘粉末', slug: 'glossy', image: 'https://bkkschool-1304214433.cos.ap-guangzhou.myqcloud.com/1781060754772-347-ral_9003.jpg', count: 7 },
  { id: 7, name: '重防腐粉末', slug: 'anti-c', image: 'https://bkkschool-1304214433.cos.ap-guangzhou.myqcloud.com/1781060702303-493-ral_9005.jpg', count: 18 },
];

Page({
  data: {
    banners: config.banners,
    bannerInterval: config.BANNER_INTERVAL || 6000,

    collections: [],
    collectionsLoading: true,
  },

  async onLoad() {
    // 等待 app 全局初始化完成（渠道 token 等）
    await app.initPromise;
    // 再等待登录流程完成，确保 isLogin 已经是最终结果（true / false）
    if (app.loginPromise) {
      try {
        await app.loginPromise;
      } catch (e) {
        // 登录失败也继续（视为未登录）
        console.warn('home: loginPromise rejected, treat as not logged in', e);
      }
    }
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
      // 微信小程序 switchTab 不会重新触发 onLoad，
      // 且首次跳转时 category 页面可能尚未在页面栈中。
      // 把目标 slug 放到 globalData，由 category 的 onShow 读取并切换分类
      app.globalData.pendingCategorySlug = slug;
      wx.switchTab({
        url: '/pages/category/category'
      });
    }
  },

  async loadCollections() {
    this.setData({ collectionsLoading: true });

    // 微信小程序审核要求：未登录用户直接展示静态 mock 分类，
    // 不走后端 API，避免触发登录态/鉴权等问题
    if (!app.globalData.isLogin) {
      this.setData({
        collections: MOCK_COLLECTIONS,
        collectionsLoading: false,
      });
      return;
    }

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
        this.setData({ collections: MOCK_COLLECTIONS });
      }
    } catch (error) {
      console.error('Failed to load collections:', error);
      this.setData({ collections: MOCK_COLLECTIONS });
    } finally {
      this.setData({ collectionsLoading: false });
    }
  },

  // ============= 分享功能 =============

  // 分享给好友
  onShareAppMessage() {
    // 优先取 banners 第一张作为分享封面，提升点击率
    const firstBanner = (this.data.banners && this.data.banners[0]) || {};
    const shareImage = firstBanner.image || '';

    // 🔑 把当前渠道 code 拼到分享 path 上
    // 接收方打开分享卡片 → onLaunch(options.query.channel) 触发 → 进入 channel 解析流程
    // 配合 app.js 的 storage 兜底：接收方后续从"最近使用"进入也能保持 channel
    const app = getApp();
    const currentChannel = (app && app.globalData && app.globalData.currentChannel) || '';
    const sharePath = currentChannel
      ? `/pages/home/home?channel=${encodeURIComponent(currentChannel)}`
      : '/pages/home/home';

    return {
      title: '优涂工品 - 绮一舟粉末采购平台',
      path: sharePath,
      // imageUrl: shareImage,  // 取消注释，使用 banner 作分享封面
    };
  },

  // 分享到朋友圈
  onShareTimeline() {
    const firstBanner = (this.data.banners && this.data.banners[0]) || {};
    const shareImage = firstBanner.image || '';

    // 🔑 朋友圈分享也带 channel，接收方打开后会被 onLaunch 捕获
    const app = getApp();
    const currentChannel = (app && app.globalData && app.globalData.currentChannel) || '';
    const sharePath = currentChannel
      ? `/pages/home/home?channel=${encodeURIComponent(currentChannel)}`
      : '/pages/home/home';

    return {
      title: '优涂工品 - 绮一舟粉末采购平台',
      path: sharePath,
      // imageUrl: shareImage,
    };
  },
});