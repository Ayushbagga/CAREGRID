import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const district = searchParams.get('district');
  const taluka = searchParams.get('taluka');

  // Baseline facility discovery response skeleton
  return NextResponse.json({
    status: 'success',
    filter: { district, taluka },
    facilities: [
      {
        id: '11111111-0000-0000-0000-000000000002',
        facility_code: 'MAH-GAD-PHC-01',
        name: 'Primary Health Centre Bhamragad',
        facility_type: 'phc',
        district: 'Gadchiroli',
        taluka: 'Bhamragad',
        operating_hours: '24x7 Emergency & Normal Delivery, 9:00 AM - 4:00 PM OPD',
        services_available: ['General OPD', '24/7 Normal Delivery', 'Basic Lab Testing', 'Teleconsultation Room'],
        specialties_available: ['General Medicine', 'Obstetrics & Normal Delivery']
      },
      {
        id: '22222222-0000-0000-0000-000000000002',
        facility_code: 'MAH-NSK-PHC-01',
        name: 'Primary Health Centre Vani',
        facility_type: 'phc',
        district: 'Nashik',
        taluka: 'Dindori',
        operating_hours: '24x7 Emergency & Delivery, 9:00 AM - 4:00 PM OPD',
        services_available: ['Primary OPD', 'Labor Room', 'Immunization Cold Chain', 'Telemedicine'],
        specialties_available: ['General Medicine', 'Maternal Care']
      }
    ]
  });
}
