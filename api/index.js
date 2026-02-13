import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import chromium from '@sparticuz/chromium';

puppeteer.use(StealthPlugin());

const MOBILE_USER_AGENT = 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { action, query, url } = req.query;

  try {
    if (action === 'home') {
      const movies = await getHomePage();
      res.status(200).json({ success: true, data: movies });
    } else if (action === 'search') {
      if (!query) throw new Error('Query parameter required');
      const results = await searchMovies(query);
      res.status(200).json({ success: true, data: results });
    } else if (action === 'stream') {
      if (!url) throw new Error('URL parameter required');
      const stream = await getVideoStream(url);
      res.status(200).json({ success: true, data: stream });
    } else {
      res.status(400).json({ success: false, error: 'Invalid action' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

async function getBrowser() {
  return await puppeteer.launch({
    args: [
      ...chromium.args,
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--disable-gpu',
      '--single-process'
    ],
    defaultViewport: chromium.defaultViewport,
    executablePath: await chromium.executablePath(),
    headless: chromium.headless,
    ignoreHTTPSErrors: true,
  });
}

async function getHomePage() {
  const browser = await getBrowser();
  const page = await browser.newPage();
  
  await page.setUserAgent(MOBILE_USER_AGENT);
  await page.goto('https://www.4khotvideo.com', { 
    waitUntil: 'networkidle2',
    timeout: 30000 
  });

  const movies = await page.evaluate(() => {
    const items = document.querySelectorAll('.item, .post, article');
    return Array.from(items).slice(0, 20).map(el => {
      const link = el.querySelector('a');
      const img = el.querySelector('img');
      const title = el.querySelector('.title, h2, .entry-title');
      
      return {
        id: Math.random().toString(36).substr(2, 9),
        title: title?.innerText?.trim() || 'Unknown Title',
        url: link?.href || null,
        thumbnail: img?.src || img?.getAttribute('data-src') || 'https://via.placeholder.com/300x450?text=SAFLIX',
        type: 'movie'
      };
    }).filter(item => item.title !== 'Unknown Title' && item.url);
  });

  await browser.close();
  return movies;
}

async function searchMovies(query) {
  const browser = await getBrowser();
  const page = await browser.newPage();
  
  await page.setUserAgent(MOBILE_USER_AGENT);
  await page.goto(`https://www.4khotvideo.com/?s=${encodeURIComponent(query)}`, { 
    waitUntil: 'networkidle2',
    timeout: 30000
  });

  const results = await page.evaluate(() => {
    const items = document.querySelectorAll('.item, .post, article, .search-item');
    return Array.from(items).slice(0, 20).map(el => {
      const link = el.querySelector('a');
      const img = el.querySelector('img');
      const title = el.querySelector('.title, h2, h3, .entry-title');
      
      return {
        id: Math.random().toString(36).substr(2, 9),
        title: title?.innerText?.trim() || 'Unknown Title',
        url: link?.href || null,
        thumbnail: img?.src || img?.getAttribute('data-src') || 'https://via.placeholder.com/300x450?text=SAFLIX',
        type: 'movie'
      };
    }).filter(item => item.title !== 'Unknown Title' && item.url);
  });

  await browser.close();
  return results;
}

async function getVideoStream(videoPageUrl) {
  const browser = await getBrowser();
  const page = await browser.newPage();
  
  await page.setUserAgent(MOBILE_USER_AGENT);
  await page.goto(videoPageUrl, { 
    waitUntil: 'networkidle2',
    timeout: 30000
  });

  const streamData = await page.evaluate(() => {
    const video = document.querySelector('video source, iframe, .video-player, .player iframe, #player iframe, .embed iframe');
    const title = document.querySelector('h1, .video-title, .entry-title');
    const iframeSrc = document.querySelector('iframe')?.src;
    const videoSrc = document.querySelector('video source')?.src;
    
    return {
      streamUrl: videoSrc || iframeSrc || video?.src || null,
      title: title?.innerText?.trim() || 'Unknown Title',
      pageUrl: window.location.href
    };
  });

  await browser.close();
  return streamData;
}import