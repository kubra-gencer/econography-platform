import { useEffect, useState } from "react";

import { fetchBTCMarketData } from "../../services/btcService";
import { normalizeBTCData } from "../../utils/normalizeBTCData";

export default function BTCDataTest() {
  const [status, setStatus] = useState("idle");
  const [pulse, setPulse] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function testBTCData() {
      try {
        setStatus("loading");

        const marketPayload = await fetchBTCMarketData();
        const normalizedPulse = normalizeBTCData(marketPayload);

        console.log("RAW BTC PAYLOAD:", marketPayload);
        console.log("NORMALIZED BTC PULSE:", normalizedPulse);

        setPulse(normalizedPulse);
        setStatus("success");
      } catch (error) {
        console.error("BTC DATA TEST FAILED:", error);
        setErrorMessage(error.message || "Unknown error");
        setStatus("error");
      }
    }

    testBTCData();
  }, []);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5 text-white">
      <p className="mono-font text-[0.5rem] uppercase tracking-[0.18em] text-dim">
        BTC Data Test
      </p>

      <h3 className="system-title mt-3 text-2xl">
        Status: {status}
      </h3>

      {errorMessage && (
        <p className="mt-4 text-sm leading-7 text-red-300">
          {errorMessage}
        </p>
      )}

      {pulse && (
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <TestMetric label="Price" value={`$${pulse.price.toLocaleString()}`} />
          <TestMetric label="24h Change" value={`${pulse.change24h.toFixed(2)}%`} />
          <TestMetric label="Volume 24h" value={`$${pulse.volume24h.toLocaleString()}`} />
          <TestMetric label="Risk" value={`${Math.round(pulse.risk * 100)}%`} />
          <TestMetric label="Liquidity" value={`${Math.round(pulse.liquidity * 100)}%`} />
          <TestMetric label="Mood" value={pulse.mood} />
          <TestMetric label="Source" value={pulse.source} />
          <TestMetric label="Live" value={pulse.isLive ? "Yes" : "Fallback"} />
        </div>
      )}
    </div>
  );
}

function TestMetric({ label, value }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-3">
      <p className="mono-font text-[0.45rem] uppercase tracking-[0.16em] text-dim">
        {label}
      </p>

      <p className="mt-2 text-sm text-white/80">
        {value}
      </p>
    </div>
  );
}