export default function CompanyProfile({ company }) {
  if (!company) return null;

  const metrics = company.metrics;

  return (
    <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-8">
      <p className="text-xs uppercase tracking-[0.25em] text-white/35">
        Selected Company
      </p>

      <h3 className="text-4xl font-semibold mt-5">{company.name}</h3>

      <p className="text-white/45 mt-3">{company.category}</p>

      <p className="text-white/55 leading-8 mt-8">{company.description}</p>

      <div className="grid grid-cols-2 gap-4 mt-10">
        <Metric label="Transaction Volume" value={`${metrics.transactionVolume}%`} />
        <Metric label="Success Rate" value={`${metrics.successRate}%`} />
        <Metric label="Fraud Risk" value={`${metrics.fraudRisk}%`} />
        <Metric label="API Latency" value={`${metrics.apiLatency}ms`} />
        <Metric label="Refund Rate" value={`${metrics.refundRate}%`} />
        <Metric label="Payment Health" value={`${metrics.paymentHealth}%`} />
      </div>
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
      <p className="text-xs uppercase tracking-[0.18em] text-white/35">
        {label}
      </p>
      <h4 className="text-2xl mt-3">{value}</h4>
    </div>
  );
}