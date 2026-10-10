import type { Theme } from 'vitepress';
import DefaultTheme from 'vitepress/theme';
import { h } from 'vue';
import HideDemo from './hide-demo';
import Home from './home';
import RankDemo from './rank-demo';
import './brand.css';

export default {
  extends: DefaultTheme,
  Layout: () => h(DefaultTheme.Layout, null, { 'home-hero-before': () => h(Home) }),
  enhanceApp({ app }) {
    app.component('HideDemo', HideDemo);
    app.component('RankDemo', RankDemo);
  },
} satisfies Theme;
