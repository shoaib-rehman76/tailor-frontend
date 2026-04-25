import {
  GARMENT_LABEL_KEY,
  GARMENT_MEASUREMENT_FIELDS,
  MEASUREMENT_LABEL_KEYS,
} from "@/src/constants/measurementFields";
import type { ShopProfile } from "@/src/store/slices/settingsSlice";
import type { Order } from "@/src/types/order";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function currency(value: number) {
  return new Intl.NumberFormat("en-PK", {
    maximumFractionDigits: 0,
  }).format(value);
}

export function buildMeasurementSlipHtml({
  order,
  profile,
  unit,
  t,
}: {
  order: Order;
  profile: ShopProfile;
  unit: "in" | "cm";
  t: (key: string, options?: Record<string, unknown>) => string;
}) {
  const totalPaid = order.payments.reduce(
    (sum, payment) => sum + (payment.amount || 0),
    0,
  );
  const remaining = Math.max(0, (order.price || 0) - (order.advance || 0));
  const shopTitle = profile.shopName || profile.tailorName || t("appName");

  const garmentsMarkup = order.garments
    .map((garment) => {
      const measurementRows = GARMENT_MEASUREMENT_FIELDS[garment.type]
        .map((field) => {
          const value = garment.measurements[field];
          if (value == null) return "";

          return `
            <tr>
              <td>${escapeHtml(t(MEASUREMENT_LABEL_KEYS[field] ?? field))}</td>
              <td>${escapeHtml(String(value))} ${escapeHtml(unit)}</td>
            </tr>
          `;
        })
        .join("");

      const stitchingRows = [
        garment.styling.sidePocket != null
          ? `
            <tr>
              <td>${escapeHtml(t("orderDetail.sidePocket"))}</td>
              <td>${escapeHtml(
                garment.styling.sidePocket
                  ? t("orderDetail.yes")
                  : t("orderDetail.no"),
              )}</td>
            </tr>
          `
          : "",
        garment.styling.collarType
          ? `
            <tr>
              <td>${escapeHtml(t("orderDetail.collarType"))}</td>
              <td>${escapeHtml(garment.styling.collarType)}</td>
            </tr>
          `
          : "",
        garment.styling.cuffSize
          ? `
            <tr>
              <td>${escapeHtml(t("orderDetail.cuffSize"))}</td>
              <td>${escapeHtml(garment.styling.cuffSize)}</td>
            </tr>
          `
          : "",
        garment.styling.frontPocket
          ? `
            <tr>
              <td>${escapeHtml(t("orderDetail.frontPocket"))}</td>
              <td>${escapeHtml(garment.styling.frontPocket)}</td>
            </tr>
          `
          : "",
      ]
        .filter(Boolean)
        .join("");

      return `
        <section class="garment-card">
          <div class="garment-header">
            <h3>${escapeHtml(t(GARMENT_LABEL_KEY[garment.type]))}</h3>
            <span>${escapeHtml(t("orderDetail.stitchingDetails"))}</span>
          </div>
          <div class="garment-grid">
            <div class="panel">
              <h4>${escapeHtml(t("newOrder.measurements"))}</h4>
              ${
                measurementRows
                  ? `<table>${measurementRows}</table>`
                  : `<p class="muted">${escapeHtml(t("orderDetail.noMeasurements"))}</p>`
              }
            </div>
            <div class="panel accent">
              <h4>${escapeHtml(t("newOrder.styling"))}</h4>
              ${
                stitchingRows
                  ? `<table>${stitchingRows}</table>`
                  : `<p class="muted">${escapeHtml(t("orderDetail.noStyling"))}</p>`
              }
            </div>
          </div>
        </section>
      `;
    })
    .join("");

  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style>
          @page { size: A4; margin: 8mm; }
          * { box-sizing: border-box; }
          html, body { margin: 0; padding: 0; }
          body {
            font-family: Arial, sans-serif;
            color: #0f172a;
            background: #ffffff;
            font-size: 10px;
            line-height: 1.25;
          }
          .sheet {
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            overflow: hidden;
          }
          .hero {
            padding: 10px 14px;
            background: linear-gradient(135deg, #0f172a, #1d4ed8, #38bdf8);
            color: white;
          }
          .hero h1 {
            margin: 0 0 2px;
            font-size: 16px;
          }
          .hero p {
            margin: 1px 0;
            font-size: 10px;
            opacity: 0.9;
          }
          .content {
            padding: 8px;
            display: grid;
            gap: 8px;
          }
          .grid {
            display: grid;
            gap: 8px;
            grid-template-columns: repeat(2, 1fr);
          }
          .card {
            border-radius: 10px;
            padding: 8px 10px;
            border: 1px solid #e5e7eb;
            background: #ffffff;
            page-break-inside: avoid;
          }
          .card.orange { background: #fff7ed; }
          .card.blue { background: #eff6ff; }
          .card.green { background: #f0fdf4; }
          .card.purple { background: #f5f3ff; }
          .card h2 {
            margin: 0 0 6px;
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.06em;
            color: #475569;
          }
          .row {
            display: flex;
            justify-content: space-between;
            gap: 8px;
            padding: 2px 0;
            border-bottom: 1px dashed #dbeafe;
            font-size: 10px;
          }
          .row:last-child { border-bottom: 0; }
          .label { color: #64748b; }
          .value { font-weight: 700; text-align: right; }
          .garment-card {
            border: 1px solid #e2e8f0;
            border-radius: 10px;
            padding: 8px 10px;
            background: #ffffff;
            margin-bottom: 6px;
            page-break-inside: avoid;
          }
          .garment-card:last-child { margin-bottom: 0; }
          .garment-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 8px;
            margin-bottom: 6px;
          }
          .garment-header h3 {
            margin: 0;
            font-size: 12px;
          }
          .garment-header span {
            padding: 3px 8px;
            border-radius: 999px;
            background: #0f172a;
            color: white;
            font-size: 8px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.06em;
          }
          .garment-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 8px;
          }
          .panel {
            border-radius: 8px;
            padding: 6px 8px;
            background: #f8fafc;
          }
          .panel.accent {
            background: #fffbeb;
          }
          .panel h4 {
            margin: 0 0 4px;
            font-size: 9px;
            color: #475569;
            text-transform: uppercase;
            letter-spacing: 0.06em;
          }
          table {
            width: 100%;
            border-collapse: collapse;
          }
          td {
            padding: 2px 0;
            border-bottom: 1px solid #e5e7eb;
            font-size: 10px;
          }
          td:last-child {
            text-align: right;
            font-weight: 700;
          }
          tr:last-child td {
            border-bottom: 0;
          }
          .muted {
            color: #64748b;
            margin: 0;
            font-size: 10px;
          }
          .notes {
            white-space: pre-wrap;
            line-height: 1.4;
            font-size: 10px;
            margin: 0;
          }
          @media print {
            body { background: white; }
            .sheet { border: 0; border-radius: 0; }
          }
        </style>
      </head>
      <body>
        <div class="sheet">
          <section class="hero">
            <h1>${escapeHtml(shopTitle)}</h1>
            <p>${escapeHtml(profile.tailorName || "")}</p>
            <p>${escapeHtml(profile.contact || "")}</p>
            <p>${escapeHtml(profile.address || "")}</p>
          </section>

          <div class="content">
            <section class="grid">
              <div class="card orange">
                <h2>${escapeHtml(t("orderDetail.customerSummary"))}</h2>
                <div class="row"><span class="label">${escapeHtml(
                  t("newOrder.customerName"),
                )}</span><span class="value">${escapeHtml(order.customer.name)}</span></div>
                <div class="row"><span class="label">${escapeHtml(
                  t("newOrder.phone"),
                )}</span><span class="value">${escapeHtml(order.customer.phone)}</span></div>
                <div class="row"><span class="label">${escapeHtml(
                  t("orderDetail.orderNumber"),
                )}</span><span class="value">#${escapeHtml(order.orderNo)}</span></div>
                <div class="row"><span class="label">${escapeHtml(
                  t("ordersBoard.status"),
                )}</span><span class="value">${escapeHtml(
                  t(`ordersBoard.${order.status.toLowerCase()}`),
                )}</span></div>
              </div>
              <div class="card blue">
                <h2>${escapeHtml(t("newOrder.orderDetails"))}</h2>
                <div class="row"><span class="label">${escapeHtml(
                  t("ordersBoard.delivery"),
                )}</span><span class="value">${escapeHtml(
                  new Date(order.deliveryDate).toLocaleDateString(),
                )}</span></div>
                <div class="row"><span class="label">${escapeHtml(
                  t("newOrder.price"),
                )}</span><span class="value">Rs ${escapeHtml(
                  currency(order.price || 0),
                )}</span></div>
                <div class="row"><span class="label">${escapeHtml(
                  t("newOrder.advance"),
                )}</span><span class="value">Rs ${escapeHtml(
                  currency(order.advance || 0),
                )}</span></div>
                <div class="row"><span class="label">${escapeHtml(
                  t("newOrder.remaining"),
                )}</span><span class="value">Rs ${escapeHtml(
                  currency(remaining),
                )}</span></div>
              </div>
            </section>

            <section class="card purple">
              <h2>${escapeHtml(t("orderDetail.garmentsAndStitching"))}</h2>
              ${garmentsMarkup || `<p class="muted">${escapeHtml(t("orderDetail.noGarments"))}</p>`}
            </section>

            <section class="grid">
              <div class="card green">
                <h2>${escapeHtml(t("orderDetail.totalPaid"))}</h2>
                <div class="row">
                  <span class="label">${escapeHtml(t("orderDetail.totalPaid"))}</span>
                  <span class="value">Rs ${escapeHtml(currency(totalPaid))}</span>
                </div>
                <div class="row">
                  <span class="label">${escapeHtml(t("newOrder.remaining"))}</span>
                  <span class="value">Rs ${escapeHtml(currency(remaining))}</span>
                </div>
              </div>
              <div class="card">
                <h2>${escapeHtml(t("newOrder.notes"))}</h2>
                <p class="notes">${
                  order.notes
                    ? escapeHtml(order.notes)
                    : escapeHtml(t("common.none"))
                }</p>
              </div>
            </section>
          </div>
        </div>
      </body>
    </html>
  `;
}
