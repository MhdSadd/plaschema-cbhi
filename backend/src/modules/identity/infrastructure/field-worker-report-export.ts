import { Injectable } from '@nestjs/common';
import { PassThrough } from 'node:stream';
import ExcelJS from 'exceljs';
import type { FieldWorkerListItem } from '../domain/user';

const EXPORT_COLUMNS: Array<{
  header: string;
  width: number;
  value: (row: FieldWorkerListItem) => string | number;
}> = [
  { header: 'Enrollment Officer', width: 24, value: (row) => row.name },
  { header: 'Email', width: 28, value: (row) => row.email },
  { header: 'Phone', width: 16, value: (row) => row.phone ?? '' },
  {
    header: 'Ward Access',
    width: 32,
    value: (row) =>
      row.wards.length === 0
        ? 'All wards'
        : row.wards.map((ward) => ward.name).join(', '),
  },
  {
    header: 'Beneficiaries Enrolled',
    width: 18,
    value: (row) => row.beneficiariesEnrolled,
  },
  {
    header: 'Last Enrollment',
    width: 22,
    value: (row) => formatExportDateTime(row.lastEnrollmentAt),
  },
  {
    header: 'Last Sync',
    width: 22,
    value: (row) => formatExportDateTime(row.lastSyncedAt),
  },
  {
    header: 'Status',
    width: 12,
    value: (row) => (row.status === 'active' ? 'Active' : 'Inactive'),
  },
];

function formatExportDateTime(value: Date | string | null): string {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Africa/Lagos',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
}

@Injectable()
export class FieldWorkerReportExportRenderer {
  async renderXlsx(
    rows: AsyncIterable<FieldWorkerListItem>,
  ): Promise<{ buffer: Buffer; rowCount: number }> {
    const stream = new PassThrough();
    const chunks: Buffer[] = [];
    stream.on('data', (chunk: Buffer) => chunks.push(chunk));

    const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({
      stream,
      useSharedStrings: true,
      useStyles: true,
    });

    const worksheet = workbook.addWorksheet('Enrollment Officers', {
      views: [{ state: 'frozen', ySplit: 1 }],
    });

    worksheet.columns = EXPORT_COLUMNS.map((column) => ({
      header: column.header,
      key: column.header,
      width: column.width,
    }));

    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.alignment = { vertical: 'middle' };
    headerRow.commit();

    let rowCount = 0;
    for await (const row of rows) {
      rowCount += 1;
      worksheet
        .addRow(EXPORT_COLUMNS.map((column) => column.value(row)))
        .commit();
    }

    await worksheet.commit();
    await workbook.commit();

    return { buffer: Buffer.concat(chunks), rowCount };
  }
}
