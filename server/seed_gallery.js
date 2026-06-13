const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const cloudinary = require('cloudinary').v2;
require('dotenv').config();

const prisma = new PrismaClient();

cloudinary.config({
  cloudinary_url: process.env.CLOUDINARY_URL
});

async function seed() {
  console.log('Starting fixed seed process...');

  const downloadPath = 'C:\\Users\\junio\\Downloads';
  const localImages = [
    'SnapInsta.to_656047134_18319299496268842_195054745942373911_n.jpg',
    'SnapInsta.to_656447093_18319299475268842_3885372719241263779_n.jpg',
    'SnapInsta.to_657290912_18319299538268842_1795145307735967317_n.jpg',
    'SnapInsta.to_660245794_18319299505268842_2278689156305833938_n.jpg'
  ];

  const products = [];

  // 1. Add the 4 real items from Downloads
  for (let i = 0; i < localImages.length; i++) {
    const imgPath = path.join(downloadPath, localImages[i]);
    if (fs.existsSync(imgPath)) {
      const bitmap = fs.readFileSync(imgPath);
      const base64 = `data:image/jpeg;base64,${bitmap.toString('base64')}`;
      console.log(`Uploading real item ${i+1} to Cloudinary...`);
      const uploadRes = await cloudinary.uploader.upload(base64, { folder: 'girls_boutique' });
      
      products.push({
        name: `Boutique Exclusive 0${i+1}`,
        description: 'Premium piece hand-picked for our top tier collection.',
        price: 450 + (i * 50),
        category: i % 2 === 0 ? 'Ready-to-wear' : 'Bags',
        image: uploadRes.secure_url
      });
    }
  }

  // 2. Add 16 verified Unsplash high-fashion images
  const categories = ['Ready-to-wear', 'Shoes', 'Bags'];
  const fashionPhotoIds = [
    '1539109136881-3be0616acf4b', '1490481652156-b3b521c81230', '1515886657613-9f3515b0c78f',
    '1445205270312-d3e7b3b5f1cb', '1558769132-cb1ea458c7e4', '1469334031218-e382a71b716b',
    '1483985988355-763728e1935b', '1496747611176-843222e1e57c', '1509631179647-0177331693ae',
    '1489987707025-afc232f7ea0f', '1529139513400-f967f9d3f443', '1503342217505-b0a15ec3261c',
    '1512436991641', '1470309839182-d319598a6888', '1438183972690-6d4658e3290e', '1485230895905-ec40ba36b9bc'
  ];

  const sampleNames = [
    'Velvet Night Gown', 'Silk Wrap Dress', 'Stiletto Heels', 'Crocodile Texture Bag',
    'Linen Summer Set', 'Designer Tote', 'Evening Clutch', 'Floral Midi Dress',
    'Platform Sandals', 'Satin Slip Dress', 'Leather Boots', 'Pearl Handle Bag',
    'Chiffon Blouse', 'Tapered Trousers', 'Gold Link Belt', 'Modern Kaftan'
  ];

  for (let i = 0; i < fashionPhotoIds.length; i++) {
    products.push({
      name: sampleNames[i],
      description: 'A masterfully crafted piece designed to make you stand out.',
      price: Math.floor(Math.random() * (1200 - 200) + 200),
      category: categories[i % 3],
      image: `https://images.unsplash.com/photo-${fashionPhotoIds[i]}?auto=format&fit=crop&w=800&q=80`
    });
  }

  console.log(`Clearing inventory and inserting ${products.length} live items...`);
  await prisma.product.deleteMany({});
  
  for (const p of products) {
    await prisma.product.create({ data: p });
  }

  console.log('Fixed Seed Successful! 20 items are now live with working images.');
  process.exit(0);
}

seed().catch(err => {
  console.error('Seed Error:', err);
  process.exit(1);
});
