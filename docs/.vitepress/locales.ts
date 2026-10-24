import { REPO_URL as repo } from '../../utils/links';

// The wiki in other languages: the home page and the guide, in docs/<folder>/. Pages
// for people who publish lists or work on Anubis (the lists directory, the list
// format, the subscribe page, and the experiments) stay in English, so the links to
// them lead to the English pages and say so. Every translation is a machine one and
// says so in its footer. utils/links.ts (WIKI_FOLDERS) tells the extension which of
// its languages have one.

interface Words {
  label: string;
  lang: string;
  description: string;
  /** Nav and sidebar, "(in English)" included where a page is English. */
  wiki: string;
  lists: string;
  listFormat: string;
  privacy: string;
  startHere: string;
  introduction: string;
  gettingStarted: string;
  using: string;
  ranking: string;
  tags: string;
  subscribing: string;
  panels: string;
  more: string;
  moving: string;
  sync: string;
  publishing: string;
  publish: string;
  directory: string;
  help: string;
  involved: string;
  engines: string;
  privacyFull: string;
  troubleshooting: string;
  translate: string;
  experiments: string;
  contributing: string;
  developing: string;
  editLink: string;
  outline: string;
  footer: string;
  prev: string;
  next: string;
  lastUpdated: string;
  langMenu: string;
  top: string;
  menu: string;
  appearance: string;
  toLight: string;
  toDark: string;
  skip: string;
  search: {
    button: string;
    details: string;
    reset: string;
    back: string;
    none: string;
    select: string;
    navigate: string;
    up: string;
    down: string;
    close: string;
  };
}

function nav(p: string, w: Words) {
  return [
    { text: 'Wiki', link: `${p}/guide/introduction`, activeMatch: `^${p}/guide/(?!privacy)` },
    { text: w.lists, link: '/lists' },
    { text: w.listFormat, link: '/list-format' },
    { text: w.privacy, link: `${p}/guide/privacy` },
  ];
}

function sidebar(p: string, w: Words) {
  return [
    {
      text: w.startHere,
      items: [
        { text: w.introduction, link: `${p}/guide/introduction` },
        { text: w.gettingStarted, link: `${p}/guide/getting-started` },
      ],
    },
    {
      text: w.using,
      items: [
        { text: w.ranking, link: `${p}/guide/ranking` },
        { text: w.tags, link: `${p}/guide/tags` },
        { text: w.subscribing, link: `${p}/guide/lists` },
        { text: w.panels, link: `${p}/guide/clean-up` },
        { text: w.more, link: `${p}/guide/more-results` },
        { text: w.moving, link: `${p}/guide/import-and-backup` },
        { text: w.sync, link: `${p}/guide/sync` },
      ],
    },
    {
      text: w.help,
      items: [
        { text: w.troubleshooting, link: `${p}/guide/troubleshooting` },
        { text: w.engines, link: `${p}/guide/search-engines` },
        { text: w.privacyFull, link: `${p}/guide/privacy` },
      ],
    },
    {
      text: w.publishing,
      items: [
        { text: w.publish, link: `${p}/guide/publish-a-list` },
        { text: w.listFormat, link: '/list-format' },
        { text: w.directory, link: '/lists' },
      ],
    },
    {
      text: w.involved,
      items: [
        { text: w.translate, link: `${p}/guide/translate` },
        { text: w.contributing, link: `${repo}/blob/main/CONTRIBUTING.md` },
        { text: w.developing, link: `${repo}/blob/main/DEVELOPMENT.md` },
        { text: w.experiments, link: '/experiments' },
      ],
    },
  ];
}

function locale(folder: string, w: Words) {
  const p = `/${folder}`;
  return {
    label: w.label,
    lang: w.lang,
    link: `${p}/`,
    description: w.description,
    themeConfig: {
      nav: nav(p, w),
      sidebar: sidebar(p, w),
      editLink: { pattern: `${repo}/edit/main/docs/:path`, text: w.editLink },
      outline: { level: [2, 3] as [number, number], label: w.outline },
      footer: { message: w.footer },
      docFooter: { prev: w.prev, next: w.next },
      lastUpdated: { text: w.lastUpdated },
      langMenuLabel: w.langMenu,
      returnToTopLabel: w.top,
      sidebarMenuLabel: w.menu,
      darkModeSwitchLabel: w.appearance,
      lightModeSwitchTitle: w.toLight,
      darkModeSwitchTitle: w.toDark,
      skipToContentLabel: w.skip,
    },
  };
}

function searchWords(s: Words['search']) {
  return {
    translations: {
      button: { buttonText: s.button, buttonAriaLabel: s.button },
      modal: {
        displayDetails: s.details,
        resetButtonTitle: s.reset,
        backButtonTitle: s.back,
        noResultsText: s.none,
        footer: {
          selectText: s.select,
          selectKeyAriaLabel: 'enter',
          navigateText: s.navigate,
          navigateUpKeyAriaLabel: s.up,
          navigateDownKeyAriaLabel: s.down,
          closeText: s.close,
          closeKeyAriaLabel: 'esc',
        },
      },
    },
  };
}

