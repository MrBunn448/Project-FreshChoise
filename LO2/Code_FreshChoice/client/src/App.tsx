import React, { useState, useEffect } from 'react';
import axios from 'axios';



type User = {
  id: number;
  naam: string;
  email: string;
};


export default function App() {
  const [view, setView] = useState<'auth' | 'login' | 'register' | 'home'>('auth');
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget as HTMLFormElement);

    try {
      const res = await axios.post("http://localhost:3001/api/login", {
        email: fd.get("email"),
        wachtwoord: fd.get("wachtwoord")
      });

      setCurrentUser(res.data);
      setView("home");
    } catch {
      alert("Inloggegevens zijn onjuist.");
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget as HTMLFormElement);

    try {
      await axios.post("http://localhost:3001/api/register", {
        naam: fd.get("naam"),
        email: fd.get("email"),
        wachtwoord: fd.get("wachtwoord")
      });

      alert("Account aangemaakt! Log nu in.");
      setView("login");
    } catch {
      alert("Email bestaat al.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans">

      {/* HEADER */}
      <header className="bg-[#9CA763] text-white p-4 shadow-md sticky top-0 z-10 flex justify-between items-center">
        <h1 className="text-2xl font-bold flex items-center gap-2">Fresh Choice</h1>

        {currentUser && (
          <div className="bg-white/20 px-3 py-1 rounded-full text-sm">
            Ingelogd: {currentUser.naam}
          </div>
        )}
      </header>

      <main className="max-w-4xl mx-auto p-4">

        {/* AUTH CHOICE SCREEN */}
        {view === 'auth' && (
          <div className="flex flex-col items-center justify-center h-96 gap-4">
            <button onClick={() => setView('login')} className="bg-gray-800 text-white px-6 py-3 rounded-xl shadow">Inloggen</button>
            <button onClick={() => setView('register')} className="bg-[#9CA763] text-white px-6 py-3 rounded-xl shadow">Nieuw account</button>
          </div>
        )}

        {/* LOGIN FORM */}
        {view === 'login' && (
          <div className="bg-white max-w-md mx-auto mt-12 p-6 rounded-xl shadow">
            <h2 className="text-xl font-bold mb-4">Inloggen</h2>
            <form onSubmit={handleLogin} className="space-y-4">
              <input name="email" type="email" required placeholder="Email" className="w-full p-2 border rounded" />
              <input name="wachtwoord" type="password" required placeholder="Wachtwoord" className="w-full p-2 border rounded" />
              <button className="w-full bg-gray-800 text-white py-2 rounded">Inloggen</button>
            </form>
          </div>
        )}

        {/* REGISTER FORM */}
        {view === 'register' && (
          <div className="bg-white max-w-md mx-auto mt-12 p-6 rounded-xl shadow">
            <h2 className="text-xl font-bold mb-4">Account aanmaken</h2>
            <form onSubmit={handleRegister} className="space-y-4">
              <input name="naam" required placeholder="Naam" className="w-full p-2 border rounded" />
              <input name="email" type="email" required placeholder="Email" className="w-full p-2 border rounded" />
              <input name="wachtwoord" type="password" required placeholder="Wachtwoord" className="w-full p-2 border rounded" />
              <input name="telefoon" placeholder="Telefoon" className="w-full p-2 border rounded" />
              <input name="adres" placeholder="Adres" className="w-full p-2 border rounded" />
              <button className="w-full bg-[#9CA763] text-white py-2 rounded">Account aanmaken</button>
            </form>
          </div>
        )}

        {/* PROTECTED AREA */}
        {currentUser && view !== 'auth' && view !== 'login' && view !== 'register' && (
          <>

            {/* NAVIGATION */}
            <div className="flex gap-4 mb-6">
              <button onClick={() => setView('home')} className={`px-4 py-2 rounded-lg font-medium transition-colors ${view === 'home' ? 'bg-gray-800 text-white' : 'bg-gray-200'}`}>Overzicht</button>
            </div>

            {/* ANNOUNCEMENTS LIST */}
            {view === 'home' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold">Aankondigingen</h2>
                </div>

              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

