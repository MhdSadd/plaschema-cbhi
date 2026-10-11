const TEMPLATE_CSV = `name,ward
Fan Primary Health Centre,Fan
Jos North General Hospital,Jos North
`;

export function downloadFacilityUploadTemplate() {
  const blob = new Blob([TEMPLATE_CSV], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = 'facilities-upload-template.csv'
  document.body.append(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

export const FACILITY_UPLOAD_COLUMNS =
  'name, ward (required). Ward must match an existing ward name exactly; LGA is taken from that ward. New facilities default to inactive.'
