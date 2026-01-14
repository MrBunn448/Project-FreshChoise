import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import logo from "./assets/FreshChoiceLogo.png";

axios.defaults.withCredentials = true;

type User = {
  id: number;
  naam: string;
  email: string;
};

type Allergeen = {
  id: number;
  naam: string;
};

// Hardcoded API URL
const API_URL = "http://localhost:3001";

type View = "home" | "products" | "login" | "register" | "account";

export default function App() {
  const [view, setView] = useState<View>("home");
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Allergenen voor registratie
  const [allergenenLijst, setAllergenenLijst] = useState<Allergeen[]>([]);
  const [selectedAllergenen, setSelectedAllergenen] = useState<number[]>([]);
  const [loadingAllergenen, setLoadingAllergenen] = useState(false);

  // Check of er een ingelogde user is bij mount
  useEffect(() => {
    axios
      .get(`${API_URL}/api/me`)
      .then((res) => {
        setCurrentUser(res.data);
      })
      .catch(() => {
        setCurrentUser(null);
      });
  }, []);

  // Ophalen allergenen zodra register open is
  useEffect(() => {
    if (view !== "register") return;

    setLoadingAllergenen(true);
    axios
      .get(`${API_URL}/api/allergenen`)
      .then((res) => setAllergenenLijst(res.data))
      .catch(() => setAllergenenLijst([]))
      .finally(() => setLoadingAllergenen(false));
  }, [view]);

  const navVariant = useMemo(() => {
    return currentUser ? "loggedIn" : "loggedOut";
  }, [currentUser]);

  const toggleAllergeen = (id: number) => {
    setSelectedAllergenen((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // --------------------
  // LOGIN
  // --------------------
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget as HTMLFormElement);

    const email = String(fd.get("email") || "");
    const wachtwoord = String(fd.get("wachtwoord") || "");

    try {
      const res = await axios.post(`${API_URL}/api/login`, { email, wachtwoord });
      setCurrentUser(res.data);
      setView("home");
    } catch {
      alert("Inloggegevens zijn onjuist.");
    }
  };

  // --------------------
  // REGISTER
  // --------------------
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget as HTMLFormElement);

    const naam = String(fd.get("naam") || "");
    const email = String(fd.get("email") || "");
    const wachtwoord = String(fd.get("wachtwoord") || "");
    const telefoonnummer = String(fd.get("telefoon") || "");
    const adres = String(fd.get("adres") || "");

    try {
      await axios.post(`${API_URL}/api/register`, {
        naam,
        email,
        wachtwoord,
        telefoonnummer,
        adres,
        allergenen: selectedAllergenen, 
      });

      alert("Account aangemaakt! Log nu in.");
      setView("login");
    } catch (err: any) {
      console.log("REGISTER ERROR:", err);
      console.log("STATUS:", err?.response?.status);
      console.log("DATA:", err?.response?.data);
      alert(err?.response?.data?.error ?? "Registreren mislukt.");
    }
  };

  const handleLogout = async () => {
    try {
      await axios.post(`${API_URL}/api/logout`);
    } catch {
      // ignore
    } finally {
      setCurrentUser(null);
      setView("home");
    }
  };

  return (
    <div className="min-h-screen bg-white text-gray-800">
      <Navbar
        variant={navVariant}
        onGoHome={() => setView("home")}
        onGoAbout={() => setView("home")}
        onGoProducts={() => setView("products")}
        onGoAccount={() => setView("account")}
        onGoLogin={() => setView("login")}
        onGoRegister={() => {
          setSelectedAllergenen([]);
          setView("register");
        }}
        onLogout={handleLogout}
      />

      {/* Views */}
      {view === "home" && <HomePage isLoggedIn={!!currentUser} />}

      {view === "products" && <ProductsPage />}

      {view === "login" && (
        <LoginPage
          onSubmit={handleLogin}
          onGoRegister={() => {
            setSelectedAllergenen([]);
            setView("register");
          }}
        />
      )}

      {view === "register" && (
        <RegisterPage
          onSubmit={handleRegister}
          loadingAllergenen={loadingAllergenen}
          allergenenLijst={allergenenLijst}
          selectedAllergenen={selectedAllergenen}
          onToggleAllergeen={toggleAllergeen}
          onGoLogin={() => setView("login")}
        />
      )}

      {view === "account" && (
        <AccountPage
          user={currentUser}
          onRequireLogin={() => setView("login")}
          onUserLoaded={(u) => setCurrentUser(u)}
        />
      )}

      <Footer onGoHome={() => setView("home")} />
    </div>
  );
}