const vi: Words = {
  label: 'Tiếng Việt',
  lang: 'vi',
  description: 'Tiện ích mở rộng trình duyệt để ẩn, xếp hạng và gắn nhãn kết quả tìm kiếm, với các danh sách ai cũng có thể xuất bản.',
  wiki: 'Wiki',
  lists: 'Danh sách (tiếng Anh)',
  listFormat: 'Định dạng danh sách (tiếng Anh)',
  privacy: 'Quyền riêng tư',
  startHere: 'Bắt đầu',
  introduction: 'Giới thiệu',
  gettingStarted: 'Bắt đầu',
  using: 'Dùng Anubis',
  ranking: 'Xếp hạng trang web',
  tags: 'Nhãn',
  subscribing: 'Đăng ký danh sách',
  panels: 'Gỡ khung',
  more: 'Tải thêm kết quả',
  moving: 'Chuyển từ công cụ khác',
  sync: 'Đồng bộ hóa giữa các máy tính',
  publishing: 'Xuất bản danh sách',
  publish: 'Xuất bản danh sách',
  directory: 'Thư mục danh sách (tiếng Anh)',
  help: 'Trợ giúp',
  involved: 'Tham gia',
  engines: 'Công cụ tìm kiếm',
  privacyFull: 'Quyền riêng tư và quyền hạn',
  troubleshooting: 'Khắc phục sự cố',
  translate: 'Giúp dịch',
  experiments: 'Thử nghiệm và quyết định (tiếng Anh)',
  contributing: 'Đóng góp (tiếng Anh)',
  developing: 'Phát triển Anubis (tiếng Anh)',
  editLink: 'Sửa trang này trên GitHub',
  outline: 'Trên trang này',
  footer: 'Phát hành theo GNU AGPL v3. Bản dịch máy, chưa được người nói tiếng Việt kiểm tra.',
  prev: 'Trang trước',
  next: 'Trang sau',
  lastUpdated: 'Cập nhật lần cuối',
  langMenu: 'Đổi ngôn ngữ',
  top: 'Về đầu trang',
  menu: 'Menu',
  appearance: 'Giao diện',
  toLight: 'Chuyển sang giao diện sáng',
  toDark: 'Chuyển sang giao diện tối',
  skip: 'Chuyển đến nội dung',
  search: {
    button: 'Tìm kiếm',
    details: 'Hiện chi tiết',
    reset: 'Xóa tìm kiếm',
    back: 'Đóng tìm kiếm',
    none: 'Không có kết quả cho',
    select: 'chọn',
    navigate: 'di chuyển',
    up: 'mũi tên lên',
    down: 'mũi tên xuống',
    close: 'đóng',
  },
};

const de: Words = {
  label: 'Deutsch',
  lang: 'de',
  description: 'Eine Browser-Erweiterung, die Suchergebnisse ausblendet, einstuft und mit Tags versieht, mit Listen, die jeder veröffentlichen kann.',
  wiki: 'Wiki',
  lists: 'Listen (auf Englisch)',
  listFormat: 'Listenformat (auf Englisch)',
  privacy: 'Datenschutz',
  startHere: 'Einstieg',
  introduction: 'Einführung',
  gettingStarted: 'Erste Schritte',
  using: 'Anubis verwenden',
  ranking: 'Websites einstufen',
  tags: 'Tags',
  subscribing: 'Listen abonnieren',
  panels: 'Bereiche entfernen',
  more: 'Mehr Ergebnisse laden',
  moving: 'Von anderen Werkzeugen umziehen',
  sync: 'Zwischen Computern synchronisieren',
  publishing: 'Listen veröffentlichen',
  publish: 'Eine Liste veröffentlichen',
  directory: 'Listenverzeichnis (auf Englisch)',
  help: 'Hilfe',
  involved: 'Mitmachen',
  engines: 'Suchmaschinen',
  privacyFull: 'Datenschutz und Berechtigungen',
  troubleshooting: 'Fehlerbehebung',
  translate: 'Bei der Übersetzung helfen',
  experiments: 'Experimente und Entscheidungen (auf Englisch)',
  contributing: 'Mitwirken (auf Englisch)',
  developing: 'Anubis entwickeln (auf Englisch)',
  editLink: 'Diese Seite auf GitHub bearbeiten',
  outline: 'Auf dieser Seite',
  footer: 'Veröffentlicht unter der GNU AGPL v3. Maschinelle Übersetzung, noch nicht von Muttersprachlern geprüft.',
  prev: 'Vorherige Seite',
  next: 'Nächste Seite',
  lastUpdated: 'Zuletzt aktualisiert',
  langMenu: 'Sprache ändern',
  top: 'Zurück nach oben',
  menu: 'Menü',
  appearance: 'Erscheinungsbild',
  toLight: 'Zum hellen Design wechseln',
  toDark: 'Zum dunklen Design wechseln',
  skip: 'Zum Inhalt springen',
  search: {
    button: 'Suchen',
    details: 'Details anzeigen',
    reset: 'Suche zurücksetzen',
    back: 'Suche schließen',
    none: 'Keine Ergebnisse für',
    select: 'auswählen',
    navigate: 'navigieren',
    up: 'Pfeil nach oben',
    down: 'Pfeil nach unten',
    close: 'schließen',
  },
};

