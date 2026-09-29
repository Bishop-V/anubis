import type { Theme } from 'vitepress';
import DefaultTheme from 'vitepress/theme';
import { h } from 'vue';
import HideDemo from './hide-demo';
import Home from './home';
import './brand.css';

export default {
  extends: DefaultTheme,
  Layout: () => h(DefaultTheme.Layout, null, { 'home-hero-before': () => h(Home) }),
  enhanceApp({ app }) {
    app.component('HideDemo', HideDemo);
  },
} satisfies Theme;
