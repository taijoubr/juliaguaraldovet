import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  getDocFromServer,
  writeBatch
} from 'firebase/firestore';
import { db, auth, OperationType, handleFirestoreError } from '../firebase';
import { CMSState, ClinicInfo, Service, MediaItem, Testimonial, BlogPost, Appointment, SiteStats } from '../types';
import { INITIAL_CMS_DATA } from '../initialData';

// Validate connection on boot as mandated by the Firebase Skill
export async function testFirestoreConnection() {
  try {
    // Attempt a direct server fetch to verify connection path
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration or network status.");
    }
  }
}

// Check if clinicInfo settings exists, if not seed the Firestore database
export async function seedFirestoreIfEmpty() {
  const infoRef = doc(db, 'settings', 'clinicInfo');
  try {
    const snap = await getDoc(infoRef);
    if (!snap.exists()) {
      console.log('Firestore is empty. Seeding defaults...');
      
      // Seed Settings
      await setDoc(infoRef, INITIAL_CMS_DATA.info);

      // Seed Services
      for (const item of INITIAL_CMS_DATA.services) {
        await setDoc(doc(db, 'services', item.id), item);
      }

      // Seed Media Items
      for (const item of INITIAL_CMS_DATA.media) {
        await setDoc(doc(db, 'media', item.id), item);
      }

      // Seed Testimonials
      for (const item of INITIAL_CMS_DATA.testimonials) {
        await setDoc(doc(db, 'testimonials', item.id), item);
      }

      // Seed Blog Posts
      for (const item of INITIAL_CMS_DATA.blog) {
        await setDoc(doc(db, 'blog', item.id), item);
      }

      // Seed Stats
      await setDoc(doc(db, 'stats', 'siteStats'), INITIAL_CMS_DATA.stats);

      // Seed default appointments
      for (const item of INITIAL_CMS_DATA.appointments) {
        await setDoc(doc(db, 'appointments', item.id), item);
      }

      console.log('Seeding complete!');
    }
  } catch (err) {
    // If permission or other error during check, we log it
    console.warn('Seeding check resulted in error (might be unauthenticated):', err);
  }
}

// Function to check if the current user is an authorized admin
export function isUserAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  // Bootstrapped Admin check from runtime metadata
  return email === 'p.nikolas3@gmail.com';
}

