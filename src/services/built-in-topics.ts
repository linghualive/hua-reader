export interface BuiltInFeed {
  title: string;
  route: string;
}

export interface BuiltInTopic {
  name: string;
  icon: string;
  feeds: BuiltInFeed[];
}

export const BUILT_IN_TOPICS: BuiltInTopic[] = [
  {
    name: '财经',
    icon: 'cash-multiple',
    feeds: [
      { title: '36氪快讯', route: '/36kr/newsflashes' },
      { title: '36氪资讯', route: '/36kr/information/web_news' },
      { title: '华尔街见闻', route: '/wallstreetcn/news/global' },
      { title: '财新网', route: '/caixin/latest' },
      { title: '第一财经', route: '/yicai/brief' },
      { title: '东方财富研报', route: '/eastmoney/report/strategyreport' },
      { title: '格隆汇', route: '/gelonghui/live' },
    ],
  },
  {
    name: '科技',
    icon: 'chip',
    feeds: [
      { title: '少数派', route: '/sspai/index' },
      { title: '少数派 Matrix', route: '/sspai/matrix' },
      { title: 'IT之家', route: '/ithome/it' },
      { title: 'Solidot', route: '/solidot/www' },
      { title: '开源中国', route: '/oschina/news' },
      { title: '虎嗅', route: '/huxiu/article' },
      { title: 'Readhub', route: '/readhub/topic' },
    ],
  },
  {
    name: '热榜',
    icon: 'fire',
    feeds: [
      { title: '知乎热榜', route: '/zhihu/hot' },
      { title: '知乎日报', route: '/zhihu/daily' },
      { title: '豆瓣正在上映', route: '/douban/movie/playing' },
    ],
  },
  {
    name: '新闻',
    icon: 'newspaper-variant-outline',
    feeds: [
      { title: '澎湃新闻', route: '/thepaper/featured' },
      { title: '南方周末', route: '/infzm/1' },
      { title: '36氪资讯', route: '/36kr/information/web_news' },
    ],
  },
  {
    name: '加密货币',
    icon: 'bitcoin',
    feeds: [
      { title: '金色财经', route: '/jinse/lives' },
    ],
  },
  {
    name: '创投',
    icon: 'rocket-launch',
    feeds: [
      { title: '36氪创投', route: '/36kr/newsflashes' },
      { title: '虎嗅', route: '/huxiu/article' },
      { title: '格隆汇', route: '/gelonghui/live' },
    ],
  },
  {
    name: '影视娱乐',
    icon: 'movie-open',
    feeds: [
      { title: '豆瓣正在上映', route: '/douban/movie/playing' },
      { title: '豆瓣新书速递', route: '/douban/book/latest' },
    ],
  },
  {
    name: '知识社区',
    icon: 'forum',
    feeds: [
      { title: '知乎热榜', route: '/zhihu/hot' },
      { title: '知乎日报', route: '/zhihu/daily' },
      { title: '少数派', route: '/sspai/index' },
      { title: 'Readhub', route: '/readhub/topic' },
    ],
  },
  {
    name: '国际',
    icon: 'earth',
    feeds: [
      { title: '华尔街见闻', route: '/wallstreetcn/news/global' },
      { title: '澎湃新闻', route: '/thepaper/featured' },
      { title: '南方周末', route: '/infzm/1' },
    ],
  },
  {
    name: '开发者',
    icon: 'code-braces',
    feeds: [
      { title: '开源中国', route: '/oschina/news' },
      { title: 'Solidot', route: '/solidot/www' },
      { title: 'Readhub', route: '/readhub/topic' },
      { title: 'IT之家', route: '/ithome/it' },
    ],
  },
];

export const DEFAULT_RSSHUB_URL = 'http://linghua.icu:1200';
