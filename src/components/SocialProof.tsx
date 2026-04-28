import { motion } from 'motion/react';
import { Star } from 'lucide-react';
import { SOCIAL_PROOF } from '../constants';

export default function SocialProof() {
  return (
    <section className="py-8 md:py-12 bg-black">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-16">
          <span className="text-red-600 font-black tracking-widest uppercase text-sm">O que dizem nossos clientes</span>
          <h2 className="text-4xl md:text-6xl font-black tracking-tighter mt-2 uppercase">PROVA REAL <br />DE <span className="text-red-600">SABOR.</span></h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {SOCIAL_PROOF.map((testimonial, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.2 }}
              className="p-8 rounded-[2rem] bg-zinc-900/50 border border-white/5 flex flex-col justify-between"
            >
              <div>
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.stars)].map((_, i) => (
                    <Star key={i} size={16} className="fill-yellow-500 text-yellow-500" />
                  ))}
                </div>
                <p className="text-gray-300 italic mb-6 leading-relaxed">"{testimonial.comment}"</p>
              </div>
              <div>
                <p className="font-black uppercase tracking-tight text-white">{testimonial.name}</p>
                <p className="text-xs text-red-600 font-bold uppercase tracking-widest">{testimonial.role}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
