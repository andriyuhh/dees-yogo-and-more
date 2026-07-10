// Public order intake for GULP by Andrea shop
// Accepts a customer order, writes it to the owner's orders table, upserts the
// customer record, and deducts stock — all via service role since callers are
// unauthenticated shoppers.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface IncomingItem {
  flavorId: string;
  quantity: number;
}

interface OrderPayload {
  customerName: string;
  customerPhone: string;
  deliveryAddress?: string;
  paymentMethod?: string;
  notes?: string;
  items: IncomingItem[];
}

function sanitize(str: unknown, max = 200): string {
  if (typeof str !== "string") return "";
  return str.trim().slice(0, max);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = (await req.json()) as OrderPayload;

    // Validate payload
    const name = sanitize(body.customerName, 100);
    const phone = sanitize(body.customerPhone, 30);
    const address = sanitize(body.deliveryAddress, 300);
    const notes = sanitize(body.notes, 500);
    const paymentMethod = sanitize(body.paymentMethod, 20);

    if (!name || !phone) {
      return new Response(JSON.stringify({ error: "Name and phone are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!Array.isArray(body.items) || body.items.length === 0) {
      return new Response(JSON.stringify({ error: "Cart is empty" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (body.items.length > 50) {
      return new Response(JSON.stringify({ error: "Too many items" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Find the shop owner
    const { data: settings } = await supabase
      .from("user_settings")
      .select("user_id, whatsapp_number, shop_enabled, shop_delivery_fee")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (!settings || !settings.shop_enabled) {
      return new Response(JSON.stringify({ error: "Shop is not available" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ownerId = settings.user_id as string;
    const deliveryFee = address ? Number(settings.shop_delivery_fee) || 0 : 0;

    // Fetch requested flavors to lock down price/name/stock server-side
    const flavorIds = body.items.map((i) => i.flavorId).filter(Boolean);
    const { data: flavors, error: flavorsError } = await supabase
      .from("flavors")
      .select("id, name, price_per_unit, stock")
      .eq("user_id", ownerId)
      .in("id", flavorIds);
    if (flavorsError) throw flavorsError;

    const flavorMap = new Map(flavors!.map((f) => [f.id, f]));
    const orderItems: Array<{ flavorId: string; flavorName: string; quantity: number; unitPrice: number }> = [];
    let subtotal = 0;

    for (const item of body.items) {
      const f = flavorMap.get(item.flavorId);
      const qty = Math.max(0, Math.floor(Number(item.quantity) || 0));
      if (!f || qty === 0) continue;
      if (qty > f.stock) {
        return new Response(
          JSON.stringify({ error: `Not enough ${f.name} in stock (only ${f.stock} left)` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const unitPrice = Number(f.price_per_unit);
      orderItems.push({ flavorId: f.id, flavorName: f.name, quantity: qty, unitPrice });
      subtotal += qty * unitPrice;
    }

    if (orderItems.length === 0) {
      return new Response(JSON.stringify({ error: "No valid items in cart" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const totalAmount = subtotal + deliveryFee;

    // Insert order (status pending, unpaid)
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: ownerId,
        customer_name: name,
        customer_phone: phone,
        delivery_address: address || null,
        delivery_fee: deliveryFee,
        items: orderItems,
        notes: notes || null,
        payment_method: paymentMethod || null,
        is_paid: false,
        status: "pending",
        total_amount: totalAmount,
      })
      .select("id, created_at")
      .single();
    if (orderError) throw orderError;

    // Decrement stock for each flavor
    await Promise.all(
      orderItems.map(async (it) => {
        const f = flavorMap.get(it.flavorId)!;
        await supabase
          .from("flavors")
          .update({ stock: f.stock - it.quantity })
          .eq("id", it.flavorId)
          .eq("user_id", ownerId);
      })
    );

    // Upsert customer by phone
    const { data: existing } = await supabase
      .from("customers")
      .select("id, purchase_count")
      .eq("user_id", ownerId)
      .eq("phone", phone)
      .maybeSingle();

    if (existing) {
      await supabase
        .from("customers")
        .update({
          name,
          address: address || null,
          purchase_count: (existing.purchase_count || 0) + 1,
        })
        .eq("id", existing.id);
    } else {
      await supabase.from("customers").insert({
        user_id: ownerId,
        name,
        phone,
        address: address || null,
        purchase_count: 1,
      });
    }

    return new Response(
      JSON.stringify({
        order_id: order.id,
        total_amount: totalAmount,
        subtotal,
        delivery_fee: deliveryFee,
        whatsapp_number: settings.whatsapp_number,
        items: orderItems,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("place-order error", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
