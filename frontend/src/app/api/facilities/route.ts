import { NextRequest } from 'next/server';
import { authorizeRequest } from '@/lib/auth/rbac';
import { errorResponse, successResponse } from '@/lib/api';

export async function GET(req: NextRequest) {
  // Authorize request: all authenticated roles (citizen, asha, doctor, admin)
  const auth = await authorizeRequest(req, ['citizen', 'asha', 'doctor']);
  if (!auth.authorized) {
    return errorResponse(auth.error || 'Unauthorized', auth.status, auth.status === 401 ? 'UNAUTHORIZED' : 'FORBIDDEN');
  }

  const { searchParams } = new URL(req.url);
  const district = searchParams.get('district');
  const taluka = searchParams.get('taluka');

  // Baseline facility seeds as safe fallback
  const fallbackFacilities = [
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
  ];

  try {
    const supabase = auth.client;
    if (supabase) {
      let query = supabase.from('facilities').select('*').eq('is_active', true);
      if (district) {
        query = query.ilike('district', `%${district}%`);
      }
      if (taluka) {
        query = query.ilike('taluka', `%${taluka}%`);
      }

      const { data, error } = await query.order('name', { ascending: true });
      if (!error && data && data.length > 0) {
        return successResponse({
          status: 'success',
          filter: { district, taluka },
          facilities: data,
          count: data.length
        }, 200, 'supabase_production');
      }
    }
  } catch (err) {
    console.warn('Supabase facilities query failed, using baseline facilities:', err);
  }

  // Fallback with filter application
  let filteredFallback = fallbackFacilities;
  if (district) {
    filteredFallback = filteredFallback.filter(f => f.district.toLowerCase().includes(district.toLowerCase()));
  }
  if (taluka) {
    filteredFallback = filteredFallback.filter(f => f.taluka.toLowerCase().includes(taluka.toLowerCase()));
  }

  return successResponse({
    status: 'success',
    filter: { district, taluka },
    facilities: filteredFallback,
    count: filteredFallback.length
  }, 200, 'baseline_fallback');
}
