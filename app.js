const config = require('./config.js');

// 持久化 key：渠道 code（首次扫码获取后永久保存，作为后续从"最近使用"等无参场景的兜底）
const STORAGE_KEY_CHANNEL = 'app_persisted_channel';

App({

  globalData: {

    activeChannelToken: "",
    activeChannelCode: "",
    lastChannelToken: "",

    // 记录当前生效的渠道 code，用于 onShow 中去重判断
    // （防止 tabBar 切换等场景反复触发 handleChannel）
    currentChannel: "",

    // 🔑 渠道切换后通知 home 页面刷新 collections 的 flag
    // 触发位置：switchChannel() 成功切换后置为 true
    // 消费位置：home.js onShow 检查并调用 reloadForChannelSwitch()，然后清回 false
    // 设计原因：tabBar 页面在不同的页面栈中，从 mine.js 的 getCurrentPages() 找不到 home
    //   （即使能找到，home 此刻被 mine 覆盖、不在屏幕上），所以用全局 flag 跨栈通知
    _homeNeedsReload: false,

    // 最近一次启动参数（来自 onLaunch/onShow/wx.getEnterOptionsSync），
    // 供其他模块按需消费
    lastEnterOptions: null,

    userInfo: null,
    openid: '',
    token: '',
    cartItems: [],
    customerInfo: null,
    baseUrl: config.baseUrl,
    isLogin: false,
    windowHeight: 0,
    windowWidth: 0,
    safeAreaTop: 0

  },

  // 暴露给所有 Page 的全局登录凭证 Promise
  // 等待 拿到 token Promise
  // 暴露给所有 Page 的全局初始化 Promise (包含渠道 token)
  loginPromise: null,
  tokenPromise: null,
  initPromise: null,
  // 云开发环境初始化 Promise —— 解决分享进入时 mine.js 调用 cloud.database() 比 mycloud.init() 快的竞态
  cloudInitPromise: null,

  async onLaunch(options) {

    // // 2026-06-13
    // // Enable debug panel, valid for production version too
    // wx.setEnableDebug({
    //   enableDebug: true
    // })



    // 🔑 新增：记录上次登录的渠道
    this.globalData.lastChannelToken = wx.getStorageSync('last-auth-channel-token');
    let lastChannel
    lastChannel = this.globalData.lastChannelToken
    console.log('lastChannel = this.globalData.lastChannelToken ----------->', lastChannel)


    if (lastChannel) {} else {
      // console.warn('lastChannel Token');
      // wx.removeStorageSync('vendure-auth-token');
    }

    // 立即创建 tokenPromise
    let resolveTokenPromise;
    this.tokenPromise = new Promise(resolve => {
      resolveTokenPromise = resolve;
    });

    // 立即创建 initPromise (确保页面不会访问 undefined)
    let resolveInitPromise;
    this.initPromise = new Promise(resolve => {
      resolveInitPromise = resolve;
    });

    // 处理未捕获的 Promise 错误
    wx.onUnhandledRejection((res) => {
      console.error('Unhandled Promise Rejection:', res);
      // 可以选择上报错误或忽略
      if (res && res.reason) {
        console.error('错误原因:', res.reason);
      }
    });

    // 2026-05-23 ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    // A1. 安全获取渠道 code
    // 优先级：① 当前启动 options.query.channel（扫码/分享/卡片带参）
    //         ② wx.getEnterOptionsSync().query.channel（onLaunch 兜底，热启动某些场景可能拿到）
    //         ③ wx.getStorageSync(STORAGE_KEY_CHANNEL)（持久化 - 首次扫码参数永久生效）
    //         ④ 默认 "blank_channel"
    let channelCode = "blank_channel";

    if (options && options.query && options.query.channel) {
      channelCode = options.query.channel;
    } else {
      try {
        const enterOpts = wx.getEnterOptionsSync && wx.getEnterOptionsSync();
        if (enterOpts && enterOpts.query && enterOpts.query.channel) {
          channelCode = enterOpts.query.channel;
        } else {
          // 兜底：从本地存储读取（首次扫码参数永久保存）
          const persisted = wx.getStorageSync(STORAGE_KEY_CHANNEL);
          if (persisted && persisted.code) {
            channelCode = persisted.code;
            console.log('[channel] 从本地存储恢复渠道:', channelCode);
          }
        }
      } catch (e) {
        // getEnterOptionsSync 失败也不影响
        console.warn('[channel] getEnterOptionsSync failed:', e);
        const persisted = wx.getStorageSync(STORAGE_KEY_CHANNEL);
        if (persisted && persisted.code) {
          channelCode = persisted.code;
        }
      }
    }

    // 🔑 持久化：如果本次启动带新 channel，写入存储（首次扫码后从"最近使用"进入也能拿到）
    if (channelCode !== "blank_channel") {
      try {
        wx.setStorageSync(STORAGE_KEY_CHANNEL, {
          code: channelCode,
          updatedAt: Date.now(),
        });
      } catch (e) {
        console.warn('[channel] setStorage failed:', e);
      }
    }

    // 记录冷启动时的渠道与启动参数，供 onShow 去重与全模块消费
    this.globalData.currentChannel = channelCode;
    this.globalData.lastEnterOptions = options || null;

    // 🔑 LRU 恢复：优先从 localStorage 读取上次成功的 channel token
    //   解决 LRU 后 channel code 在 mine 页不显示的问题
    //   原理：上次成功调用 getChannelToken 时会持久化 active-channel-code/token 到 localStorage
    //   LRU 后 JS 内存清空，但 localStorage 保留 → onLaunch 时同步读出作为初始值
    //   后续 await getChannelToken() 会用后端最新值覆盖（双保险）
    if (channelCode !== 'blank_channel') {
      try {
        const cachedCode = wx.getStorageSync('active-channel-code');
        const cachedToken = wx.getStorageSync('active-channel-token');
        // 只有当缓存的 code 匹配当前 channelCode 时才用（避免切渠道后用错）
        if (cachedCode === channelCode && cachedToken) {
          this.globalData.activeChannelCode = cachedCode;
          this.globalData.activeChannelToken = cachedToken;
          console.log(`[onLaunch] LRU 恢复: 从 localStorage 同步读取 channel=${cachedCode}`);
        }
      } catch (e) {
        console.warn('[onLaunch] LRU 恢复失败:', e);
      }
    }

    // A2. 调用你自定义的接口，安全获取当前渠道 token
    //   成功时 setData 覆盖 localStorage 的缓存值
    //   失败时用 last-auth-channel-token 兜底（getChannelToken 内部已处理）
    await this.getChannelToken(channelCode);

    // token 完成 (渠道 token 已获取)，resolve tokenPromise
    resolveTokenPromise();

    console.log("最终使用渠道：", channelCode);
    console.log("最终使用 token：", this.globalData.activeChannelToken);

    // 2026-05-23 ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    // B1. 获取屏幕尺寸
    this.getSystemInfo();

    // B2. 异步初始化云开发环境（不阻塞主登录流程）
    // 必须把 init() 的 Promise 暴露出去，分享进入时 page 需 await 这个 Promise
    this.cloudInitPromise = this.initCloud();

    // B3. 初始化购物车徽章（即使未登录也显示本地购物车数量）
    this.initCartBadge();

    // B4. 🔥 启动核心身份鉴权控制流，并挂载到全局 Promise

    await this.tokenPromise;

    this.loginPromise = this.initAuthFlow().then(() => {
      // 登录完成后同步服务器购物车数量
      if (this.globalData.isLogin) {
        this.syncServerCartCount();
      }
    });

    // 全局初始化完成 (渠道 token 已获取)，resolve initPromise
    resolveInitPromise();
  },

  // ============= 渠道参数兜底：onShow + wx.getEnterOptionsSync =============
  // 解决从「最近使用」「顶部菜单」「后台切回」等热启动场景下丢失 channel 的问题。
  // onLaunch 只在冷启动触发一次，从最近使用列表进入属于热启动，
  // 微信不重新派发 onLaunch.options，但 onShow 一定会触发。
  // 三级保险：onShow(options) 优先 → wx.getEnterOptionsSync() 兜底 → 本地存储兜兜底
  onShow(options) {

    console.log('onShow 热启动 --->>>>> ', options)

    // 1) 优先用 onShow 传入的 options（冷启动/分享/扫码 等场景）
    // 2) 兜底用 wx.getEnterOptionsSync()（最近使用列表等热启动场景 onShow options 可能为空）
    let enterOptions = options;
    if (!enterOptions || !enterOptions.query || !enterOptions.query.channel) {
      try {
        enterOptions = wx.getEnterOptionsSync();
      } catch (e) {
        // 某些低版本基础库可能不支持，记一个 warn 即可
        console.warn('wx.getEnterOptionsSync() failed:', e);
      }
    }

    // 把最近一次启动参数写入 globalData，方便其他模块消费
    if (enterOptions) {
      this.globalData.lastEnterOptions = enterOptions;
      // 同步给本地测试接口，便于 mock 启动参数
      try {
        wx.setStorageSync('lastEnterOptions', enterOptions);
      } catch (e) {}
    }

    // 计算当前 channel（三级 fallback）
    let newChannel = enterOptions && enterOptions.query && enterOptions.query.channel;
    if (!newChannel) {
      // 兜兜底：从持久化存储读取（首次扫码的 channel 永久生效）
      try {
        const persisted = wx.getStorageSync(STORAGE_KEY_CHANNEL);
        if (persisted && persisted.code) {
          newChannel = persisted.code;
          console.log('[channel] onShow 从本地存储恢复渠道:', newChannel);
        }
      } catch (e) {}
    }

    // 只有当真的有 channel 参数，且与当前不同时才处理（避免 tabBar 切换等场景反复触发）
    if (newChannel && newChannel !== this.globalData.currentChannel) {
      console.log('onShow 检测到新渠道:', newChannel);
      // 🔑 复用统一的渠道切换逻辑
      this.applyChannelChange(newChannel, { source: 'onShow' });
    } else {
      console.log('onShow 渠道未变化（或无 channel），跳过。currentChannel=', this.globalData.currentChannel);
    }
  },

  // 🔑 渠道切换的核心逻辑（提取为可复用方法）
  // 三处入口共用：onShow（启动参数）、switchChannel（用户手动切换）、refreshChannelFromEnterOptions（热启动刷新）
  // 副作用：
  //   1) 持久化到 STORAGE_KEY_CHANNEL
  //   2) 更新 globalData.currentChannel / activeChannelCode / activeChannelToken
  //   3) 🔑 同步更新 globalData.lastEnterOptions（让任何读 lastEnterOptions.query.channel 的代码拿到正确值）
  //   4) 不在这里清登录态 —— 由调用方按需决定（手动切换需要清；启动参数进入时一般不清）
  //   5) 不在这里触发 initAuthFlow —— 让 page 在 onShow 时自然触发，逻辑更解耦
  //
  // @param {string} newCode  新的渠道代码
  // @param {object} options
  //   - source:  切换来源标识（'onShow' | 'manual' | 'refresh'），仅用于日志
  // @returns {Promise<{changed: boolean, code: string, token: string}>}
  async applyChannelChange(newCode, { source = 'unknown' } = {}) {
    if (!newCode) {
      console.warn(`[channel] applyChannelChange 收到空 code，source=${source}，忽略`);
      return { changed: false, code: this.globalData.currentChannel, token: this.globalData.activeChannelToken };
    }

    if (newCode === this.globalData.currentChannel) {
      console.log(`[channel] 渠道未变 (${newCode})，source=${source}，跳过 applyChannelChange`);
      return { changed: false, code: newCode, token: this.globalData.activeChannelToken };
    }

    console.log(`[channel] 切换渠道: ${this.globalData.currentChannel} → ${newCode} (source=${source})`);

    // 1) 先更新 currentChannel，避免并发 onShow / switchChannel 重复触发
    this.globalData.currentChannel = newCode;

    // 2) 持久化（与 onLaunch / onShow 行为完全一致）
    try {
      wx.setStorageSync(STORAGE_KEY_CHANNEL, {
        code: newCode,
        updatedAt: Date.now(),
      });
    } catch (e) {
      console.warn('[channel] applyChannelChange 持久化失败:', e);
    }

    // 3) 拉取新渠道 token（getChannelToken 内部会 set globalData.activeChannelCode/Token）
    await this.getChannelToken(newCode);

    // 4) 🔑 同步更新 lastEnterOptions（让任何读 lastEnterOptions.query.channel 的代码拿到正确值）
    //    场景：用户从搜索/最近使用进入（query: {}），然后在 mine 页面手动切换渠道
    //    → 切换后 lastEnterOptions.query.channel 应反映用户手动选的新渠道，保持全局一致
    //    保留原有的 path/scene/mode/apiCategory 等结构，只覆盖 query.channel
    const prevOptions = this.globalData.lastEnterOptions || {};
    const newOptions = {
      ...prevOptions,
      query: {
        ...(prevOptions.query || {}),
        channel: newCode,
      },
    };
    this.globalData.lastEnterOptions = newOptions;
    try {
      wx.setStorageSync('lastEnterOptions', newOptions);
      console.log(`[channel] 已同步更新 lastEnterOptions.query.channel = ${newCode}`);
    } catch (e) {
      console.warn('[channel] 同步更新 lastEnterOptions 失败:', e);
    }

    return {
      changed: true,
      code: newCode,
      token: this.globalData.activeChannelToken,
    };
  },

  // 🔑 公开 API：用户手动切换渠道
  // 调用方：mine.js 的 onChannelCodeTap
  // 行为（与 onLaunch 的鉴权启动完全对齐）：
  //   1) 验证新 code 有效性（通过 getChannelToken → GraphQL getChannelTokenByCode）
  //   2) 应用切换（复用 applyChannelChange）— 持久化 + 更新 currentChannel
  //   3) 清理本地登录态（旧 token + last-auth-channel-*）
  //   4) 🔑 关键：重新触发 initAuthFlow，让 proceedToGetOpenId 用 NEW channel 的 token
  //      调 Vendure 校验用户在新渠道是否有账号，命中则自动登录 + 锁定 last-auth-channel-token
  //      这个调用挂在 loginPromise 上，覆盖旧的 loginPromise，page 重新 onShow 时会 await 这个新 promise
  //   5) await loginPromise 让调用方（mine.js）能拿到最终的 isLogin 状态
  //
  // @param {string} newCode
  // @returns {Promise<{success: boolean, message: string, code?: string, isLogin?: boolean}>}
  async switchChannel(newCode) {
    if (!newCode || !String(newCode).trim()) {
      return { success: false, message: '渠道代码不能为空' };
    }
    newCode = String(newCode).trim();

    // 1) 验证：通过 GraphQL 拿 token，拿不到就视为无效
    await this.getChannelToken(newCode);
    if (!this.globalData.activeChannelToken) {
      console.warn(`[channel] switchChannel 失败：code=${newCode} 拿不到 token`);
      return { success: false, message: '渠道代码无效或已失效' };
    }

    // 2) 应用切换
    const result = await this.applyChannelChange(newCode, { source: 'manual' });
    if (!result.changed) {
      return { success: true, message: '已经是该渠道', code: newCode, isLogin: this.globalData.isLogin };
    }

    // 3) 🔑 清理本地登录态（强制走 re-auth）
    try {
      wx.removeStorageSync('vendure-auth-token');
      wx.removeStorageSync('last-auth-channel-code');
      wx.removeStorageSync('last-auth-channel-token');
    } catch (e) {
      console.warn('[channel] switchChannel 清理 storage 失败:', e);
    }
    this.globalData.lastChannelToken = '';
    this.globalData.isLogin = false;
    this.globalData.customerInfo = null;
    // 清掉本地购物车（旧渠道的购物车不应跨渠道带过去）
    try {
      wx.removeStorageSync('cart_items');
    } catch (e) {}
    this.globalData.cartItems = [];
    this.globalData.cartTotalCount = 0;

    // 4) 🔑 核心：重新触发鉴权流程（与 onLaunch 的 B4 步骤完全一致）
    //    initAuthFlow 内部会：
    //      - 看到 token=null + lastChannel='' → 走 proceedToGetOpenId
    //      - proceedToGetOpenId 用 NEW channel 的 activeChannelToken 调 Vendure 校验 openid
    //      - 命中则 setLoginStatus(true) + 写入 last-auth-channel-token = NEW channel token
    //      - 未命中则 setLoginStatus(false)，引导用户去注册
    this.loginPromise = this.initAuthFlow().then(() => {
      if (this.globalData.isLogin) {
        this.syncServerCartCount();
      }
    });

    // 5) 等待新鉴权完成，让调用方能直接拿到最终 isLogin
    try {
      await this.loginPromise;
    } catch (e) {
      console.error('[channel] switchChannel 重新鉴权失败:', e);
    }

    // 6) 🔑 通知 home 页面下次 onShow 时刷新 collections
    //    tabBar 页面在不同页面栈中，从 mine 的 getCurrentPages() 找不到 home
    //    所以用 flag 跨栈通知，home.onShow 检查到后会调用 reloadForChannelSwitch()
    this.globalData._homeNeedsReload = true;
    console.log(`[channel] 已置 _homeNeedsReload=true，等待 home.onShow 消费`);

    console.log(`[channel] switchChannel 完成：${newCode}，isLogin=${this.globalData.isLogin}`);

    return {
      success: true,
      message: this.globalData.isLogin ? '切换成功并已自动登录' : '切换成功，请在新渠道注册或登录',
      code: newCode,
      isLogin: this.globalData.isLogin,
    };
  },

  // 可选：手动刷新渠道参数（供其他模块按需调用，例如在某个页面入口主动拉取最新）
  refreshChannelFromEnterOptions() {
    try {
      const enterOptions = wx.getEnterOptionsSync();
      const channel = enterOptions && enterOptions.query && enterOptions.query.channel;
      if (channel && channel !== this.globalData.currentChannel) {
        this.globalData.currentChannel = channel;
        this.globalData.lastEnterOptions = enterOptions;
        this.getChannelToken(channel);
      }
    } catch (e) {
      console.warn('refreshChannelFromEnterOptions failed:', e);
    }
  },

  // 测试辅助：清除持久化的 channel（重置后下次启动会回退到 "blank_channel"）
  // 调用方式：getApp().clearPersistedChannel()
  clearPersistedChannel() {
    try {
      wx.removeStorageSync(STORAGE_KEY_CHANNEL);
      this.globalData.currentChannel = "blank_channel";
      console.log('[channel] 已清除持久化渠道，重置为 blank_channel');
    } catch (e) {
      console.warn('clearPersistedChannel failed:', e);
    }
  },










  /*** 2026-05-23 Channel Token */

  // ==============================================
  // 👇 调用你自己的 API：getChannelTokenByCode
  // 🔑 新增：每次成功获取后持久化到 localStorage
  //   这样 LRU 触发后 onLaunch 可以从 localStorage 秒级恢复，不用等 API 调用
  //   存储 keys:
  //     - 'active-channel-code': 最近一次成功的 channel code
  //     - 'active-channel-token': 最近一次成功的 channel token
  // ==============================================
  async getChannelToken(code) {

    // // 临时加入，测完删除
    // await new Promise(resolve => setTimeout(resolve, 3000));

    return new Promise((resolve) => {
      wx.request({
        url: `${config.production.API_URL}`,
        method: "POST",
        header: {
          "Content-Type": "application/json",
        },
        // 👇 直接用你给的 VSCode 查询！！！
        data: {
          query: `
            query TestChannelLookup($code: String!) {
              getChannelTokenByCode(code: $code) {
                id
                code
                token
              }
            }
          `,
          variables: {
            code: code
          }
        },
        success: (res) => {
          console.log("返回数据：", res.data);

          try {
            const token = res.data.data.getChannelTokenByCode.token;
            this.globalData.activeChannelToken = token;
            this.globalData.activeChannelCode = code;
            // 🔑 持久化到 localStorage（LRU 恢复用）
            try {
              wx.setStorageSync('active-channel-code', code);
              wx.setStorageSync('active-channel-token', token);
              console.log(`[getChannelToken] 持久化 channel: ${code}`);
            } catch (e) {
              console.warn('[getChannelToken] 持久化失败:', e);
            }
          } catch (e) {
            console.error("获取渠道失败");
          }

          resolve();
        },
        fail: () => {
          console.warn('[getChannelToken] API 调用失败，使用 lastChannelToken 兜底');
          // 🔑 兜底：用 lastChannelToken 顶替（如果 localStorage 里有）
          const lastToken = wx.getStorageSync('last-auth-channel-token');
          if (lastToken) {
            this.globalData.activeChannelToken = lastToken;
            this.globalData.activeChannelCode = code;
            console.log(`[getChannelToken] fail fallback: 用 last-auth-channel-token 顶替，code=${code}`);
          }
          resolve();
        },
      });
    });
  },


  async initAuthFlow() {
    const token = wx.getStorageSync('vendure-auth-token');
    const lastChannel = this.globalData.lastChannelToken;
    const currentChannel = this.globalData.activeChannelToken;

    // 🚨 核心防线：如果发现换渠道了，旧 Token 必须立刻销毁，绝不拿去 verify 避免污染！
    if (token && lastChannel !== currentChannel) {
      console.warn('【安全警报】检测到渠道切换！正在强制熔断并清理旧渠道 Token，防止跨渠道污染...');
      wx.removeStorageSync('vendure-auth-token');
      wx.removeStorageSync('last-auth-channel-code');
      wx.removeStorageSync('last-auth-channel-token');
      // 强制把 token 设为 null，直接跳过步骤1，逼他去走步骤2和3重新核销或判别
      return this.proceedToGetOpenId();
    }

    // ---- 步骤 1：本地有 Token 且渠道一致，才允许验证有效性 ----
    console.log('1 lastChannel -------------->', lastChannel)
    console.log('2 currentChannel --------------->>>>>>>>>', currentChannel)

    if (token) {
      console.log('【步骤 1】同渠道旧 Token ➡️ 正在验证有效性...');
      const isValid = await this.verifyToken(token);
      if (isValid) {
        this.setLoginStatus(true);
        return {
          isLogin: true,
          openid: wx.getStorageSync('openid')
        };
      }
      wx.removeStorageSync('vendure-auth-token');
    }

    return this.proceedToGetOpenId();
  },




  // 把原本步骤2和步骤3抽成一个干净的内部方法
  async proceedToGetOpenId() {
    // ---- 步骤 2 & 3 的原有代码放这里 ----
    const openid = await this.getWechatOpenId();
    if (!openid) return {
      isLogin: false
    };

    const isRegisteredUser = await this.checkAndLoginWithVendure(openid);

    if (isRegisteredUser) {
      // 🔑 记住：只要登录成功，就必须把当前的渠道标记死死锁住！
      wx.setStorageSync('last-auth-channel-code', this.globalData.activeChannelCode);
      wx.setStorageSync('last-auth-channel-token', this.globalData.activeChannelToken);
      this.globalData.lastChannelToken = this.globalData.activeChannelToken; // 同步写入内存
      this.setLoginStatus(true);
      return {
        isLogin: true,
        openid
      };
    } else {
      console.log('【渠道锁】纯净新用户，清空渠道历史痕迹，等待去注册页面落户...');
      wx.removeStorageSync('last-auth-channel-token');
      this.globalData.lastChannelToken = "";

      this.setLoginStatus(false);
      return {
        isLogin: false,
        openid
      };
    }
  },






  /*** 验证本地存储的令牌 */
  // 'vendure-token': this.globalData.activeChannelToken
  verifyToken(token) {
    return new Promise((resolve) => {
      wx.request({
        url: this.globalData.baseUrl,
        method: 'POST',
        header: {
          'Authorization': `Bearer ${token}`,
        },
        data: {
          query: `
            query CheckMe {
              me {
                id
                identifier
              }
            }
          `
        },
        success: (res) => {
          const me = res.data?.data?.me;
          resolve(!!me); // me 有数据返回 true，没有（或者为null）则返回 false
        },
        fail: () => {
          console.error('网络校验请求失败，默认 Token 失效');
          resolve(false);
        }
      });
    });
  },

  /*** 通过 FastAPI 或者缓存获取用户 OpenID */
  getWechatOpenId() {
    return new Promise((resolve) => {
      // 优先读取本地持久化缓存
      let myOpenId = wx.getStorageSync("openid");
      if (myOpenId) {
        this.globalData.openid = myOpenId;
        console.log("【OpenID】从本地 Storage 读取成功");
        return resolve(myOpenId);
      }

      // 本地没有，执行原生微信登录换取
      wx.login({
        success: (res) => {
          if (res.code) {
            console.log("1 微信临时 code 成功 -------->", res.code);
            wx.request({
              url: `${config.fastapiUrl}/api/checkYcgpLoginStatus`,
              method: 'POST',
              data: {
                code: res.code
              },
              success: (backendRes) => {
                const fetchedOpenid = backendRes.data?.openid;
                if (fetchedOpenid) {
                  console.log('2 FastAPI 换取 Openid 成功 --------->');
                  wx.setStorageSync('openid', fetchedOpenid);
                  this.globalData.openid = fetchedOpenid;

                  // 同步尝试获取用户的授权配置
                  wx.getSetting({
                    success: (settingRes) => {
                      this.globalData.userInfo = settingRes.authSetting;
                    }
                  });
                  resolve(fetchedOpenid);
                } else {
                  resolve(null);
                }
              },
              fail: (err) => {
                console.error('FastAPI 换取 Openid 接口网络请求失败:', err);
                resolve(null);
              }
            });
          } else {
            console.error('微信原生 wx.login 失败:', res.errMsg);
            resolve(null);
          }
        },
        fail: () => resolve(null)
      });
    });
  },

  /*** 向 Vendure 发起不带注册权限的静默登录校验 */
  checkAndLoginWithVendure(openid) {
    return new Promise((resolve) => {
      wx.request({
        url: this.globalData.baseUrl,
        method: 'POST',
        header: {
          'vendure-token': this.globalData.activeChannelToken
        },
        data: {
          query: `
            mutation CheckOrLogin($openId: String!) {
              authenticate(input: { wechat: { openId: $openId } }) {
                __typename
                ... on CurrentUser {
                  id
                }
                ... on InvalidCredentialsError {
                  errorCode
                  message
                }
              }
            }
          `,
          variables: {
            openId: openid
          }
        },
        success: (res) => {
          const authData = res.data?.data?.authenticate;
          const typeName = authData?.__typename;

          if (typeName === 'InvalidCredentialsError') {
            // 捕获到后端策略由于没有设置 signUp 抛出的凭证失效错误，确认为未注册
            resolve(false);
          } else if (typeName === 'CurrentUser' && authData?.id) {
            // 已有账号，登录成功，提取 Response Headers 里的全新 Vendure Token
            const token = res.header['vendure-auth-token'] || res.header['Vendure-Auth-Token'];
            if (token) {
              wx.setStorageSync('vendure-auth-token', token);
              resolve(true);
            } else {
              console.error('已通过鉴权，但 Response Header 中无 vendure-auth-token');
              resolve(false);
            }
          } else {
            resolve(false);
          }
        },
        fail: () => {
          console.error('请求 Vendure 身份校验网关故障');
          resolve(false);
        }
      });
    });
  },

  // ~~~~~~~~~~~ 系统工具初始化模块 ~~~~~~~~~~~

  initCloud() {
    // 关键：返回 Promise，让外部 await，确保 mycloud.init() 完成后再使用 app.cloud
    return new Promise((resolve) => {
      try {
        const mycloud = new wx.cloud.Cloud({
          resourceAppid: config.cloudAppId,
          resourceEnv: config.cloudEnvId
        });

        // 先把实例挂到 this.cloud（这样 page 里 !app.cloud 防御逻辑不会误判），
        // 但要靠 cloudInitPromise 来保证 init() 完成
        this.cloud = mycloud;

        mycloud.init().then(() => {
          console.log('共享云环境初始化成功 ✔');
          resolve();
        }).catch(err => {
          console.error('初始化共享云失败 ❌', err);
          // 即便 init 失败也要 resolve，避免页面永远卡住
          resolve();
        });
      } catch (e) {
        console.error('云开发模块发生异常', e);
        // 出错也要 resolve，避免阻塞 page
        resolve();
      }
    });
  },

  getSystemInfo() {
    try {
      const windowInfo = wx.getWindowInfo();
      this.globalData.windowHeight = windowInfo.windowHeight;
      this.globalData.windowWidth = windowInfo.windowWidth;
      this.globalData.safeAreaTop = windowInfo.safeArea.top;
    } catch (e) {
      console.error('获取设备屏幕尺寸失败', e);
    }
  },

  // ~~~~~~~~~~~~~~~~~~~~ 购物车核心数据驱动方法 ~~~~~~~~~~~~~~~~~~~~

  setCartItems(items) {
    this.globalData.cartItems = items;
    wx.setStorageSync('cart_items', items);
  },

  getCartItems() {
    if (this.globalData.cartItems.length === 0) {
      this.globalData.cartItems = wx.getStorageSync('cart_items') || [];
    }
    return this.globalData.cartItems;
  },

  addToCart(product, quantity = 1) {
    const cartItems = this.getCartItems();
    const existIndex = cartItems.findIndex(
      item => item.variantId === product.variantId
    );

    if (existIndex > -1) {
      cartItems[existIndex].quantity += quantity;
    } else {
      cartItems.push({
        ...product,
        quantity,
        selected: true,
      });
    }

    this.setCartItems(cartItems);
    return cartItems;
  },

  updateCartItemQuantity(variantId, quantity) {
    const cartItems = this.getCartItems();
    const index = cartItems.findIndex(item => item.variantId === variantId);

    if (index > -1) {
      if (quantity <= 0) {
        cartItems.splice(index, 1);
      } else {
        cartItems[index].quantity = quantity;
      }
      this.setCartItems(cartItems);
    }

    return cartItems;
  },

  removeFromCart(variantId) {
    return this.updateCartItemQuantity(variantId, 0);
  },

  clearCart() {
    this.setCartItems([]);
  },

  addItemToLocalCart(product, quantity = 1) {
    return this.addToCart(product, quantity);
  },

  async addItemToServerCart(variantId, quantity = 1) {
    const {
      graphqlClient
    } = require('./utils/api.js');

    const mutation = `
      mutation AddItemToOrder($productVariantId: ID!, $quantity: Int!) {
        addItemToOrder(productVariantId: $productVariantId, quantity: $quantity) {
          ... on Order {
            id
            state
            totalQuantity
          }
          ... on OrderLimitError {
            message
          }
          ... on InsufficientStockError {
            message
          }
        }
      }
    `;

    const result = await graphqlClient.mutate(mutation, {
      productVariantId: variantId,
      quantity: quantity,
    });

    if (result.addItemToOrder.message) {
      throw new Error(result.addItemToOrder.message);
    }

    return result.addItemToOrder;
  },

  getCartTotal() {
    const cartItems = this.getCartItems();
    return cartItems
      .filter(item => item.selected)
      .reduce((total, item) => {
        return total + (item.price * item.quantity);
      }, 0);
  },

  getCartCount() {
    const cartItems = this.getCartItems();
    return cartItems.length; // Count number of distinct items, not total quantity
  },

  initCartBadge() {
    const localItems = wx.getStorageSync('cart_items') || [];
    const localCount = localItems.length; // Count number of distinct items, not total quantity

    console.log('initCartBadge - 本地购物车数量:', localCount);

    if (localCount > 0) {
      wx.setTabBarBadge({
        index: 3,
        text: String(localCount),
      });
    }
  },

  updateCartBadge() {
    const cartCount = this.globalData.cartTotalCount || this.getCartCount();
    console.log('updateCartBadge - cartCount:', cartCount);
    if (cartCount > 0) {
      wx.setTabBarBadge({
        index: 3,
        text: String(cartCount),
      });
    } else {
      wx.removeTabBarBadge({
        index: 3,
      });
    }
  },

  updateMineInfo() {
    console.log('updateMineInfo -----');
  },

  async syncServerCartCount() {
    if (!this.globalData.isLogin) return;

    try {
      const {
        graphqlClient
      } = require('./utils/api.js');
      const query = `
        query GetActiveOrder {
          activeOrder {
            lines {
              id
            }
          }
        }
      `;
      const data = await graphqlClient.query(query);
      // console.log('syncServerCartCount - data:', data);
      if (data?.activeOrder?.lines) {
        this.globalData.cartTotalCount = data.activeOrder.lines.length; // Count number of distinct items
        this.updateCartBadge();
      } else {
        this.globalData.cartTotalCount = 0;
        this.updateCartBadge();
      }
    } catch (error) {
      console.error('同步服务器购物车数量失败:', error);
    }
  },

  async mergeLocalCartToServer() {
    if (!this.globalData.isLogin) {
      console.log('mergeLocalCartToServer - 用户未登录，跳过合并');
      return;
    }

    const localItems = wx.getStorageSync('cart_items') || [];
    if (localItems.length === 0) {
      console.log('mergeLocalCartToServer - 本地购物车为空，无需合并');
      return;
    }

    console.log(`mergeLocalCartToServer - 开始合并 ${localItems.length} 个本地商品到服务器`);

    try {
      const {
        graphqlClient
      } = require('./utils/api.js');

      for (const item of localItems) {
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
        await graphqlClient.mutate(mutation, {
          productVariantId: item.variantId,
          quantity: item.quantity,
        });
        console.log(`mergeLocalCartToServer - 已合并商品: ${item.variantId}`);
      }

      wx.removeStorageSync('cart_items');
      this.globalData.cartItems = [];

      await this.syncServerCartCount();
      console.log('mergeLocalCartToServer - 合并完成');
    } catch (error) {
      console.error('mergeLocalCartToServer - 合并失败:', error);
    }
  },

  setLoginStatus(isLogin) {
    const previousStatus = this.globalData.isLogin;
    this.globalData.isLogin = isLogin;

    if (isLogin && !previousStatus) {
      console.log('setLoginStatus - 登录状态从 false 变为 true，开始合并购物车');
      setTimeout(() => {
        this.mergeLocalCartToServer();
      }, 100);
    } else if (!isLogin && previousStatus) {
      console.log('setLoginStatus - 登录状态从 true 变为 false，显示本地购物车数量');
      this.initCartBadge();
    }
  },


});