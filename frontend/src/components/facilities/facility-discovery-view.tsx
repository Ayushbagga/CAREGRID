'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/i18n/context';
import { FacilityService } from '@/lib/offline-sync/facility-service';
import { Building2, Search, MapPin, Phone, Clock, Stethoscope, Ticket } from 'lucide-react';
import type { Facility } from '@/types/healthcare';

interface FacilityDiscoveryViewProps {
  onBookToken?: (facility: Facility) => void;
}

export const FacilityDiscoveryView: React.FC<FacilityDiscoveryViewProps> = ({ onBookToken }) => {
  const { t } = useLanguage();
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  const loadFacilities = async () => {
    setIsLoading(true);
    try {
      const list = await FacilityService.getFacilities({
        district: selectedDistrict,
        facilityType: selectedType,
        searchQuery
      });
      setFacilities(list);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFacilities();
  }, [searchQuery, selectedDistrict, selectedType]);

  const formatFacilityType = (type: string) => {
    switch (type) {
      case 'sub_centre': return 'Sub-Centre (Arogya Mandir)';
      case 'phc': return 'Primary Health Centre (PHC)';
      case 'chc': return 'Community Health Centre (CHC)';
      case 'sub_district_hosp': return 'Sub-District Hospital (SDH)';
      case 'district_hospital': return 'District Hospital (DH)';
      default: return type.toUpperCase();
    }
  };

  return (
    <div className="space-y-4">
      {/* Header & Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-2 justify-between items-center">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={t.facilitySearchPlaceholder}
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
            />
          </div>

          <div className="flex w-full sm:w-auto space-x-2">
            <select
              value={selectedDistrict}
              onChange={e => setSelectedDistrict(e.target.value)}
              className="px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-teal-500 font-medium"
            >
              <option value="all">{t.filterAllDistricts}</option>
              <option value="Gadchiroli">Gadchiroli (गडचिरोली)</option>
              <option value="Nashik">Nashik (नाशिक)</option>
              <option value="Pune">Pune (पुणे)</option>
            </select>

            <select
              value={selectedType}
              onChange={e => setSelectedType(e.target.value)}
              className="px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-teal-500 font-medium"
            >
              <option value="all">{t.filterAllTypes}</option>
              <option value="sub_centre">Sub-Centre</option>
              <option value="phc">PHC</option>
              <option value="chc">CHC / SDH</option>
              <option value="district_hospital">District Hospital</option>
            </select>
          </div>
        </div>
      </div>

      {/* Facilities Cards List */}
      {isLoading ? (
        <div className="py-8 text-center text-xs text-slate-500">Discovering public health facilities...</div>
      ) : facilities.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-xs text-slate-500">
          No healthcare facilities found matching your criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {facilities.map(facility => (
            <div
              key={facility.id}
              className="bg-white p-4 rounded-xl border border-slate-200 hover:border-teal-300 shadow-xs transition-all space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-bold text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded uppercase">
                      {formatFacilityType(facility.facility_type)}
                    </span>
                    <h4 className="font-bold text-slate-900 text-sm sm:text-base mt-1.5 leading-snug">
                      {facility.name}
                    </h4>
                    <p className="text-xs text-slate-500 flex items-center mt-0.5">
                      <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400" />
                      {facility.taluka}, {facility.district}
                    </p>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono bg-slate-100 px-1.5 py-0.5 rounded">
                    {facility.facility_code}
                  </span>
                </div>

                {/* Operating Hours & Phone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <div className="flex items-center space-x-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{facility.operating_hours}</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{facility.contact_number}</span>
                  </div>
                </div>

                {/* Available Services */}
                <div>
                  <span className="text-[11px] font-bold text-slate-700 block mb-1">
                    {t.servicesOfferedLabel}:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {facility.services_available?.map((service, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded text-[10px] bg-slate-100 text-slate-700 font-medium"
                      >
                        {service}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Clinical Specialties */}
                <div>
                  <span className="text-[11px] font-bold text-slate-700 block mb-1">
                    {t.specialtiesLabel}:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {facility.specialties_available?.map((spec, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded text-[10px] bg-teal-50 text-teal-800 font-semibold border border-teal-100"
                      >
                        {spec}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-2 border-t border-slate-100 flex justify-end items-center">
                {onBookToken && (
                  <button
                    type="button"
                    onClick={() => onBookToken(facility)}
                    className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-lg shadow-xs flex items-center space-x-1.5 transition-colors"
                  >
                    <Ticket className="w-3.5 h-3.5" />
                    <span>{t.bookOpdTokenBtn}</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
