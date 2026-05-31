const COINGECKO_BTC_URL =
  "https://api.coingecko.com/api/v3/simple/price" +
  "?ids=bitcoin" +
  "&vs_currencies=usd" +
  "&include_market_cap=true" +
  "&include_24hr_vol=true" +
  "&include_24hr_change=true" +
  "&include_last_updated_at=true";

export async function fetchBTCMarketData() {
  try {
    const response = await fetch(COINGECKO_BTC_URL, {
      method: "GET",
      headers: {
        accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`CoinGecko request failed: ${response.status}`);
    }

    const data = await response.json();

    if (!data?.bitcoin) {
      throw new Error("CoinGecko response did not include bitcoin data.");
    }

    return {
      source: "coingecko",
      isLive: true,
      raw: data.bitcoin,
    };
  } catch (error) {
    console.warn("Using fallback BTC data:", error);

    return {
      source: "fallback",
      isLive: false,
      raw: {
        usd: 107034,
        usd_market_cap: 2110000000000,
        usd_24h_vol: 42000000000,
        usd_24h_change: 2.4,
        last_updated_at: Math.floor(Date.now() / 1000),
      },
    };
  }
}