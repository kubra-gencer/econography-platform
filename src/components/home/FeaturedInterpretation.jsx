

import { motion } from "framer-motion";

export default function FeaturedInterpretation({ interpretation }) {
  return (
    <section className="page-padding relative z-10 py-30 md:py-36">
      <div className="mx-auto grid max-w-[1520px] gap-14 lg:grid-cols-[0.8fr_1.2fr]">
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.85, ease: [0.76, 0, 0.24, 1] }}
        >
          <p className="label">How to read the memory</p>

          <h2 className="page-title mt-8 max-w-3xl text-[clamp(2.4rem,5vw,5.6rem)]">
            The artwork is not decoration. It is a readable financial signal.
          </h2>

          <p className="mt-8 max-w-lg text-[0.98rem] leading-8 text-muted">
            Econography translates behavior into form. Each visual detail is
            connected to a financial condition: pressure, risk, coherence,
            latency, liquidity and activity.
          </p>
        </motion.div>

        <div className="grid gap-4 md:grid-cols-2">
          {interpretation.map((item, index) => (
            <InterpretationCard
              key={item.title}
              title={item.title}
              signal={item.signal}
              text={item.text}
              delay={index * 0.06}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function InterpretationCard({ title, signal, text, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.82, ease: [0.76, 0, 0.24, 1] }}
      whileHover={{ y: -2 }}
      className="visual-card rounded-[1.7rem] p-7 md:p-8"
    >
      <p className="mono-font text-[0.46rem] uppercase tracking-[0.16em] text-dim">
        {signal}
      </p>

      <h3 className="system-title mt-6 text-[clamp(1.8rem,3vw,3rem)]">
        {title}
      </h3>

      <div className="hairline mt-6" />

      <p className="mt-6 text-sm leading-8 text-muted">{text}</p>
    </motion.div>
  );
}