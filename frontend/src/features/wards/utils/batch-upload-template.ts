const TEMPLATE_CSV = `name,lga,code
Gyel A,Jos North,
Fan Health Ward,Barkin Ladi,FAN-001
`;

export function downloadWardUploadTemplate() {
  const blob = new Blob([TEMPLATE_CSV], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = 'wards-upload-template.csv'
  document.body.append(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

export const WARD_UPLOAD_COLUMNS =
  'name, lga (required); code (optional — when omitted, code is derived from LGA and ward name). New wards default to inactive.'
