export async function elementToCanvas(element: HTMLElement) {
  const html2canvas = (await import("html2canvas")).default;
  return html2canvas(element, { scale: 2, backgroundColor: "#ffffff", useCORS: true });
}

export async function downloadPdf(element: HTMLElement, filename: string) {
  const { jsPDF } = await import("jspdf");
  const canvas = await elementToCanvas(element);
  const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const imgHeight = (canvas.height * pageWidth) / canvas.width;
  const data = canvas.toDataURL("image/jpeg", 0.95);
  let position = 0;
  let remaining = imgHeight;
  pdf.addImage(data, "JPEG", 0, position, pageWidth, imgHeight);
  remaining -= pageHeight;
  while (remaining > 0) {
    position -= pageHeight;
    pdf.addPage();
    pdf.addImage(data, "JPEG", 0, position, pageWidth, imgHeight);
    remaining -= pageHeight;
  }
  pdf.save(`${filename}.pdf`);
}

export async function printElement(element: HTMLElement) {
  const canvas = await elementToCanvas(element);
  const win = window.open("", "_blank", "width=900,height=1200");
  if (!win) return;
  win.document.write(
    `<html><head><title>Stampa</title><style>body{margin:0}img{width:100%}</style></head><body><img src="${canvas.toDataURL(
      "image/png",
    )}" onload="window.focus();window.print();" /></body></html>`,
  );
  win.document.close();
}

export function sendByEmail(to: string, subject: string, body: string) {
  const link = `mailto:${encodeURIComponent(to || "")}?subject=${encodeURIComponent(
    subject,
  )}&body=${encodeURIComponent(body)}`;
  window.location.href = link;
}
