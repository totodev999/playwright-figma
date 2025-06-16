import { setContext as _setContext } from './utils';
import { htmlToFigma as _htmlToFigma } from './html-to-figma';

// 必要なら型定義やツリーシェイキング向けに名前を変えて取り込む
export function htmlToFigma() {
  // ここで DOM 操作して Figma 向けオブジェクトを返す
  const data = _htmlToFigma();
  console.log('_htmlToFigma', _htmlToFigma);
  return window.parent.postMessage({ type: 'RESULT', data });
}

export function setContext(win: Window) {
  _setContext(win);
}

// バンドルを読み込むだけでグローバルに公開する
(function () {
  // @ts-ignore
  window.htmlToFigma = htmlToFigma;
  // @ts-ignore
  window.setContext = setContext;

  // ★ ここで自動実行させる（必要ならtry-catchでエラー対策も推奨）
  try {
    htmlToFigma();
  } catch (e) {
    // エラーがあればconsoleに出す
    console.error('htmlToFigmaの自動実行エラー', e);
  }
})();
