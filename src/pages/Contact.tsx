import { motion } from 'motion/react';
import { Phone, Mail, MapPin, Instagram, Facebook, MessageCircle } from 'lucide-react';
import FAQ from '../components/FAQ';

export default function Contact() {
  const whatsappNumber = '5562991778064';

  return (
    <div className="bg-black text-white font-sans">
      <div className="max-w-7xl mx-auto px-4 pb-8 md:py-16">
        <div className="text-center mb-16 md:mb-24">
          <motion.span 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-red-600 font-black tracking-[0.4em] uppercase text-[10px] md:text-sm mb-4 block"
          >
            Atendimento Prioritário
          </motion.span>
          <h1 className="text-5xl sm:text-6xl md:text-[9rem] font-black tracking-tighter uppercase mb-4 md:mb-6 leading-[0.8] italic">
            ESTAMOS <br /><span className="text-red-600 not-italic">PRONTOS.</span>
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto text-xl leading-relaxed">
            Sua fome não espera e nós também não. Chame agora e garanta o melhor burger da sua vida.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 mb-16">
          {/* Contact Info */}
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <a 
                href={`https://wa.me/${whatsappNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-10 bg-zinc-900/50 rounded-[3rem] border border-white/5 hover:border-green-500/50 transition-all group relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/5 blur-[40px]" />
                <div className="p-5 bg-black rounded-2xl text-green-500 w-fit mb-8 group-hover:scale-110 transition-transform">
                  <MessageCircle size={40} />
                </div>
                <h3 className="text-2xl font-black uppercase mb-2">WhatsApp</h3>
                <p className="text-gray-400 font-mono text-lg">(62) 99177-8064</p>
                <p className="mt-4 text-[10px] font-black text-green-500 uppercase tracking-widest">Resposta em 2 min</p>
              </a>

              <a href="https://www.instagram.com/triburgersgourmet/" target="_blank" rel="noopener noreferrer" className="p-10 bg-zinc-900/50 rounded-[3rem] border border-white/5 hover:border-pink-500/50 transition-all group relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-pink-500/5 blur-[40px]" />
                <div className="p-5 bg-black rounded-2xl text-pink-500 w-fit mb-8 group-hover:scale-110 transition-transform">
                  <Instagram size={40} />
                </div>
                <h3 className="text-2xl font-black uppercase mb-2">Instagram</h3>
                <p className="text-gray-400 font-mono text-lg">@triburgersgourmet</p>
              </a>
            </div>

            <div className="p-10 bg-zinc-900/50 rounded-[3rem] border border-white/5">
              <div className="p-5 bg-black rounded-2xl text-red-600 w-fit mb-8">
                <MapPin size={40} />
              </div>
              <h3 className="text-2xl font-black uppercase mb-2">Base de Operações</h3>
              <p className="text-gray-400 text-lg mb-4">Av A, 226 - Q A2 - Leste Vila Nova<br/>Goiânia - GO, 74645-210</p>
              <p className="text-sm text-gray-500 uppercase tracking-widest font-bold">Retirada no local ou Delivery.</p>
            </div>
          </div>

          {/* Schedule - Moved Up */}
          <div className="bg-zinc-900/30 rounded-[4rem] p-12 md:p-16 border border-white/5 flex flex-col justify-center relative overflow-hidden">
            <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-red-600/5 blur-[100px] rounded-full" />
            <h2 className="text-4xl font-black uppercase mb-10 tracking-tight">Horário de <span className="text-red-600">Ataque</span></h2>
            <div className="space-y-5">
              {[
                { day: 'Segunda-feira', time: 'A partir das 18:00' },
                { day: 'Terça-feira', time: 'A partir das 18:00' },
                { day: 'Quarta-feira', time: 'A partir das 18:00' },
                { day: 'Quinta-feira', time: 'A partir das 18:00' },
                { day: 'Sexta-feira', time: 'A partir das 18:00' },
                { day: 'Sábado', time: 'A partir das 18:00' },
                { day: 'Domingo', time: 'A partir das 18:00' },
              ].map((item, idx) => (
                <div key={idx} className="flex justify-between items-center border-b border-white/5 pb-3">
                  <span className="font-black uppercase text-[10px] tracking-[0.2em] text-gray-400">{item.day}</span>
                  <span className={`font-mono text-sm font-bold ${item.time === 'Recuperação' ? 'text-red-600' : 'text-white'}`}>
                    {item.time}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Map integration - Moved Down */}
        <div className="mb-24">
          <h2 className="text-4xl font-black uppercase mb-10 tracking-tight text-center">Nossa <span className="text-red-600">Localização</span></h2>
          <div className="w-full h-[450px] rounded-[3rem] overflow-hidden border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
            <iframe 
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3822.274021969177!2d-49.2397103!3d-16.6631656!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x935ef372f8597569%3A0x3a7960ebd1589f3b!2sTri%20Burgers%20-%20Pit%20dog%20(Tele-entrega)!5e0!3m2!1spt-BR!2sbr!4v1776362567651!5m2!1spt-BR!2sbr" 
              width="100%" 
              height="100%" 
              style={{ border: 0 }} 
              allowFullScreen={false} 
              loading="lazy" 
              referrerPolicy="no-referrer-when-downgrade"
            ></iframe>
          </div>
        </div>


        <FAQ />
      </div>
    </div>
  );
}
