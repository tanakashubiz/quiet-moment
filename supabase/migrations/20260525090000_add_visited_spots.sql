CREATE TABLE public.visited_spots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  spot_id UUID NOT NULL REFERENCES public.spots(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, spot_id)
);

ALTER TABLE public.visited_spots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own visited spots" ON public.visited_spots
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can add visited spots" ON public.visited_spots
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove visited spots" ON public.visited_spots
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_visited_spots_user_id ON public.visited_spots (user_id);
CREATE INDEX idx_visited_spots_spot_id ON public.visited_spots (spot_id);
