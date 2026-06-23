/* ============================================================
   MariOla — beaches.js
   Listado completo de 55 playas del litoral español, ordenado por:
     Comunidad Autónoma > Provincia > Nombre (alfabético, locale 'es').
   Estructura: { id, name, region, ccaa, province, lat, lon }
   ============================================================ */

const BEACHES = [
  // ===== Andalucía =====
  // -- Almería --
  { id: 'genoveses',       name: 'Los Genoveses',          region: 'Cabo de Gata (Almería)',  ccaa: 'Andalucía',            province: 'Almería',                  lat: 36.7619, lon: -2.1206 },
  { id: 'monsul',          name: 'Mónsul',                 region: 'Cabo de Gata (Almería)',  ccaa: 'Andalucía',            province: 'Almería',                  lat: 36.7503, lon: -2.1500 },
  // -- Cádiz --
  { id: 'barbate',         name: 'Barbate',                region: 'Cádiz',                   ccaa: 'Andalucía',            province: 'Cádiz',                    lat: 36.1880, lon: -5.9300 },
  { id: 'bolonia',         name: 'Bolonia',                region: 'Cádiz',                   ccaa: 'Andalucía',            province: 'Cádiz',                    lat: 36.0828, lon: -5.7714 },
  { id: 'camposoto',       name: 'Camposoto',              region: 'San Fernando (Cádiz)',    ccaa: 'Andalucía',            province: 'Cádiz',                    lat: 36.4420, lon: -6.2330 },
  { id: 'chipiona',        name: 'Chipiona',               region: 'Cádiz',                   ccaa: 'Andalucía',            province: 'Cádiz',                    lat: 36.7280, lon: -6.4400 },
  { id: 'conil',           name: 'Conil de la Frontera',   region: 'Cádiz',                   ccaa: 'Andalucía',            province: 'Cádiz',                    lat: 36.2772, lon: -6.0888 },
  { id: 'el-palmar',       name: 'El Palmar',              region: 'Vejer (Cádiz)',           ccaa: 'Andalucía',            province: 'Cádiz',                    lat: 36.2304, lon: -6.0345 },
  { id: 'el-puerto',       name: 'El Puerto',              region: 'El Puerto de Santa María (Cádiz)', ccaa: 'Andalucía',   province: 'Cádiz',                    lat: 36.5830, lon: -6.2470 },
  { id: 'la-barrosa',      name: 'La Barrosa',             region: 'Chiclana (Cádiz)',        ccaa: 'Andalucía',            province: 'Cádiz',                    lat: 36.3560, lon: -6.1800 },
  { id: 'la-caleta',       name: 'La Caleta',              region: 'Cádiz',                   ccaa: 'Andalucía',            province: 'Cádiz',                    lat: 36.5298, lon: -6.3066 },
  { id: 'la-victoria',     name: 'La Victoria',            region: 'Cádiz',                   ccaa: 'Andalucía',            province: 'Cádiz',                    lat: 36.5070, lon: -6.2870 },
  { id: 'canos-meca',      name: 'Los Caños de Meca',      region: 'Barbate (Cádiz)',         ccaa: 'Andalucía',            province: 'Cádiz',                    lat: 36.1850, lon: -6.0150 },
  { id: 'tarifa-lances',   name: 'Los Lances',             region: 'Tarifa (Cádiz)',          ccaa: 'Andalucía',            province: 'Cádiz',                    lat: 36.0269, lon: -5.6303 },
  { id: 'rota',            name: 'Rota',                   region: 'Cádiz',                   ccaa: 'Andalucía',            province: 'Cádiz',                    lat: 36.6155, lon: -6.3620 },
  { id: 'zahara-atunes',   name: 'Zahara de los Atunes',   region: 'Cádiz',                   ccaa: 'Andalucía',            province: 'Cádiz',                    lat: 36.1361, lon: -5.8458 },
  { id: 'zahora',          name: 'Zahora',                 region: 'Barbate (Cádiz)',         ccaa: 'Andalucía',            province: 'Cádiz',                    lat: 36.1990, lon: -6.0420 },
  // -- Huelva --
  { id: 'matalascanas',    name: 'Matalascañas',           region: 'Huelva',                  ccaa: 'Andalucía',            province: 'Huelva',                   lat: 36.9744, lon: -6.5435 },
  // -- Málaga --
  { id: 'burriana',        name: 'Burriana',               region: 'Nerja (Málaga)',          ccaa: 'Andalucía',            province: 'Málaga',                   lat: 36.7414, lon: -3.8736 },
  { id: 'malagueta',       name: 'La Malagueta',           region: 'Málaga',                  ccaa: 'Andalucía',            province: 'Málaga',                   lat: 36.7211, lon: -4.4097 },
  { id: 'misericordia',    name: 'La Misericordia',        region: 'Málaga',                  ccaa: 'Andalucía',            province: 'Málaga',                   lat: 36.7028, lon: -4.4583 },

  // ===== Asturias =====
  { id: 'gulpiyuri',       name: 'Gulpiyuri',              region: 'Asturias',                ccaa: 'Asturias',             province: 'Asturias',                 lat: 43.4297, lon: -4.9355 },
  { id: 'silencio',        name: 'Playa del Silencio',     region: 'Asturias',                ccaa: 'Asturias',             province: 'Asturias',                 lat: 43.5572, lon: -6.2433 },
  { id: 'san-lorenzo',     name: 'San Lorenzo',            region: 'Gijón (Asturias)',        ccaa: 'Asturias',             province: 'Asturias',                 lat: 43.5453, lon: -5.6500 },

  // ===== Canarias =====
  // -- Las Palmas --
  { id: 'famara',          name: 'Famara',                 region: 'Lanzarote',               ccaa: 'Canarias',             province: 'Las Palmas',               lat: 29.1297, lon: -13.5575 },
  { id: 'canteras',        name: 'Las Canteras',           region: 'Las Palmas (Gran Canaria)',ccaa: 'Canarias',            province: 'Las Palmas',               lat: 28.1394, lon: -15.4361 },
  { id: 'maspalomas',      name: 'Maspalomas',             region: 'Gran Canaria',            ccaa: 'Canarias',             province: 'Las Palmas',               lat: 27.7367, lon: -15.5853 },
  // -- Santa Cruz de Tenerife --
  { id: 'playa-jardin',    name: 'Playa Jardín',           region: 'Tenerife',                ccaa: 'Canarias',             province: 'Santa Cruz de Tenerife',   lat: 28.4150, lon: -16.5550 },

  // ===== Cantabria =====
  { id: 'berria',          name: 'Berria',                 region: 'Santoña (Cantabria)',     ccaa: 'Cantabria',            province: 'Cantabria',                lat: 43.4670, lon: -3.4596 },
  { id: 'sardinero',       name: 'El Sardinero',           region: 'Santander (Cantabria)',   ccaa: 'Cantabria',            province: 'Cantabria',                lat: 43.4747, lon: -3.7795 },
  { id: 'oyambre',         name: 'Oyambre',                region: 'Cantabria',               ccaa: 'Cantabria',            province: 'Cantabria',                lat: 43.3753, lon: -4.3367 },

  // ===== Cataluña =====
  // -- Barcelona --
  { id: 'castelldefels',   name: 'Castelldefels',          region: 'Barcelona',               ccaa: 'Cataluña',             province: 'Barcelona',                lat: 41.2683, lon: 1.9783 },
  { id: 'sitges',          name: 'Sitges',                 region: 'Barcelona',               ccaa: 'Cataluña',             province: 'Barcelona',                lat: 41.2353, lon: 1.8126 },
  // -- Girona --
  { id: 'platja-daro',     name: "Platja d'Aro",           region: 'Girona (Costa Brava)',    ccaa: 'Cataluña',             province: 'Girona',                   lat: 41.8167, lon: 3.0667 },
  { id: 'sant-pol',        name: 'Sant Pol',               region: 'Girona (Costa Brava)',    ccaa: 'Cataluña',             province: 'Girona',                   lat: 41.7644, lon: 3.0264 },
  // -- Tarragona --
  { id: 'miracle',         name: 'El Miracle',             region: 'Tarragona',               ccaa: 'Cataluña',             province: 'Tarragona',                lat: 41.1163, lon: 1.2569 },

  // ===== Comunidad Valenciana =====
  // -- Alicante --
  { id: 'postiguet',       name: 'El Postiguet',           region: 'Alicante',                ccaa: 'Comunidad Valenciana', province: 'Alicante',                 lat: 38.3494, lon: -0.4731 },
  { id: 'granadella',      name: 'La Granadella',          region: 'Jávea (Alicante)',        ccaa: 'Comunidad Valenciana', province: 'Alicante',                 lat: 38.7193, lon: 0.1850 },
  { id: 'levante-benidorm',name: 'Levante',                region: 'Benidorm (Alicante)',     ccaa: 'Comunidad Valenciana', province: 'Alicante',                 lat: 38.5417, lon: -0.1234 },
  { id: 'san-juan',        name: 'Playa de San Juan',      region: 'Alicante',                ccaa: 'Comunidad Valenciana', province: 'Alicante',                 lat: 38.3958, lon: -0.4233 },
  // -- Valencia --
  { id: 'el-saler',        name: 'El Saler',               region: 'Valencia',                ccaa: 'Comunidad Valenciana', province: 'Valencia',                 lat: 39.3781, lon: -0.3197 },
  { id: 'malvarrosa',      name: 'La Malvarrosa',          region: 'Valencia',                ccaa: 'Comunidad Valenciana', province: 'Valencia',                 lat: 39.4783, lon: -0.3270 },
  { id: 'gandia',          name: 'Playa de Gandía',        region: 'Valencia',                ccaa: 'Comunidad Valenciana', province: 'Valencia',                 lat: 38.9764, lon: -0.1620 },

  // ===== Galicia =====
  // -- A Coruña --
  { id: 'riazor',          name: 'Riazor',                 region: 'A Coruña',                ccaa: 'Galicia',              province: 'A Coruña',                 lat: 43.3697, lon: -8.4116 },
  // -- Lugo --
  { id: 'catedrales',      name: 'Playa de las Catedrales',region: 'Lugo (Galicia)',          ccaa: 'Galicia',              province: 'Lugo',                     lat: 43.5538, lon: -7.1561 },
  // -- Pontevedra --
  { id: 'a-lanzada',       name: 'A Lanzada',              region: 'Pontevedra',              ccaa: 'Galicia',              province: 'Pontevedra',               lat: 42.4358, lon: -8.8775 },
  { id: 'rodas',           name: 'Playa de Rodas',         region: 'Islas Cíes (Pontevedra)', ccaa: 'Galicia',              province: 'Pontevedra',               lat: 42.2227, lon: -8.9006 },

  // ===== Illes Balears =====
  { id: 'cala-agulla',     name: 'Cala Agulla',            region: 'Mallorca',                ccaa: 'Illes Balears',        province: 'Mallorca',                 lat: 39.7211, lon: 3.4564 },
  { id: 'es-trenc',        name: 'Es Trenc',               region: 'Mallorca',                ccaa: 'Illes Balears',        province: 'Mallorca',                 lat: 39.3489, lon: 3.0119 },
  { id: 'palma',           name: 'Playa de Palma',         region: 'Mallorca',                ccaa: 'Illes Balears',        province: 'Mallorca',                 lat: 39.5278, lon: 2.7375 },

  // ===== País Vasco =====
  // -- Bizkaia --
  { id: 'sopelana',        name: 'Sopelana',               region: 'Bizkaia',                 ccaa: 'País Vasco',           province: 'Bizkaia',                  lat: 43.3833, lon: -3.0286 },
  // -- Gipuzkoa --
  { id: 'la-concha',       name: 'La Concha',              region: 'San Sebastián (Gipuzkoa)',ccaa: 'País Vasco',           province: 'Gipuzkoa',                 lat: 43.3183, lon: -1.9889 },
  { id: 'zarautz',         name: 'Zarautz',                region: 'Gipuzkoa',                ccaa: 'País Vasco',           province: 'Gipuzkoa',                 lat: 43.2876, lon: -2.1672 },

  // ===== Región de Murcia =====
  { id: 'calblanque',      name: 'Calblanque',             region: 'Murcia',                  ccaa: 'Región de Murcia',     province: 'Murcia',                   lat: 37.6133, lon: -0.7333 },
  { id: 'la-manga',        name: 'La Manga del Mar Menor', region: 'Murcia',                  ccaa: 'Región de Murcia',     province: 'Murcia',                   lat: 37.7333, lon: -0.7500 }
];

window.MariOla = window.MariOla || {};
window.MariOla.beaches = BEACHES;
