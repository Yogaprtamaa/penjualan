'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { 
  LayoutGrid, 
  Settings, 
  Search, 
  Trash2, 
  Plus, 
  Minus, 
  ShoppingBag,
  ChefHat,
  ArrowRight,
  Coffee,
  X,
  ChevronUp,
  LogOut,
  User,
  Lock
} from 'lucide-react'

// --- TYPES ---
interface Product {
  id: number
  name: string
  base_cost: number
  selling_price: number
  target_profit?: number
  icon?: string
}

interface Sale {
  id: number
  product_name: string
  qty: number
  gross_total: number
  net_revenue: number
  actual_profit: number
  created_at: string
}

interface AdminForm {
  name: string
  modal: string
  target: string
}

interface AuthUser {
  id: string
  email: string
  role?: 'owner' | 'cashier'
  user_metadata?: {
    name?: string
    role?: string
  }
}

// --- SETUP DATABASE ---
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

// --- FORMAT DUIT ---
const formatRp = (num: number) => new Intl.NumberFormat('id-ID').format(num)

const foodIcons = ["🍔", "🍕", "🍜", "🍰", "🥗", "🍣", "🍩", "🍗", "🍚", "🍝", "🍟", "🍞"]

export default function ResponsivePOS() {
  const [view, setView] = useState('pos') // 'pos' | 'admin'
  const [products, setProducts] = useState<Product[]>([])
  const [sales, setSales] = useState<Sale[]>([])
  const [cartLoading, setCartLoading] = useState<number | null>(null)
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  
  // State khusus Mobile
  const [showMobileCart, setShowMobileCart] = useState(false)

  useEffect(() => {
    checkUser()
  }, [])

  useEffect(() => {
    if (user) {
      fetchData()
    }
  }, [user])

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
      // Get user profile with role
      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('user_id', session.user.id)
        .single()
      
      if (userProfile) {
        setUser({
          id: session.user.id,
          email: session.user.email!,
          role: userProfile.role,
          user_metadata: session.user.user_metadata
        })
      }
    }
    setLoading(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProducts([])
    setSales([])
  }

  const checkPermission = (action: 'view_admin' | 'create_product' | 'delete_product' | 'view_sales' | 'delete_sale') => {
    if (!user) return false
    
    switch (action) {
      case 'view_admin':
      case 'create_product':
      case 'delete_product':
        return user.role === 'owner'
      case 'view_sales':
      case 'delete_sale':
        return user.role === 'owner' || user.role === 'cashier'
      default:
        return false
    }
  }

  const fetchData = async () => {
    const { data: p } = await supabase.from('products').select('*').order('name', { ascending: true })
    const { data: s } = await supabase.from('sales').select('*').order('created_at', { ascending: false })
    if (p) setProducts(p)
    if (s) setSales(s)
  }

  const handleJual = async (product: Product, qty: number) => {
    if (!checkPermission('view_sales')) {
      alert('Access denied: Insufficient permissions')
      return
    }
    
    setCartLoading(product.id)
    const fee = 0.38
    const gross = product.selling_price * qty
    const net = gross * (1 - fee)
    const profit = net - (product.base_cost * qty)

    await supabase.from('sales').insert({
      product_name: product.name,
      qty, 
      gross_total: gross, 
      net_revenue: net, 
      actual_profit: profit
    })
    
    setCartLoading(null)
    fetchData()
  }

  const handleDelete = async (id: number) => {
    if (!checkPermission('delete_sale')) {
      alert('Access denied: Only owners can delete sales')
      return
    }
    
    if(confirm('Hapus item ini?')) {
      await supabase.from('sales').delete().eq('id', id)
      fetchData()
    }
  }

  // --- LOGIC ADMIN ---
  const handleSimpanMenu = async (form: Omit<Product, 'id'>) => {
    if (!checkPermission('create_product')) {
      alert('Access denied: Only owners can create products')
      return
    }
    
    await supabase.from('products').insert(form)
    fetchData()
    alert('Menu Tersimpan!')
  }

  const handleHapusMenu = async (id: number) => {
    if (!checkPermission('delete_product')) {
      alert('Access denied: Only owners can delete products')
      return
    }
    
    if(confirm('Hapus menu permanen?')) {
      await supabase.from('products').delete().eq('id', id)
      fetchData()
    }
  }

  // Hitung Total untuk Mobile Bar
  const totalOmzet = sales.reduce((a, b) => a + b.gross_total, 0)
  const totalItems = sales.reduce((a, b) => a + b.qty, 0)

  // Show loading spinner
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center text-white mb-4 mx-auto animate-pulse">
            <ChefHat size={24} />
          </div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Show login if not authenticated
  if (!user) {
    return <LoginScreen onLogin={setUser} />
  }

  return (
    <div className="flex h-screen bg-gray-50 text-gray-800 font-sans overflow-hidden">
      
      {/* 1. SIDEBAR (HANYA MUNCUL DI DESKTOP/MD KE ATAS) */}
      <aside className="hidden md:flex w-20 bg-white border-r border-gray-200 flex-col items-center py-6 z-20">
        <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center text-white mb-8 shadow-lg shadow-orange-200">
          <ChefHat size={20} />
        </div>
        <nav className="flex flex-col gap-4 w-full px-2 flex-1">
          <SidebarBtn active={view === 'pos'} onClick={() => setView('pos')} icon={<LayoutGrid size={22} />} label="KASIR" />
          {checkPermission('view_admin') && (
            <SidebarBtn active={view === 'admin'} onClick={() => setView('admin')} icon={<Settings size={22} />} label="MENU" />
          )}
        </nav>
        
        {/* User info and logout */}
        <div className="w-full px-2 mt-4 border-t border-gray-100 pt-4">
          <div className="text-center mb-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white mx-auto mb-1 ${user.role === 'owner' ? 'bg-orange-500' : 'bg-blue-500'}`}>
              <User size={14} />
            </div>
            <p className="text-[8px] text-gray-500 truncate px-1">{user.email}</p>
            <p className="text-[7px] font-bold text-gray-400 uppercase">{user.role || 'cashier'}</p>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex items-center justify-center"
            title="Logout"
          >
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      {/* 2. MAIN CONTENT WRAPPER */}
      <div className="flex-1 flex flex-col md:flex-row relative overflow-hidden">
        
        {/* KONTEN TENGAH (GRID PRODUK / ADMIN) */}
        <div className="flex-1 flex flex-col h-full overflow-hidden relative">
          {view === 'pos' ? (
            <POSLayout 
              products={products} 
              onJual={handleJual} 
              loadingId={cartLoading}
              // Props tambahan untuk mobile
              isMobile={true}
            />
          ) : checkPermission('view_admin') ? (
            <AdminLayout 
              products={products} 
              onSimpan={handleSimpanMenu} 
              onHapus={handleHapusMenu}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-gray-500">
                <Lock size={48} className="mx-auto mb-4" />
                <h2 className="text-xl font-bold mb-2">Access Denied</h2>
                <p>You don't have permission to access this section.</p>
                <p className="text-sm mt-2">Current role: <span className="font-bold">{user.role || 'cashier'}</span></p>
              </div>
            </div>
          )}

          {/* BOTTOM NAVIGATION (HANYA MUNCUL DI MOBILE) */}
          <div className="md:hidden h-16 bg-white border-t border-gray-200 flex justify-around items-center px-4 z-40 shrink-0">
             <button onClick={() => setView('pos')} className={`flex flex-col items-center ${view === 'pos' ? 'text-orange-600' : 'text-gray-400'}`}>
                <LayoutGrid size={20} />
                <span className="text-[10px] font-bold mt-1">Menu</span>
             </button>
             <button onClick={() => setView('admin')} className={`flex flex-col items-center ${view === 'admin' ? 'text-orange-600' : 'text-gray-400'}`}>
                <Settings size={20} />
                <span className="text-[10px] font-bold mt-1">Admin</span>
             </button>
          </div>
        </div>

        {/* 3. KERANJANG / CART PANEL (RESPONSIF) */}
        {/* Logic: Di Desktop selalu muncul. Di Mobile hanya muncul jika showMobileCart === true */}
        <div className={`
            fixed inset-0 z-50 bg-white md:bg-transparent md:static md:w-[380px] md:border-l md:border-gray-200 md:flex md:flex-col shadow-2xl md:shadow-none
            transform transition-transform duration-300 ease-in-out
            ${showMobileCart ? 'translate-y-0' : 'translate-y-full md:translate-y-0'}
            ${view === 'admin' && 'hidden md:hidden'} /* Sembunyikan cart kalau lagi mode admin */
        `}>
          
          {/* Mobile Header untuk Cart (Tombol Close) */}
          <div className="md:hidden flex justify-between items-center p-4 border-b border-gray-100 bg-gray-50">
            <h2 className="font-bold text-lg">Keranjang Pesanan</h2>
            <button onClick={() => setShowMobileCart(false)} className="p-2 bg-white rounded-full text-gray-500 shadow-sm">
              <ChevronUp size={20} className="rotate-180"/>
            </button>
          </div>

          {/* Isi Cart (Reusable Component) */}
          <CartContent 
            sales={sales} 
            totalOmzet={totalOmzet} 
            onDelete={handleDelete} 
          />
        </div>

        {/* 4. MOBILE FLOATING CART BAR (Hanya muncul di Mobile & Mode POS) */}
        {view === 'pos' && !showMobileCart && (
           <div className="md:hidden absolute bottom-20 left-4 right-4 z-30">
              <button 
                onClick={() => setShowMobileCart(true)}
                className="w-full bg-gray-900 text-white rounded-xl p-4 shadow-xl flex justify-between items-center animate-in slide-in-from-bottom-4"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-orange-500 w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs">
                    {totalItems}
                  </div>
                  <div className="text-left">
                    <p className="text-xs text-gray-400">Total</p>
                    <p className="font-bold">Rp {formatRp(totalOmzet)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm font-bold text-orange-400">
                  Lihat Keranjang <ArrowRight size={16}/>
                </div>
              </button>
           </div>
        )}

      </div>
    </div>
  )
}

