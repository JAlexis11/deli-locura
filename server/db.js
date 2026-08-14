const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');
const bcrypt = require('bcryptjs');

const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const db = new DatabaseSync(path.join(dataDir, 'deli-locura.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS menu_data (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    json TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS admin (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    password_hash TEXT NOT NULL
  );
`);

const DEFAULT_MENU = {
  header: {
    title: 'Menú Deli Locura',
    slogan: 'Comida rápida y antojitos picantes 🔥'
  },
  sections: [
    {
      id: 'gomitas',
      title: 'Gomitas Enchiladas',
      image: 'imagen/Gomita.png',
      type: 'simple',
      items: [
        'Gomitas mixtas con chile',
        'Gomitas con chamoy',
        'Gomitas con tamarindo',
        'Gomitas extra picantes'
      ]
    },
    {
      id: 'lonchisloko',
      title: 'Lonchisloko',
      image: 'imagen/lonchis.png',
      type: 'menu',
      items: [
        { name: 'Lonchys Vacío', price: '$1,25', desc: '' },
        { name: 'Lonchysloko tradicional', price: '$1,75', desc: '' },
        { name: 'Lonchysnack pequeño', price: '$2,75', desc: 'Choclo, dorito pequeño, carne molida, queso, pico de gallo, salsas, tajín' },
        { name: 'Lonchysnack mediano', price: '$3,50', desc: 'Choclo, dorito mediano, carne molida, queso, pico de gallo, salsas, tajín' }
      ]
    },
    {
      id: 'esquites',
      title: 'Esquites',
      image: 'imagen/esnac.png',
      type: 'menu',
      items: [
        { name: 'Esquite estudiantil', price: '$0,50', desc: 'Choclo, queso, salsa, tajín' },
        { name: 'Esquite pequeño 8oz', price: '$1,00', desc: 'Choclo, salsas, queso, tajín' },
        { name: 'Esquite mediano 12oz', price: '$1,50', desc: 'Choclo, carne molida, queso, salsas, tajín' },
        { name: 'Esquite Grande', price: '$2,50', desc: 'Choclo, carne molida, queso, salsas, tajín' }
      ]
    },
    {
      id: 'dorilokos',
      title: 'Dorilokos',
      image: 'imagen/doriloco.png',
      type: 'menu',
      items: [
        { name: 'Tatoloko estudiantil', price: '$1,00', desc: 'Tostitos, choclo, carne molida, queso, pico de gallo, salsas, tajín' },
        { name: 'Doriloko pequeño', price: '$1,25', desc: 'Doritos, choclo, carne molida, queso, pico de gallo, salsas, tajín' },
        { name: 'Doriloko mediano', price: '$2,25', desc: 'Doritos, choclo, carne molida, queso, pico de gallo, salsas, tajín' },
        { name: 'Doriloko paketon', price: '$3,00', desc: 'Doritos, choclo, carne molida, chorizo o huevo, queso, pico de gallo, salsas, tajín' }
      ]
    },
    {
      id: 'bebidas',
      title: 'Bebidas',
      image: null,
      type: 'simple',
      items: ['Gaseosas', 'Te', 'Infusiones', 'Café']
    }
  ],
  contact: {
    address: 'Calle Antonio José de Sucre y Gabriel García Moreno, San Antonio de Ibarra, Imbabura – Ecuador',
    whatsapp: '593960946686',
    instagram: 'delilocura',
    facebook: 'delilocura'
  },
  qr: {
    menu: 'imagen/qr-menu.png',
    whatsapp: 'imagen/qr-whatsapp.png'
  }
};

const existing = db.prepare('SELECT id FROM menu_data WHERE id = 1').get();
if (!existing) {
  db.prepare('INSERT INTO menu_data (id, json) VALUES (1, ?)').run(JSON.stringify(DEFAULT_MENU));
}

const existingAdmin = db.prepare('SELECT id FROM admin WHERE id = 1').get();
if (!existingAdmin) {
  const initialPassword = process.env.ADMIN_PASSWORD || 'delilocura2026';
  const hash = bcrypt.hashSync(initialPassword, 10);
  db.prepare('INSERT INTO admin (id, password_hash) VALUES (1, ?)').run(hash);
  console.log('[deli-locura] Contraseña de administrador inicial creada.');
  if (!process.env.ADMIN_PASSWORD) {
    console.log('[deli-locura] Usando contraseña por defecto "delilocura2026". Cámbiala desde el panel admin o con la variable ADMIN_PASSWORD.');
  }
}

module.exports = db;