/* -----------------------------
   NAVBAR (wireframe-achtig)
----------------------------- */

function Navbar(props: {
  variant: "loggedIn" | "loggedOut";
  onGoHome: () => void;
  onGoAbout: () => void;
  onGoProducts: () => void;
  onGoAccount: () => void;
  onGoLogin: () => void;
  onGoRegister: () => void;
  onLogout: () => void;
}) {
  const {
    variant,
    onGoHome,
    onGoAbout,
    onGoProducts,
    onGoAccount,
    onGoLogin,
    onGoRegister,
    onLogout,
  } = props;

  return (
    <header className="border-b bg-white">
      <div className="mx-auto max-w-6xl px-4">
        <div className="h-16 flex items-center justify-between">
          {/* Left nav */}
          <nav className="flex items-center gap-6 text-sm text-gray-500">
            <button onClick={onGoHome} className="hover:text-gray-900">
              Home
            </button>
            <button onClick={onGoAbout} className="hover:text-gray-900">
              About Us
            </button>
            <button onClick={onGoProducts} className="hover:text-gray-900">
              Products
            </button>
            {variant === "loggedIn" && (
              <button onClick={onGoAccount} className="hover:text-gray-900">
                Account
              </button>
            )}
          </nav>

          {/* Center logo */}
          <div className="flex items-center justify-center">
            <img src={logo} alt="Fresh Choice logo" className="h-9 w-auto object-contain" />
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-3">
            {variant === "loggedOut" ? (
              <>
                <button
                  onClick={onGoRegister}
                  className="px-4 py-2 rounded-full border text-sm text-gray-700 hover:bg-gray-50"
                >
                  Register
                </button>
                <button
                  onClick={onGoLogin}
                  className="px-4 py-2 rounded-full bg-gray-700 text-white text-sm hover:bg-gray-800"
                >
                  Login
                </button>
              </>
            ) : (
              <>
                {/* “Cart” icon placeholder */}
                <button
                  className="w-10 h-10 rounded-full border flex items-center justify-center hover:bg-gray-50"
                  title="Cart"
                  aria-label="Cart"
                >
                  🛒
                </button>
                <button
                  onClick={onLogout}
                  className="px-4 py-2 rounded-full bg-gray-700 text-white text-sm hover:bg-gray-800"
                >
                  Logout
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

/* -----------------------------
   HOMEPAGE (wireframe-achtig)
----------------------------- */

function HomePage(props: { isLoggedIn: boolean }) {
  const { isLoggedIn } = props;

  return (
    <main className="mx-auto max-w-6xl px-4">
      {/* HERO */}
      <section className="mt-6">
        <div className="relative border rounded-md overflow-hidden bg-gray-100">
          {/* Image placeholder - hier kan later een <img src="..." /> in */}
          <div className="h-[360px] w-full flex items-center justify-center text-gray-400">
            {/* Later: <img className="w-full h-full object-cover" src="..." alt="Hero" /> */}
            HERO IMAGE PLACEHOLDER
          </div>

          {/* Search box (rechts boven in hero) */}
          <div className="absolute top-6 right-6 w-80">
            <label className="block text-xs text-gray-500 mb-1">Search</label>
            <div className="flex items-center gap-2 bg-white border rounded-md px-3 py-2 shadow-sm">
              <input placeholder="Enter search terms" className="w-full outline-none text-sm" />
              <span className="text-gray-400">🔍</span>
            </div>
          </div>

          {/* CTA placeholder (midden onder) */}
          <div className="absolute left-1/2 -translate-x-1/2 bottom-8">
            <button className="px-6 py-2 rounded-full bg-gray-200 text-gray-700 text-sm">
              Button label
            </button>
          </div>
        </div>
      </section>

      {/* MID SECTION */}
      <section className="mt-12 text-center">
        <h2 className="text-3xl font-semibold text-gray-700">Welkom!</h2>
        <p className="mt-3 text-gray-500 max-w-2xl mx-auto">Tekstje om de gebruiker te verwelkomen</p>
      </section>

      {/* FEATURES */}
      <section className="mt-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <FeatureCard icon="📍" title="Choose products" desc="Tekstje over het kiezen van producten." />
          <FeatureCard icon="🗓️" title="Add them in your basket" desc="Tekstje over het toevoegen van producten aan je mandje." />
          <FeatureCard icon="🚗" title="Easy to find, easy to collect" desc="Tekstje over het binnenkrijgen van je bestelling." />
        </div>
      </section>

      {/* Kleine statusregel */}
      <section className="mt-12 mb-8">
        <div className="h-2 rounded-full bg-gray-100" />
        <p className="mt-3 text-xs text-gray-400">
          {isLoggedIn ? "You are logged in." : "You are viewing as guest."}
        </p>
      </section>
    </main>
  );
}

function FeatureCard(props: { icon: string; title: string; desc: string }) {
  const { icon, title, desc } = props;
  return (
    <div className="text-center">
      <div className="mx-auto w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center text-2xl">
        {icon}
      </div>
      <h3 className="mt-4 font-semibold text-gray-700">{title}</h3>
      <p className="mt-2 text-sm text-gray-500">{desc}</p>
    </div>
  );
}

/* -----------------------------
 PRODUCTS PAGE
----------------------------- */
type Product = {
  id: number;
  naam: string;
  prijs: number;
  categorie: string;
  imageUrl?: string; // later echte image
  allergeen_id?: number | null;
  allergeen_naam?: string | null;
};

function ProductsPage() {
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [showNonAllergenOnly, setShowNonAllergenOnly] = useState(false);
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);

  // cart: map productId -> qty
  const [cart, setCart] = useState<Record<number, number>>({});
  const [confirmAdd, setConfirmAdd] = useState<{ productId: number; add: number; allerNaam: string } | null>(null);

  // user's allergenen (from /api/my-allergenen) used to show warnings; optional
  const [myAllergenen, setMyAllergenen] = useState<number[]>([]);

  useEffect(() => {
    setLoading(true);
    axios
      .get(`${API_URL}/api/products`)
      .then((res) => setProducts(res.data || []))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));

    // Try to fetch my allergenen; ignore errors (user may be guest)
    axios.get(`${API_URL}/api/my-allergenen`).then((res) => setMyAllergenen(Array.isArray(res.data) ? res.data : [])).catch(() => {});
  }, []);

  const addToCart = (productId: number, add = 1) => {
    const prod = products.find((p) => p.id === productId);
    if (prod && prod.allergeen_id && myAllergenen.includes(prod.allergeen_id)) {
      // show confirmation modal with custom button text
      const allerNaam = prod.allergeen_naam || 'een allergeen';
      setConfirmAdd({ productId, add, allerNaam });
      return;
    }

    setCart((c) => {
      const next = { ...c };
      next[productId] = Math.min(99, (next[productId] || 0) + add);
      return next;
    });
  };

  const removeFromCart = (productId: number) => {
    setCart((c) => {
      const next = { ...c };
      delete next[productId];
      return next;
    });
  };

  const updateQty = (productId: number, qty: number) => {
    if (qty <= 0) return removeFromCart(productId);
    setCart((c) => ({ ...c, [productId]: Math.min(99, qty) }));
  };

  const filtered = products.filter((p) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return p.naam.toLowerCase().includes(q) || String(p.allergeen_naam || "").toLowerCase().includes(q);
  });
  // apply non-allergen filter
  const visible = filtered.filter((p) => {
    if (!showNonAllergenOnly) return true;
    if (!p.allergeen_id) return true;
    return !myAllergenen.includes(p.allergeen_id);
  });

  const fetchProductDetail = async (id: number) => {
    const res = await axios.get(`${API_URL}/api/products/${id}`);
    return res.data as Product;
  };

  // Handlers for the confirm-add modal (shown when adding allergenic products)
  const handleConfirmAdd = (productId: number, add: number) => {
    setCart((c: Record<number, number>) => {
      const next = { ...c };
      next[productId] = Math.min(99, (next[productId] || 0) + add);
      return next;
    });
    setConfirmAdd(null);
  };

  const handleCancelAdd = () => setConfirmAdd(null);

  return (
    <main className="mx-auto max-w-6xl px-4">
      <section className="mt-10 flex flex-col md:flex-row md:items-start md:justify-between gap-6">
        <div>
          <h1 className="text-5xl font-semibold text-gray-800">Products</h1>
          <p className="text-sm text-gray-500 mt-2">POC: alleen Brood, Kaas en Noten zijn beschikbaar.</p>
        </div>

        <div className="w-full md:w-96">
          <label className="block text-sm text-gray-600 mb-2">Search</label>
          <div className="flex items-center gap-2 bg-white border rounded-md px-3 py-2 shadow-sm">
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Enter search terms" className="w-full outline-none text-sm" />
            <span className="text-gray-400">🔍</span>
          </div>
        </div>
      </section>

      <section className="mt-6 grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3">
          <div className="mt-6">
            <div className="flex items-center gap-4 mb-4">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={showNonAllergenOnly} onChange={(e) => setShowNonAllergenOnly(e.target.checked)} />
                Alleen non-allergenen tonen (gebruikersfilter)
              </label>
            </div>
                {loading ? (
              <div className="text-gray-500">Laden...</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
                {visible.map((p) => (
                  <ProductCard key={p.id} product={p} onAdd={() => addToCart(p.id)} onView={() => { fetchProductDetail(p.id).then((pd)=> setDetailProduct(pd)).catch(()=>{}) }} myAllergenen={myAllergenen} />
                ))}
                {/* Product detail modal (shows when detailProduct is set) */}
                <ProductDetailModal product={detailProduct} onClose={() => setDetailProduct(null)} myAllergenen={myAllergenen} />
              </div>
            )}
          </div>
        </div>

          <aside className="lg:col-span-1">
          <CartSidebar products={products} cart={cart} onAdd={addToCart} onRemove={removeFromCart} onUpdate={updateQty} setCart={setCart} myAllergenen={myAllergenen} confirmAdd={confirmAdd} onConfirmAdd={handleConfirmAdd} onCancelAdd={handleCancelAdd} />
        </aside>
      </section>
    </main>
  );
}

