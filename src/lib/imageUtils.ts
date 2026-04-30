
/**
 * Professional Image Utility for Product Uploads
 */

interface ProcessImageOptions {
  maxWidth: number;
  quality: number;
}

export async function processImage(file: File, options: ProcessImageOptions): Promise<Blob> {
  return new Promise((resolve, reject) => {
    // Basic validations
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!validTypes.includes(file.type)) {
      return reject(new Error('Formato inválido. Use apenas JPG ou PNG.'));
    }

    if (file.size > 2 * 1024 * 1024) {
      return reject(new Error('O arquivo é muito grande. O limite é 2 MB.'));
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Resize if necessary
        if (width > options.maxWidth) {
          height = Math.round((height * options.maxWidth) / width);
          width = options.maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return reject(new Error('Erro ao processar imagem (Canvas)'));
        }

        // Fill white background for transparency conversion
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to Blob as JPG 0.85
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Erro ao gerar blob da imagem'));
            }
          },
          'image/jpeg',
          options.quality
        );
      };
      img.onerror = () => reject(new Error('Erro ao carregar imagem'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
    reader.readAsDataURL(file);
  });
}
