import { motion } from "framer-motion";

export default function MemoryLeaderboard({ companies }) {
  const rankedCompanies = [...companies].sort((a, b) => {
    const scoreA = calculateMemoryScore(a);
    const scoreB = calculateMemoryScore(b);

    return scoreB - scoreA;
  });

  return (
    <section className="page-padding relative z-10 pb-32">
      <div className="mx-auto max-w-[1520px]">
        <div className="mb-12 grid gap-8 lg:grid-cols-[0.86fr_1.14fr] lg:items-end">
          <motion.div
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.85, ease: [0.76, 0, 0.24, 1] }}
          >
            <p className="label">Daily Memory Index</p>

            <h2 className="page-title mt-8 max-w-4xl text-[clamp(2.4rem,5vw,5.4rem)]">
              Financial entities ranked by the clarity of their memory.
            </h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{
              delay: 0.08,
              duration: 0.85,
              ease: [0.76, 0, 0.24, 1],
            }}
            className="visual-card rounded-[1.7rem] p-6"
          >
            <p className="mono-font text-[0.48rem] uppercase tracking-[0.18em] text-dim">
              Ranking Criteria
            </p>

            <p className="mt-4 text-sm leading-8 text-muted">
              Entities are not ranked by beauty alone. The index combines
              liquidity coherence, operational health, risk pressure,
              transaction density, latency stability and visual score into a
              single memory quality signal.
            </p>
          </motion.div>
        </div>

        <div className="space-y-3">
          {rankedCompanies.map((company, index) => (
            <LeaderboardItem key={company.id} company={company} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}

function calculateMemoryScore(company) {
  const positive =
    company.paymentHealth * 0.24 +
    company.liquidityCoherence * 0.22 +
    company.transactionDensity * 0.16 +
    company.latencyStability * 0.16 +
    company.visualScore * 0.22;

  const riskPenalty = company.riskPressure * 0.18;

  return Math.round(positive - riskPenalty);
}

function LeaderboardItem({ company, index }) {
  const memoryScore = calculateMemoryScore(company);

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{
        delay: index * 0.05,
        duration: 0.82,
        ease: [0.76, 0, 0.24, 1],
      }}
      whileHover={{ y: -2 }}
      className="visual-card grid items-center gap-7 rounded-[1.7rem] p-5 transition duration-500 md:grid-cols-[58px_1fr_190px_110px]"
    >
      <div>
        <p className="mono-font text-[0.46rem] uppercase tracking-[0.16em] text-dim">
          Rank
        </p>

        <h3 className="system-title mt-2 text-3xl">0{index + 1}</h3>
      </div>

      <div>
        <p className="mono-font text-[0.48rem] uppercase tracking-[0.18em] text-dim">
          {company.category}
        </p>

        <h2 className="system-title mt-3 text-[clamp(1.6rem,2.8vw,3rem)]">
          {company.name}
        </h2>

        <p className="mt-4 max-w-2xl text-sm leading-7 text-muted">
          {company.rankReason}
        </p>
      </div>

      <div className="grid gap-3">
        <MemoryMetric label="Health" value={`${company.paymentHealth}%`} />
        <MemoryMetric label="Risk" value={`${company.riskPressure}%`} />
      </div>

      <div className="flex items-center justify-center rounded-full border border-white/10 bg-white/[0.025] px-6 py-4">
        <div className="text-center">
          <p className="mono-font text-[0.46rem] uppercase tracking-[0.16em] text-dim">
            Memory
          </p>

          <h3 className="mt-2 text-2xl font-medium text-white">
            {memoryScore}
          </h3>
        </div>
      </div>
    </motion.div>
  );
}

function MemoryMetric({ label, value }) {
  return (
    <div>
      <p className="mono-font text-[0.46rem] uppercase tracking-[0.16em] text-dim">
        {label}
      </p>

      <p className="mt-1.5 text-sm text-white/78">{value}</p>
    </div>
  );
}