// Product detail modal (simple)
function ProductDetailModal({ product, onClose, myAllergenen }: { product: Product | null; onClose: () => void; myAllergenen: number[] }) {
  if (!product) return null;

  const containsAllergeen = product.allergeen_id ? myAllergenen.includes(product.allergeen_id) : false;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-40">
      <div className="bg-white rounded-md p-6 max-w-md w-full">
        <h3 className="text-xl font-semibold mb-2">{product.naam}</h3>
        <p className="text-sm text-gray-600">Prijs: € {product.prijs.toFixed(2)}</p>
        <p className="text-sm text-gray-600">Allergeen: {product.allergeen_naam ?? 'Geen'}</p>

        {containsAllergeen && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 text-red-700 rounded">
            <strong>Waarschuwing:</strong> Dit product bevat een allergeen waarvoor je gemarkeerd bent. Kies een alternatief.
          </div>
        )}

        <div className="mt-4 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded bg-gray-200">Close</button>
        </div>
      </div>
    </div>
  );
}

function ProductCard({ product, onAdd, onView, myAllergenen }: { product: Product; onAdd: () => void; onView?: () => void; myAllergenen: number[] }) {
  const hasAllergeen = product.allergeen_id && myAllergenen.includes(product.allergeen_id);

  return (
    <div className="group border rounded-md p-4">
      <div className="border rounded-md bg-gray-100 overflow-hidden">
        <div className="aspect-square flex items-center justify-center text-gray-400">IMAGE</div>
      </div>

      <div className="mt-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-gray-800 group-hover:underline">{product.naam}</h3>
          <p className="text-sm text-gray-500">{product.allergeen_naam ?? ''}</p>
        </div>

        <div className="text-sm font-semibold text-gray-700">€ {product.prijs.toFixed(2)}</div>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button onClick={onAdd} className="px-4 py-2 rounded-full bg-gray-200 text-sm text-gray-700 hover:bg-gray-300">Add</button>
  <button onClick={onView} className="px-3 py-1 rounded-full border text-xs text-gray-600">View</button>
        {hasAllergeen && <span className="ml-auto text-sm text-red-600 font-semibold">! Contains allergen</span>}
      </div>
   </div>
  );
}

