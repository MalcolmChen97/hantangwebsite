-- Allow Supabase Realtime to broadcast changes on appointments (multi-device sync).
ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments;
