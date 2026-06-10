// https://yt.favor100.site

const config = {

  fastapiUrl: "https://bkkapi.favor100.site",
  
  baseUrl: 'https://yt.favor100.site/shop-api',

  development: {
    API_URL: 'https://yt.favor100.site/shop-api',
    GRAPHQL_URL: 'https://yt.favor100.site',
  },

  production: {
    API_URL: 'https://yt.favor100.site/shop-api',
    GRAPHQL_URL: 'https://yt.favor100.site',
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
    { keyword: '通用工业粉末', count: 1005 },
    { keyword: '绝缘粉末', count: 986 },
    { keyword: '重防腐粉末', count: 854 },
    { keyword: '环氧粉末', count: 765 },
    { keyword: '聚酯粉末', count: 612 },
  ],

  banners: [
    {
      image: 'https://bkkschool-1304214433.cos.ap-guangzhou.myqcloud.com/1761471765660-618-15.jpg',
      title: '优涂工品',
      subtitle: '绮一舟粉末采购平台',
    },
    {
      image: 'https://bkkschool-1304214433.cos.ap-guangzhou.myqcloud.com/1761471828632-72-1.jpg',
      title: '品质保证', 
      subtitle: '优异性能 质量稳定',
    },
    // {
    //   image: 'https://bkkschool-1304214433.cos.ap-guangzhou.myqcloud.com/1769908625640-373-road26.jpg',
    //   title: '批量优惠',
    //   subtitle: '量大价优 采购无忧',
    // },
  ],
  
};

module.exports = config;
