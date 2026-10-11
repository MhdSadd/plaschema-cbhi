const TEMPLATE_CSV = `name,email,phone,status,lga,wards
Ada Lovelace,ada.example@cbhi.local,08012345678,active,Jos North,Gyel A|Gyel B
Bala Mohammed,bala.example@cbhi.local,08087654321,active,,
Chinelo Okoro,chinelo.example@cbhi.local,08011112222,inactive,Barkin Ladi,Fan
`;

export function downloadEnrollmentOfficerUploadTemplate() {
  const blob = new Blob([TEMPLATE_CSV], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'enrollment-officers-upload-template.csv';
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export const ENROLLMENT_OFFICER_UPLOAD_COLUMNS =
  'name, email, phone, status (optional), lga (required when wards are set), wards (optional; use | between ward names; leave empty for all wards)'
