import { forwardRef } from "react";
import type { CompanyInfo, DocItem, DocTemplate } from "@/lib/doc";
import { docTotals, formatCurrency, formatDate, lineTotal } from "@/lib/doc";

export type DocPreviewProps = {
  template: DocTemplate;
  docLabel: string;
  number: string;
  date: string;
  secondaryDateLabel?: string;
  secondaryDate?: string | null;
  company: CompanyInfo;
  clientName: string;
  clientLines: string[];
  items: DocItem[];
  vatRate: number;
  notes?: string;
  bodyText?: string;
  title?: string;
  cantiere?: string;
  paymentMethod?: string;
  paymentIban?: string;
};

const BLUE = "#1d4ed8";
const DEEP = "#172554";
const RED = "#dc2626";
const GREY = "#64748b";
const LINE = "#e2e8f0";

export const DocPreview = forwardRef<HTMLDivElement, DocPreviewProps>(
  function DocPreview(props, ref) {
    const {
      template,
      docLabel,
      number,
      date,
      secondaryDateLabel,
      secondaryDate,
      company,
      clientName,
      clientLines,
      items,
      vatRate,
      notes,
      bodyText,
      title,
      cantiere,
      paymentMethod,
      paymentIban,
    } = props;
    const totals = docTotals(items, vatRate);
    const accent = template === "moderno" ? RED : BLUE;

    const header = () => {
      if (template === "minimal") {
        return (
          <div style={{ borderBottom: `2px solid ${DEEP}`, paddingBottom: 14, marginBottom: 22 }}>
            <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: 1, color: DEEP }}>
              {company.company_name}
            </div>
            <div style={{ fontSize: 10, color: GREY, marginTop: 4 }}>
              {[company.address, company.city, company.phone, company.email]
                .filter(Boolean)
                .join(" · ")}
            </div>
          </div>
        );
      }
      if (template === "moderno") {
        return (
          <div
            style={{
              background: `linear-gradient(120deg, ${DEEP}, ${BLUE} 60%, ${RED})`,
              color: "#fff",
              borderRadius: 12,
              padding: "22px 24px",
              marginBottom: 24,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}
          >
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: 0.5 }}>
                {company.company_name}
              </div>
              <div style={{ fontSize: 10, opacity: 0.85, marginTop: 6, lineHeight: 1.6 }}>
                {company.address}
                {company.address && company.city ? ", " : ""}
                {company.city}
                <br />
                {company.phone} {company.email ? `· ${company.email}` : ""}
                <br />
                {company.vat_number ? `P.IVA ${company.vat_number}` : ""}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 17, fontWeight: 700, textTransform: "uppercase" }}>
                {docLabel}
              </div>
              <div style={{ fontSize: 11, marginTop: 6 }}>N. {number || "—"}</div>
              <div style={{ fontSize: 11 }}>{formatDate(date)}</div>
            </div>
          </div>
        );
      }
      return (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            borderBottom: `3px solid ${BLUE}`,
            paddingBottom: 16,
            marginBottom: 24,
          }}
        >
          <div>
            <div style={{ fontSize: 19, fontWeight: 800, color: DEEP }}>{company.company_name}</div>
            <div style={{ fontSize: 10, color: GREY, marginTop: 6, lineHeight: 1.7 }}>
              {company.address}
              {company.address && company.city ? ", " : ""}
              {company.city}
              <br />
              {company.phone} {company.email ? `· ${company.email}` : ""}
              <br />
              {company.vat_number ? `P.IVA ${company.vat_number}` : ""}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div
              style={{
                fontSize: 16,
                fontWeight: 800,
                color: RED,
                textTransform: "uppercase",
                letterSpacing: 1,
              }}
            >
              {docLabel}
            </div>
            <div style={{ fontSize: 11, color: GREY, marginTop: 6 }}>N. {number || "—"}</div>
            <div style={{ fontSize: 11, color: GREY }}>Data: {formatDate(date)}</div>
            {secondaryDate ? (
              <div style={{ fontSize: 11, color: GREY }}>
                {secondaryDateLabel}: {formatDate(secondaryDate)}
              </div>
            ) : null}
          </div>
        </div>
      );
    };

    return (
      <div
        ref={ref}
        className="print-area"
        style={{
          width: 794,
          minHeight: 1123,
          background: "#ffffff",
          color: "#0f172a",
          padding: 40,
          fontFamily: "Helvetica, Arial, sans-serif",
          fontSize: 12,
          boxSizing: "border-box",
        }}
      >
        {header()}

        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 22 }}>
          <div>
            <div
              style={{
                fontSize: 10,
                textTransform: "uppercase",
                letterSpacing: 1,
                color: accent,
                fontWeight: 700,
              }}
            >
              Destinatario
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, marginTop: 6 }}>{clientName || "—"}</div>
            <div style={{ fontSize: 11, color: GREY, lineHeight: 1.7 }}>
              {clientLines.filter(Boolean).map((l) => (
                <div key={l}>{l}</div>
              ))}
            </div>
          </div>
          {template !== "classico" ? (
            <div style={{ textAlign: "right", fontSize: 11, color: GREY }}>
              {template === "minimal" ? (
                <>
                  <div style={{ fontWeight: 700, color: DEEP, fontSize: 14 }}>
                    {docLabel} {number}
                  </div>
                  <div>{formatDate(date)}</div>
                </>
              ) : null}
              {secondaryDate ? (
                <div>
                  {secondaryDateLabel}: {formatDate(secondaryDate)}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        {(title || cantiere) && (
          <div
            style={{
              background: "#f8fafc",
              border: `1px solid ${LINE}`,
              borderRadius: 8,
              padding: "10px 14px",
              marginBottom: 16,
            }}
          >
            {title && (
              <div style={{ fontSize: 12, fontWeight: 700, color: DEEP }}>
                <span style={{ color: GREY, fontWeight: 600, marginRight: 6 }}>OGGETTO:</span>
                {title}
              </div>
            )}
            {cantiere && (
              <div style={{ fontSize: 11, color: GREY, marginTop: title ? 4 : 0 }}>
                <span style={{ fontWeight: 600, marginRight: 6 }}>CANTIERE / LUOGO:</span>
                {cantiere}
              </div>
            )}
          </div>
        )}

        {bodyText ? (
          <div
            style={{
              whiteSpace: "pre-wrap",
              background: "#f8fafc",
              border: `1px solid ${LINE}`,
              borderRadius: 8,
              padding: 14,
              marginBottom: 20,
              lineHeight: 1.7,
            }}
          >
            {bodyText}
          </div>
        ) : null}

        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 18 }}>
          <thead>
            <tr
              style={{
                background: template === "minimal" ? "#ffffff" : accent,
                color: template === "minimal" ? DEEP : "#ffffff",
                borderBottom: `2px solid ${template === "minimal" ? DEEP : accent}`,
              }}
            >
              <th style={{ textAlign: "left", padding: "9px 10px", fontSize: 11 }}>Descrizione</th>
              <th style={{ textAlign: "right", padding: "9px 10px", fontSize: 11, width: 70 }}>
                Q.tà
              </th>
              <th style={{ textAlign: "right", padding: "9px 10px", fontSize: 11, width: 100 }}>
                Prezzo
              </th>
              <th style={{ textAlign: "right", padding: "9px 10px", fontSize: 11, width: 110 }}>
                Totale
              </th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ padding: 14, color: GREY, textAlign: "center" }}>
                  Nessuna voce inserita
                </td>
              </tr>
            ) : (
              items.map((item, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${LINE}` }}>
                  <td style={{ padding: "9px 10px" }}>{item.description || "—"}</td>
                  <td style={{ padding: "9px 10px", textAlign: "right" }}>{item.qty}</td>
                  <td style={{ padding: "9px 10px", textAlign: "right" }}>
                    {formatCurrency(Number(item.unit_price) || 0)}
                  </td>
                  <td style={{ padding: "9px 10px", textAlign: "right", fontWeight: 600 }}>
                    {formatCurrency(lineTotal(item))}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <div style={{ width: 260 }}>
            <Row label="Imponibile" value={formatCurrency(totals.net)} />
            <Row label={`IVA ${vatRate}%`} value={formatCurrency(totals.vat)} />
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "10px 0",
                borderTop: `2px solid ${accent}`,
                marginTop: 6,
                fontWeight: 800,
                fontSize: 14,
                color: accent,
              }}
            >
              <span>Totale</span>
              <span>{formatCurrency(totals.total)}</span>
            </div>
          </div>
        </div>

        {notes ? (
          <div style={{ marginTop: 26, fontSize: 11, color: GREY, whiteSpace: "pre-wrap" }}>
            <strong style={{ color: DEEP }}>Note:</strong> {notes}
          </div>
        ) : null}

        <div
          style={{
            marginTop: 34,
            paddingTop: 12,
            borderTop: `1px solid ${LINE}`,
            fontSize: 10,
            color: GREY,
            textAlign: "center",
          }}
        >
          {paymentMethod ? (
            <span style={{ fontWeight: 600, color: DEEP }}>
              Modalità di pagamento: {paymentMethod}
              {paymentIban ? ` (IBAN: ${paymentIban})` : ""}
              {" · "}
            </span>
          ) : company.iban ? (
            `Pagamento su IBAN ${company.iban} · `
          ) : (
            ""
          )}
          {company.company_name} {company.vat_number ? `· P.IVA ${company.vat_number}` : ""}
        </div>
      </div>
    );
  },
);

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 0" }}>
      <span style={{ color: GREY }}>{label}</span>
      <span style={{ fontWeight: 600 }}>{value}</span>
    </div>
  );
}
