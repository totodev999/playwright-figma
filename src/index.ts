import { chromium } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const getFigmaData = async (html: string) => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.setContent(html);

  const bundle = fs.readFileSync(
    path.join(__dirname, 'browser.bundle.js'),
    'utf-8'
  );

  await page.addScriptTag({ content: bundle });

  // 3) ページ内で setContext を呼び出す
  await page.evaluate(() => {
    console.log(window);
    // @ts-ignore
    window.setContext(window);
  });

  // ページ内で htmlToFigma() を呼び出し
  const layers = await page.evaluate(() => {
    // @ts-ignore
    return window.htmlToFigma('#root,#container');
  });

  await browser.close();

  fs.writeFileSync('./res.txt', JSON.stringify(layers, null, 2));

  return JSON.stringify(layers, null, 2);
};

getFigmaData(fs.readFileSync('./input.txt').toString());
