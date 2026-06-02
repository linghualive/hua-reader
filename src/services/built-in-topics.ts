export interface BuiltInFeed {
  title: string;
  route: string;
  type?: 'rsshub' | 'native';
}

export interface BuiltInTopic {
  name: string;
  icon: string;
  feeds: BuiltInFeed[];
}

export const BUILT_IN_TOPICS: BuiltInTopic[] = [
  {
    name: '热点时事',
    icon: 'fire',
    feeds: [
      { title: '知乎热榜', route: '/zhihu/hot' },
      { title: '知乎日报', route: '/zhihu/daily' },
      { title: '澎湃新闻', route: '/thepaper/featured' },
      { title: 'Readhub 热门', route: '/readhub/topic' },
      { title: 'V2EX 热门', route: '/v2ex/topics/hot' },
    ],
  },
  {
    name: '财经商业',
    icon: 'cash-multiple',
    feeds: [
      { title: '36氪快讯', route: '/36kr/newsflashes' },
      { title: '36氪深度', route: '/36kr/information/web_news' },
      { title: '华尔街见闻', route: '/wallstreetcn/news/global' },
      { title: '财新网', route: '/caixin/latest' },
      { title: '虎嗅', route: '/huxiu/article' },
      { title: '东方财富研报', route: '/eastmoney/report/strategyreport' },
      { title: '格隆汇', route: '/gelonghui/live' },
      { title: '创业邦', route: '/cyzone/news' },
      { title: 'Stratechery', route: 'https://stratechery.com/feed/', type: 'native' },
    ],
  },
  {
    name: '科技前沿',
    icon: 'chip',
    feeds: [
      { title: '少数派', route: 'https://sspai.com/feed', type: 'native' },
      { title: 'IT之家', route: '/ithome/it' },
      { title: 'Solidot', route: '/solidot/www' },
      { title: '开源中国', route: '/oschina/news' },
      { title: '果壳科学', route: '/guokr/scientific' },
      { title: 'The Verge', route: 'https://www.theverge.com/rss/index.xml', type: 'native' },
      { title: 'Ars Technica', route: 'https://feeds.arstechnica.com/arstechnica/index', type: 'native' },
      { title: 'TechCrunch', route: 'https://techcrunch.com/feed/', type: 'native' },
      { title: 'Product Hunt', route: 'https://www.producthunt.com/feed', type: 'native' },
    ],
  },
  {
    name: '深度阅读',
    icon: 'book-open-variant',
    feeds: [
      { title: '南方周末', route: '/infzm/1' },
      { title: '阮一峰的博客', route: 'https://feeds.feedburner.com/ruanyifeng', type: 'native' },
      { title: '酷壳', route: 'https://coolshell.cn/feed', type: 'native' },
      { title: '得到精选', route: '/dedao/list/年度日更' },
      { title: 'Wait But Why', route: 'https://waitbutwhy.com/feed', type: 'native' },
      { title: 'Paul Graham', route: 'https://paulgraham.com/rss.html', type: 'native' },
      { title: 'MIT Technology Review', route: 'https://www.technologyreview.com/feed/', type: 'native' },
    ],
  },
  {
    name: '全球新闻',
    icon: 'earth',
    feeds: [
      { title: 'BBC World News', route: 'https://feeds.bbci.co.uk/news/world/rss.xml', type: 'native' },
      { title: 'New York Times', route: 'https://rss.nytimes.com/services/xml/rss/nyt/World.xml', type: 'native' },
      { title: 'Google News', route: 'https://blog.google/rss/', type: 'native' },
      { title: 'IEEE Spectrum', route: 'https://spectrum.ieee.org/feeds/feed.rss', type: 'native' },
    ],
  },
  {
    name: '开发者',
    icon: 'code-braces',
    feeds: [
      { title: 'Hacker News', route: 'https://hnrss.org/frontpage', type: 'native' },
      { title: 'Lobsters', route: 'https://lobste.rs/rss', type: 'native' },
      { title: 'Dev.to', route: 'https://dev.to/feed', type: 'native' },
      { title: 'GitHub Blog', route: 'https://github.blog/feed/', type: 'native' },
      { title: 'Cloudflare Blog', route: 'https://blog.cloudflare.com/rss/', type: 'native' },
      { title: 'Netflix Tech Blog', route: 'https://netflixtechblog.com/feed', type: 'native' },
      { title: 'Meta Engineering', route: 'https://engineering.fb.com/feed/', type: 'native' },
      { title: 'Hacker News 精选', route: '/hackernews/best' },
    ],
  },
  {
    name: 'AI 前沿',
    icon: 'robot',
    feeds: [
      { title: 'MIT Technology Review', route: 'https://www.technologyreview.com/feed/', type: 'native' },
      { title: 'Google AI Blog', route: 'https://blog.google/rss/', type: 'native' },
      { title: 'The Verge', route: 'https://www.theverge.com/rss/index.xml', type: 'native' },
      { title: '果壳科学', route: '/guokr/scientific' },
      { title: 'IEEE Spectrum', route: 'https://spectrum.ieee.org/feeds/feed.rss', type: 'native' },
    ],
  },
  {
    name: '加密货币',
    icon: 'bitcoin',
    feeds: [
      { title: '金色财经', route: '/jinse/lives' },
      { title: '36氪快讯', route: '/36kr/newsflashes' },
    ],
  },
];

export const DEFAULT_RSSHUB_URL = 'http://linghua.icu:1200';
