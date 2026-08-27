import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import {
  fmt,
  fmtArea,
  fmtDate,
  fmtTime,
  type Inspection,
  type InspStatus,
  type Measurement,
  type Photo,
  type Profile,
  type PropertyAssessment,
  comparableUnitValue,
  homogenizedUnitValue,
  summarizeAssessment,
} from "./store";

/* ---------- Paleta do documento ---------- */
const NAVY: [number, number, number] = [34, 48, 74];
const INK: [number, number, number] = [24, 34, 54];
const GRAY: [number, number, number] = [107, 122, 148];
const SOFT: [number, number, number] = [217, 211, 194];
const AMBER: [number, number, number] = [224, 146, 8];
const PAGE_W = 210;
const M = 14;
const EDGE = PAGE_W - M;
const BOTTOM = 277;

const STATUS_LABEL: Record<InspStatus, string> = {
  agendada: "Agendada",
  campo: "Em campo",
  concluida: "Concluída",
};

const GROUP_LABEL: Record<string, string> = {
  terreno: "Terreno",
  planta: "Planta",
  conversao: "Conversão",
};

/** Carrega uma imagem (dataURL ou URL) e devolve JPEG compatível com jsPDF. */
function toJpegData(src: string): Promise<{ data: string; w: number; h: number } | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    const fail = () => resolve(null);
    img.onerror = fail;
    img.onload = () => {
      try {
        const maxSide = 1100;
        const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
        const w = Math.max(1, Math.round(img.naturalWidth * scale));
        const h = Math.max(1, Math.round(img.naturalHeight * scale));
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return fail();
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        resolve({ data: canvas.toDataURL("image/jpeg", 0.72), w, h });
      } catch {
        fail();
      }
    };
    img.src = src;
  });
}

function ensurePage(doc: jsPDF, y: number, need: number): number {
  if (y + need > BOTTOM) {
    doc.addPage();
    return 22;
  }
  return y;
}

function sectionHead(doc: jsPDF, yIn: number, num: string, title: string): number {
  let y = ensurePage(doc, yIn, 16);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(...NAVY);
  doc.text(`${num} · ${title.toUpperCase()}`, M, y + 3);
  doc.setDrawColor(...SOFT);
  doc.setLineWidth(0.4);
  doc.line(M, y + 5.5, EDGE, y + 5.5);
  return y + 11;
}

/** Desenha o brasão do Prumo (círculo de nível + prumo) em (cx, cy). */
function drawMark(doc: jsPDF, cx: number, cy: number, r: number) {
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.7);
  doc.circle(cx, cy, r);
  doc.line(cx - r - 2.4, cy, cx - r + 0.6, cy);
  doc.line(cx + r - 0.6, cy, cx + r + 2.4, cy);
  doc.line(cx, cy - r - 2.4, cx, cy - r + 0.6);
  doc.line(cx, cy + r - 0.6, cx, cy + r + 2.4);
  doc.setDrawColor(...AMBER);
  doc.setFillColor(...AMBER);
  const k = r / 5.4;
  doc.setLineWidth(0.6);
  doc.line(cx, cy - r + 1.2, cx, cy - r * 0.36);
  doc.triangle(cx, cy - r * 0.36, cx + r * 0.46, cy + r * 0.18, cx, cy + r * 0.86, "FD");
  doc.triangle(cx, cy - r * 0.36, cx - r * 0.46, cy + r * 0.18, cx, cy + r * 0.86, "FD");
  doc.setFillColor(255, 255, 255);
  doc.circle(cx, cy + r * 0.18, 0.55 * k + 0.35, "F");
}

export interface ReportInput {
  insp: Inspection;
  photos: Photo[];
  measurements: Measurement[];
  profile: Profile;
}

