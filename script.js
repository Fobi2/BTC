const el = document.getElementById("chart");

const chart = LightweightCharts.createChart(el, {
  layout: {
    backgroundColor: "#020617",
    textColor: "#e5e7eb",
  },
  grid: {
    vertLines: { color: "#1e293b" },
    horzLines: { color: "#1e293b" },
  },
  timeScale: { timeVisible: true, secondsVisible: false },
});

const candleSeries = chart.addCandlestickSeries();

const SYMBOL_UP = "BTCUSDT";
const SYMBOL = "btcusdt";
const INTERVAL = "1m";

async function loadHistory() {
  const url = `https://api.binance.com/api/v3/klines?symbol=${SYMBOL_UP}&interval=${INTERVAL}&limit=200`;
  const res = await fetch(url);
  const data = await res.json();

  const candles = data.map(k => ({
    time: k[0] / 1000,
    open: parseFloat(k[1]),
    high: parseFloat(k[2]),
    low: parseFloat(k[3]),
    close: parseFloat(k[4]),
  }));

  candleSeries.setData(candles);
}

let ws;

function connectWS() {
  const wsUrl = `wss://stream.binance.com:9443/ws/${SYMBOL}@kline_${INTERVAL}`;
  ws = new WebSocket(wsUrl);

  ws.onopen = () => console.log("WS connected");

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    const k = msg.k;

    const candle = {
      time: k.t / 1000,
      open: parseFloat(k.o),
      high: parseFloat(k.h),
      low: parseFloat(k.l),
      close: parseFloat(k.c),
    };

    candleSeries.update(candle);
  };

  ws.onclose = () => {
    console.log("WS closed - reconnecting...");
    setTimeout(connectWS, 1000);
  };

  ws.onerror = (e) => {
    console.log("WS error", e);
    ws.close();
  };
}

(async () => {
  await loadHistory();
  connectWS();
})();