// Fetch complete public and private state (conditional on auth)
export async function loadCMSState(isAdminUser: boolean): Promise<CMSState> {
  const state: Partial<CMSState> = {};

  try {
    // 1. Load Info Settings
    const infoRef = doc(db, 'settings', 'clinicInfo');
    const infoSnap = await getDoc(infoRef);
    if (infoSnap.exists()) {
      state.info = infoSnap.data() as ClinicInfo;
    } else {
      state.info = INITIAL_CMS_DATA.info;
    }
  } catch (e) {
    console.error('Error loading clinicInfo from Firestore:', e);
    state.info = INITIAL_CMS_DATA.info;
  }

  try {
    // 2. Load Services
    const servicesSnap = await getDocs(collection(db, 'services'));
    const services: Service[] = [];
    servicesSnap.forEach(docSnap => {
      services.push(docSnap.data() as Service);
    });
    state.services = services.length > 0 ? services : INITIAL_CMS_DATA.services;
  } catch (e) {
    console.error('Error loading services from Firestore:', e);
    state.services = INITIAL_CMS_DATA.services;
  }

  try {
    // 3. Load Media Items
    const mediaSnap = await getDocs(collection(db, 'media'));
    const media: MediaItem[] = [];
    mediaSnap.forEach(docSnap => {
      media.push(docSnap.data() as MediaItem);
    });
    state.media = media.length > 0 ? media : INITIAL_CMS_DATA.media;
  } catch (e) {
    console.error('Error loading media from Firestore:', e);
    state.media = INITIAL_CMS_DATA.media;
  }

  try {
    // 4. Load Testimonials
    const testimonialsSnap = await getDocs(collection(db, 'testimonials'));
    const testimonials: Testimonial[] = [];
    testimonialsSnap.forEach(docSnap => {
      testimonials.push(docSnap.data() as Testimonial);
    });
    state.testimonials = testimonials.length > 0 ? testimonials : INITIAL_CMS_DATA.testimonials;
  } catch (e) {
    console.error('Error loading testimonials from Firestore:', e);
    state.testimonials = INITIAL_CMS_DATA.testimonials;
  }

  try {
    // 5. Load Blog Posts
    const blogSnap = await getDocs(collection(db, 'blog'));
    const blog: BlogPost[] = [];
    blogSnap.forEach(docSnap => {
      blog.push(docSnap.data() as BlogPost);
    });
    state.blog = blog.length > 0 ? blog : INITIAL_CMS_DATA.blog;
  } catch (e) {
    console.error('Error loading blog from Firestore:', e);
    state.blog = INITIAL_CMS_DATA.blog;
  }

  // 6. Load Appointments (Securely conditional on isAdminUser)
  if (isAdminUser) {
    try {
      const appointmentsSnap = await getDocs(collection(db, 'appointments'));
      const appointments: Appointment[] = [];
      appointmentsSnap.forEach(docSnap => {
        appointments.push(docSnap.data() as Appointment);
      });
      state.appointments = appointments;
    } catch (e) {
      console.error('Error loading appointments from Firestore:', e);
      state.appointments = [];
    }
  } else {
    // Normal visitors never see protected appointments (Zero-trust)
    state.appointments = [];
  }

  try {
    // 7. Load Stats
    const statsSnap = await getDoc(doc(db, 'stats', 'siteStats'));
    if (statsSnap.exists()) {
      state.stats = statsSnap.data() as SiteStats;
    } else {
      state.stats = INITIAL_CMS_DATA.stats;
    }
  } catch (e) {
    console.error('Error loading stats from Firestore:', e);
    state.stats = INITIAL_CMS_DATA.stats;
  }

  return state as CMSState;
}

// Individual operations supporting direct secure writes and complete error mappings
export async function saveClinicInfo(info: ClinicInfo) {
  const path = 'settings/clinicInfo';
  try {
    await setDoc(doc(db, 'settings', 'clinicInfo'), info);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function saveService(service: Service) {
  const path = `services/${service.id}`;
  try {
    await setDoc(doc(db, 'services', service.id), service);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteService(id: string) {
  const path = `services/${id}`;
  try {
    await deleteDoc(doc(db, 'services', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function saveMediaItem(media: MediaItem) {
  const path = `media/${media.id}`;
  try {
    await setDoc(doc(db, 'media', media.id), media);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteMediaItem(id: string) {
  const path = `media/${id}`;
  try {
    await deleteDoc(doc(db, 'media', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function saveTestimonial(testimonial: Testimonial) {
  const path = `testimonials/${testimonial.id}`;
  try {
    await setDoc(doc(db, 'testimonials', testimonial.id), testimonial);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteTestimonial(id: string) {
  const path = `testimonials/${id}`;
  try {
    await deleteDoc(doc(db, 'testimonials', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function saveBlogPost(post: BlogPost) {
  const path = `blog/${post.id}`;
  try {
    await setDoc(doc(db, 'blog', post.id), post);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteBlogPost(id: string) {
  const path = `blog/${id}`;
  try {
    await deleteDoc(doc(db, 'blog', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function saveAppointment(appointment: Appointment) {
  const path = `appointments/${appointment.id}`;
  try {
    await setDoc(doc(db, 'appointments', appointment.id), appointment);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteAppointment(id: string) {
  const path = `appointments/${id}`;
  try {
    await deleteDoc(doc(db, 'appointments', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function incrementStats(accessesInc: number, viewsInc: number) {
  const path = 'stats/siteStats';
  try {
    const statsRef = doc(db, 'stats', 'siteStats');
    const snap = await getDoc(statsRef);
    const current = snap.exists() ? snap.data() as SiteStats : { accesses: 0, views: 0 };
    await setDoc(statsRef, {
      accesses: current.accesses + accessesInc,
      views: current.views + viewsInc
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}