export async function generateReportPdf({ insp, photos, measurements, profile }: ReportInput): Promise<void> {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const rPhotos = photos.filter((p) => p.inspectionId === insp.id);
  const rMeas = measurements.filter((m) => m.inspectionId === insp.id);
  const now = new Date().toISOString();

  /* ---------- Cabeçalho ---------- */
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, PAGE_W, 26, "F");
  doc.setFillColor(...AMBER);
  doc.rect(0, 26, PAGE_W, 1.1, "F");
  drawMark(doc, 17, 13, 6);
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(17);
  doc.text("PRUMO", 28, 12.4);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.4);
  doc.setTextColor(178, 197, 224);
  doc.text("VISTORIA & AVALIAÇÃO DE IMÓVEIS — RELATÓRIO DE CAMPO", 28, 17.2);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text(insp.code, EDGE, 11, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.6);
  doc.setTextColor(178, 197, 224);
  doc.text(`Emissão: ${fmtDate(now)} ${fmtTime(now)} · Situação: ${STATUS_LABEL[insp.status]}`, EDGE, 16.4, {
    align: "right",
  });

  /* ---------- Título ---------- */
  let y = 38;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14.5);
  doc.setTextColor(...INK);
  doc.text("Relatório de vistoria e registro fotográfico", M, y);
  y += 8;

  /* ---------- 1. Identificação ---------- */
  y = sectionHead(doc, y, "1", "Identificação");
  const tech = profile.name.trim() || "Responsável técnico";
  const reg = profile.registryNumber.trim()
    ? `${profile.registryLabel} ${profile.registryNumber}`
    : profile.registryLabel;
  const contact = [profile.phone, profile.email, profile.city].filter(Boolean).join(" · ") || "—";

  autoTable(doc, {
    startY: y,
    margin: { left: M, right: M },
    theme: "plain",
    styles: { font: "helvetica", fontSize: 9, cellPadding: 1.6, textColor: INK },
    columnStyles: {
      0: { cellWidth: 46, textColor: GRAY, fontStyle: "normal" },
      1: { fontStyle: "bold" },
    },
    body: [
      ["Cliente / contratante", insp.client || "—"],
      ["Data da vistoria", fmtDate(insp.date)],
      ["Endereço do imóvel", insp.address || "—"],
      ["Município / UF", insp.city || "—"],
      ["Tipo de serviço", insp.type],
      ["Responsável técnico", `${tech} — ${profile.title}`],
      ["Registro profissional", reg],
      ["Contato do avaliador", contact],
    ],
  });
  y = ((doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable?.finalY ?? y) + 8;

  /* ---------- 2. Medições ---------- */
  y = sectionHead(doc, y, "2", `Medições (${rMeas.length})`);
  if (rMeas.length === 0) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8.6);
    doc.setTextColor(...GRAY);
    doc.text("Nenhuma medição vinculada a esta vistoria.", M, y);
    y += 8;
  } else {
    autoTable(doc, {
      startY: y,
      margin: { left: M, right: M },
      theme: "grid",
      headStyles: { fillColor: NAVY, textColor: [255, 255, 255], fontSize: 8, fontStyle: "bold" },
      styles: { font: "helvetica", fontSize: 8.4, cellPadding: 2, textColor: INK, lineColor: SOFT, lineWidth: 0.2 },
      alternateRowStyles: { fillColor: [246, 244, 237] },
      columnStyles: { 0: { cellWidth: 26 }, 3: { cellWidth: 30, halign: "right", fontStyle: "bold" } },
      head: [["Tipo", "Descrição", "Detalhes", "Área"]],
      body: rMeas.map((m) => [
        GROUP_LABEL[m.group] ?? m.group,
        m.label,
        m.detail,
        m.areaM2 != null ? fmtArea(m.areaM2) : "—",
      ]),
      foot: rMeas.some((m) => m.areaM2 != null)
        ? [[
            { content: "Área total registrada", colSpan: 3, styles: { halign: "right", fontStyle: "bold" } },
            { content: `${fmt(rMeas.reduce((a, m) => a + (m.areaM2 ?? 0), 0))} m²`, styles: { halign: "right", fontStyle: "bold" } },
          ]]
        : undefined,
      footStyles: { fillColor: [236, 232, 220], textColor: INK, fontSize: 8.6 },
    });
    y = ((doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable?.finalY ?? y) + 8;
  }

  /* ---------- 3. Registro fotográfico ---------- */
  y = sectionHead(doc, y, "3", `Registro fotográfico (${rPhotos.length})`);
  if (rPhotos.length === 0) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8.6);
    doc.setTextColor(...GRAY);
    doc.text("Nenhuma fotografia vinculada a esta vistoria.", M, y);
    y += 8;
  } else {
    const colW = (EDGE - M - 8) / 2;
    const imgH = colW * 0.62;

    const layoutOf = (p: Photo, idx: number) => {
      const capLines = doc.splitTextToSize(
        `Foto ${idx + 1} — ${p.caption || "Sem legenda"} (${p.category})`,
        colW - 2
      ) as string[];
      const noteLines = p.notes.flatMap((n) => doc.splitTextToSize(`• ${n.text}`, colW - 2) as string[]);
      return { capLines, noteLines, h: imgH + 5 + capLines.length * 3.6 + 3.4 + noteLines.length * 3.4 + 6 };
    };

    for (let i = 0; i < rPhotos.length; i += 2) {
      const left = rPhotos[i];
      const right = rPhotos[i + 1] as Photo | undefined;
      const layL = layoutOf(left, i);
      const layR = right ? layoutOf(right, i + 1) : null;
      const rowH = Math.max(layL.h, layR?.h ?? 0) + 2;
      y = ensurePage(doc, y, rowH);

      const jpegL = await toJpegData(left.src);
      const jpegR = right ? await toJpegData(right.src) : null;

      const drawBlock = (
        jpeg: { data: string; w: number; h: number } | null,
        lay: { capLines: string[]; noteLines: string[] },
        x: number,
        p: Photo
      ) => {
        if (jpeg) {
          doc.setDrawColor(...SOFT);
          doc.setLineWidth(0.3);
          doc.addImage(jpeg.data, "JPEG", x, y, colW, imgH, undefined, "FAST");
          doc.rect(x, y, colW, imgH);
        } else {
          doc.setFillColor(240, 237, 228);
          doc.setDrawColor(...SOFT);
          doc.rect(x, y, colW, imgH, "FD");
          doc.setFont("helvetica", "italic");
          doc.setFontSize(8);
          doc.setTextColor(...GRAY);
          doc.text("Imagem indisponível para exportação", x + colW / 2, y + imgH / 2, { align: "center" });
        }
        let ty = y + imgH + 4.6;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8.2);
        doc.setTextColor(...INK);
        doc.text(lay.capLines, x + 1, ty);
        ty += lay.capLines.length * 3.6;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7);
        doc.setTextColor(...GRAY);
        doc.text(`${fmtDate(p.at)} · ${fmtTime(p.at)}`, x + 1, ty + 0.8);
        ty += 3.4;
        if (lay.noteLines.length > 0) {
          doc.setFontSize(7.8);
          doc.setTextColor(66, 83, 111);
          doc.text(lay.noteLines, x + 1, ty + 1);
        }
      };

      drawBlock(jpegL, layL, M, left);
      if (right && layR && jpegR !== undefined) drawBlock(jpegR, layR, M + colW + 8, right);
      y += rowH + 2;
    }
    y += 2;
  }

  /* ---------- 4. Observações do perito ---------- */
  y = sectionHead(doc, y, "4", "Observações do perito");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...INK);
  const obs = doc.splitTextToSize(insp.notes || "Sem observações gerais registradas.", EDGE - M) as string[];
  y = ensurePage(doc, y, obs.length * 4.4 + 4);
  doc.text(obs, M, y);
  y += obs.length * 4.4 + 12;

  /* ---------- Assinaturas ---------- */
  y = ensurePage(doc, y, 30);
  const colW2 = (EDGE - M - 20) / 2;
  const sigY = y + 12;
  doc.setDrawColor(...NAVY);
  doc.setLineWidth(0.4);
  doc.line(M, sigY, M + colW2, sigY);
  doc.line(M + colW2 + 20, sigY, EDGE, sigY);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.6);
  doc.setTextColor(...INK);
  doc.text(tech, M + colW2 / 2, sigY + 4.6, { align: "center" });
  doc.text(insp.client || "Cliente ou representante", M + colW2 + 20 + colW2 / 2, sigY + 4.6, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.4);
  doc.setTextColor(...GRAY);
  doc.text(`${profile.title} · ${reg}`, M + colW2 / 2, sigY + 8.2, { align: "center" });
  doc.text("Cliente ou representante legal", M + colW2 + 20 + colW2 / 2, sigY + 8.2, { align: "center" });

  /* ---------- Rodapé ---------- */
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.2);
    doc.setTextColor(...GRAY);
    doc.text(
      `Documento gerado pelo Prumo em ${fmtDate(now)} às ${fmtTime(now)} — registros capturados em campo.`,
      PAGE_W / 2,
      289,
      { align: "center" }
    );
    doc.text(`Página ${i} de ${pages}`, EDGE, 289, { align: "right" });
    doc.text(insp.code, M, 289);
  }

  doc.save(`relatorio-${insp.code}.pdf`);
}

