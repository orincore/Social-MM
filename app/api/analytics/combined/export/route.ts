import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { GET as getCombinedAnalytics } from '../route';

function toCSV(rows: Record<string, unknown>[]): string {
  if (!rows || rows.length === 0) return '';
  const headers = Object.keys(rows[0]);
  const lines = rows.map((row) =>
    headers
      .map((header) => {
        const value = row[header];
        if (value === null || value === undefined) return '';
        const str = String(value);
        return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
      })
      .join(',')
  );
  return [headers.join(','), ...lines].join('\n');
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

  const platforms = combinedPayload.data?.platforms;
  const rows: Record<string, unknown>[] = [];

  if (platforms?.instagram?.data?.metrics) {
    rows.push({ platform: 'Instagram', ...platforms.instagram.data.metrics, ...platforms.instagram.data.metrics?.lifetimeTotals });
  }
  if (platforms?.youtube?.data?.metrics) {
    rows.push({ platform: 'YouTube', ...platforms.youtube.data.metrics, ...platforms.youtube.data.metrics?.lifetimeTotals });
  }

  const csv = toCSV(rows);
  const filename = `analytics-export-${new Date().toISOString().replace(/[:.]/g, '-')}.csv`;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
