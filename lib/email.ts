import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

const ses = new SESClient({
  region: process.env.AWS_REGION ?? "eu-west-2",
  credentials: {
    accessKeyId:     process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const FROM = process.env.SES_FROM_EMAIL ?? "hello@jkcurryhouse.co.uk";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.jkcurryhouse.co.uk";
const RESTAURANT_NAME = "JK Curryhouse";

// ── Shared email wrapper ────────────────────────────────────────────────────
async function sendEmail(to: string, subject: string, html: string, text: string) {
  const cmd = new SendEmailCommand({
    Source: `${RESTAURANT_NAME} <${FROM}>`,
    Destination: { ToAddresses: [to] },
    Message: {
      Subject: { Data: subject, Charset: "UTF-8" },
      Body: {
        Html: { Data: html, Charset: "UTF-8" },
        Text: { Data: text, Charset: "UTF-8" },
      },
    },
  });

  try {
    await ses.send(cmd);
    return { ok: true };
  } catch (err) {
    console.error("[SES] Failed to send email:", err);
    return { ok: false, error: err };
  }
}

// ── Shared HTML shell ────────────────────────────────────────────────────────
function emailShell(body: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${RESTAURANT_NAME}</title>
</head>
<body style="margin:0;padding:0;background:#f5f0eb;font-family:'Georgia',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f0eb;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border:1px solid #e5ddd4;">

        <!-- Header -->
        <tr>
          <td style="background:#0b0b0b;padding:32px 40px;text-align:center;">
            <img src="${SITE_URL}/brand/jk-monogram-192.png" width="72" height="72" alt="JK Curryhouse" style="display:block;margin:0 auto 12px;border:0;" />
            <p style="margin:0;font-family:'Georgia',serif;font-size:30px;font-weight:bold;color:#d4a437;letter-spacing:2px;">JK Curryhouse</p>
            <p style="margin:6px 0 0;font-size:11px;color:#d4a437;letter-spacing:3px;text-transform:uppercase;">The Real Indian Kitchen</p>
          </td>
        </tr>

        <!-- Gold divider -->
        <tr><td style="height:3px;background:linear-gradient(90deg,#9c6f1e,#f2d27a,#9c6f1e);"></td></tr>

        <!-- Body -->
        <tr>
          <td style="padding:40px;">
            ${body}
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f9f6f2;border-top:1px solid #e5ddd4;padding:24px 40px;text-align:center;">
            <p style="margin:0;font-size:12px;color:#9b8679;font-family:Arial,sans-serif;">
              12 Market Place, Chippenham, Wiltshire, SN15 1HA<br/>
              <a href="tel:01249123456" style="color:#8a6416;text-decoration:none;">01249 123456</a>
              &nbsp;·&nbsp;
              <a href="mailto:hello@jkcurryhouse.co.uk" style="color:#8a6416;text-decoration:none;">hello@jkcurryhouse.co.uk</a>
            </p>
            <p style="margin:12px 0 0;font-size:11px;color:#c4b5a8;font-family:Arial,sans-serif;">
              © ${new Date().getFullYear()} JK Curryhouse. All rights reserved.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ── Reservation confirmation (to guest) ─────────────────────────────────────
export async function sendReservationConfirmation({
  to, name, date, time, partySize, reservationId, specialRequest,
}: {
  to: string; name: string; date: string; time: string;
  partySize: number; reservationId: string; specialRequest?: string;
}) {
  const subject = `Your table is booked — ${date} at ${time} | JK Curryhouse`;

  const body = `
    <h2 style="margin:0 0 8px;font-family:'Georgia',serif;font-size:24px;color:#0b0b0b;">Booking Confirmed ✓</h2>
    <p style="margin:0 0 24px;font-size:15px;color:#5c4033;font-family:Arial,sans-serif;">
      Thank you, ${name}. We look forward to welcoming you.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#faf6f0;border:1px solid #e5ddd4;margin-bottom:24px;">
      <tr><td style="padding:20px 24px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          ${row("Date",          date)}
          ${row("Time",          time)}
          ${row("Party size",    `${partySize} ${partySize === 1 ? "guest" : "guests"}`)}
          ${row("Booking ref",   `<strong>#${reservationId.slice(-8).toUpperCase()}</strong>`)}
          ${specialRequest ? row("Special request", specialRequest) : ""}
        </table>
      </td></tr>
    </table>

    <p style="font-size:14px;color:#5c4033;font-family:Arial,sans-serif;line-height:1.6;">
      If you need to change or cancel your booking, please call us on
      <a href="tel:01249123456" style="color:#8a6416;text-decoration:none;font-weight:bold;">01249 123456</a>
      at least 2 hours before your reservation.
    </p>

    <p style="margin:24px 0 0;font-size:13px;color:#9b8679;font-family:Arial,sans-serif;">
      Booking reference: ${reservationId}
    </p>
  `;

  const text = `Booking Confirmed!\n\nThank you, ${name}.\n\nDate: ${date}\nTime: ${time}\nParty: ${partySize}\nRef: ${reservationId}\n\nTo change or cancel: 01249 123456`;

  return sendEmail(to, subject, emailShell(body), text);
}

// ── Reservation notification (to restaurant) ─────────────────────────────────
export async function sendReservationNotification({
  name, email, phone, date, time, partySize, reservationId, specialRequest,
}: {
  name: string; email: string; phone: string; date: string; time: string;
  partySize: number; reservationId: string; specialRequest?: string;
}) {
  const subject = `New Reservation — ${partySize} guests, ${date} at ${time}`;

  const body = `
    <h2 style="margin:0 0 8px;font-family:'Georgia',serif;font-size:22px;color:#0b0b0b;">New Booking Received</h2>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#faf6f0;border:1px solid #e5ddd4;margin:16px 0;">
      <tr><td style="padding:20px 24px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          ${row("Name",           name)}
          ${row("Email",          email)}
          ${row("Phone",          phone)}
          ${row("Date",           date)}
          ${row("Time",           time)}
          ${row("Party size",     `${partySize} guests`)}
          ${row("Booking ref",    `#${reservationId.slice(-8).toUpperCase()}`)}
          ${specialRequest ? row("Special request", `<em>${specialRequest}</em>`) : ""}
        </table>
      </td></tr>
    </table>
  `;

  const text = `New Booking: ${name}, ${partySize} guests, ${date} at ${time}. Phone: ${phone}. Ref: ${reservationId}`;

  return sendEmail(FROM, subject, emailShell(body), text);
}

function row(label: string, value: string) {
  return `<tr>
    <td style="padding:6px 0;font-size:13px;color:#9b8679;font-family:Arial,sans-serif;width:140px;vertical-align:top;">${label}</td>
    <td style="padding:6px 0;font-size:14px;color:#0b0b0b;font-family:Arial,sans-serif;font-weight:500;">${value}</td>
  </tr>`;
}

// ── Order confirmation (to guest) ────────────────────────────────────────────
export async function sendOrderConfirmation({
  to, name, ref, mode, eta, items, total, address,
}: {
  to: string; name: string; ref: string;
  mode: "delivery" | "takeaway"; eta: string;
  items: { name: string; quantity: number; price: number }[];
  total: number; address?: string;
}) {
  const subject = `Order confirmed #${ref} — JK Curryhouse`;
  const itemRows = items
    .map((i) => row(i.name + (i.quantity > 1 ? ` × ${i.quantity}` : ""), `£${(i.price * i.quantity).toFixed(2)}`))
    .join("");

  const body = `
    <h2 style="margin:0 0 8px;font-family:'Georgia',serif;font-size:24px;color:#0b0b0b;">Order Confirmed ✓</h2>
    <p style="margin:0 0 20px;font-size:15px;color:#5c4033;font-family:Arial,sans-serif;">
      Thank you, ${name}! We&apos;re preparing your order now.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#faf6f0;border:1px solid #e5ddd4;margin-bottom:20px;">
      <tr><td style="padding:20px 24px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          ${row("Order ref", `<strong>#${ref}</strong>`)}
          ${row("Type", mode === "delivery" ? "Delivery" : "Takeaway")}
          ${row("Est. time", eta)}
          ${address ? row("Address", address) : ""}
          <tr><td colspan="2" style="padding:12px 0 6px;font-size:12px;color:#9b8679;font-family:Arial,sans-serif;border-top:1px solid #e5ddd4;">Items</td></tr>
          ${itemRows}
          <tr>
            <td style="padding:8px 0 0;font-size:15px;color:#0b0b0b;font-family:'Georgia',serif;font-weight:bold;border-top:1px solid #e5ddd4;">Total</td>
            <td style="padding:8px 0 0;font-size:15px;color:#8a6416;font-family:'Georgia',serif;font-weight:bold;border-top:1px solid #e5ddd4;">£${total.toFixed(2)}</td>
          </tr>
        </table>
      </td></tr>
    </table>
    <p style="font-size:13px;color:#9b8679;font-family:Arial,sans-serif;">
      Questions? Call us on <a href="tel:01249123456" style="color:#8a6416;">01249 123456</a>.
    </p>
  `;
  const text = `Order confirmed #${ref}. ${mode === "delivery" ? `Delivery in ${eta}` : `Ready in ${eta}`}. Total: £${total.toFixed(2)}`;
  return sendEmail(to, subject, emailShell(body), text);
}

// ── Order notification (to restaurant) ──────────────────────────────────────
export async function sendOrderNotification({
  name, email, phone, ref, mode, items, total, address,
}: {
  name: string; email: string; phone: string; ref: string;
  mode: "delivery" | "takeaway";
  items: { name: string; quantity: number; price: number }[];
  total: number; address?: string;
}) {
  const subject = `New ${mode} order #${ref} — £${total.toFixed(2)}`;
  const itemRows = items
    .map((i) => row(i.name + (i.quantity > 1 ? ` × ${i.quantity}` : ""), `£${(i.price * i.quantity).toFixed(2)}`))
    .join("");
  const body = `
    <h2 style="margin:0 0 8px;font-family:'Georgia',serif;font-size:22px;color:#0b0b0b;">New Order Received</h2>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#faf6f0;border:1px solid #e5ddd4;margin:16px 0;">
      <tr><td style="padding:20px 24px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          ${row("Ref",    `#${ref}`)}
          ${row("Type",   mode === "delivery" ? "Delivery" : "Takeaway")}
          ${row("Name",   name)}
          ${row("Email",  email)}
          ${row("Phone",  phone)}
          ${address ? row("Address", address) : ""}
          <tr><td colspan="2" style="padding:12px 0 6px;font-size:12px;color:#9b8679;font-family:Arial,sans-serif;border-top:1px solid #e5ddd4;">Items</td></tr>
          ${itemRows}
          <tr>
            <td style="padding:8px 0 0;font-size:15px;font-family:'Georgia',serif;font-weight:bold;border-top:1px solid #e5ddd4;color:#0b0b0b;">Total</td>
            <td style="padding:8px 0 0;font-size:15px;font-family:'Georgia',serif;font-weight:bold;border-top:1px solid #e5ddd4;color:#8a6416;">£${total.toFixed(2)}</td>
          </tr>
        </table>
      </td></tr>
    </table>
  `;
  const text = `New order #${ref}: ${name}, £${total.toFixed(2)}, ${mode}. Phone: ${phone}`;
  return sendEmail(FROM, subject, emailShell(body), text);
}
