import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { FAQ_DATA } from '../constants';

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="py-12 md:py-24 bg-zinc-950">
      <div className="max-w-3xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-6xl font-black tracking-tighter uppercase">DÚVIDAS <span className="text-red-600">FREQUENTES</span></h2>
          <p className="text-gray-400 mt-4">Tudo o que você precisa saber antes de pedir.</p>
        </div>

        <div className="space-y-4">
          {FAQ_DATA.map((faq, idx) => (
            <div key={idx} className="border border-white/10 rounded-2xl overflow-hidden">
              <button
                onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
                className="w-full flex items-center justify-between p-6 text-left bg-zinc-900/50 hover:bg-zinc-900 transition-colors"
              >
                <span className="font-bold uppercase tracking-tight text-white">{faq.question}</span>
                {openIndex === idx ? <ChevronUp className="text-red-600" /> : <ChevronDown className="text-gray-500" />}
              </button>
              <AnimatePresence>
                {openIndex === idx && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-6 bg-black/40 text-gray-400 leading-relaxed border-t border-white/5">
                      {faq.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