export interface EvaluationPdfInput {
  assessment: PropertyAssessment;
  profile: Profile;
  inspection?: Inspection;
}

/** Exporta uma minuta de avaliação mercadológica com a memória de cálculo dos comparáveis. */
export function generateEvaluationPdf({ assessment, profile, inspection }: EvaluationPdfInput): void {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const now = new Date().toISOString();
  const rows = assessment.comparables
    .filter((c) => comparableUnitValue(c) > 0)
    .map((c) => ({ ...c, unit: comparableUnitValue(c), adjusted: homogenizedUnitValue(c) }));
  const summary = summarizeAssessment(assessment);
  const { averageUnit: average, estimatedValue: estimated, minUnit: min, maxUnit: max, precision } = summary;

  doc.setFillColor(...NAVY);
  doc.rect(0, 0, PAGE_W, 26, "F");
  doc.setFillColor(...AMBER);
  doc.rect(0, 26, PAGE_W, 1.1, "F");
  drawMark(doc, 17, 13, 6);
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("PRUMO", 28, 12.4);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.4);
  doc.setTextColor(178, 197, 224);
  doc.text("AVALIAÇÃO MERCADOLÓGICA — MINUTA DE MEMÓRIA DE CÁLCULO", 28, 17.2);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text("MCDDM", EDGE, 12.5, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.4);
  doc.setTextColor(178, 197, 224);
  doc.text(`Emissão: ${fmtDate(now)} ${fmtTime(now)}`, EDGE, 17.2, { align: "right" });

  let y = 38;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14.5);
  doc.setTextColor(...INK);
  doc.text("Parecer técnico de avaliação mercadológica", M, y);
  y += 8;
  y = sectionHead(doc, y, "1", "Identificação do imóvel avaliando");
  autoTable(doc, {
    startY: y,
    margin: { left: M, right: M },
    theme: "plain",
    styles: { font: "helvetica", fontSize: 9, cellPadding: 1.6, textColor: INK },
    columnStyles: { 0: { cellWidth: 48, textColor: GRAY }, 1: { fontStyle: "bold" } },
    body: [
      ["Finalidade", assessment.purpose],
      ["Tipo de imóvel", assessment.propertyType],
      ["Endereço", assessment.address || "—"],
      ["Município / UF", assessment.city || "—"],
      ["Área considerada", assessment.areaM2 > 0 ? fmtArea(assessment.areaM2) : "—"],
      ["Características", `${assessment.bedrooms} dormitório(s) · ${assessment.parking} vaga(s) · Conservação: ${assessment.conservation} · Topografia: ${assessment.topography}`],
      ["Vistoria vinculada", inspection ? `${inspection.code} — ${inspection.client}` : "Sem vínculo"],
      ["Responsável", `${profile.name || "Responsável técnico"} — ${profile.title}`],
      ["Registro", profile.registryNumber ? `${profile.registryLabel} ${profile.registryNumber}` : profile.registryLabel],
    ],
  });
  y = ((doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable?.finalY ?? y) + 8;

  y = sectionHead(doc, y, "2", `Amostragem e homogeneização (${rows.length})`);
  if (!rows.length) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8.6);
    doc.setTextColor(...GRAY);
    doc.text("Nenhum comparável válido foi cadastrado.", M, y);
    y += 8;
  } else {
    autoTable(doc, {
      startY: y,
      margin: { left: M, right: M },
      theme: "grid",
      headStyles: { fillColor: NAVY, textColor: [255, 255, 255], fontSize: 7.5, fontStyle: "bold" },
      styles: { font: "helvetica", fontSize: 7.3, cellPadding: 1.7, textColor: INK, lineColor: SOFT, lineWidth: 0.2 },
      alternateRowStyles: { fillColor: [246, 244, 237] },
      head: [["Comparável", "Fonte / data", "Preço", "Área", "R$/m² homogeneizado"]],
      body: rows.map((row) => [row.address, `${row.source || "—"} / ${row.date || "—"}`, `R$ ${fmt(row.price)}`, fmtArea(row.areaM2), `R$ ${fmt(row.adjusted)}`]),
      foot: [[{ content: "Média dos valores unitários homogeneizados", colSpan: 4, styles: { halign: "right", fontStyle: "bold" } }, { content: `R$ ${fmt(average)} / m²`, styles: { fontStyle: "bold" } }]],
      footStyles: { fillColor: [236, 232, 220], textColor: INK, fontSize: 7.8 },
    });
    y = ((doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable?.finalY ?? y) + 8;
  }

  y = sectionHead(doc, y, "3", "Resultado indicativo");
  autoTable(doc, {
    startY: y,
    margin: { left: M, right: M },
    theme: "plain",
    styles: { font: "helvetica", fontSize: 10, cellPadding: 2, textColor: INK },
    columnStyles: { 0: { cellWidth: 75, textColor: GRAY }, 1: { fontStyle: "bold" } },
    body: [
      ["Valor indicativo de mercado", `R$ ${fmt(estimated)}`],
      ["Faixa unitária observada", `R$ ${fmt(min)} a R$ ${fmt(max)} / m²`],
      ["Precisão preliminar da amostra", precision],
      ["Quantidade de comparáveis", String(rows.length)],
    ],
  });
  y = ((doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable?.finalY ?? y) + 8;

  y = sectionHead(doc, y, "4", "Premissas e ressalvas");
  const text = assessment.notes || "Registrar as premissas, limitações, fontes e verificações realizadas pelo profissional responsável.";
  const lines = doc.splitTextToSize(text, EDGE - M) as string[];
  y = ensurePage(doc, y, lines.length * 4.4 + 20);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...INK);
  doc.text(lines, M, y);
  y += lines.length * 4.4 + 14;
  const disclaimer = "MINUTA: resultado indicativo por média aritmética de valores unitários homogeneizados. A seleção da amostra, os fatores, o intervalo de confiança e o grau de fundamentação/precisão devem ser revisados e complementados pelo profissional habilitado conforme a finalidade do trabalho e as normas aplicáveis.";
  const disclaimerLines = doc.splitTextToSize(disclaimer, EDGE - M) as string[];
  y = ensurePage(doc, y, disclaimerLines.length * 3.8 + 10);
  doc.setFont("helvetica", "italic");
  doc.setFontSize(7.8);
  doc.setTextColor(...GRAY);
  doc.text(disclaimerLines, M, y);

  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.2);
    doc.setTextColor(...GRAY);
    doc.text(`Documento gerado pelo Prumo em ${fmtDate(now)} às ${fmtTime(now)}.`, PAGE_W / 2, 289, { align: "center" });
    doc.text(`Página ${i} de ${pages}`, EDGE, 289, { align: "right" });
  }
  doc.save(`avaliacao-${assessment.id}.pdf`);
}