const zhCN: Words = {
  label: '简体中文',
  lang: 'zh-CN',
  description: '一款浏览器扩展，用来隐藏、排名和标记搜索结果，并支持任何人都能发布的列表。',
  wiki: 'Wiki',
  lists: '列表（英文）',
  listFormat: '列表格式（英文）',
  privacy: '隐私',
  startHere: '从这里开始',
  introduction: '简介',
  gettingStarted: '开始使用',
  using: '使用 Anubis',
  ranking: '为网站排名',
  tags: '标签',
  subscribing: '订阅列表',
  panels: '移除面板',
  more: '加载更多结果',
  moving: '从其他工具迁移',
  sync: '在多台电脑间同步',
  publishing: '发布列表',
  publish: '发布列表',
  directory: '列表目录（英文）',
  help: '帮助',
  involved: '参与',
  engines: '搜索引擎',
  privacyFull: '隐私与权限',
  troubleshooting: '疑难解答',
  translate: '帮助翻译',
  experiments: '实验与决定（英文）',
  contributing: '参与贡献（英文）',
  developing: '开发 Anubis（英文）',
  editLink: '在 GitHub 上编辑此页',
  outline: '本页内容',
  footer: '以 GNU AGPL v3 发布。机器翻译，尚未由中文母语者校对。',
  prev: '上一页',
  next: '下一页',
  lastUpdated: '最后更新',
  langMenu: '切换语言',
  top: '返回顶部',
  menu: '菜单',
  appearance: '外观',
  toLight: '切换到浅色模式',
  toDark: '切换到深色模式',
  skip: '跳到正文',
  search: {
    button: '搜索',
    details: '显示详情',
    reset: '清除搜索',
    back: '关闭搜索',
    none: '没有找到相关结果：',
    select: '选择',
    navigate: '切换',
    up: '向上箭头',
    down: '向下箭头',
    close: '关闭',
  },
};

const zhTW: Words = {
  label: '繁體中文',
  lang: 'zh-TW',
  description: '一款瀏覽器擴充功能，用來隱藏、排名和標記搜尋結果，並支援任何人都能發布的清單。',
  wiki: 'Wiki',
  lists: '清單（英文）',
  listFormat: '清單格式（英文）',
  privacy: '隱私',
  startHere: '從這裡開始',
  introduction: '簡介',
  gettingStarted: '開始使用',
  using: '使用 Anubis',
  ranking: '為網站排名',
  tags: '標籤',
  subscribing: '訂閱清單',
  panels: '移除面板',
  more: '載入更多結果',
  moving: '從其他工具移轉',
  sync: '在多部電腦間同步',
  publishing: '發布清單',
  publish: '發布清單',
  directory: '清單目錄（英文）',
  help: '說明',
  involved: '參與',
  engines: '搜尋引擎',
  privacyFull: '隱私與權限',
  troubleshooting: '疑難排解',
  translate: '協助翻譯',
  experiments: '實驗與決定（英文）',
  contributing: '參與貢獻（英文）',
  developing: '開發 Anubis（英文）',
  editLink: '在 GitHub 上編輯此頁',
  outline: '本頁內容',
  footer: '以 GNU AGPL v3 發布。機器翻譯，尚未由中文母語者校對。',
  prev: '上一頁',
  next: '下一頁',
  lastUpdated: '最後更新',
  langMenu: '切換語言',
  top: '回到頂端',
  menu: '選單',
  appearance: '外觀',
  toLight: '切換至淺色模式',
  toDark: '切換至深色模式',
  skip: '跳到內文',
  search: {
    button: '搜尋',
    details: '顯示詳細資料',
    reset: '清除搜尋',
    back: '關閉搜尋',
    none: '找不到相關結果：',
    select: '選取',
    navigate: '切換',
    up: '向上鍵',
    down: '向下鍵',
    close: '關閉',
  },
};

// The key is the folder in docs/ (and the path on the site), as in WIKI_FOLDERS.
const LANGUAGES: Record<string, Words> = { vi, de, 'zh-cn': zhCN, 'zh-tw': zhTW };

export const translatedLocales = Object.fromEntries(Object.entries(LANGUAGES).map(([folder, w]) => [folder, locale(folder, w)]));

export const searchLocales = Object.fromEntries(Object.entries(LANGUAGES).map(([folder, w]) => [folder, searchWords(w.search)]));
