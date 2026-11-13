// 自动跑局脚本：node autoplay.js [good|bad]
const { chromium } = require('playwright');

(async () => {
  const mode = process.argv[2] || 'good';
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  page.on('pageerror', e => console.log('PAGE_ERROR:', e.message));
  await page.goto('file:///D:/2workspace/codex/trae-1024/last-mile-game/game.html');
  await page.waitForTimeout(600);
  await page.evaluate(() => startGame());
  if (process.argv[3]) { await page.evaluate(d => { selDiff(d); }, process.argv[3]); await page.evaluate(() => startGame()); }
  await page.waitForTimeout(300);

  // 1) 选停车点 + 选车
  await page.evaluate((mode) => {
    if (mode === 'good') {
      openCluster('P1');
      const c = CLUSTERS[0];
      selectBike(c.bikes.findIndex(b => b.state === 'good'));
    } else if (mode === 'chain') {
      let found = null;
      CLUSTERS.forEach(c => c.bikes.forEach((b, i) => { if (b.key === 'chain' && !found) found = { c, i }; }));
      if (!found) { openCluster('P3'); const c = CLUSTERS[2]; selectBike(c.bikes.findIndex(b => b.state !== 'good')); }
      else { openCluster(found.c.id); selectBike(found.i); }
    } else {
      openCluster('P3');
      const c = CLUSTERS[2];
      let i = c.bikes.findIndex(b => b.state === 'hidden');
      if (i < 0) i = c.bikes.findIndex(b => b.state !== 'good');
      selectBike(i);
    }
  }, mode);
  await page.waitForTimeout(300);
  const picked = await page.evaluate(() => {
    const c = CLUSTERS.find(x => x.id === curCluster);
    const b = c.bikes[selIdx];
    commit();
    return { cluster: c.id, state: b.state, def: b.def || null, key: b.key || null };
  });
  console.log('PICKED:', JSON.stringify(picked));
  await page.waitForTimeout(1700);
  await page.evaluate(() => { document.querySelector('#inspect .btn.main').click(); });

  // 2) 步行 → 开锁
  await page.waitForFunction(() => stage === 'unlock', null, { timeout: 20000 });
  for (let i = 0; i < 30; i++) {
    const st = await page.evaluate(() => ({
      stage,
      actions: !!document.querySelector('#unlockActions button'),
      pad: document.getElementById('padWrap').classList.contains('show'),
    }));
    if (st.stage === 'ride') break;
    if (st.pad) {
      await page.evaluate(() => {
        wipeSmudge();
        chosen.bike.tail.split('').forEach(d => keyIn(d));
      });
      await page.waitForTimeout(400);
      continue;
    }
    if (st.actions) { await page.evaluate(() => openPad()); await page.waitForTimeout(400); continue; }
    await page.waitForTimeout(400);
  }

  // 3) 骑行事件自动决策
  const seen = [];
  for (let i = 0; i < 400; i++) {
    const done = await page.evaluate(() => stage === 'end');
    if (done) break;
    const acted = await page.evaluate((mode) => {
      if (!evModal) return null;
      const box = document.getElementById('evBox');
      if (box.querySelector('.qte-big')) return 'qte-wait';
      const txt = box.textContent;
      if (txt.includes('红灯') && txt.includes('老老实实等')) { mode === 'good' ? doWait() : doRun(); return 'light'; }
      if (txt.includes('积水') && txt.includes('井盖')) { return mode === 'good' ? (obsPick('curb'), 'obs-curb') : 'obs-wait'; }
      if (txt.includes('雨点劈头盖脸')) { mode === 'good' ? rainCoat() : rainHard(); return 'rain'; }
      if (txt.includes('带我一程')) { mode === 'good' ? coTake() : coRefuse(); return 'coworker'; }
      if (txt.includes('小巷')) { mode === 'good' ? alleySafe() : alleyGo(); return 'alley'; }
      if (txt.includes('手机颠掉了')) { mode === 'good' ? phonePick() : phoneSkip(); return 'phone'; }
      if (txt.includes('洒水车')) { mode === 'good' ? sprSlow() : sprRush(); return 'sprinkler'; }
      if (txt.includes('下坡')) { mode === 'good' ? downCoast() : downDash(); return 'downhill'; }
      if (txt.includes('裤子都湿了')) { wetPaper(); return 'wet'; }
      if (txt.includes('链条掉了')) { chainEndure(); return 'chain'; }
      if (txt.includes('慢撒气')) { flatOk(); return 'flat'; }
      if (txt.includes('刹车捏到底')) { brakeFoot(); return 'brake'; }
      return 'unknown:' + txt.slice(0, 30);
    }, mode);
    if (acted === 'qte-wait') {
      if (mode === 'good') { await page.evaluate(() => qteOk()); seen.push('qte-ok'); }
      else { await page.waitForTimeout(2500); seen.push('qte-fail'); }
      continue;
    }
    if (acted === 'obs-wait') { await page.waitForTimeout(2700); seen.push('obs-fail'); continue; }
    if (acted) seen.push(acted);
    else if (mode === 'good') await page.evaluate(() => dash());  // 顺便压测猛蹬
    await page.waitForTimeout(300);
  }

  // 4) 结算
  await page.waitForFunction(() => stage === 'end', null, { timeout: 120000 });
  const end = await page.evaluate(() => ({
    t_left: Math.round(t), hp: Math.round(hp), mood: Math.round(mood),
    stats: { ...stats }, dist: Math.round(dist),
    title: document.querySelector('#endBox h2').textContent,
    stamp: document.querySelector('.stamp').textContent,
    clock: document.querySelector('.clockline b').textContent,
  }));
  console.log('EVENTS:', seen.join(','));
  console.log('END:', JSON.stringify(end, null, 2));
  await page.screenshot({ path: `screenshots/v7-autoplay-${mode}.png` });
  await browser.close();
})().catch(e => { console.error('FATAL', e); process.exit(1); });