function CartSidebar({ products, cart, onAdd, onRemove, onUpdate, setCart, myAllergenen, confirmAdd, onConfirmAdd, onCancelAdd }: { products: Product[]; cart: Record<number, number>; onAdd: (id:number, add?:number)=>void; onRemove: (id:number)=>void; onUpdate: (id:number, qty:number)=>void; setCart: any; myAllergenen: number[]; confirmAdd: { productId: number; add: number; allerNaam: string } | null; onConfirmAdd: (productId:number, add:number)=>void; onCancelAdd: ()=>void }) {
  const items = Object.entries(cart).map(([pid, qty]) => {
    const p = products.find((x) => x.id === Number(pid));
    return p ? { ...p, qty: Number(qty) } : null;
  }).filter(Boolean) as Array<Product & { qty: number }>;

  const subtotal = items.reduce((s, it) => s + it.prijs * it.qty, 0);

  const checkout = async () => {
    if (items.length === 0) return alert('Cart is empty');

    // build order payload: items with productId and qty
    const payload = { items: items.map(i => ({ productId: i.id, qty: i.qty })) };
    try {
      const res = await axios.post(`${API_URL}/api/orders`, payload);
      // If barcode image present, show modal with PNG (scanbaar). Otherwise fallback to text alert.
      const img = res.data?.barcodeImage;
      const barcodeText = res.data?.barcode;
      if (img) {
        setBarcodeImage(img);
      } else if (barcodeText) {
        alert(`Order confirmed. Barcode: ${barcodeText}`);
      } else {
        alert('Order confirmed.');
      }
      // clear cart
      setCart({});
    } catch (err: any) {
      alert(err?.response?.data?.error ?? 'Order failed');
    }
  };

  const [barcodeImage, setBarcodeImage] = useState<string | null>(null);
  // confirmAdd state and handlers are provided by parent (ProductsPage)

  return (
    <div className="border rounded-md p-4 bg-white">
      <h3 className="font-semibold text-gray-800">Cart</h3>
      {items.length === 0 ? (
        <div className="mt-4 text-sm text-gray-500">No items yet.</div>
      ) : (
        <div className="mt-4 space-y-3">
          {items.map((it) => (
            <div key={it.id} className="flex items-center gap-3">
              <div className="flex-1">
                <div className="text-sm font-medium">{it.naam}</div>
                <div className="text-xs text-gray-500">€ {it.prijs.toFixed(2)}</div>
                {it.allergeen_id && myAllergenen.includes(it.allergeen_id) && (
                  <div className="text-xs text-red-600 font-semibold">Warning: contains your allergen</div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => onUpdate(it.id, Math.max(0, it.qty - 1))} className="px-2 py-1 border rounded">-</button>
                <div className="w-8 text-center">{it.qty}</div>
                <button onClick={() => onUpdate(it.id, it.qty + 1)} className="px-2 py-1 border rounded">+</button>
              </div>
            </div>
          ))}

          <div className="border-t pt-3">
            <div className="flex justify-between text-sm text-gray-700"><span>Subtotal</span><span>€ {subtotal.toFixed(2)}</span></div>
            <button onClick={checkout} className="mt-3 w-full px-4 py-2 rounded-full bg-gray-700 text-white">Confirm order (generate barcode)</button>
          </div>
        </div>
      )}
      {/* Show modal with scannable barcode image when available */}
      <BarcodeModal image={barcodeImage} onClose={() => setBarcodeImage(null)} />
      <ConfirmModal openData={confirmAdd} onConfirm={onConfirmAdd} onCancel={onCancelAdd} />
    </div>
  );
}

function BarcodeModal({ image, onClose }: { image: string | null; onClose: () => void }) {
  if (!image) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-md p-6 max-w-xl w-full">
        <h3 className="text-lg font-semibold mb-3">Your order barcode</h3>
        <div className="flex flex-col items-center gap-4">
          <img src={image} alt="Barcode" className="max-w-full h-auto" />
          <div className="text-sm text-gray-600">Scan this barcode at collection</div>
          <div className="flex gap-2 mt-4">
            <a href={image} download="barcode.png" className="px-4 py-2 rounded bg-gray-200">Download PNG</a>
            <button onClick={onClose} className="px-4 py-2 rounded bg-gray-700 text-white">Close</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* -----------------------------
   LOGIN PAGE (wireframe-achtig)
----------------------------- */

function LoginPage(props: { onSubmit: (e: React.FormEvent) => void; onGoRegister: () => void }) {
  const { onSubmit, onGoRegister } = props;

  return (
    <main className="mx-auto max-w-6xl px-4">
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
        {/* Left form */}
        <div className="py-8">
          <h1 className="text-5xl font-semibold text-gray-800">Welcome back!</h1>

          <form onSubmit={onSubmit} className="mt-10 max-w-lg space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm text-gray-600 mb-2">Email</label>
                <input
                  name="email"
                  type="email"
                  required
                  className="w-full border rounded-md px-3 py-2 outline-none"
                  placeholder="Email"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-2">Password</label>
                <input
                  name="wachtwoord"
                  type="password"
                  required
                  className="w-full border rounded-md px-3 py-2 outline-none"
                  placeholder="Password"
                />
              </div>
            </div>

            <button className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-gray-200 text-gray-700 text-sm">
              Login <span className="text-gray-400">+</span>
            </button>

            <div className="text-sm text-gray-500">
              No account?{" "}
              <button type="button" onClick={onGoRegister} className="underline hover:text-gray-800">
                Register
              </button>
            </div>
          </form>
        </div>

        {/* Right image placeholder */}
        <div className="border rounded-md bg-gray-100 flex items-center justify-center text-gray-400 min-h-[520px]">
          IMAGE PLACEHOLDER
        </div>
      </div>
    </main>
  );
}

/* -----------------------------
   REGISTER PAGE (wireframe-achtig + allergenen)
----------------------------- */

function RegisterPage(props: {
  onSubmit: (e: React.FormEvent) => void;
  onGoLogin: () => void;
  loadingAllergenen: boolean;
  allergenenLijst: Allergeen[];
  selectedAllergenen: number[];
  onToggleAllergeen: (id: number) => void;
}) {
  const {
    onSubmit,
    onGoLogin,
    loadingAllergenen,
    allergenenLijst,
    selectedAllergenen,
    onToggleAllergeen,
  } = props;

  return (
    <main className="mx-auto max-w-6xl px-4">
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
        {/* Left form */}
        <div className="py-8">
          <h1 className="text-5xl font-semibold text-gray-800">Hi! Who are you?</h1>

          <form onSubmit={onSubmit} className="mt-10 max-w-lg space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Field label="Name">
                <input
                  name="naam"
                  required
                  className="w-full border rounded-md px-3 py-2 outline-none"
                  placeholder="Your name"
                />
              </Field>

              <Field label="Email">
                <input
                  name="email"
                  type="email"
                  required
                  className="w-full border rounded-md px-3 py-2 outline-none"
                  placeholder="Email"
                />
              </Field>

              <Field label="Password">
                <input
                  name="wachtwoord"
                  type="password"
                  required
                  className="w-full border rounded-md px-3 py-2 outline-none"
                  placeholder="Password"
                />
              </Field>

              <Field label="Phone number">
                <input
                  name="telefoon"
                  className="w-full border rounded-md px-3 py-2 outline-none"
                  placeholder="Phone number"
                />
              </Field>

              <div className="md:col-span-2">
                <Field label="Address">
                  <input
                    name="adres"
                    className="w-full border rounded-md px-3 py-2 outline-none"
                    placeholder="Address"
                  />
                </Field>
              </div>
            </div>

            {/* Allergenen block */}
            <div className="border rounded-md p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold text-gray-700">Allergenen (optioneel)</p>
                  <p className="text-sm text-gray-500">
                    Vink aan waar je allergisch voor bent. Laat leeg als je geen allergieën hebt.
                  </p>
                </div>
                <span className="text-xs text-gray-400">optional</span>
              </div>

              <div className="mt-3">
                {loadingAllergenen ? (
                  <p className="text-sm text-gray-500">Allergenen laden...</p>
                ) : allergenenLijst.length === 0 ? (
                  <p className="text-sm text-gray-500">Geen allergenen beschikbaar.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-auto pr-1">
                    {allergenenLijst.map((a) => (
                      <label key={a.id} className="flex items-center gap-2 text-sm text-gray-700">
                        <input
                          type="checkbox"
                          checked={selectedAllergenen.includes(a.id)}
                          onChange={() => onToggleAllergeen(a.id)}
                        />
                        <span>{a.naam}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <button className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-gray-200 text-gray-700 text-sm">
              Register <span className="text-gray-400">+</span>
            </button>

            <div className="text-sm text-gray-500">
              Already have an account?{" "}
              <button type="button" onClick={onGoLogin} className="underline hover:text-gray-800">
                Login
              </button>
            </div>
          </form>
        </div>

        {/* Right image placeholder */}
        <div className="border rounded-md bg-gray-100 flex items-center justify-center text-gray-400 min-h-[520px]">
          IMAGE PLACEHOLDER
        </div>
      </div>
    </main>
  );
}

function Field(props: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm text-gray-600 mb-2">{props.label}</label>
      {props.children}
    </div>
  );
}

/* -----------------------------
   ACCOUNT PAGE (Settings layout + allergenen aanpassen)
----------------------------- */

type Profile = {
  id: number;
  naam: string;
  email: string;
  adres: string | null;
  telefoonnummer: string | null;
};

function AccountPage(props: {
  user: User | null;
  onRequireLogin: () => void;
  onUserLoaded?: (u: User) => void;
}) {
  const { user, onRequireLogin, onUserLoaded } = props;

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);

  const [naam, setNaam] = useState("");
  const [email, setEmail] = useState("");
  const [adres, setAdres] = useState("");
  const [telefoon, setTelefoon] = useState("");
  const [saving, setSaving] = useState(false);

  //  Allergenen in account
  const [allergenen, setAllergenen] = useState<Allergeen[]>([]);
  const [selectedMyAllergenen, setSelectedMyAllergenen] = useState<number[]>([]);
  const [loadingAllergenen, setLoadingAllergenen] = useState(false);
  const [savingAllergenen, setSavingAllergenen] = useState(false);

  const toggleMyAllergeen = (id: number) => {
    setSelectedMyAllergenen((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  useEffect(() => {
    const init = async () => {
      try {
        // check sessie
        if (!user) {
          const meRes = await axios.get(`${API_URL}/api/me`);
          onUserLoaded?.(meRes.data);
        }

        // profiel
        const profRes = await axios.get(`${API_URL}/api/profile`);
        setProfile(profRes.data);
        setNaam(profRes.data.naam ?? "");
        setEmail(profRes.data.email ?? "");
        setAdres(profRes.data.adres ?? "");
        setTelefoon(profRes.data.telefoonnummer ?? "");

        // allergenen master + mijn selectie
        setLoadingAllergenen(true);
        const [allRes, myRes] = await Promise.all([
          axios.get(`${API_URL}/api/allergenen`),
          axios.get(`${API_URL}/api/my-allergenen`).catch(() => ({ data: [] })),
        ]);
        setAllergenen(allRes.data || []);
        setSelectedMyAllergenen(Array.isArray(myRes.data) ? myRes.data : []);
      } catch (err) {
        console.log("ACCOUNT PAGE ERROR:", err);
        onRequireLogin();
      } finally {
        setLoading(false);
        setLoadingAllergenen(false);
      }
    };

    init();
  }, []);

  const saveProfile = async () => {
    setSaving(true);
    try {
      await axios.put(`${API_URL}/api/profile`, {
        naam,
        email,
        adres,
        telefoonnummer: telefoon,
      });

      // profile state syncen
      setProfile((p) =>
        p
          ? {
              ...p,
              naam,
              email,
              adres: adres || null,
              telefoonnummer: telefoon || null,
            }
          : p
      );

      alert("Profiel opgeslagen!");
    } catch (err: any) {
      alert(err?.response?.data?.error ?? "Opslaan mislukt.");
    } finally {
      setSaving(false);
    }
  };

  const saveMyAllergenen = async () => {
    setSavingAllergenen(true);
    try {
      await axios.put(`${API_URL}/api/my-allergenen`, {
        allergenen: selectedMyAllergenen,
      });
      alert("Allergenen opgeslagen!");
    } catch (err: any) {
      alert(err?.response?.data?.error ?? "Allergenen opslaan mislukt.");
    } finally {
      setSavingAllergenen(false);
    }
  };

  if (loading) {
    return (
      <main className="mx-auto max-w-6xl px-4">
        <div className="mt-10 text-gray-500">Laden...</div>
      </main>
    );
  }

  if (!profile) return null;

  return (
    <main className="mx-auto max-w-6xl px-4">
      <div className="mt-10">
        <h1 className="text-5xl font-semibold text-gray-800">Settings</h1>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
          <aside className="lg:col-span-3">
            <div className="space-y-2 text-sm text-gray-600">
              <div className="font-semibold text-gray-700">Account</div>
              <div className="hover:text-gray-900 cursor-pointer">Notifications</div>
              <div className="hover:text-gray-900 cursor-pointer">Password</div>
              <div className="hover:text-gray-900 cursor-pointer">Preference</div>
            </div>
          </aside>

          <section className="lg:col-span-9">
            <div className="border rounded-md bg-gray-100 p-8">
              <h2 className="text-2xl font-semibold text-gray-800">Avatar</h2>

              <div className="mt-6 flex items-center gap-6">
                <div className="w-20 h-20 rounded-full bg-gray-300" />
                <div className="flex items-center gap-3">
                  <button className="px-4 py-2 rounded-full bg-gray-200 text-sm text-gray-700">
                    Upload
                  </button>
                  <button className="px-4 py-2 rounded-full bg-gray-200 text-sm text-gray-700">
                    Remove
                  </button>
                </div>
              </div>

              {/* Profiel velden */}
              <div className="mt-8 border-t border-gray-300 pt-6">
                <div className="max-w-2xl">
                  <label className="block text-sm text-gray-600 mb-2">User name</label>
                  <input
                    className="w-full border rounded-md px-3 py-2 outline-none bg-white"
                    value={naam}
                    onChange={(e) => setNaam(e.target.value)}
                  />
                </div>

                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
                  <div>
                    <label className="block text-sm text-gray-600 mb-2">Email</label>
                    <input
                      className="w-full border rounded-md px-3 py-2 outline-none bg-white"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-600 mb-2">Phone number</label>
                    <input
                      className="w-full border rounded-md px-3 py-2 outline-none bg-white"
                      value={telefoon}
                      onChange={(e) => setTelefoon(e.target.value)}
                      placeholder="06..."
                    />
                  </div>
                </div>

                <div className="mt-6 max-w-2xl">
                  <label className="block text-sm text-gray-600 mb-2">Adres</label>
                  <input
                    className="w-full border rounded-md px-3 py-2 outline-none bg-white"
                    value={adres}
                    onChange={(e) => setAdres(e.target.value)}
                    placeholder="Straat + huisnummer"
                  />
                </div>

                <div className="mt-8 flex justify-end">
                  <button
                    onClick={saveProfile}
                    disabled={saving}
                    className="px-6 py-2 rounded-full bg-gray-200 text-gray-700 text-sm disabled:opacity-60"
                  >
                    {saving ? "Opslaan..." : "Save profile"}
                  </button>
                </div>
              </div>

              {/* Allergenen blok in Account */}
              <div className="mt-10 border-t border-gray-300 pt-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800">Allergenen</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Vink aan waar je allergisch voor bent. Laat leeg als je geen allergieën hebt.
                    </p>
                  </div>
                  <span className="text-xs text-gray-400">optional</span>
                </div>

                <div className="mt-4">
                  {loadingAllergenen ? (
                    <p className="text-sm text-gray-500">Allergenen laden...</p>
                  ) : allergenen.length === 0 ? (
                    <p className="text-sm text-gray-500">Geen allergenen beschikbaar.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-auto pr-1 bg-white border rounded-md p-4">
                      {allergenen.map((a) => (
                        <label key={a.id} className="flex items-center gap-2 text-sm text-gray-700">
                          <input
                            type="checkbox"
                            checked={selectedMyAllergenen.includes(a.id)}
                            onChange={() => toggleMyAllergeen(a.id)}
                          />
                          <span>{a.naam}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={saveMyAllergenen}
                    disabled={savingAllergenen || loadingAllergenen}
                    className="px-6 py-2 rounded-full bg-gray-200 text-gray-700 text-sm disabled:opacity-60"
                  >
                    {savingAllergenen ? "Opslaan..." : "Save allergenen"}
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

function Footer(props: { onGoHome: () => void }) {
  const { onGoHome } = props;

  return (
    <footer className="mt-16 border-t bg-white">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-sm text-gray-500">
          <div className="flex items-center gap-6">
            <button onClick={onGoHome} className="hover:text-gray-900">
              Home
            </button>
            <button className="hover:text-gray-900">About Us</button>
            <button className="hover:text-gray-900">Contact</button>
          </div>

          <div className="flex items-center justify-center">
            <img src={logo} alt="Fresh Choice logo" className="h-8 w-auto object-contain" />
          </div>

          <div className="flex items-center gap-6">
            <button className="hover:text-gray-900">Careers</button>
            <button className="hover:text-gray-900">Visit us</button>
            <button className="hover:text-gray-900">Blog</button>
          </div>
        </div>
      </div>
    </footer>
  );
}

function ConfirmModal({ openData, onConfirm, onCancel }: { openData: { productId: number; add: number; allerNaam: string } | null; onConfirm: (productId:number, add:number)=>void; onCancel: ()=>void }) {
  if (!openData) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-md p-6 max-w-md w-full">
        <h3 className="text-lg font-semibold mb-2">Waarschuwing: bevat allergeen</h3>
        <p className="text-sm text-gray-700">Dit product bevat {openData.allerNaam}. Weet je zeker dat je het wilt toevoegen?</p>
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={() => onCancel()} className="px-4 py-2 rounded bg-gray-200">Annuleren</button>
          <button onClick={() => onConfirm(openData.productId, openData.add)} className="px-4 py-2 rounded bg-green-600 text-white">Toch toevoegen</button>
        </div>
      </div>
    </div>
  );
}