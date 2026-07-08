ALTER TABLE public.user_settings 
ADD COLUMN IF NOT EXISTS invoice_payment_terms text NOT NULL DEFAULT 'Payment due upon receipt. Mobile Money: Orange Money, AfriMoney, QMoney. Cash accepted on delivery.',
ADD COLUMN IF NOT EXISTS invoice_footer_notes text NOT NULL DEFAULT 'Thank you for choosing GULP by Andrea. For orders & inquiries, reach out on WhatsApp.';