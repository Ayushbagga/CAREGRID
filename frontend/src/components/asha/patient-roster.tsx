'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/i18n/context';
import { PatientService } from '@/lib/offline-sync/patient-service';
import { Search, Activity, AlertCircle, Phone, MapPin } from 'lucide-react';
import type { Patient } from '@/types/healthcare';

interface PatientRosterProps {
  onSelectForScreening?: (patientId: string) => void;
  onNewRegistration?: () => void;
  onViewRecord?: (patientId: string) => void;
}

export const PatientRoster: React.FC<PatientRosterProps> = ({
  onSelectForScreening,
  onNewRegistration,
  onViewRecord
}) => {
  const { t } = useLanguage();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'pregnant' | 'highRisk' | 'chronic'>('all');
  const [isLoading, setIsLoading] = useState(true);

  const loadPatients = async () => {
    setIsLoading(true);
    try {
      const list = await PatientService.getPatients(searchQuery, activeFilter);
      setPatients(list);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPatients();
  }, [searchQuery, activeFilter]);

  return (
    <div className="space-y-4">
      {/* Search and Action Bar */}
      <div className="flex flex-col sm:flex-row gap-2 justify-between items-center">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={t.searchPlaceholder}
            className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
          />
        </div>

        {onNewRegistration && (
          <button
            onClick={onNewRegistration}
            className="w-full sm:w-auto px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs sm:text-sm font-bold rounded-lg shadow-sm flex items-center justify-center space-x-1 transition-colors"
          >
            <span>{t.newRegistrationBtn}</span>
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-2 overflow-x-auto pb-1 text-xs">
        {[
          { id: 'all', label: t.allPatients },
          { id: 'pregnant', label: t.pregnantFilter },
          { id: 'highRisk', label: t.highRiskFilter },
          { id: 'chronic', label: t.chronicFilter }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveFilter(tab.id as any)}
            className={`px-3 py-1.5 rounded-full font-medium whitespace-nowrap transition-colors ${
              activeFilter === tab.id
                ? 'bg-teal-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Patients List */}
      {isLoading ? (
        <div className="py-8 text-center text-xs text-slate-500">Loading roster...</div>
      ) : patients.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-xs text-slate-500">
          {t.noPatientsFound}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {patients.map(patient => (
            <div
              key={patient.id}
              className="bg-white p-4 rounded-xl border border-slate-200 hover:border-teal-300 shadow-sm transition-all space-y-2.5"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{patient.full_name}</h4>
                  <div className="flex items-center space-x-2 text-xs text-slate-500 mt-0.5">
                    <span>{patient.estimated_age} yrs</span>
                    <span>•</span>
                    <span className="capitalize">{patient.gender}</span>
                    <span>•</span>
                    <span className="flex items-center"><MapPin className="w-3 h-3 mr-0.5" />{patient.village}</span>
                  </div>
                </div>

                {onSelectForScreening && (
                  <button
                    onClick={() => onSelectForScreening(patient.id)}
                    className="px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 rounded text-xs font-semibold flex items-center space-x-1"
                  >
                    <Activity className="w-3.5 h-3.5" />
                    <span>{t.recordVitalsBtn}</span>
                  </button>
                )}
              </div>

              {/* Status Badges */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {patient.is_pregnant && (
                  <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-pink-100 text-pink-800">
                    🤰 Pregnant ({patient.gestational_age_weeks || 0}w)
                  </span>
                )}
                {patient.high_risk_pregnancy && (
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-red-100 text-red-800 flex items-center space-x-1">
                    <AlertCircle className="w-3 h-3 inline mr-0.5" /> High Risk
                  </span>
                )}
                {patient.chronic_conditions?.map((cond, i) => (
                  <span key={i} className="px-2 py-0.5 rounded text-[11px] bg-slate-100 text-slate-700 font-medium">
                    {cond}
                  </span>
                ))}
              </div>

              {/* Contact Footer */}
              <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-xs text-slate-500">
                <span className="flex items-center"><Phone className="w-3 h-3 mr-1 text-slate-400" />{patient.primary_phone}</span>
                <div className="flex items-center space-x-2">
                  {onViewRecord && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onViewRecord(patient.id); }}
                      className="text-[11px] font-bold text-teal-700 hover:underline"
                    >
                      {t.viewHealthRecordBtn}
                    </button>
                  )}
                  {patient.abha_id && (
                    <span className="text-[10px] bg-teal-50 text-teal-800 px-1.5 py-0.5 rounded">ABHA Linked</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
