import { motion } from 'motion/react';
import { History, Heart, Users, Award } from 'lucide-react';

export default function About() {
  return (
    <div className="bg-black text-white font-sans">
      {/* Hero */}
      <section className="relative pb-12 md:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#dc2626_0%,transparent_70%)] opacity-10" />
        <div className="max-w-7xl mx-auto px-4 text-center relative z-10">
          <motion.span 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-red-600 font-black tracking-[0.4em] uppercase text-[10px] md:text-sm"
          >
            A Lenda Tri Burgers
          </motion.span>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl sm:text-6xl md:text-[8rem] font-black tracking-tighter uppercase mt-4 md:mt-6 mb-4 md:mb-8 leading-[0.8] italic"
          >
            FORJADOS NO <br /><span className="text-red-600 not-italic">FOGO E SABOR.</span>
          </motion.h1>
        </div>
      </section>

      {/* Story Content */}
      <section className="py-12 md:py-24" aria-labelledby="story-title">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 md:gap-24 items-center">
            <div className="relative group mx-auto w-full max-w-sm md:max-w-full">
              <div className="aspect-square rounded-[3rem] md:rounded-[4rem] overflow-hidden border border-white/10 shadow-2xl rotate-3 group-hover:rotate-0 transition-transform duration-700">
                <img 
                  src="https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&q=80&w=1000" 
                  alt="A cozinha artesanal do Tri Burgers em Goiânia" 
                  className="w-full h-full object-cover opacity-90 group-hover:scale-110 group-hover:opacity-100 transition-all duration-700"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="absolute -bottom-10 -left-10 bg-red-600 p-12 rounded-[3rem] hidden md:block shadow-2xl -rotate-6 group-hover:-rotate-3 transition-transform duration-700">
                <span className="block text-6xl font-black">12+</span>
                <span className="text-xs font-bold uppercase tracking-widest">Anos de Histórica Tradição</span>
              </div>
            </div>
            <div className="space-y-10">
              <h2 id="story-title" className="text-5xl font-black uppercase tracking-tight leading-tight">O Autêntico <span className="text-red-600">Pit Dog</span> de Goiânia</h2>
              <p className="text-gray-400 text-xl leading-relaxed">
                Nascido em 2012 no coração da <strong className="text-white">Leste Vila Nova</strong>, o Tri Burgers não é apenas uma hamburgueria, é um marco da cultura gastronômica goiana. Nossa missão é preservar a essência do "Pit Dog" tradicional, elevando-a com técnicas artesanais de alta gastronomia.
              </p>
              <p className="text-gray-400 text-xl leading-relaxed">
                Cada blend é moído na casa diariamente, utilizando apenas cortes selecionados. Nosso diferencial? O <strong className="text-white">Molho Verde Secreto</strong>, uma receita de família que se tornou a lenda entre os moradores do Setor Vila Nova e região central. Aqui, a transparência é real: da fogueira para a sua mesa.
              </p>
              <div className="grid grid-cols-2 gap-10 pt-10 border-t border-white/10">
                <div className="space-y-2">
                  <p className="text-3xl font-black text-red-600">100%</p>
                  <p className="text-xs font-bold uppercase tracking-widest text-gray-500">Carnes Selecionadas e Frescas</p>
                </div>
                <div className="space-y-2">
                  <p className="text-3xl font-black text-red-600">50k+</p>
                  <p className="text-xs font-bold uppercase tracking-widest text-gray-500">Pedidos Entregues com Sucesso</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 md:py-24 bg-zinc-950">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-6xl font-black tracking-tighter uppercase">O QUE NOS MOVE</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { title: "Variedade", desc: "Do tradicional X-Tudo ao Gourmet de Costela, temos opções para todos os gostos e fomes." },
              { title: "Delivery", desc: "Logística própria e eficiente para garantir que seu lanche chegue rápido e impecável." },
              { title: "Comunidade", desc: "Valorizamos o atendimento local e a satisfação de cada cliente que nos escolhe desde 2012." },
            ].map((value, idx) => (
              <div key={idx} className="p-10 bg-black border border-white/5 rounded-[2rem] hover:border-red-600/50 transition-colors">
                <h3 className="text-2xl font-black text-red-600 uppercase mb-4">{value.title}</h3>
                <p className="text-gray-400 leading-relaxed">{value.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
