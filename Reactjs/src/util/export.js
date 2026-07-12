/**
 * Tiện ích xuất dữ liệu ra file Excel (.xls) tương thích hoàn hảo với Microsoft Excel,
 * hỗ trợ ký tự Tiếng Việt (Unicode UTF-8) và hiển thị lưới dòng (gridlines).
 */
export function exportToExcel(filename, headers, rows) {
  let tableHtml = '<table border="1">';
  // Header row
  tableHtml += '<tr>' + headers.map(h => `<th style="background-color: #4f46e5; color: #ffffff; font-weight: bold; padding: 6px; text-align: left;">${h}</th>`).join('') + '</tr>';
  
  // Data rows
  rows.forEach(row => {
    tableHtml += '<tr>' + row.map(cell => {
      const val = cell !== null && cell !== undefined ? String(cell) : '';
      // Escape HTML entities to prevent malformed tags
      const escaped = val.replace(/</g, '&lt;').replace(/>/g, '&gt;');
      return `<td style="padding: 6px; text-align: left; mso-number-format:'\\@';">${escaped}</td>`;
    }).join('') + '</tr>';
  });
  tableHtml += '</table>';

  const excelTemplate = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta http-equiv="content-type" content="application/vnd.ms-excel; charset=UTF-8"/>
      <!--[if gte mso 9]>
      <xml>
        <x:ExcelWorkbook>
          <x:ExcelWorksheets>
            <x:ExcelWorksheet>
              <x:Name>Báo cáo thống kê</x:Name>
              <x:WorksheetOptions>
                <x:DisplayGridlines/>
              </x:WorksheetOptions>
            </x:ExcelWorksheet>
          </x:ExcelWorksheets>
        </x:ExcelWorkbook>
      </xml>
      <![endif]-->
      <style>
        th, td { font-family: 'Segoe UI', 'Arial', sans-serif; font-size: 11pt; }
      </style>
    </head>
    <body>
      ${tableHtml}
    </body>
    </html>
  `;

  const blob = new Blob([excelTemplate], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename.endsWith('.xls') ? filename : `${filename}.xls`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
