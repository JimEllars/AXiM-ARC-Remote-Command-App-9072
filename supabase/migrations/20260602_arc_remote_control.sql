CREATE TABLE IF NOT EXISTS public.executive_device_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT NOT NULL CHECK (
    user_email IN ('james.ellars@axim.us.com', 'jrellars@gmail.com')
  ),
  endpoint TEXT UNIQUE NOT NULL,
  p256dh TEXT NOT NULL,
  auth_key TEXT NOT NULL,
  user_agent TEXT,
  device_label TEXT DEFAULT 'Mobile Device',
  is_active BOOLEAN DEFAULT true,
  last_notified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.executive_device_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super user manages executive device subscriptions"
ON public.executive_device_subscriptions
FOR ALL
USING (
  auth.jwt() ->> 'email' IN (
    'james.ellars@axim.us.com',
    'jrellars@gmail.com'
  )
  AND auth.jwt() ->> 'role' = 'super_user'
)
WITH CHECK (
  auth.jwt() ->> 'email' IN (
    'james.ellars@axim.us.com',
    'jrellars@gmail.com'
  )
  AND auth.jwt() ->> 'role' = 'super_user'
);

CREATE TABLE IF NOT EXISTS public.emergency_switches (
  service_key TEXT PRIMARY KEY,
  is_halted BOOLEAN NOT NULL DEFAULT false,
  halt_reason TEXT,
  halted_by TEXT CHECK (
    halted_by IN ('james.ellars@axim.us.com', 'jrellars@gmail.com')
  ),
  halted_at TIMESTAMPTZ,
  resumed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.emergency_switches (
  service_key,
  is_halted,
  halt_reason
)
VALUES
  ('global', false, 'Normal operations'),
  ('coding_lab_merges', false, 'Normal operations'),
  ('support_auto_patch', false, 'Normal operations'),
  ('ace_publishing', false, 'Normal operations')
ON CONFLICT (service_key) DO NOTHING;

ALTER TABLE public.emergency_switches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super user controls emergency switches"
ON public.emergency_switches
FOR ALL
USING (
  auth.jwt() ->> 'email' IN (
    'james.ellars@axim.us.com',
    'jrellars@gmail.com'
  )
  AND auth.jwt() ->> 'role' = 'super_user'
)
WITH CHECK (
  auth.jwt() ->> 'email' IN (
    'james.ellars@axim.us.com',
    'jrellars@gmail.com'
  )
  AND auth.jwt() ->> 'role' = 'super_user'
);

CREATE OR REPLACE FUNCTION public.set_arc_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_executive_subscription_updated_at
BEFORE UPDATE ON public.executive_device_subscriptions
FOR EACH ROW EXECUTE FUNCTION public.set_arc_updated_at();

CREATE TRIGGER set_emergency_switch_updated_at
BEFORE UPDATE ON public.emergency_switches
FOR EACH ROW EXECUTE FUNCTION public.set_arc_updated_at();