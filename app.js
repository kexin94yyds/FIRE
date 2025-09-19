(function () {
  'use strict';

  function formatNumber(value, fractionDigits) {
    if (Number.isNaN(value) || !Number.isFinite(value)) return '—';
    try {
      return new Intl.NumberFormat('zh-CN', {
        minimumFractionDigits: fractionDigits,
        maximumFractionDigits: fractionDigits
      }).format(value);
    } catch (_) {
      return String(value.toFixed(fractionDigits));
    }
  }

  function parseNumber(value) {
    if (!value || value === '') return 0;
    // 移除逗号和其他非数字字符（除了小数点和负号）
    const cleanValue = String(value).replace(/[^\d.-]/g, '');
    const parsed = Number(cleanValue);
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  // 将数值写入 <input type="number">，不使用千位分隔，避免浏览器判定为无效
  function setNumberInputValue(inputEl, value, fractionDigits) {
    if (!inputEl) return;
    if (Number.isNaN(value) || !Number.isFinite(value)) return;
    try {
      inputEl.value = String(Number(value).toFixed(fractionDigits));
    } catch (_) {
      // 兜底：直接转字符串
      inputEl.value = String(value);
    }
  }


  function $(id) { return document.getElementById(id); }


  let selectedCoin = { symbol: 'BTC', cg: 'bitcoin', binance: 'BTCUSDT' };

  function getSelectedCoinMeta() {
    return selectedCoin;
  }

  function updateCoinUi() {
    const coin = getSelectedCoinMeta();
    const btn = $("btn_fetch_market");
    if (btn) btn.textContent = `一键获取 ${coin.symbol}/USD 与汇率`;
    
    // 更新币种选择按钮状态
    document.querySelectorAll('.coin-btn-expanded').forEach(btn => {
      btn.classList.remove('active');
      if (btn.dataset.coin === coin.symbol) {
        btn.classList.add('active');
      }
    });
    
    // 更新选中币种行的标签
    const labelEl = $("selected-coin-label");
    if (labelEl) labelEl.textContent = coin.symbol;
    
    // 更新选择币种显示
    const displayEl = $("selected-coin-display");
    if (displayEl) displayEl.textContent = coin.symbol;

    // 更新价格设置里的币种标签
    const priceCoinLabel = $("label_price_coin");
    if (priceCoinLabel) priceCoinLabel.textContent = coin.symbol;
  }

  function toggleCoinSelection() {
    const expanded = $("coin-selection-expanded");
    const trigger = $("coin-selection-trigger");
    
    if (expanded.style.display === "none") {
      expanded.style.display = "block";
      trigger.classList.add("expanded");
    } else {
      expanded.style.display = "none";
      trigger.classList.remove("expanded");
    }
  }

  async function fetchMarket() {
    const statusEl = $("market_status");
    statusEl.textContent = "正在获取市场数据…";

    async function getJSON(url) {
      try {
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), 8000);
        const res = await fetch(url, { signal: ctrl.signal });
        clearTimeout(t);
        if (!res.ok) throw new Error(String(res.status));
        return await res.json();
      } catch (_) { return null; }
    }

    const coin = getSelectedCoinMeta();
    const symbol = coin.symbol;
    // Try multiple coin/USD sources, prefer Coingecko (CORS 开放)
    let coinUsd = 0;
    const cors = 'https://cors.isomorphic-git.org/';
    const btcSources = [
      // Coingecko Simple Price
      async () => {
        const data = await getJSON(`https://api.coingecko.com/api/v3/simple/price?ids=${coin.cg}&vs_currencies=usd`);
        return data && data[coin.cg] && data[coin.cg].usd ? Number(data[coin.cg].usd) : 0;
      },
      async () => {
        const data = await getJSON(`${cors}https://api.coingecko.com/api/v3/simple/price?ids=${coin.cg}&vs_currencies=usd`);
        return data && data[coin.cg] && data[coin.cg].usd ? Number(data[coin.cg].usd) : 0;
      },
      // Binance 现货价格
      async () => {
        const data = await getJSON(`https://api.binance.com/api/v3/ticker/price?symbol=${coin.binance}`);
        return data && data.price ? Number(data.price) : 0;
      },
      async () => {
        const data = await getJSON(`${cors}https://api.binance.com/api/v3/ticker/price?symbol=${coin.binance}`);
        return data && data.price ? Number(data.price) : 0;
      },
      // Coindesk 作为备用
      async () => {
        if (symbol !== 'BTC') return 0; // Coindesk 仅 BTC
        const data = await getJSON('https://api.coindesk.com/v1/bpi/currentprice/USD.json');
        return data && data.bpi && data.bpi.USD && data.bpi.USD.rate_float ? Number(data.bpi.USD.rate_float) : 0;
      },
      async () => {
        if (symbol !== 'BTC') return 0;
        const data = await getJSON(`${cors}https://api.coindesk.com/v1/bpi/currentprice/USD.json`);
        return data && data.bpi && data.bpi.USD && data.bpi.USD.rate_float ? Number(data.bpi.USD.rate_float) : 0;
      }
    ];
    for (const fn of btcSources) {
      coinUsd = await fn();
      if (coinUsd && Number.isFinite(coinUsd)) break;
    }

    // Try multiple FX sources USD->CNY
    let usdCny = 0;
    const fxSources = [
      async () => {
        const data = await getJSON('https://api.exchangerate.host/latest?base=USD&symbols=CNY');
        return data && data.rates && data.rates.CNY ? Number(data.rates.CNY) : 0;
      },
      async () => {
        const data = await getJSON(`${cors}https://api.exchangerate.host/latest?base=USD&symbols=CNY`);
        return data && data.rates && data.rates.CNY ? Number(data.rates.CNY) : 0;
      },
      async () => {
        const data = await getJSON('https://api.frankfurter.app/latest?from=USD&to=CNY');
        return data && data.rates && data.rates.CNY ? Number(data.rates.CNY) : 0;
      },
      async () => {
        const data = await getJSON(`${cors}https://api.frankfurter.app/latest?from=USD&to=CNY`);
        return data && data.rates && data.rates.CNY ? Number(data.rates.CNY) : 0;
      }
    ];
    for (const fn of fxSources) {
      usdCny = await fn();
      if (usdCny && Number.isFinite(usdCny)) break;
    }

    // Write back to inputs if fetched
    if (coinUsd > 0) { $("price_btc_usd").value = String(coinUsd.toFixed(2)); }
    if (usdCny > 0) { $("rate_usd_cny").value = String(usdCny.toFixed(4)); }

     // Update status and trigger calc
     if (coinUsd > 0 || usdCny > 0) {
       const parts = [];
       if (coinUsd > 0) parts.push(`${symbol}/USD ${coinUsd.toFixed(2)}`);
       if (usdCny > 0) parts.push(`USD/CNY ${usdCny.toFixed(4)}`);
       statusEl.textContent = `已更新：${parts.join(' · ')}`;
       
       // 获取汇率后，检查所有输入框并计算换算
       calculateAllConversions();
       statusEl.textContent += " - 已更新所有换算结果";
     } else {
       statusEl.textContent = "未能获取（可能被浏览器或接口拦截），请手动填写";
       // 即使获取失败，也尝试进行换算（使用已有的价格数据）
       calculateAllConversions();
     }
  }

  // 简化的换算逻辑
  function calculateAllConversions() {
    // 获取所有价格数据
    const coinUsd = parseNumber($("price_btc_usd").value);
    const usdCny = parseNumber($("rate_usd_cny").value);
    const riceCny = parseNumber($("price_rice_cny").value);
    const aiUsd = parseNumber($("price_ai_usd").value);
    const iphoneUsd = parseNumber($("price_iphone_usd").value);

    // 获取所有输入值
    const coinAmount = parseNumber($("btc_amount").value);
    const usdtAmount = parseNumber($("usdt_amount").value);
    const cnyAmount = parseNumber($("cny_amount").value);
    const riceAmount = parseNumber($("rice_amount").value);
    const aiAmount = parseNumber($("ai_amount").value);
    const iphoneAmount = parseNumber($("iphone_amount").value);

    // 找到第一个有值的输入，计算基准USD
    let baseUsd = 0;
    
    if (coinAmount > 0 && coinUsd > 0) {
      baseUsd = coinAmount * coinUsd;
    } else if (usdtAmount > 0) {
      baseUsd = usdtAmount;
    } else if (cnyAmount > 0 && usdCny > 0) {
      baseUsd = cnyAmount / usdCny;
    } else if (riceAmount > 0 && riceCny > 0 && usdCny > 0) {
      baseUsd = (riceAmount * riceCny) / usdCny;
    } else if (aiAmount > 0 && aiUsd > 0) {
      baseUsd = aiAmount * aiUsd;
    } else if (iphoneAmount > 0 && iphoneUsd > 0) {
      baseUsd = iphoneAmount * iphoneUsd;
    }

    // 如果有基准USD值，更新所有其他输入框
    if (baseUsd > 0) {
      // 强制更新所有输入框（除了来源），对 number 输入使用纯数字字符串
      if (coinUsd > 0) {
        setNumberInputValue($("btc_amount"), baseUsd / coinUsd, 6);
      }

      setNumberInputValue($("usdt_amount"), baseUsd, 2);

      if (aiUsd > 0) {
        setNumberInputValue($("ai_amount"), baseUsd / aiUsd, 2);
      }

      if (iphoneUsd > 0) {
        setNumberInputValue($("iphone_amount"), baseUsd / iphoneUsd, 2);
      }

      if (usdCny > 0) {
        const baseCny = baseUsd * usdCny;
        setNumberInputValue($("cny_amount"), baseCny, 2);

        if (riceCny > 0) {
          setNumberInputValue($("rice_amount"), baseCny / riceCny, 0);
        }
      }
    }
  }

  // 简化的换算函数
  function updateConversions() {
    calculateAllConversions();
  }

  function bind() {
    $("btn_fetch_market").addEventListener('click', fetchMarket);
    $("btn_manual_calc").addEventListener('click', calculateAllConversions);
    
    // 币种选择行点击事件
    $("coin-selection-trigger").addEventListener('click', toggleCoinSelection);
    
    // 币种选择按钮事件
    document.querySelectorAll('.coin-btn-expanded').forEach(btn => {
      btn.addEventListener('click', () => {
        selectedCoin = {
          symbol: btn.dataset.coin,
          cg: btn.dataset.cg,
          binance: btn.dataset.binance
        };
        updateCoinUi();
        // 选择后自动收起
        toggleCoinSelection();
        // 清空价格，提示重新获取
        $("price_btc_usd").value = '';
        $("market_status").textContent = '已切换币种，请获取或填入价格后点击"手动换算"';
      });
    });

    // 移除自动换算事件监听器 - 用户输入时不自动换算
    // 只有在点击"一键获取"或"手动换算"时才进行换算
    
    // 价格设置输入框事件 - 价格变化时也不自动换算
    // $("price_btc_usd").addEventListener('input', calculateAllConversions);
    // $("rate_usd_cny").addEventListener('input', calculateAllConversions);
    // $("price_rice_cny").addEventListener('input', calculateAllConversions);
    // $("price_ai_usd").addEventListener('input', calculateAllConversions);
    // $("price_iphone_usd").addEventListener('input', calculateAllConversions);

    // initial
    updateCoinUi();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind);
  } else {
    bind();
  }
})();
