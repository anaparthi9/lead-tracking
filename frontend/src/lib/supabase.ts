import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ackmysebotdrmmdtvsvw.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFja215c2Vib3Rkcm1tZHR2c3Z3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzYxOTkzNjcsImV4cCI6MjA1MTc3NTM2N30.4XZYM1XYc1whr-FD9LY2fTefGvFUKo3X9mytp_lr7cU';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase;
