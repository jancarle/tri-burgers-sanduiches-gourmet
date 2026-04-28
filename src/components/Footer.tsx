import { Link } from 'react-router-dom';
import { Instagram, Facebook, MessageCircle, Star, Share2 } from 'lucide-react';

export default function Footer() {
  const handleShare = async () => {
    const shareData = {
      title: 'Tri Burgers | O Melhor Hambúrguer de Goiânia',
      text: 'Bateu a fome? 🍔 Pede na Tri Burgers agora! Hambúrguer artesanal e entrega rápida.',
      url: window.location.origin,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        const textToShare = `${shareData.title}\n${shareData.text}\n${shareData.url}`;
        const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(textToShare)}`;
        window.open(whatsappUrl, '_blank');
      }
    } catch (err) {
      console.log('Compartilhamento cancelado ou falhou', err);
    }
  };

  return (
    <footer className="bg-black text-white pt-24 pb-12 border-t border-white/10 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-red-600/50 to-transparent" />
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 lg:gap-20 mb-20 text-center md:text-left">
          <div className="md:col-span-5 flex flex-col items-center md:items-start">
            <Link to="/" className="text-4xl font-black tracking-tighter mb-6 block hover:scale-105 transition-transform">
              TRI<span className="text-red-600">BURGERS</span>
            </Link>
            <p className="text-gray-400 font-medium leading-relaxed mb-8 max-w-sm">
              A melhor hamburgueria gourmet da região. Tradição desde 2012, sabor marcante e delivery rápido para matar sua fome com qualidade.
            </p>
            <div className="flex items-center gap-4">
              <button onClick={handleShare} className="w-12 h-12 bg-zinc-900 border border-white/10 rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:border-red-600 hover:bg-red-600/10 transition-all group" title="Compartilhar">
                <Share2 size={20} className="group-hover:scale-110 transition-transform" />
              </button>
              <a href="https://www.instagram.com/triburgersgourmet/" target="_blank" rel="noopener noreferrer" className="w-12 h-12 bg-zinc-900 border border-white/10 rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:border-red-600 hover:bg-red-600/10 transition-all group">
                <Instagram size={20} className="group-hover:scale-110 transition-transform" />
              </a>
              <a href={`https://wa.me/5562991778064?text=${encodeURIComponent('Olá!')}`} target="_blank" rel="noopener noreferrer" className="w-12 h-12 bg-zinc-900 border border-white/10 rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:border-green-500 hover:bg-green-500/10 transition-all group" title="WhatsApp">
                <MessageCircle size={20} className="group-hover:scale-110 transition-transform" />
              </a>
              <a href="https://g.page/r/CTufWNHrYHk6EAE/review" target="_blank" rel="noopener noreferrer" className="w-12 h-12 bg-zinc-900 border border-white/10 rounded-full flex items-center justify-center text-gray-400 hover:text-yellow-400 hover:border-yellow-400 hover:bg-yellow-400/10 transition-all group" title="Avalie-nos no Google">
                <Star size={20} className="group-hover:scale-110 transition-transform" />
              </a>
            </div>
          </div>
          
          <div className="md:col-span-3">
            <h4 className="font-black uppercase tracking-[0.2em] text-xs mb-8 text-red-600">Links Rápidos</h4>
            <ul className="space-y-4 font-medium text-gray-400">
              <li><a href="#home" className="hover:text-white hover:translate-x-2 transition-all inline-block">Home</a></li>
              <li><Link to="/cardapio" className="hover:text-white hover:translate-x-2 transition-all inline-block">Cardápio</Link></li>
              <li><a href="#sobre" className="hover:text-white hover:translate-x-2 transition-all inline-block">Nossa História</a></li>
              <li><a href="#contato" className="hover:text-white hover:translate-x-2 transition-all inline-block">Contato</a></li>
            </ul>
          </div>

          <div className="md:col-span-4" itemScope itemType="https://schema.org/Restaurant">
            <meta itemProp="name" content="Tri Burgers" />
            <h4 className="font-black uppercase tracking-[0.2em] text-xs mb-8 text-red-600">Contato & Local</h4>
            <ul className="space-y-6 text-gray-400">
              <li className="flex flex-col gap-1 items-center md:items-start" itemProp="telephone">
                <span className="text-[10px] uppercase tracking-widest text-gray-400">Telefone / Delivery</span>
                <span className="font-mono text-lg text-white font-bold">(62) 99177-8064</span>
              </li>
              <li className="flex flex-col gap-1 items-center md:items-start" itemProp="address" itemScope itemType="https://schema.org/PostalAddress">
                <span className="text-[10px] uppercase tracking-widest text-gray-400">Endereço</span>
                <span className="leading-snug text-gray-200">
                  <span itemProp="streetAddress">Av. A, 226 - Leste Vila Nova</span><br/>
                  <span itemProp="addressLocality">Goiânia</span> - <span itemProp="addressRegion">GO</span>
                  <meta itemProp="postalCode" content="74645-210" />
                  <meta itemProp="addressCountry" content="BR" />
                </span>
              </li>
              <li className="flex flex-col gap-1 items-center md:items-start">
                <span className="text-[10px] uppercase tracking-widest text-gray-400">Horário</span>
                <span className="font-bold text-white uppercase text-xs">A partir das 18:00 (Seg - Dom)</span>
              </li>
              <li className="flex flex-col gap-1 items-center md:items-start mt-4 pt-4 border-t border-white/5 w-full">
                <a href="https://g.page/r/CTufWNHrYHk6EAE/review" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 group hover:text-white transition-colors">
                  <span className="text-sm font-bold">Avalie-nos no Google</span>
                  <Star size={14} className="text-yellow-500 group-hover:scale-110 transition-transform" />
                </a>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] text-gray-400 font-bold uppercase tracking-widest">
          <p>© 2026 Tri Burgers Gourmet. Todos os direitos reservados. <Link to="/admin" className="ml-2 hover:text-white transition-colors opacity-50 hover:opacity-100">Área Admin</Link></p>
          <p className="flex items-center gap-2">Desenvolvido com <span className="text-red-600">⚡</span> por <a href="https://wa.me/5562991778064?text=Olá!%20Vi%20o%20cardápio%20da%20Tri%20Burgers%20e%20gostaria%20de%20um%20orçamento%20para%20o%20meu%20estabelecimento." target="_blank" rel="noopener noreferrer" className="text-white hover:text-red-500 transition-colors underline decoration-white/30 underline-offset-4">Jan Carle | Negócios Locais</a></p>
        </div>
      </div>
    </footer>
  );
}
