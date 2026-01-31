import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { authOptions } from '@/lib/auth-options';
import { GET as getCombinedAnalytics } from '../route';

function formatNumber(value: number | undefined | null): string {
  if (value === null || value === undefined) return 'N/A';
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toString();
}

function formatLabel(key: string): string {
  return key
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

async function createPdfReport(analytics: any, periodLabel: string) {
  const pdfDoc = await PDFDocument.create();
  const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const italicFont = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  let page = pdfDoc.addPage();
  let { width, height } = page.getSize();
  let cursorY = height - 60;
  const maxWidth = width - 80;

  const wrapText = (text: string, font = regularFont, size = 12) => {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    words.forEach((word) => {
      const tentative = currentLine ? `${currentLine} ${word}` : word;
      const textWidth = font.widthOfTextAtSize(tentative, size);
      if (textWidth > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = tentative;
      }
    });

    if (currentLine) {
      lines.push(currentLine);
    }

    return lines;
  };

  const ensureSpace = (lineCount = 1, lineHeight = 16) => {
    if (cursorY - lineCount * lineHeight < 50) {
      page = pdfDoc.addPage();
      ({ width, height } = page.getSize());
      cursorY = height - 60;
    }
  };

  const drawParagraph = (
    text: string,
    {
      font = regularFont,
      size = 12,
      color = rgb(0.05, 0.05, 0.05),
      indent = 0,
    }: {
      font?: any;
      size?: number;
      color?: ReturnType<typeof rgb>;
      indent?: number;
    } = {}
  ) => {
    const lines = wrapText(text, font, size);
    lines.forEach((line) => {
      ensureSpace();
      page.drawText(line, {
        x: 40 + indent,
        y: cursorY,
        size,
        font,
        color,
        maxWidth,
      });
      cursorY -= size + 4;
    });
  };

  const drawHeading = (text: string, size = 16) => {
    ensureSpace();
    page.drawText(text, {
      x: 40,
      y: cursorY,
      size,
      font: boldFont,
      color: rgb(0.1, 0.1, 0.1),
    });
    cursorY -= size + 8;
  };

  const drawDivider = () => {
    ensureSpace();
    page.drawLine({
      start: { x: 40, y: cursorY },
      end: { x: width - 40, y: cursorY },
      thickness: 0.5,
      color: rgb(0.8, 0.8, 0.8),
    });
    cursorY -= 14;
  };

  const addPlatformSection = (label: string, platformData: any) => {
    drawHeading(`${label} Overview`, 14);
    if (!platformData?.connected) {
      drawParagraph(`${label} is not connected.`);
      drawDivider();
      return;
    }

    drawParagraph('Status: Connected');
    const metrics = platformData.data?.metrics;
    if (metrics) {
      Object.entries(metrics)
        .slice(0, 6)
        .forEach(([key, value]) => {
          if (typeof value === 'number') {
            drawParagraph(`${formatLabel(key)}: ${formatNumber(value)}`, { indent: 10 });
          }
        });
    }

    const totals = metrics?.lifetimeTotals;
    if (totals) {
      drawParagraph('Lifetime Totals:', { font: italicFont });
      Object.entries(totals)
        .slice(0, 6)
        .forEach(([key, value]) => {
          if (typeof value === 'number') {
            drawParagraph(`• ${formatLabel(key)}: ${formatNumber(value)}`, { indent: 10 });
          }
        });
    }

    const recentContent = platformData.data?.recentContent;
    if (Array.isArray(recentContent) && recentContent.length > 0) {
      drawParagraph('Top Recent Content:', { font: italicFont });
      recentContent.slice(0, 3).forEach((item: any, index: number) => {
        const title = item.title || item.caption || `Item ${index + 1}`;
        const engagements = item.statistics?.viewCount || item.like_count || item.views || 0;
        drawParagraph(`• ${title} — ${formatNumber(Number(engagements))} engagements`, { indent: 10 });
      });
    }

    drawDivider();
  };

  drawHeading('Cross-Platform Analytics Report', 20);
  drawParagraph(`Period: ${periodLabel}`, { font: italicFont, color: rgb(0.35, 0.35, 0.35) });
  drawDivider();

  const summary = analytics?.comparison;
  if (summary) {
    drawHeading('Overview');
    drawParagraph(`Total Audience: ${formatNumber(summary.audience?.total)}`);
    drawParagraph(`Total Reach / Views: ${formatNumber(summary.reach?.total)}`);
    drawParagraph(
      `Instagram Engagement Rate: ${summary.engagement?.instagram?.rate?.toFixed?.(2) ?? 'N/A'}%`
    );
    drawParagraph(
      `YouTube Engagement Rate: ${summary.engagement?.youtube?.rate?.toFixed?.(2) ?? 'N/A'}%`
    );
    drawDivider();
  }

  const dateRange = analytics?.dateRange;
  if (dateRange) {
    drawHeading('Date Range', 14);
    drawParagraph(`${dateRange.startDate || 'N/A'} to ${dateRange.endDate || 'N/A'}`);
    drawDivider();
  }

  const platforms = analytics?.platforms;
  if (platforms) {
    addPlatformSection('Instagram', platforms.instagram);
    addPlatformSection('YouTube', platforms.youtube);
  }

  const insights = analytics?.insights;
  if (Array.isArray(insights) && insights.length > 0) {
    drawHeading('AI Insights & Recommendations');
    insights.slice(0, 6).forEach((insight: any, idx: number) => {
      drawParagraph(`${idx + 1}. ${insight.title}`, { font: boldFont });
      if (insight.description) {
        drawParagraph(insight.description, { indent: 10 });
      }
      if (insight.recommendation) {
        drawParagraph(`Recommendation: ${insight.recommendation}`, {
          indent: 10,
          font: italicFont,
          color: rgb(0.3, 0.3, 0.3),
        });
      }
    });
  }

  const bytes = await pdfDoc.save();
  return bytes;
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const combinedResponse = await getCombinedAnalytics(request);
  const combinedPayload = await combinedResponse.json();
  if (!combinedResponse.ok) {
    return NextResponse.json(combinedPayload, { status: combinedResponse.status });
  }

  const { searchParams } = new URL(request.url);
  const period = searchParams.get('period') || 'month';
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  let periodLabel = period;
  if (period === 'custom' && startDate && endDate) {
    periodLabel = `${startDate} to ${endDate}`;
  }

  const pdfBytes = await createPdfReport(combinedPayload.data, periodLabel);
  const filename = `analytics-report-${new Date().toISOString().replace(/[:.]/g, '-')}.pdf`;

  const arrayBuffer = pdfBytes.buffer.slice(pdfBytes.byteOffset, pdfBytes.byteOffset + pdfBytes.byteLength) as ArrayBuffer;
  const pdfBlob = new Blob([arrayBuffer], { type: 'application/pdf' });

  return new NextResponse(pdfBlob.stream(), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
