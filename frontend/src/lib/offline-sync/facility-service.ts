import { offlineDb } from './db';
import type { Facility } from '@/types/healthcare';

const INITIAL_FACILITIES: Facility[] = [
  // Gadchiroli District (Tribal / Forest / Remote Belts)
  {
    id: '11111111-0000-0000-0000-000000000001',
    facility_code: 'MAH-GAD-SC-01',
    name: 'Sub-Centre Reguntha (Ayushman Arogya Mandir)',
    facility_type: 'sub_centre',
    district: 'Gadchiroli',
    taluka: 'Sironcha',
    village: 'Reguntha',
    pincode: '442504',
    contact_number: '07138-230001',
    operating_hours: '9:00 AM - 4:00 PM (Monday - Saturday)',
    services_available: ['MCH Screening', 'Immunization', 'NCD Vitals Check', 'Rapid Diagnostic Kits'],
    specialties_available: ['Primary Community Health'],
    is_active: true
  },
  {
    id: '11111111-0000-0000-0000-000000000002',
    facility_code: 'MAH-GAD-PHC-01',
    name: 'Primary Health Centre Bhamragad',
    facility_type: 'phc',
    district: 'Gadchiroli',
    taluka: 'Bhamragad',
    village: 'Bhamragad',
    pincode: '442710',
    contact_number: '07134-220012',
    operating_hours: '24x7 Emergency & Normal Delivery, 9:00 AM - 4:00 PM OPD',
    services_available: ['General OPD', '24/7 Normal Delivery', 'Basic Lab Testing', 'Teleconsultation Room', 'Emergency Stabilization'],
    specialties_available: ['General Medicine', 'Obstetrics & Normal Delivery'],
    is_active: true
  },
  {
    id: '11111111-0000-0000-0000-000000000003',
    facility_code: 'MAH-GAD-CHC-01',
    name: 'Sub-District Hospital Aheri (CHC)',
    facility_type: 'chc',
    district: 'Gadchiroli',
    taluka: 'Aheri',
    village: 'Aheri',
    pincode: '442705',
    contact_number: '07133-272044',
    operating_hours: '24x7 Inpatient, Emergency & Surgery',
    services_available: ['Specialist OPD', 'Emergency Care', 'Ultrasound', 'Digital X-Ray', 'Blood Storage Unit'],
    specialties_available: ['Obstetrics & Gynecology', 'Pediatrics', 'General Surgery'],
    is_active: true
  },
  {
    id: '11111111-0000-0000-0000-000000000004',
    facility_code: 'MAH-GAD-DH-01',
    name: 'District General Hospital Gadchiroli',
    facility_type: 'district_hospital',
    district: 'Gadchiroli',
    taluka: 'Gadchiroli',
    village: 'Gadchiroli Town',
    pincode: '442605',
    contact_number: '07132-222061',
    operating_hours: '24x7 Multi-Specialty Hospital',
    services_available: ['Intensive Care Unit (ICU)', 'Newborn Care (SNCU)', 'Emergency Trauma', 'Diagnostic Pathology', 'Dialysis Unit'],
    specialties_available: ['General Medicine', 'Pediatrics', 'Gynecology & Obstetrics', 'General Surgery', 'Orthopedics'],
    is_active: true
  },

  // Nashik District (Hilly / Rural / Tribal Belts)
  {
    id: '22222222-0000-0000-0000-000000000001',
    facility_code: 'MAH-NSK-SC-01',
    name: 'Sub-Centre Harsul (Ayushman Arogya Mandir)',
    facility_type: 'sub_centre',
    district: 'Nashik',
    taluka: 'Trimbakeshwar',
    village: 'Harsul',
    pincode: '422204',
    contact_number: '02594-240010',
    operating_hours: '9:00 AM - 4:00 PM (Monday - Saturday)',
    services_available: ['ANC Checkup', 'Infant Weight Tracking', 'NCD Screening', 'Essential Drug Dispensing'],
    specialties_available: ['Community Healthcare'],
    is_active: true
  },
  {
    id: '22222222-0000-0000-0000-000000000002',
    facility_code: 'MAH-NSK-PHC-01',
    name: 'Primary Health Centre Vani',
    facility_type: 'phc',
    district: 'Nashik',
    taluka: 'Dindori',
    village: 'Vani',
    pincode: '422215',
    contact_number: '02557-221234',
    operating_hours: '24x7 Emergency & Delivery, 9:00 AM - 4:00 PM OPD',
    services_available: ['Primary OPD', 'Labor Room', 'Immunization Cold Chain', 'Diagnostic Sputum & Blood Testing', 'Telemedicine'],
    specialties_available: ['General Medicine', 'Maternal Care'],
    is_active: true
  },
  {
    id: '22222222-0000-0000-0000-000000000003',
    facility_code: 'MAH-NSK-CHC-01',
    name: 'Sub-District Hospital Kalwan',
    facility_type: 'sub_district_hosp',
    district: 'Nashik',
    taluka: 'Kalwan',
    village: 'Kalwan',
    pincode: '423501',
    contact_number: '02592-222345',
    operating_hours: '24x7 Secondary Hospital',
    services_available: ['Emergency Medicine', 'Cesarean Delivery', 'Pediatric Inpatient Unit', 'Diagnostic Radiology'],
    specialties_available: ['Obstetrics & Gynecology', 'Pediatrics', 'General Surgery'],
    is_active: true
  },
  {
    id: '22222222-0000-0000-0000-000000000004',
    facility_code: 'MAH-NSK-DH-01',
    name: 'District Civil Hospital Nashik',
    facility_type: 'district_hospital',
    district: 'Nashik',
    taluka: 'Nashik',
    village: 'Nashik City',
    pincode: '422002',
    contact_number: '0253-2576106',
    operating_hours: '24x7 Tertiary Hospital',
    services_available: ['Emergency Resuscitation', 'CEmONC', 'ICU / SNCU', 'Advanced Diagnostic Lab', 'Specialist OPD'],
    specialties_available: ['Cardiology', 'Neurology', 'Pediatrics', 'Obstetrics & Gynecology', 'General Surgery', 'Orthopedics'],
    is_active: true
  }
];

