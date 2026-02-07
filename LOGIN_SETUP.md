# 🎯 Simple Login System - My Business POS

## ✅ **SISTEM SUDAH SIAP PAKAI!**

Aplikasi POS dengan sistem login sederhana yang aman dan praktis.

## 🔐 **CARA SETUP AKUN ADMIN**

### **Step 1: Setup Database**
1. Buka **Supabase Dashboard** → **SQL Editor**
2. Copy-paste isi file `database_setup.sql`
3. Klik **Run**

### **Step 2: Buat Admin Account**
1. Buka **Supabase Dashboard** → **Authentication** → **Users**
2. Klik **"Add User"**
3. Isi data:
   - **Email**: `admin@tokoku.com`
   - **Password**: `admin123456` (atau password pilihan Anda)
   - **Email Confirm**: `✅ Confirmed`
4. Klik **Create User**

### **Step 3: Login ke Aplikasi**
- Email: `admin@tokoku.com`
- Password: `admin123456`
- Role: **Owner** (otomatis)

## 🎊 **HASIL AKHIR:**

### **👑 Admin Features (Owner):**
- ✅ Tambah/edit/hapus menu
- ✅ Proses transaksi penjualan
- ✅ Hapus data penjualan
- ✅ Akses penuh ke semua fitur
- ✅ Lihat laporan penjualan

### **👤 Kasir Features (Cashier):**
- ✅ Proses transaksi penjualan
- ✅ Lihat menu produk
- ✅ Lihat data penjualan
- ❌ Tidak bisa tambah/hapus menu
- ❌ Tidak bisa hapus data penjualan

## 🔒 **Keamanan:**

- ✅ **Row Level Security** enabled
- ✅ **Role-based Access Control**
- ✅ **Session Management**
- ✅ **Password Protection**
- ✅ **SQL Injection Protection**

## 💡 **Cara Tambah User Baru:**

1. **Manual di Supabase:**
   - Dashboard → Authentication → Add User
   - Auto-assign role: `cashier`
   - Untuk jadikan `owner`, update database manual

2. **Auto Role Assignment:**
   - Email `admin@tokoku.com` = Owner
   - Email lainnya = Cashier

## 🚀 **Production Ready!**

Sistem ini siap untuk:
- ✅ Deploy ke production
- ✅ Multiple users
- ✅ Real business usage
- ✅ Secure transactions
- ✅ Role-based permissions

---

**🎯 SIMPLE, SECURE, SCALABLE!**