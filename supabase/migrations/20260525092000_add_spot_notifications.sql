CREATE TABLE public.spot_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  recipient_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  spot_id UUID NOT NULL REFERENCES public.spots(id) ON DELETE CASCADE,
  kind TEXT NOT NULL DEFAULT 'visited' CHECK (kind IN ('visited')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  read_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.spot_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own spot notifications" ON public.spot_notifications
  FOR SELECT USING (auth.uid() = recipient_user_id);

CREATE POLICY "Users can update own spot notifications" ON public.spot_notifications
  FOR UPDATE USING (auth.uid() = recipient_user_id)
  WITH CHECK (auth.uid() = recipient_user_id);

CREATE POLICY "Users can delete own spot notifications" ON public.spot_notifications
  FOR DELETE USING (auth.uid() = recipient_user_id);

CREATE INDEX idx_spot_notifications_recipient_created_at
  ON public.spot_notifications (recipient_user_id, created_at DESC);

CREATE INDEX idx_spot_notifications_spot_id
  ON public.spot_notifications (spot_id);

CREATE OR REPLACE FUNCTION public.notify_spot_visited()
RETURNS TRIGGER AS $$
DECLARE
  spot_owner UUID;
BEGIN
  SELECT user_id INTO spot_owner
  FROM public.spots
  WHERE id = NEW.spot_id;

  IF spot_owner IS NOT NULL AND spot_owner <> NEW.user_id THEN
    INSERT INTO public.spot_notifications (recipient_user_id, spot_id, kind)
    VALUES (spot_owner, NEW.spot_id, 'visited');
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_visited_spot_created
  AFTER INSERT ON public.visited_spots
  FOR EACH ROW EXECUTE FUNCTION public.notify_spot_visited();
