import type { InteractiveListSection } from './client';
import { storeConfig } from '../config/store';

export const MAIN_MENU_SECTIONS: InteractiveListSection[] = [
  {
    title: 'Menu Utama',
    rows: [
      { id: 'MENU_STORE', title: '🛒 Store', description: 'Lihat semua produk' },
      { id: 'MENU_CATEGORY', title: '📦 Kategori', description: 'Jelajah berdasarkan kategori' },
      { id: 'MENU_SEARCH', title: '🔎 Cari Produk', description: 'Cari produk spesifik' },
      { id: 'MENU_CART', title: '🛍️ Keranjang', description: 'Lihat keranjang belanja' },
      { id: 'MENU_ORDERS', title: '📋 Pesanan Saya', description: 'Riwayat pesanan' },
      { id: 'MENU_PAYMENT', title: '💳 Pembayaran', description: 'Status pembayaran' },
      { id: 'MENU_ACCOUNT', title: '👤 Akun Saya', description: 'Info akun kamu' },
      { id: 'MENU_PROMO', title: '🎟️ Promo', description: 'Voucher & promo aktif' },
      { id: 'MENU_HELP', title: '💬 Bantuan', description: 'Butuh bantuan?' },
    ],
  },
];

export function buildMainMenuFallbackText(): string {
  return [
    `🌙 *${storeConfig.name.toUpperCase()}*`,
    '',
    `Selamat datang di ${storeConfig.name}.`,
    '',
    'Pilih menu dengan mengetik angka:',
    '',
    '1️⃣ 🛒 Store',
    '2️⃣ 📦 Kategori',
    '3️⃣ 🔎 Cari Produk',
    '4️⃣ 🛍️ Keranjang',
    '5️⃣ 📋 Pesanan Saya',
    '6️⃣ 💳 Pembayaran',
    '7️⃣ 👤 Akun Saya',
    '8️⃣ 🎟️ Promo',
    '9️⃣ 💬 Bantuan',
  ].join('\n');
}

export function buildWelcomeHeader(): string {
  return `🌙 ${storeConfig.name.toUpperCase()}`;
}

export function buildGenericErrorMessage(): string {
  return '⚠️ Terjadi kesalahan.\n\nSilakan coba beberapa saat lagi.';
}
