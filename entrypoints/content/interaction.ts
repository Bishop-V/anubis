import { createStore } from '@inglorious/store';

type SearchInteraction = {
  type: 'SearchInteraction';
  reveal: boolean;
  shown: Set<string>;
  filter?: string;
};

const SearchInteraction = {
  searched(state: SearchInteraction) {
    state.reveal = false;
    state.shown.clear();
    state.filter = undefined;
  },
  revealChanged(state: SearchInteraction, reveal: boolean) {
    state.reveal = reveal;
    if (!reveal) state.shown.clear();
  },
  resultsShown(state: SearchInteraction, urls: string[]) {
    for (const url of urls) state.shown.add(url);
  },
  filterChanged(state: SearchInteraction, filter?: string) {
    state.filter = filter;
  },
};

export function createSearchInteraction() {
  const search: SearchInteraction = { type: 'SearchInteraction', reveal: false, shown: new Set() };
  return createStore({ types: { SearchInteraction }, entities: { search } });
}
