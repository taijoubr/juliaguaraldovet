import React, { useState, useEffect } from 'react';
import { CMSState } from './types';
import { INITIAL_CMS_DATA } from './initialData';
import MainSite from './components/MainSite';
import AdminPanel from './components/AdminPanel';
import { motion, AnimatePresence } from 'motion/react';
import { Activity, Heart } from 'lucide-react';
import { onAuthStateChanged, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from './firebase';
import { 
  testFirestoreConnection, 
  seedFirestoreIfEmpty, 
  loadCMSState, 
  isUserAdmin, 
  incrementStats 
} from './lib/firestoreSync';

export default function App() {
  // Splash Screen loading state
  const [loading, setLoading] = useState<boolean>(true);
  
  // App views: 'site' (public) or 'admin' (private dashboard)
  const [view, setView] = useState<'site' | 'admin'>('site');

  // Track if current user is an authorized admin
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  // CMS State Engine loaded from Firestore
  const [cmsState, setCmsState] = useState<CMSState>(INITIAL_CMS_DATA);

  // Track page views and accesses on boot
  useEffect(() => {
    // Run connection test in the background
    const runBackgroundInit = async () => {
      try {
        await testFirestoreConnection();
      } catch (e) {
        console.error("Failed background initialization:", e);
      }
    };
    runBackgroundInit();

    // Set up authentication observer immediately
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      let activeUser = user;
      let isRestoring = false;

      // Auto-restore background Firebase session if logged in via localStorage using password method
      if (!activeUser && localStorage.getItem('vet_admin_auth') === 'true' && localStorage.getItem('vet_admin_auth_method') === 'password') {
        const role = localStorage.getItem('vet_admin_role');
        const email = role === 'master' ? 'ncodes@drajuliaguaraldo.com' : (role === 'owner' ? 'julia@drajuliaguaraldo.com' : null);
        const pass = role === 'master' ? 'Taijou13' : (role === 'owner' ? 'Julia123' : null);
        if (email && pass) {
          isRestoring = true;
          try {
            const credential = await signInWithEmailAndPassword(auth, email, pass);
            activeUser = credential.user;
          } catch (err) {
            console.error("Auto-restore auth failed:", err);
          } finally {
            isRestoring = false;
          }
        }
      }

      const adminStatus = isUserAdmin(activeUser?.email);
      setIsAdmin(adminStatus);

      // Instantly let the app show the UI state so the user never gets stuck on a splash screen
      if (!isRestoring) {
        setLoading(false);
      }

      if (adminStatus) {
        try {
          // Seed the database only when the authorized admin is authenticated
          await seedFirestoreIfEmpty();
        } catch (err) {
          console.error("Failed to seed Firestore after admin login:", err);
        }
      }

      try {
        // Load live CMS state from Firestore in background
        const dbState = await loadCMSState(adminStatus);
        setCmsState(dbState);

        // Update visitor statistics securely on launch if not admin
        if (!adminStatus) {
          try {
            await incrementStats(1, 2);
            const refreshedState = await loadCMSState(adminStatus);
            setCmsState(refreshedState);
          } catch (err) {
            console.error("Failed to increment stats:", err);
          }
        }
      } catch (err) {
        console.error("Error syncing live state from Firestore:", err);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Sync state mutations to state locally
  const handleUpdateState = (newState: CMSState) => {
    setCmsState(newState);
  };

  return (
    <div className="min-h-screen bg-vet-bg">
      <AnimatePresence mode="wait">
        {loading ? (
          /* --- ELEGANT VET CLINIC LOADING SCREEN --- */
          <motion.div
            key="loader"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.6 }}
            className="fixed inset-0 z-50 bg-vet-bg flex flex-col items-center justify-center p-6"
          >
            <div className="relative flex flex-col items-center max-w-sm text-center space-y-6">
              {/* Pulsating heart with stethoscope pulse inside an organic leaf blob */}
              <div className="relative">
                <motion.div 
                  animate={{ scale: [1, 1.15, 1] }}
                  transition={{ repeat: Infinity, duration: 1.4, ease: "easeInOut" }}
                  className="bg-vet-light/20 p-7 rounded-[50%_50%_50%_0] text-vet-dark shadow-xs flex items-center justify-center"
                >
                  <Heart size={44} fill="#8EBB63" strokeWidth={1} />
                </motion.div>
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
                  className="absolute inset-0 border-2 border-dashed border-vet-leaf/30 rounded-[50%_50%_50%_0]"
                ></motion.div>
              </div>

              {/* Soothing medical text */}
              <div className="space-y-1">
                <h1 className="text-3xl font-medium text-neutral-800 font-serif tracking-tight">
                  Dra. Júlia Guaraldo
                </h1>
                <p className="text-[10px] text-vet-dark font-semibold uppercase tracking-widest">
                  Atendimento Veterinário Domiciliar
                </p>
              </div>

              {/* Pulse waves */}
              <div className="flex items-center gap-1.5 text-vet-leaf pt-2 justify-center">
                <Activity size={18} className="animate-pulse" />
                <span className="text-[11px] text-neutral-400 font-medium tracking-wide">Carregando ambiente seguro...</span>
              </div>
            </div>
          </motion.div>
        ) : (
          /* --- APPLICATION VIEWS --- */
          <motion.div
            key="app-content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
          >
            {view === 'site' ? (
              <MainSite 
                cmsState={cmsState} 
                onUpdateState={handleUpdateState}
                onOpenAdmin={() => setView('admin')}
              />
            ) : (
              <AdminPanel 
                cmsState={cmsState}
                onUpdateState={handleUpdateState}
                onClose={() => setView('site')}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
