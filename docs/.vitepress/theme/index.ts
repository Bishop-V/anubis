import type { Theme } from 'vitepress';
import DefaultTheme from 'vitepress/theme';
import { h } from 'vue';
import BeforeAfter from './before-after';
import './brand.css';

export default {
  extends: DefaultTheme,
  Layout: () => h(DefaultTheme.Layout, null, { 'home-hero-after': () => h(BeforeAfter) }),
} satisfies Theme;
