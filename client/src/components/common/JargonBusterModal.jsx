import React, { useState, useEffect } from 'react';
import { BookOpen, Search, X, Scale, FileText, Sparkles } from 'lucide-react';
import clsx from 'clsx';

const JARGON_DICTIONARY = [
  {
    term: '7/12 Extract (सातबारा उतारे)',
    category: 'Land Title & Revenue',
    shortDef: 'Official Land Register Extract',
    explanation: 'A fundamental revenue document issued by the Land Records Department (Mahabhulekh) showing legal ownership, survey/gut numbers, crop history, and encumbrances/liens against rural or peri-urban land.'
  },
  {
    term: 'Mojani (मोजणी / Kayam Mojani)',
    category: 'Survey & Demarcation',
    shortDef: 'Cadastral Boundary Measurement Sheet',
    explanation: 'An on-ground trigonometric survey conducted by the Taluka Inspector of Land Records (TILR). It officially fixes plot boundaries, street widening setbacks, and adjoining government reservations before blueprint sanction.'
  },
  {
    term: 'AutoDCR / PreDCR Scrutiny',
    category: 'Architectural Compliance',
    shortDef: 'State Automated CAD Blueprint Checker',
    explanation: 'State-mandated software (integrated into MahaBPAMS) that parses layered AutoCAD (.dwg) files submitted by licensed architects to algorithmically verify setback distances, FSI, ground coverage, parking, and staircase ventilation.'
  },
  {
    term: 'IOD (Intimation of Disapproval)',
    category: 'Conditional Approval',
    shortDef: 'Section 45 Conditional Sanction Notice',
    explanation: 'A misleading historical term: it is actually a conditional green signal. The municipal authority approves architectural drawings in principle, but forbids ground excavation until ~15 to 20 parallel departmental NOCs (tree, hydraulic, fire, structural) are submitted.'
  },
  {
    term: 'CC (Commencement Certificate)',
    category: 'Permits & Construction',
    shortDef: 'Legal Groundbreaking Authorization',
    explanation: 'The definitive statutory permit (Appendix C under UDCPR 2020) issued by the Town Planning authority. It legally unlocks physical excavation and structural casting up to the plinth height level.'
  },
  {
    term: 'Plinth Checking (Regulation 2.8.4)',
    category: 'Inspections & Hold Points',
    shortDef: 'Mandatory Foundation Inspection Halt',
    explanation: 'A statutory halt where construction must pause when the foundation reaches plinth height. Municipal engineers inspect the physical site to verify that actual boundary offsets and road setbacks match the sanctioned blueprint before issuing Superstructure CC.'
  },
  {
    term: 'OC (Occupancy Certificate)',
    category: 'Habitation & Utilities',
    shortDef: 'Final Habitability Certification',
    explanation: 'Issued under UDCPR Regulation 2.10 upon building completion. It validates that construction strictly follows the sanctioned plan, unlocking legal permanent electricity meters, drinking water mains, and municipal tax assessment.'
  },
  {
    term: 'CTS / Property Card (मालमत्ता पत्रक)',
    category: 'Urban Land Records',
    shortDef: 'City Title Survey Record',
    explanation: 'The urban equivalent of the 7/12 extract, maintained by City Survey Offices (CTSO) for properties within municipal corporation limits and urban gaothans.'
  },
  {
    term: 'RTS Act (Right to Public Services Act)',
    category: 'Statutory Governance',
    shortDef: 'Maharashtra Time-Bound Guarantee',
    explanation: 'State law mandating statutory maximum turnaround timelines (e.g., 30-60 days for building permits) with monetary penalties on municipal officers for unexcused administrative delays.'
  },
  {
    term: 'UDCPR 2020',
    category: 'Bylaws & Regulations',
    shortDef: 'Unified Development Control & Promotion Regulations',
    explanation: 'The unified statutory rulebook applicable across all Municipal Corporations and Councils in Maharashtra (excluding BMC which follows DCPR 2034), standardizing FSI, setbacks, parking, and permitting.'
  }
];

export default function JargonBusterModal({ isOpen, onClose }) {
  const [searchTerm, setSearchTerm] = useState('');

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredJargon = JARGON_DICTIONARY.filter(
    (item) =>
      item.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.explanation.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                Civic Jargon Buster
                <span className="text-xs font-normal text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700">
                  UDCPR & Municipal Lexicon
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Demystifying statutory procedures, acronyms, and Marathi municipal revenue terms.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-slate-800 bg-slate-900/90">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by abbreviation, Marathi term, or rule (e.g., IOD, 7/12, Plinth)..."
              className="w-full bg-slate-800/90 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              autoFocus
            />
          </div>
        </div>

        {/* Jargon Cards Grid */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {filteredJargon.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-xs">
              No matching statutory terms found for "{searchTerm}".
            </div>
          ) : (
            filteredJargon.map((item, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-slate-850 border border-slate-800 hover:border-slate-700 transition-all space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-950/60 text-indigo-300 border border-indigo-800/40">
                    {item.category}
                  </span>
                  <span className="text-xs font-semibold text-slate-400">
                    {item.shortDef}
                  </span>
                </div>

                <h4 className="font-bold text-sm text-slate-100">
                  {item.term}
                </h4>

                <p className="text-xs text-slate-300 leading-relaxed">
                  {item.explanation}
                </p>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/40 flex items-center justify-between text-xs text-slate-400">
          <span>Sourced from UDCPR 2020 & Maharashtra Regional Town Planning Act (MRTP 1966).</span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
