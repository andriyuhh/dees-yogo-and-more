// Render an invoice-styled JPEG using canvas 2d — no extra deps.
// Kept intentionally simple; branded to match the PDF invoice look.
import type { Order } from '@/types/yogurt';
import logoImg from '@/assets/logo.png';

interface InvoiceOpts {
  paymentTerms?: string;
  footerNotes?: string;
}

const BRAND = {
  pink: '#e91e63',
  pinkDark: '#ad1457',
  pinkSoft: '#fce4ec',
  ink: '#1e1e1e',
  muted: '#787878',
  line: '#f0d2e0',
};

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export async function generateInvoiceImageBlob(
  order: Order,
  opts?: InvoiceOpts
): Promise<{ blob: Blob; filename: string }> {
  // High-res portrait canvas ~ A4 ratio, scaled for legibility on WhatsApp
  const W = 1080;
  const scale = W / 210; // mm → px factor (portrait A4 width = 210mm)
  const mm = (v: number) => v * scale;

  // Dynamic height based on items count
  const rowH = 8;
  const bodyH = 220 + order.items.length * rowH + (opts?.paymentTerms ? 30 : 0) + (order.notes ? 15 : 0);
  const H = Math.round(mm(bodyH));

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  // Background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, W, H);

  // Top pink band
  ctx.fillStyle = BRAND.pink;
  ctx.fillRect(0, 0, W, mm(10));

  // Logo
  const margin = mm(18);
  try {
    const logo = await loadImage(logoImg);
    const lw = mm(34);
    const lh = mm(22);
    ctx.drawImage(logo, margin, mm(18), lw, lh);
  } catch {
    ctx.fillStyle = BRAND.pink;
    ctx.font = `bold ${mm(11)}px Helvetica, Arial, sans-serif`;
    ctx.fillText('GULP', margin, mm(32));
  }

  // Tagline
  ctx.fillStyle = BRAND.muted;
  ctx.font = `italic ${mm(4.5)}px Helvetica, Arial, sans-serif`;
  ctx.fillText('Sip. Smile. Repeat.', margin, mm(46));
  ctx.font = `${mm(4)}px Helvetica, Arial, sans-serif`;
  ctx.fillText('Freetown, Sierra Leone', margin, mm(51));

  // INVOICE title
  ctx.fillStyle = BRAND.pink;
  ctx.font = `bold ${mm(15)}px Helvetica, Arial, sans-serif`;
  ctx.textAlign = 'right';
  ctx.fillText('INVOICE', W - margin, mm(28));

  // Invoice meta
  ctx.fillStyle = BRAND.muted;
  ctx.font = `${mm(4.5)}px Helvetica, Arial, sans-serif`;
  const dateStr = new Date(order.createdAt).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'long', year: 'numeric',
  });
  ctx.fillText(`Invoice #${order.id.slice(0, 8).toUpperCase()}`, W - margin, mm(36));
  ctx.fillText(dateStr, W - margin, mm(42));

  // Divider
  ctx.strokeStyle = BRAND.line;
  ctx.lineWidth = mm(0.5);
  ctx.beginPath();
  ctx.moveTo(margin, mm(58));
  ctx.lineTo(W - margin, mm(58));
  ctx.stroke();

  // Bill To
  ctx.textAlign = 'left';
  let y = mm(67);
  ctx.fillStyle = BRAND.pink;
  ctx.font = `bold ${mm(4)}px Helvetica, Arial, sans-serif`;
  ctx.fillText('BILL TO', margin, y);
  y += mm(6);
  ctx.fillStyle = BRAND.ink;
  ctx.font = `bold ${mm(5.5)}px Helvetica, Arial, sans-serif`;
  ctx.fillText(order.customerName, margin, y);
  y += mm(5);
  ctx.fillStyle = BRAND.muted;
  ctx.font = `${mm(4.5)}px Helvetica, Arial, sans-serif`;
  ctx.fillText(order.customerPhone, margin, y);
  if (order.deliveryAddress) {
    y += mm(5);
    ctx.fillText(order.deliveryAddress, margin, y);
  }

  // Status on right
  ctx.fillStyle = BRAND.pink;
  ctx.font = `bold ${mm(4)}px Helvetica, Arial, sans-serif`;
  ctx.textAlign = 'right';
  ctx.fillText('STATUS', W - margin, mm(67));
  ctx.font = `bold ${mm(5.5)}px Helvetica, Arial, sans-serif`;
  ctx.fillStyle =
    order.status === 'completed' ? '#228b22' :
    order.status === 'pending' ? '#c89600' : '#c83232';
  ctx.fillText(order.status.toUpperCase(), W - margin, mm(73));

  // Items table header
  ctx.textAlign = 'left';
  const tableY = Math.max(y, mm(80)) + mm(10);
  const contentW = W - margin * 2;
  ctx.fillStyle = BRAND.pink;
  ctx.fillRect(margin, tableY - mm(5), contentW, mm(9));
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${mm(4)}px Helvetica, Arial, sans-serif`;
  ctx.fillText('ITEM', margin + mm(3), tableY);
  ctx.textAlign = 'center';
  ctx.fillText('QTY', margin + mm(90), tableY);
  ctx.fillText('PRICE', margin + mm(118), tableY);
  ctx.textAlign = 'right';
  ctx.fillText('AMOUNT', W - margin - mm(3), tableY);

  // Table rows
  let rowY = tableY + mm(10);
  ctx.font = `${mm(4.5)}px Helvetica, Arial, sans-serif`;
  order.items.forEach((item, idx) => {
    if (idx % 2 === 0) {
      ctx.fillStyle = BRAND.pinkSoft;
      ctx.fillRect(margin, rowY - mm(4), contentW, mm(7));
    }
    const amount = item.quantity * item.unitPrice;
    ctx.fillStyle = BRAND.ink;
    ctx.textAlign = 'left';
    ctx.fillText(item.flavorName, margin + mm(3), rowY);
    ctx.textAlign = 'center';
    ctx.fillText(String(item.quantity), margin + mm(90), rowY);
    ctx.fillText(`Le ${item.unitPrice.toLocaleString()}`, margin + mm(118), rowY);
    ctx.textAlign = 'right';
    ctx.font = `bold ${mm(4.5)}px Helvetica, Arial, sans-serif`;
    ctx.fillText(`Le ${amount.toLocaleString()}`, W - margin - mm(3), rowY);
    ctx.font = `${mm(4.5)}px Helvetica, Arial, sans-serif`;
    rowY += mm(7);
  });

  // Totals
  const subtotal = order.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  rowY += mm(4);
  ctx.strokeStyle = BRAND.line;
  ctx.beginPath();
  ctx.moveTo(margin + mm(80), rowY);
  ctx.lineTo(W - margin, rowY);
  ctx.stroke();
  rowY += mm(7);
  ctx.fillStyle = BRAND.ink;
  ctx.textAlign = 'left';
  ctx.fillText('Subtotal', margin + mm(105), rowY);
  ctx.textAlign = 'right';
  ctx.fillText(`Le ${subtotal.toLocaleString()}`, W - margin - mm(3), rowY);
  if (order.deliveryFee > 0) {
    rowY += mm(6);
    ctx.textAlign = 'left';
    ctx.fillText('Delivery Fee', margin + mm(105), rowY);
    ctx.textAlign = 'right';
    ctx.fillText(`Le ${order.deliveryFee.toLocaleString()}`, W - margin - mm(3), rowY);
  }

  // Total pill
  rowY += mm(9);
  ctx.fillStyle = BRAND.pink;
  ctx.fillRect(margin + mm(88), rowY - mm(6), contentW - mm(88), mm(12));
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${mm(6)}px Helvetica, Arial, sans-serif`;
  ctx.textAlign = 'left';
  ctx.fillText('TOTAL', margin + mm(105), rowY + mm(1));
  ctx.textAlign = 'right';
  ctx.fillText(`Le ${order.totalAmount.toLocaleString()}`, W - margin - mm(3), rowY + mm(1));

  // Payment terms
  if (opts?.paymentTerms) {
    rowY += mm(18);
    ctx.fillStyle = BRAND.pinkSoft;
    ctx.fillRect(margin, rowY - mm(4), contentW, mm(20));
    ctx.fillStyle = BRAND.pinkDark;
    ctx.font = `bold ${mm(4)}px Helvetica, Arial, sans-serif`;
    ctx.textAlign = 'left';
    ctx.fillText('PAYMENT TERMS', margin + mm(5), rowY + mm(1));
    ctx.fillStyle = BRAND.ink;
    ctx.font = `${mm(4)}px Helvetica, Arial, sans-serif`;
    ctx.fillText(opts.paymentTerms.slice(0, 120), margin + mm(5), rowY + mm(8));
  }

  // Footer
  const footerY = H - mm(15);
  ctx.strokeStyle = BRAND.line;
  ctx.beginPath();
  ctx.moveTo(margin, footerY - mm(6));
  ctx.lineTo(W - margin, footerY - mm(6));
  ctx.stroke();
  ctx.fillStyle = BRAND.pinkDark;
  ctx.font = `bold ${mm(4.5)}px Helvetica, Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText(opts?.footerNotes || 'Thank you for your patronage.', W / 2, footerY);
  ctx.fillStyle = BRAND.muted;
  ctx.font = `italic ${mm(4)}px Helvetica, Arial, sans-serif`;
  ctx.fillText('GULP by Andrea  |  Sip. Smile. Repeat.', W / 2, footerY + mm(5));

  // Bottom band
  ctx.fillStyle = BRAND.pink;
  ctx.fillRect(0, H - mm(8), W, mm(8));

  const blob: Blob = await new Promise((resolve) =>
    canvas.toBlob((b) => resolve(b!), 'image/jpeg', 0.92)
  );
  const filename = `Invoice-${order.customerName.replace(/\s/g, '_')}.jpg`;
  return { blob, filename };
}

export async function shareInvoiceImage(order: Order, opts?: InvoiceOpts) {
  const { blob, filename } = await generateInvoiceImageBlob(order, opts);
  const file = new File([blob], filename, { type: 'image/jpeg' });

  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    await navigator.share({
      files: [file],
      title: 'Invoice',
      text: `Invoice for ${order.customerName} — GULP by Andrea`,
    });
    return;
  }

  // Fallback: download + open WhatsApp text
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  const phone = order.customerPhone.replace(/[^0-9+]/g, '');
  if (phone) {
    window.open(
      `https://wa.me/${phone}?text=${encodeURIComponent(
        `Hi ${order.customerName}, please find your invoice attached. — GULP by Andrea`
      )}`,
      '_blank'
    );
  }
}
