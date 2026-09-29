import type { Theme } from 'vitepress';
import DefaultTheme from 'vitepress/theme';
import { h } from 'vue';
import ScrollDemo from './scroll-demo';
import './brand.css';

export default {
  extends: DefaultTheme,
  Layout: () => h(DefaultTheme.Layout, null, { 'home-hero-after': () => h(ScrollDemo) }),
} satisfies Theme;
