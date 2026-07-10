// Public menu endpoint for GULP by Andrea shop
// Returns the shop owner's info + in-stock flavors so the storefront can render them.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Pick the earliest user_settings row as the shop owner (single-tenant shop).
    const { data: settings, error: settingsError } = await supabase
      .from("user_settings")
      .select("user_id, whatsapp_number, shop_enabled, shop_delivery_fee")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (settingsError) throw settingsError;
    if (!settings) {
      return new Response(JSON.stringify({ error: "Shop not set up yet" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!settings.shop_enabled) {
      return new Response(JSON.stringify({ error: "Shop is currently closed" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: flavors, error: flavorsError } = await supabase
      .from("flavors")
      .select("id, name, emoji, price_per_unit, stock")
      .eq("user_id", settings.user_id)
      .gt("stock", 0)
      .order("name", { ascending: true });

    if (flavorsError) throw flavorsError;

    return new Response(
      JSON.stringify({
        business_name: "GULP by Andrea",
        tagline: "Sip. Smile. Repeat.",
        whatsapp_number: settings.whatsapp_number,
        delivery_fee: Number(settings.shop_delivery_fee) || 0,
        flavors: flavors || [],
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("shop-menu error", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
