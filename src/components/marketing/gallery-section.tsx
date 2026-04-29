import Image from 'next/image';

const GALLERY = [
  {
    src: 'https://images.pexels.com/photos/3184292/pexels-photo-3184292.jpeg?auto=compress&cs=tinysrgb&w=800',
    alt: 'Team collaborating at a laptop',
  },
  {
    src: 'https://images.pexels.com/photos/6476588/pexels-photo-6476588.jpeg?auto=compress&cs=tinysrgb&w=800',
    alt: 'Dashboard analytics on screen',
  },
];

export function GallerySection() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {GALLERY.map((img) => (
        <div
          key={img.src}
          className="relative aspect-[4/3] overflow-hidden rounded-lg border border-border shadow-sm"
        >
          <Image
            src={img.src}
            alt={img.alt}
            fill
            className="object-cover"
            sizes="(min-width: 768px) 50vw, 100vw"
          />
        </div>
      ))}
    </div>
  );
}
