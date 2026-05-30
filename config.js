const config = {

  fastapiUrl: "https://bkkapi.favor100.site",
  
  baseUrl: 'http://192.168.0.51:3000/shop-api',

  development: {
    API_URL: 'http://192.168.0.51:3000/shop-api',
    GRAPHQL_URL: 'http://192.168.0.51:3000',
  },

  production: {
    API_URL: 'http://192.168.0.51:3000/shop-api',
    GRAPHQL_URL: 'http://192.168.0.51:3000',
  },


  PAGE_SIZE: 10,
  FILTER_MODE: 'server',
  PAGE_REC_NUMBER: 12,
  PRODUCT_COLUMNS: 2,
  BANNER_INTERVAL: 10000,


  IMAGE_SIZES: {
    THUMBNAIL: '?w=200&h=200&format=webp',
    MEDIUM: '?w=400&h=400&format=webp',
    LARGE: '?w=800&h=800&format=webp',
  },


  avatarImg: "/static/images/get_avatar.png",
  cloudEnvId: "bkkschool-1304214433-4bo349633e7",
  cloudAppId: 'wx65ce07b8050f8ae4',


  hotSearch: [
    { keyword: 'Computer', count: 1005 },
    { keyword: 'Plants', count: 986 },
    { keyword: 'Camera', count: 854 },
    { keyword: 'Sports', count: 765 },
  ],

  banners: [
    {
      image: 'https://bkkschool-1304214433.cos.ap-guangzhou.myqcloud.com/1761471765660-618-15.jpg',
      title: '优涂工品',
      subtitle: '工业耗材B2B批量采购平台',
    },
    {
      image: 'https://bkkschool-1304214433.cos.ap-guangzhou.myqcloud.com/1761471828632-72-1.jpg',
      title: '正品保障',
      subtitle: '品牌授权 品质保证',
    },
    {
      image: 'https://bkkschool-1304214433.cos.ap-guangzhou.myqcloud.com/1769908625640-373-road26.jpg',
      title: '批量优惠',
      subtitle: '量大价优 采购无忧',
    },
  ],
  
};

module.exports = config;
