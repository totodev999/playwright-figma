import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';
import * as fs from 'fs';
import * as path from 'path';

export const getFigmaData = async (html: string) => {
  const browser = await puppeteer.launch(
    process.env.NODE_ENV === 'production'
      ? {
          args: [
            '--disable-gpu',
            '--disable-dev-shm-usage',
            '--disable-setuid-sandbox',
            '--no-first-run',
            '--no-sandbox',
            '--no-zygote',
            '--single-process',
            "--proxy-server='direct://'",
            '--proxy-bypass-list=*',
            '--font-render-hinting=none',
          ],
          defaultViewport: chromium.defaultViewport,
          executablePath: await chromium.executablePath(),
          headless: chromium.headless,
        }
      : { headless: true, channel: 'chrome' }
  );

  const page = await browser.newPage();
  await page.setExtraHTTPHeaders({
    'Accept-Language': 'ja-JP',
  });

  await page.setContent(html, {
    waitUntil: ['domcontentloaded', 'networkidle2'],
  });

  const bundle = fs.readFileSync(
    path.join(__dirname, 'browser.bundle.js'),
    'utf-8'
  );

  await page.screenshot({ fullPage: true, path: './screen.jpeg' });

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