// --- SUB-COMPONENTS ---

interface SidebarBtnProps {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
}

function SidebarBtn({ active, onClick, icon, label }: SidebarBtnProps) {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center justify-center p-3 rounded-xl transition-all duration-200 ${
        active ? 'bg-gray-900 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-100'
      }`}
    >
      {icon}
      <span className="text-[9px] font-bold mt-1 tracking-widest">{label}</span>
    </button>
  )
}

// --- CART CONTENT (Dipisah biar bisa dipake Mobile & Desktop) ---
interface CartContentProps {
  sales: Sale[]
  totalOmzet: number
  onDelete: (id: number) => Promise<void>
}

function CartContent({ sales, totalOmzet, onDelete }: CartContentProps) {
  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header Cart */}
      <div className="p-6 border-b border-gray-100 bg-white shrink-0">
        <div className="flex items-center gap-2 mb-1">
           <ShoppingBag size={18} className="text-orange-500"/>
           <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Ringkasan</span>
        </div>
        <h2 className="text-3xl font-black text-gray-800">Rp {formatRp(totalOmzet)}</h2>
        <p className="text-xs text-gray-400 mt-1">Total Transaksi Hari Ini</p>
      </div>

      {/* List Items Scrollable */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-gray-50">
        {sales.map((sale) => (
          <div key={sale.id} className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm flex justify-between items-center group">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500 shrink-0">
                {sale.qty}x
              </div>
              <div className="min-w-0">
                <h4 className="font-bold text-gray-800 text-sm truncate">{sale.product_name}</h4>
                <p className="text-[10px] text-gray-400">{new Date(sale.created_at).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</p>
              </div>
            </div>
            <div className="text-right shrink-0 ml-2">
              <p className="font-bold text-gray-700 text-sm">Rp {formatRp(sale.gross_total)}</p>
              <button onClick={() => onDelete(sale.id)} className="text-[10px] text-red-400 p-1">HAPUS</button>
            </div>
          </div>
        ))}
        {sales.length === 0 && (
          <div className="text-center py-10 opacity-40">
            <p className="text-4xl mb-2">🧾</p>
            <p className="text-sm">Belum ada pesanan</p>
          </div>
        )}
      </div>

      {/* Footer Cart */}
      <div className="bg-white p-4 border-t border-dashed border-gray-300 relative shrink-0 pb-8 md:pb-4">
         <button className="w-full bg-gray-900 text-white py-3 rounded-xl font-bold text-sm hover:bg-black transition flex justify-center items-center gap-2">
           <Plus size={16}/> PESANAN BARU
         </button>
      </div>
    </div>
  )
}

interface POSLayoutProps {
  products: Product[]
  onJual: (product: Product, qty: number) => Promise<void>
  loadingId: number | null
  isMobile?: boolean
}

function POSLayout({ products, onJual, loadingId, isMobile }: POSLayoutProps) {
  const [search, setSearch] = useState('')
  const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="flex flex-col h-full bg-gray-50/50">
      {/* Header */}
      <header className="px-4 md:px-8 py-4 flex flex-col md:flex-row md:items-center justify-between bg-white/80 backdrop-blur sticky top-0 z-10 border-b border-gray-100">
        <div className="mb-3 md:mb-0">
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Menu Pesanan</h1>
          <p className="text-xs text-gray-400 font-medium hidden md:block">Pilih menu untuk pelanggan</p>
        </div>
        <div className="relative w-full md:w-auto">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Cari menu..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl w-full md:w-64 focus:outline-none focus:ring-1 focus:ring-orange-500 shadow-sm text-sm"
          />
        </div>
      </header>

      {/* Grid Menu (Responsif) */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-32 md:pb-8"> 
      {/* pb-32 di mobile biar konten ga ketutup floating button */}
        {filtered.length === 0 ? (
           <div className="flex flex-col items-center justify-center h-64 text-gray-300">
             <Coffee size={48} className="mb-2"/>
             <p>Tidak ada menu</p>
           </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
            {filtered.map((item, idx) => (
              <ProductCard 
                key={item.id} 
                data={item} 
                onJual={onJual} 
                loading={loadingId === item.id}
                icon={foodIcons[idx % foodIcons.length]} 
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

interface AdminLayoutProps {
  products: Product[]
  onSimpan: (form: Omit<Product, 'id'>) => Promise<void>
  onHapus: (id: number) => Promise<void>
}

function AdminLayout({ products, onSimpan, onHapus }: AdminLayoutProps) {
  const [form, setForm] = useState<AdminForm>({ name: '', modal: '', target: '' })
  const [preview, setPreview] = useState<{
    modal: number
    target: number
    final: number
    feeVal: number
    net: number
  } | null>(null)

  const hitung = () => {
    if(!form.modal || !form.target) return
    const modal = parseFloat(form.modal)
    const target = parseFloat(form.target)
    const fee = 0.38
    const raw = (modal + target) / (1 - fee)
    const final = Math.ceil(raw / 100) * 100
    setPreview({ modal, target, final, feeVal: final * fee, net: final * (1 - fee) })
  }

  const simpan = () => {
    if (!preview) return
    
    onSimpan({
      name: form.name,
      base_cost: preview.modal,
      target_profit: preview.target,
      selling_price: preview.final
    })
    setForm({name:'', modal:'', target:''}); setPreview(null)
  }

  return (
    <div className="w-full h-full overflow-y-auto bg-gray-50 p-4 md:p-8 pb-24 md:pb-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">Manajemen Menu</h1>
        
        {/* Form Card */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200">
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Input Menu</h2>
            <div className="space-y-4">
              <input 
                value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                placeholder="Nama Makanan" 
                className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl text-sm font-medium focus:outline-none focus:ring-1 focus:ring-orange-500"
              />
              <div className="flex gap-3">
                <div className="w-1/2">
                   <label className="text-[10px] font-bold text-gray-400 ml-1">MODAL</label>
                   <input type="number" value={form.modal} onChange={e => setForm({...form, modal: e.target.value})}
                     className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-orange-500" placeholder="0" />
                </div>
                <div className="w-1/2">
                   <label className="text-[10px] font-bold text-gray-400 ml-1">TARGET</label>
                   <input type="number" value={form.target} onChange={e => setForm({...form, target: e.target.value})}
                     className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-green-500 text-green-700 font-bold" placeholder="0" />
                </div>
              </div>
              <button onClick={hitung} className="w-full bg-gray-100 text-gray-600 font-bold py-3 rounded-xl text-sm hover:bg-gray-200">Hitung</button>
            </div>
            
            {/* Preview Harga */}
            {preview && (
              <div className="mt-4 bg-orange-50 rounded-xl p-4 border border-orange-100 animate-in fade-in">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-orange-800">Harga Jual</span>
                  <span className="text-xl font-black text-orange-600">Rp {formatRp(preview.final)}</span>
                </div>
                <button onClick={simpan} className="mt-3 w-full bg-orange-600 text-white font-bold py-2 rounded-lg text-sm shadow-md shadow-orange-200">SIMPAN</button>
              </div>
            )}
        </div>

        {/* List Menu */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200">
           <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Database Menu</h2>
           <div className="space-y-2">
              {products.map(p => (
                <div key={p.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div className="truncate pr-2">
                    <div className="font-bold text-gray-800 text-sm truncate">{p.name}</div>
                    <div className="text-[10px] text-gray-400">Jual: {formatRp(p.selling_price)}</div>
                  </div>
                  <button onClick={() => onHapus(p.id)} className="text-gray-300 hover:text-red-500 shrink-0"><Trash2 size={16}/></button>
                </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  )
}

interface ProductCardProps {
  data: Product
  onJual: (product: Product, qty: number) => Promise<void>
  loading: boolean
  icon: string
}

function ProductCard({ data, onJual, loading, icon }: ProductCardProps) {
  const [qty, setQty] = useState(1)

  return (
    <div className="bg-white rounded-2xl p-3 md:p-4 border border-gray-100 shadow-sm flex flex-col justify-between h-full relative">
      <div>
        <div className="w-10 h-10 md:w-12 md:h-12 bg-gray-50 rounded-full flex items-center justify-center text-xl md:text-2xl mb-2 md:mb-3">
          {icon}
        </div>
        <h3 className="font-bold text-gray-900 text-sm md:text-lg leading-tight mb-1 line-clamp-2">{data.name}</h3>
        <p className="text-gray-500 text-xs md:text-sm">Rp {formatRp(data.selling_price)}</p>
      </div>

      <div className="mt-3 pt-3 border-t border-gray-50 flex items-center gap-1 md:gap-2">
        <div className="flex items-center bg-gray-100 rounded-lg p-0.5 md:p-1 h-8 md:h-9">
          <button onClick={() => setQty(Math.max(1, qty-1))} className="w-6 md:w-7 h-full flex items-center justify-center text-gray-500"><Minus size={12}/></button>
          <span className="w-4 md:w-6 text-center text-xs font-bold">{qty}</span>
          <button onClick={() => setQty(qty+1)} className="w-6 md:w-7 h-full flex items-center justify-center text-gray-500"><Plus size={12}/></button>
        </div>
        
        <button 
          onClick={() => { onJual(data, qty); setQty(1); }}
          disabled={loading}
          className="flex-1 bg-gray-900 text-white h-8 md:h-9 rounded-lg font-bold text-[10px] md:text-xs flex items-center justify-center gap-1 active:scale-95 transition-transform"
        >
          {loading ? '...' : <ArrowRight size={14}/>}
        </button>
      </div>
    </div>
  )
}

// === LOGIN SCREEN COMPONENT ===
interface LoginScreenProps {
  onLogin: (user: AuthUser) => void
}

function LoginScreen({ onLogin }: LoginScreenProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Sign in
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase().trim(),
        password
      })
      
      if (error) {
        throw error
      }
      
      if (data.user) {
        // Get user profile with role
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('role')
          .eq('user_id', data.user.id)
          .single()
        
        onLogin({
          id: data.user.id,
          email: data.user.email!,
          role: profile?.role || 'cashier',
          user_metadata: data.user.user_metadata
        })
      }
    } catch (error: any) {
      alert(error.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-400 via-orange-500 to-red-500 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center text-orange-500 mx-auto mb-4 shadow-2xl">
            <ChefHat size={40} />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">My Business POS</h1>
          <p className="text-orange-100">Sistem Kasir Terpadu</p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-3xl p-8 shadow-2xl">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Masuk ke Sistem
            </h2>
            <p className="text-gray-500 text-sm">
              Gunakan akun yang sudah terdaftar
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="contoh@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Masukkan password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-500 text-white py-3 rounded-xl font-semibold hover:bg-orange-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                'Loading...'
              ) : (
                <>
                  <Lock size={18} />
                  Masuk
                </>
              )}
            </button>
          </form>

          {/* Admin Info */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <p className="text-sm text-gray-600 mb-2">
                <strong>👑 Admin Account:</strong>
              </p>
              <p className="text-xs text-gray-500">
                Email: <code className="bg-white px-2 py-1 rounded">admin@tokoku.com</code>
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Create this account in Supabase Authentication panel
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}