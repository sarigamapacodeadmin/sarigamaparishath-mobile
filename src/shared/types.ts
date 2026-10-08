// Data shapes returned by the web app's API and the Supabase tables it reads.
// They follow the web app's pages (app/page.tsx, app/member/profile/page.tsx).

export type Language = 'en' | 'te';

export interface Activity {
  id: number | string;
  title_en: string;
  title_te: string;
  description_en: string;
  description_te: string;
  full_description_en?: string | null;
  full_description_te?: string | null;
  category: string;
  icon: string;
  schedule_en?: string | null;
  schedule_te?: string | null;
  frequency_en?: string | null;
  frequency_te?: string | null;
  participants?: number | null;
  color?: string | null;
  location_en?: string | null;
  location_te?: string | null;
  duration_en?: string | null;
  duration_te?: string | null;
  level_en?: string | null;
  level_te?: string | null;
  requirements_en?: string | null;
  requirements_te?: string | null;
  benefits_en?: string | null;
  benefits_te?: string | null;
  instructor_en?: string | null;
  instructor_te?: string | null;
}

export interface Member {
  id: string;
  user_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  city?: string | null;
  state?: string | null;
  gotra?: string | null;
  bio_en?: string | null;
  created_at: string;
}

export interface Cow {
  id: number;
  name: string;
  breed: string | null;
  sex: string | null;
  date_of_birth: string | null;
}

export interface ParishathEvent {
  id: string;
  title_en: string;
  title_te: string;
  description_en: string | null;
  description_te: string | null;
  location_en: string | null;
  location_te: string | null;
  event_date: string;
  event_time: string | null;
  category: string | null;
  image_url: string | null;
  capacity: number | null;
  registered_count: number;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  organizer_name: string | null;
  organizer_email?: string | null;
  organizer_phone?: string | null;
  difficulty_level: string | null;
  age_group?: string | null;
  featured: boolean;
  registration_required?: boolean | null;
}

export interface GalleryPhoto {
  id: string;
  title_en: string;
  title_te: string;
  caption_en: string | null;
  caption_te: string | null;
  date: string;
  category: string;
  image_url: string;
  featured: boolean;
  photographer_name: string | null;
  alt_text: string | null;
}

export interface BlogPost {
  id: string;
  title: string;
  title_te?: string | null;
  slug: string;
  excerpt: string;
  excerpt_te?: string | null;
  content?: string | null;
  content_te?: string | null;
  featured_image_url: string | null;
  category: string;
  author: string;
  featured: boolean;
  views: number;
  created_at: string;
}
