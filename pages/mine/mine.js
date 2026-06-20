const app = getApp();
const util = require('../../utils/util.js');
const config = require('../../config.js');

Page({
  data: {
    fastapiUrl: config.fastapiUrl,
    userInfoExist: false,
    userOpenId: '',
    userAvatarUrl: '',
    userNickName: '',
    userName: '',
    userMobile: '',
    userMobileColor: '#707070',
    isLogin: false,
    isLoading: true,
    isAgreed: false,
    companyInfo: '',
    invoiceInfo: '',
    channelCode: ''
  },

  returnToHome: function () {
    wx.switchTab({
      url: '/pages/home/home'
    });
  },

  goToAddress: function () {
    wx.navigateTo({
      url: '/pages/address/address'
    });
  },

  goToOrderHistory: function () {
    wx.navigateTo({
      url: '/pages/order-history/order-history'
    });
  },

  async onLoad() {
    await app.initPromise;
    // 关键：分享直接进入时，必须先等云环境 init() 完成，否则会报
    // "Cloud API isn't enabled, please call wx.cloud.init first"
    if (app.cloudInitPromise) {
      try {
        await app.cloudInitPromise;
      } catch (e) {
        console.warn('mine onLoad: cloudInitPromise rejected', e);
      }
    }
    await app.loginPromise;

    const openid = app.globalData.openid || wx.getStorageSync('openid');

    this.setData({
      userOpenId: openid,
      isLogin: app.globalData.isLogin,
      channelCode: app.globalData.activeChannelCode
    });

    if (openid) {
      await this.cloudDbRead(openid);
    }

    this.readLocalStorageInfo();

    if (!this.data.userAvatarUrl) {
      this.setData({
        userAvatarUrl: config.avatarImg
      });
    }

    if (app.globalData.isLogin) {
      await this.fetchVendureCustomerInfo();
    }

    this.setData({
      isLoading: false
    });
  },

  async onShow() {
    console.log('1 Mine onShow --->')
    if (app.globalData.isLogin) {
      console.log('2 Mine onShow --->')
    }
    // 每次页面切回时，确保最新的资料能及时刷新
    this.setData({
      isLogin: app.globalData.isLogin
    });
    
    // 无论是否登录，都尝试读取云数据库数据（优先级更高）
    const openid = app.globalData.openid || wx.getStorageSync('openid');
    if (openid) {
      // 等云环境 init() 完成（即使 onLoad 已 await 过，onShow 仍需保证）
      if (app.cloudInitPromise) {
        try { await app.cloudInitPromise; } catch (e) {}
      }
      await this.cloudDbRead(openid);
    } else {
      // 如果没有 openid，也要重置数据
      this.setData({
        userAvatarUrl: config.avatarImg,
        userNickName: '',
        userName: '',
        userMobile: '',
        userInfoExist: false
      });
    }
    
    // 读取本地缓存作为补充（避免 cloudDbRead 失败时显示空白）
    this.readLocalStorageInfo();

    // 更新购物车徽章
    app.updateCartBadge();
    if (app.globalData.isLogin) {
      app.syncServerCartCount();
    }
  },

  /**
   * 提取本地缓存资料进行视图渲染
   */
  readLocalStorageInfo() {
    const avatarurl = wx.getStorageSync('avatarurl');
    const nickname = wx.getStorageSync('nickname');
    const mobile = wx.getStorageSync('mobile');
    const userName = wx.getStorageSync('userName');

    if (avatarurl && avatarurl !== `${config.avatarImg}`) {
      this.setData({ userAvatarUrl: avatarurl });
    } else if (!this.data.userAvatarUrl || this.data.userAvatarUrl === '') {
      // 如果没有有效的头像，设置默认头像
      this.setData({ userAvatarUrl: config.avatarImg });
    }
    if (nickname) {
      this.setData({ userNickName: nickname });
    } else {
      this.setData({ userNickName: '' });
    }
    if (mobile) {
      this.setData({ userMobile: mobile });
    } else {
      this.setData({ userMobile: '' });
    }
    if (userName) {
      this.setData({ userName: userName });
    } else {
      this.setData({ userName: '' });
    }
  },

  /**
   * 读取微信云数据库
   */
  async cloudDbRead(openid) {
    if (!app.cloud) {
      console.error('Cloud is not initialized');
      return null;
    }

    // 兜底：即使调用方忘了 await，这里也再等一次 init() 完成
    if (app.cloudInitPromise) {
      try { await app.cloudInitPromise; } catch (e) {}
    }

    // init 失败后 cloud 实例仍存在但可能不可用，再做一次防御
    if (!app.cloud || typeof app.cloud.database !== 'function') {
      console.error('Cloud database API not available');
      return null;
    }

    const db = app.cloud.database();
    const userCollection = db.collection('user');

    try {
      const res = await userCollection.where({
        openid: openid // 统一查询字段
      }).get();

      if (res.data.length > 0) {
        const userInfo = res.data[0];
        console.log('【云数据库】成功读取到个性化资料:', userInfo);

        // 处理云数据库中的空字符串，正确设置数据
        this.setData({
          userAvatarUrl: userInfo.avatarurl ? userInfo.avatarurl : config.avatarImg,
          userNickName: userInfo.nickname ? userInfo.nickname : '',
          userMobile: userInfo.mobile ? userInfo.mobile : '',
          userName: userInfo.userName ? userInfo.userName : '',
          companyInfo: userInfo.companyInfo ? userInfo.companyInfo : '',
          userInfoExist: true
        });

        // 同步写回本地缓存，防止时差闪烁
        if (userInfo.avatarurl) wx.setStorageSync('avatarurl', userInfo.avatarurl);
        if (userInfo.nickname) wx.setStorageSync('nickname', userInfo.nickname);
        if (userInfo.mobile) wx.setStorageSync('mobile', userInfo.mobile);
        if (userInfo.userName) wx.setStorageSync('userName', userInfo.userName);
        if (userInfo.companyInfo) wx.setStorageSync('companyInfo', userInfo.companyInfo);

        return userInfo;
      } else {
        console.log('【云数据库】该 OpenID 暂未创建云端个性化记录');
        this.setData({
          userInfoExist: false
        });
        return null;
      }
    } catch (err) {
      console.error('读取微信云数据库故障:', err);
      return null;
    }
  },

  async fetchVendureCustomerInfo() {
    try {
      // 确保 graphqlClient 存在且已初始化
      const api = require('../../utils/api.js');
      if (!api.graphqlClient) {
        console.warn('graphqlClient 未初始化');
        return;
      }

      const {
        graphqlClient
      } = api;

      const query = `
        query GetMe {
          me {
            id
            identifier
          }
        }
      `;

      // 添加超时和错误处理
      const data = await graphqlClient.query(query).catch(err => {
        console.error('GraphQL 查询失败:', err);
        return null;
      });

      console.log('fetchVendureCustomerInfo - data:', data);

      // 添加更严格的空值检查
      if (data && data.me && typeof data.me === 'object') {
        const customer = data.me;
        app.globalData.customerInfo = customer;

        // // 设置公司信息和发票信息
        // this.setData({
        //   companyInfo: customer.customFields?.companyInfo || '',
        //   invoiceInfo: customer.customFields?.invoiceInfo || ''
        // });

        // 确保 customer 有值且不是 null 再进行后续操作
        if (customer && customer.id) {
          console.log('获取到用户信息:', customer.id);
        }
      } else {
        console.log('未获取到有效的用户信息');
      }
    } catch (error) {
      console.error('获取Vendure用户信息失败:', error);
      // 不抛出错误，避免影响页面渲染
    }
  },

  checkboxChange(e) {
    this.setData({
      isAgreed: (e.detail.value && e.detail.value.length > 0)
    });
  },

  // 🔑 渠道切换入口
  // 触发位置：mine.wxml 中"渠道：xxx ⇄ 切换"那一行
  // 流程：
  //   1) 弹 wx.showModal（editable=true）让用户输入新 code
  //   2) 调用 app.switchChannel() 完成切换
  //   3) 刷新本页 + 通知所有 page 重新 onShow（让 cart 拿到新 token）
  // 注意：切换会强制清掉登录态（安全设计），所以即使从 blank_channel 切到真渠道
  //   也需要重新走登录流程（云数据库里有记录的话会自动登录）
  async onChannelCodeTap() {
    const current = app.globalData.activeChannelCode || 'blank_channel';
    const isBlank = !current || current === 'blank_channel';

    // ~~~~~~~~~~~~~~~~~~~~~~~~~
    
    if (current !== "blank_channel") {
      return wx.showToast({ title: '感谢您的使用', icon: 'none' });
    }
    
    // ~~~~~~~~~~~~~~~~~~~~~~~~~

    // 2 步确认：先告诉用户会发生什么，再让用户输入
    const confirmRes = await new Promise(resolve => {
      wx.showModal({
        title: '切换渠道',
        content: isBlank
          ? '当前为默认渠道。\n\n 确认要切换吗？'
          : `当前渠道：${current}\n\n 确认要切换吗？`,
        confirmText: isBlank ? '下一步' : '确认切换',
        cancelText: '取消',
        success: resolve,
        fail: () => resolve({ confirm: false }),
      });
    });

    if (!confirmRes.confirm) return;

    // 让用户输入新 code
    // placeholderText: '例如：default-channel',
    const inputRes = await new Promise(resolve => {
      wx.showModal({
        title: '请输入新渠道代码',
        content: '',
        editable: true,
        confirmText: '切换',
        cancelText: '取消',
        success: resolve,
        fail: () => resolve({ confirm: false }),
      });
    });

    if (!inputRes.confirm) return;
    const newCode = (inputRes.content || '').trim();
    if (!newCode) {
      return wx.showToast({ title: '渠道代码不能为空', icon: 'none' });
    }
    if (newCode === current) {
      return wx.showToast({ title: '渠道未变化', icon: 'none' });
    }
    if (newCode === "__default_channel__") {
      return wx.showToast({ title: '感谢您的使用', icon: 'none' });
    }

    // 执行切换
    wx.showLoading({ title: '正在切换渠道...', mask: true });
    let result;
    try {
      // 🔑 防御：如果 app.switchChannel 未定义（旧版本或缓存），提示用户清除缓存
      if (typeof app.switchChannel !== 'function') {
        console.error('[mine] app.switchChannel is not a function. ' +
          'app keys:', Object.keys(app).slice(0, 20).join(', '));
        throw new Error('app.switchChannel 不可用，请清除微信开发者工具缓存后重试');
      }
      result = await app.switchChannel(newCode);
    } catch (e) {
      wx.hideLoading();
      console.error('[mine] switchChannel 抛出异常:', e);
      return wx.showToast({
        title: '切换失败：' + (e.message || '网络异常'),
        icon: 'none',
        duration: 2500,
      });
    }
    wx.hideLoading();

    if (!result || !result.success) {
      return wx.showToast({
        title: (result && result.message) || '切换失败',
        icon: 'none',
        duration: 2500,
      });
    }

    // 切换成功：立即切到 home tab，再做其他后台工作
    // 🔑 关键：switchTab 在 setData 之前调用，确保 native 第一时间处理页面切换
    //   1) wx.switchTab 发送消息给 native（立即返回）
    //   2) 紧跟的 setData 也发送消息给 native
    //   3) native 优先处理 switchTab（页面被切走），再处理 setData（更新隐藏的 mine）
    //   4) 用户看到的是：mine 页面 → 几乎瞬间切到 home
    //   5) mine 的数据更新在后台发生，用户切回 mine tab 时数据已是新 channel 的
    //
    // 与之前版本的区别：
    //   - 之前：setData → await toast (1.8s) → setTimeout(1.5s) → switchTab
    //     用户看到 mine 的更新状态 + 1.8s toast + 1.5s 等待 = 约 3s 视觉停留
    //   - 现在：switchTab 立即触发 → 用户只看到 home tab 加载新数据
    wx.switchTab({
      url: '/pages/home/home',
      success: () => {
        console.log('[mine] switchChannel 成功 → 切到 home tab（直接切换，未显示 mine）');
      },
      fail: (err) => {
        console.warn('[mine] switchTab to home failed (non-fatal):', err);
        // 即使 switchTab 失败，_homeNeedsReload flag 仍会兜底：
        // 用户后续手动切到 home tab 时，home.onShow 会检测到 flag 并 reload
      },
    });

    // 🔑 更新本页显示（在 switchTab 之后执行，更新的是已被切走的 mine 页面）
    //    用户切回 mine tab 时能看到新 channel 的状态
    this.setData({
      channelCode: result.code,
      isLogin: result.isLogin,
      // isLogin=true：新渠道有账号 → 重新拉一次云数据 + Vendure 客户信息
      // isLogin=false：新渠道无账号 → 清空所有用户态，等用户去注册
      userNickName: '',
      userName: '',
      userMobile: '',
      companyInfo: '',
      userInfoExist: false,
    });

    // 🔑 toast 在切 tab 之后显示（系统级，会跟随页面切换）
    // 不 await，避免阻塞当前函数
    wx.showToast({
      title: result.isLogin ? '切换成功' : '切换成功',
      icon: result.isLogin ? 'success' : 'none',
      duration: 1800,
    });

    // 🔑 刷新其他 tabBar/普通页面（fire-and-forget）
    //    因为 switchChannel 已经覆盖了 loginPromise，每个 page onShow 里的
    //    await app.loginPromise 都会拿到 NEW 的 promise，自动等待新鉴权
    //    mine 已经被隐藏，这里只需要刷新其他还在栈中的页面
    const pages = getCurrentPages();
    pages.forEach(p => {
      if (p && typeof p.onShow === 'function') {
        try { p.onShow(); } catch (e) { console.warn('[mine] refresh page onShow failed:', e); }
      }
    });

    // 🔑 通知 home 页面刷新 collections（如果 home 在页面栈里）
    //    这是双保险：即使 home 在栈中且 reloadForChannelSwitch 已执行，
    //    switchTab 之后 home.onShow 还会再检测一次 _homeNeedsReload flag
    //    （_homeNeedsReload 是在 app.switchChannel() 内部置的，到此还未被 home.onShow 消费）
    const homePage = pages.find(p => p && p.route === 'pages/home/home');
    if (homePage && typeof homePage.reloadForChannelSwitch === 'function') {
      console.log('[mine] home page in stack, trigger reloadForChannelSwitch');
      try {
        // 不 await，让 home 的刷新异步进行
        homePage.reloadForChannelSwitch();
      } catch (e) {
        console.warn('[mine] home reloadForChannelSwitch failed:', e);
      }
    } else {
      console.log('[mine] home page NOT in stack, switchTab will activate it');
    }

    // 🔑 自己的 onShow 也在后台跑一次（fire-and-forget）
    //    mine 已经被切走，但 onShow 里的 cloudDbRead + fetchVendureCustomerInfo 需要跑
    //    这样当用户后续切回 mine tab 时，data 已经是新 channel 的
    this.onShow().catch(e => console.warn('[mine] self onShow refresh failed:', e));
  
  // ~~~~~~~~~~~~~~~~~~~~~~~~~

  
  },

  updateUserInfo2: function () {
    if (!this.data.isLogin && !this.data.isAgreed) {
      wx.showToast({
        title: '请先勾选并同意《用户服务协议》《隐私政策》',
        icon: 'none',
        duration: 1200
      });
      return;
    }
    wx.navigateTo({
      url: '/pages/mine/register'
    });
  },

  unbindAccount: function () {
    wx.showModal({
      title: '确认解除绑定',
      content: '确定要解除微信与账户的绑定吗？解除后将清除本地登录状态。',
      success: async (res) => {
        if (res.confirm) {
          wx.showLoading({
            title: '正在解除绑定...'
          });

          try {
            const token = wx.getStorageSync('vendure-auth-token');
            const channelToken = app.globalData.activeChannelToken || '';

            const response = await new Promise((resolve, reject) => {
              wx.request({
                url: app.globalData.baseUrl,
                method: 'POST',
                header: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`,
                  'vendure-token': channelToken
                },
                data: {
                  query: `mutation { unbindWechatAccount { success message } }`
                },
                success: (res) => {
                  if (res.data?.errors && res.data.errors.length > 0) {
                    reject(new Error(res.data.errors[0].message));
                  } else {
                    resolve(res.data);
                  }
                },
                fail: (err) => reject(err)
              });
            });

            const result = response?.data?.unbindWechatAccount;

            if (result?.success) {
              // 先清除云数据库数据
              if (app.cloud) {
                const db = app.cloud.database();
                const userCollection = db.collection('user');

                try {
                  const res = await userCollection.where({
                    openid: this.data.userOpenId
                  }).get();

                  if (res.data.length > 0) {
                    const docId = res.data[0]._id;
                    await userCollection.doc(docId).update({
                      data: {
                        avatarurl: '',
                        nickname: '',
                        mobile: '',
                        userName: '',
                        companyInfo: '',
                      }
                    });
                  }
                } catch (err) {
                  console.error('清除云数据库数据失败:', err);
                }
              }

              // 清除本地存储
              wx.removeStorageSync('vendure-auth-token');
              app.globalData.isLogin = false;
              app.globalData.customerInfo = null;

              // 清除本地缓存
              wx.removeStorageSync('openid');
              wx.removeStorageSync('avatarurl');
              wx.removeStorageSync('nickname');
              wx.removeStorageSync('mobile');
              wx.removeStorageSync('userName');
              wx.removeStorageSync('companyInfo');
              wx.removeStorageSync('vendure-auth-token');
              wx.removeStorageSync('last-auth-channel-token');
              wx.removeStorageSync('last-auth-channel-code');
              
              // 立即更新当前页面数据
              this.setData({
                isLogin: false,
                userAvatarUrl: config.avatarImg,
                userNickName: '',
                userName: '',
                userMobile: '',
                companyInfo: '',
                userInfoExist: false
              });

              wx.hideLoading();
              wx.showToast({
                title: '解除绑定成功',
                icon: 'success',
                duration: 2000,
                complete: () => {
                  setTimeout(() => {
                    // 刷新所有页面并跳转到首页
                    const pages = getCurrentPages();
                    pages.forEach(page => {
                      if (page.onShow) {
                        page.onShow();
                      }
                    });
                    wx.switchTab({
                      url: '/pages/home/home'
                    });
                  }, 2000);
                }
              });
            } else {
              wx.hideLoading();
              wx.showToast({
                title: result?.message || '解除绑定失败',
                icon: 'none'
              });
            }
          } catch (error) {
            wx.hideLoading();
            console.error('解除绑定失败:', error);
            wx.showToast({
              title: error.message || '解除绑定失败',
              icon: 'none'
            });
          }
        }
      }
    });
  },

  // onShareAppMessage: function () {
  //   return {
  //     title: '优涂工品',
  //     path: '/pages/mine/mine'
  //   };
  // },

  // onShareTimeline: function () {
  //   return {
  //     title: '优涂工品',
  //     path: '/pages/mine/mine'
  //   };
  // }



});