export class FacilityService {
  /**
   * Seeds local Dexie facility directory if empty
   */
  public static async seedIfEmpty(): Promise<void> {
    if (typeof window === 'undefined') return;
    const count = await offlineDb.cachedFacilities.count();
    if (count === 0) {
      await offlineDb.cachedFacilities.bulkAdd(INITIAL_FACILITIES);
    }
  }

  /**
   * Discovers facilities by district, taluka, type, or service query
   */
  public static async getFacilities(filters?: {
    district?: string;
    taluka?: string;
    facilityType?: string;
    searchQuery?: string;
  }): Promise<Facility[]> {
    await this.seedIfEmpty();
    let list = await offlineDb.cachedFacilities.toArray();

    if (filters?.district && filters.district !== 'all') {
      list = list.filter(f => f.district.toLowerCase() === filters.district?.toLowerCase());
    }

    if (filters?.taluka && filters.taluka !== 'all') {
      list = list.filter(f => f.taluka.toLowerCase() === filters.taluka?.toLowerCase());
    }

    if (filters?.facilityType && filters.facilityType !== 'all') {
      list = list.filter(f => f.facility_type === filters.facilityType);
    }

    if (filters?.searchQuery?.trim()) {
      const q = filters.searchQuery.toLowerCase();
      list = list.filter(f =>
        f.name.toLowerCase().includes(q) ||
        f.district.toLowerCase().includes(q) ||
        f.taluka.toLowerCase().includes(q) ||
        f.services_available.some(s => s.toLowerCase().includes(q)) ||
        f.specialties_available.some(s => s.toLowerCase().includes(q))
      );
    }

    return list;
  }

  public static async getFacilityById(id: string): Promise<Facility | undefined> {
    await this.seedIfEmpty();
    return await offlineDb.cachedFacilities.get(id);
  }
}
