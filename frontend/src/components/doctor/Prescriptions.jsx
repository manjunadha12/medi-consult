import React, { useState, useEffect } from 'react';
import Navbar from '../common/Navbar';
import api from '../../utils/api';
import { toast } from 'react-hot-toast';
import { 
  FileText, Calendar, User, Activity, Download, Printer, 
  Search as SearchIcon, ShieldCheck as ShieldCheckIcon, CheckCircle, Info, ChevronRight, X, Trash2, Loader2
} from 'lucide-react';
import useStore from '../../store/useStore';

const Prescriptions = () => {
  const { theme } = useStore();
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal State
  const [selectedPrescription, setSelectedPrescription] = useState(null);

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  const fetchPrescriptions = async () => {
    setLoading(true);
    try {
      const res = await api.get('/doctor/prescriptions');
      setPrescriptions(res.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load issued medical prescriptions.');
    } finally {
      setLoading(false);
    }
  };

  const triggerPrint = () => {
    window.print();
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Purge this prescription from central registry? This action is permanent.")) return;

    setDeletingId(id);
    try {
      await api.delete(`/doctor/prescription/${id}`);
      toast.success("Medical record purged");
      fetchPrescriptions();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete record");
    } finally {
      setDeletingId(null);
    }
  };

  const filteredPrescriptions = prescriptions.filter(p => {
    const query = searchQuery.toLowerCase();
    return (
      p.diagnosis?.toLowerCase().includes(query) ||
      p.patientId?.toLowerCase().includes(query) ||
      p.doctorRegNo?.toLowerCase().includes(query) ||
      p.medicines.some(m => m.name.toLowerCase().includes(query))
    );
  });

  return (
    <div className="flex min-h-screen bg-[#050505] text-zinc-300 text-left neural-grid pb-24 relative overflow-x-hidden">
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <Navbar />

        <main className="flex-1 overflow-y-auto p-4 md:p-8 space-y-10 custom-scrollbar relative z-10 print:p-0 print:m-0 print:bg-white print:text-black">
          
          {/* Header Panel */}
          <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 pb-8 print:hidden">
            <div>
              <h1 className="text-3xl font-black text-white uppercase tracking-tight">Prescription Archives</h1>
              <p className="text-blue-500 uppercase text-[10px] font-black tracking-widest mt-1">Search and view all prescriptions issued by you</p>
            </div>
            <div className="relative w-full md:w-80">
              <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-650" size={16} />
              <input
                type="text"
                placeholder="Search patient, diagnosis, or drug..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-5 py-3 bg-white/5 border border-white/5 rounded-2xl outline-none font-bold text-xs text-white focus:border-blue-500/30 transition-all placeholder:text-zinc-650"
              />
            </div>
          </header>

          {/* Printable Prescription Content (Only visible on Print) */}
          {selectedPrescription && (
            <div id="print-area" className="hidden print:block p-10 bg-white text-black font-sans min-h-screen text-left">
              <div className="border-b-4 border-blue-600 pb-6 mb-8 flex justify-between items-start">
                <div>
                  <h1 className="text-3xl font-extrabold uppercase tracking-tight text-blue-600">MediConsult Hospital</h1>
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Clinical Prescription Record</p>
                </div>
                <div className="text-right text-xs">
                  <p className="font-bold">Doctor Reg No: <span className="text-blue-600 font-extrabold">{selectedPrescription.doctorRegNo || 'REG89721'}</span></p>
                  <p>Date Issued: {new Date(selectedPrescription.createdAt).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8 mb-8 text-xs">
                <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100">
                  <h3 className="font-extrabold uppercase text-blue-600 tracking-wider mb-2 border-b border-gray-200 pb-1">Consulting Specialist</h3>
                  <p className="font-bold text-gray-800">Dr. Naresh Trehan</p>
                  <p className="text-gray-500">Chief Consultant</p>
                  <p className="text-gray-400 mt-2">MediConsult Clinical Center</p>
                </div>
                <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100">
                  <h3 className="font-extrabold uppercase text-blue-600 tracking-wider mb-2 border-b border-gray-200 pb-1">Patient Details</h3>
                  <p className="font-bold text-gray-800">Patient ID: <span className="font-extrabold">{selectedPrescription.patientId}</span></p>
                  <p className="text-gray-500 mt-1">Medical Record Link</p>
                </div>
              </div>

              <div className="text-xs mb-8">
                <p className="font-extrabold text-zinc-800 uppercase text-[9px] tracking-wider mb-1">Diagnosis Context:</p>
                <p className="font-extrabold text-zinc-900 border-b border-zinc-100 pb-3">{selectedPrescription.diagnosis}</p>
              </div>

              <div className="mb-10 text-xs">
                <h3 className="font-extrabold uppercase text-blue-600 tracking-wider mb-4 border-b border-gray-200 pb-1">Prescribed Medications</h3>
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-200 text-gray-400 font-bold uppercase text-[9px] tracking-wider">
                      <th className="py-2">Medication</th>
                      <th className="py-2">Dosage</th>
                      <th className="py-2">Frequency</th>
                      <th className="py-2">Timing</th>
                      <th className="py-2">Duration</th>
                      <th className="py-2 text-right">Qty</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 font-bold text-gray-800">
                    {selectedPrescription.medicines.map((med, idx) => (
                      <tr key={idx}>
                        <td className="py-3">
                          <p className="font-extrabold text-blue-600 uppercase">{med.name}</p>
                          {med.genericName && <p className="text-[9px] text-gray-400 font-normal italic mt-0.5">({med.genericName})</p>}
                          {med.specialInstructions && <p className="text-[9px] text-red-500 font-bold mt-1">* {med.specialInstructions}</p>}
                        </td>
                        <td className="py-3">{med.dosage}</td>
                        <td className="py-3 uppercase">{med.frequency}</td>
                        <td className="py-3">{med.foodInstruction}</td>
                        <td className="py-3">{med.durationValue} {med.durationUnit}</td>
                        <td className="py-3 text-right">{med.quantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {selectedPrescription.advice && (
                <div className="text-xs text-gray-700 leading-relaxed mb-8 bg-gray-50 p-4 rounded-xl border border-gray-150">
                  <p className="font-extrabold text-gray-900 uppercase tracking-widest text-[8px] mb-1">Clinical Advice Directives:</p>
                  <p>{selectedPrescription.advice}</p>
                </div>
              )}

              <div className="flex justify-between items-end mt-16 text-xs border-t border-gray-100 pt-6">
                <div>
                  <p className="text-gray-400 uppercase text-[9px]">Electronic Auth Signature</p>
                  <p className="font-black text-gray-800 mt-2">{user?.name}</p>
                  <p className="text-gray-400">Authorized Specialist</p>
                </div>
                <div className="text-right">
                  <p className="text-gray-400 uppercase text-[9px] mb-1">Stamp & Verify</p>
                  <div className="w-16 h-16 border border-dashed border-gray-300 rounded-lg flex items-center justify-center text-[7px] font-bold text-gray-400 uppercase tracking-widest">
                    QR Stamp
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Screen Only Prescription List */}
          {loading ? (
            <div className="h-64 flex items-center justify-center print:hidden">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:hidden">
              {filteredPrescriptions.map(p => (
                <div key={p._id} className="bg-zinc-950/80 border border-white/5 rounded-[36px] p-6 relative overflow-hidden group shadow-lg flex flex-col justify-between">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-blue-600/10 rounded-full blur-3xl"></div>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]"></span>
                        <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Issued Rx</span>
                      </div>
                      <span className="text-[9px] text-zinc-500 font-bold flex items-center gap-1">
                        <Calendar size={12} /> {new Date(p.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-base font-black text-white uppercase tracking-tight line-clamp-1">{p.diagnosis}</h3>
                      <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest mt-0.5">Patient ID: {p.patientId}</p>
                    </div>

                    <div className="space-y-2 pt-2">
                      <p className="text-[10px] font-bold text-zinc-500 flex justify-between">
                        <span>Medicines:</span>
                        <span className="text-zinc-300 font-black truncate max-w-[200px]">{p.medicines.map(m => m.name).join(', ')}</span>
                      </p>
                      <p className="text-[10px] font-bold text-zinc-500 flex justify-between">
                        <span>Doctor Reg:</span>
                        <span className="text-zinc-300 font-black">{p.doctorRegNo || 'REG89721'}</span>
                      </p>
                    </div>
                  </div>

                  <div className="mt-8 pt-4 border-t border-white/5 flex gap-3">
                    <button
                      onClick={() => setSelectedPrescription(p)}
                      className="flex-1 py-3.5 bg-blue-600/10 border border-blue-500/20 hover:bg-blue-600/20 text-blue-400 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 active:scale-95"
                    >
                      <FileText size={12} /> View Details
                    </button>
                    <button
                      onClick={() => handleDelete(p._id)}
                      disabled={deletingId === p._id}
                      className="px-5 py-3.5 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-30"
                    >
                      {deletingId === p._id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                    </button>
                  </div>
                </div>
              ))}
              {filteredPrescriptions.length === 0 && (
                <div className="col-span-full py-16 text-center bg-zinc-950/80 border border-white/5 border-dashed rounded-[40px]">
                  <FileText size={40} className="text-zinc-650 mx-auto mb-4" />
                  <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">No prescription records found.</p>
                </div>
              )}
            </div>
          )}

        </main>
      </div>

      {/* Detail Modal Console */}
      {selectedPrescription && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[2000] p-4 animate-in fade-in duration-200 print:hidden text-left">
          <div className="bg-zinc-950 border border-white/10 max-w-4xl w-full rounded-[48px] p-6 md:p-8 space-y-6 shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center border-b border-white/5 pb-4">
              <div>
                <h3 className="text-lg font-black text-white uppercase tracking-tight">Prescription Terminal Console</h3>
                <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mt-1">Full pharmacology schema output</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={triggerPrint}
                  className="px-4 py-2 bg-blue-600 text-white text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-blue-500 shadow-md shadow-blue-500/10 flex items-center gap-1.5 active:scale-95"
                >
                  <Printer size={12} /> Print / Download PDF
                </button>
                <button
                  onClick={() => setSelectedPrescription(null)}
                  className="px-4 py-2 bg-white/5 text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-white/10 text-zinc-400 hover:text-white transition-all active:scale-95"
                >
                  Close Console
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-zinc-900/50 rounded-3xl border border-white/5 space-y-8">
              {/* Paper letterhead */}
              <div className="bg-white text-zinc-800 p-8 rounded-2xl shadow-xl space-y-6 font-sans">
                <div className="border-b-2 border-zinc-200 pb-4 mb-6 flex justify-between items-start">
                  <div>
                    <h4 className="text-xl font-extrabold uppercase text-blue-600 tracking-tight">MediConsult Diagnostics</h4>
                    <p className="text-[8px] text-zinc-400 font-extrabold uppercase tracking-widest mt-0.5">Clinical Authorization Link</p>
                  </div>
                  <div className="text-right text-[10px] text-zinc-500">
                    <p className="font-bold">Reg Number: <span className="text-zinc-800 font-extrabold">{selectedPrescription.doctorRegNo || 'REG89721'}</span></p>
                    <p>Date Issued: {new Date(selectedPrescription.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-[10px] border-b border-zinc-150 pb-4">
                  <div>
                    <p className="font-black text-zinc-400 uppercase text-[8px] tracking-widest">Consulting Specialist</p>
                    <p className="font-bold text-zinc-800 mt-1">{user?.name}</p>
                    <p className="text-zinc-500">{user?.role === 'doctor' ? 'Chief Consultant' : 'Specialist Node'}</p>
                  </div>
                  <div>
                    <p className="font-black text-zinc-400 uppercase text-[8px] tracking-widest">Patient Identity</p>
                    <p className="font-bold text-zinc-800 mt-1">Patient Record Node</p>
                    <p className="text-zinc-500">Patient ID: {selectedPrescription.patientId}</p>
                  </div>
                </div>

                <div className="text-[10px] text-zinc-700">
                  <p className="font-bold text-zinc-400 uppercase text-[8px] tracking-wider mb-1">Diagnosis Context:</p>
                  <p className="font-extrabold text-zinc-800">{selectedPrescription.diagnosis}</p>
                </div>

                <div className="space-y-4">
                  <p className="font-bold text-zinc-400 uppercase text-[8px] tracking-wider border-b border-zinc-100 pb-1">Medication Schedule Matrix:</p>
                  <table className="w-full text-left border-collapse text-[10px]">
                    <thead>
                      <tr className="border-b border-zinc-100 text-gray-400 font-bold uppercase text-[8px] tracking-wider">
                        <th className="py-2">Medication</th>
                        <th className="py-2">Dosage</th>
                        <th className="py-2">Frequency</th>
                        <th className="py-2">Timing</th>
                        <th className="py-2">Duration</th>
                        <th className="py-2 text-right">Qty</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 font-bold text-gray-800">
                      {selectedPrescription.medicines.map((med, idx) => (
                        <tr key={idx}>
                          <td className="py-3">
                            <p className="font-extrabold text-blue-600 uppercase">{med.name}</p>
                            {med.genericName && <p className="text-[8px] text-gray-400 font-normal italic mt-0.5">({med.genericName})</p>}
                            {med.specialInstructions && <p className="text-[8px] text-red-500 font-bold mt-1">* {med.specialInstructions}</p>}
                          </td>
                          <td className="py-3">{med.dosage}</td>
                          <td className="py-3 uppercase">{med.frequency}</td>
                          <td className="py-3">{med.foodInstruction}</td>
                          <td className="py-3">{med.durationValue} {med.durationUnit}</td>
                          <td className="py-3 text-right">{med.quantity}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {selectedPrescription.advice && (
                  <div className="text-[10px] text-zinc-650 bg-zinc-50 p-4 rounded-xl border border-zinc-150">
                    <p className="font-bold text-zinc-800 uppercase text-[8px] tracking-wider mb-1">Clinical Advice directives:</p>
                    <p>{selectedPrescription.advice}</p>
                  </div>
                )}

                <div className="border-t border-zinc-150 pt-4 flex justify-between items-center text-[9px] text-zinc-400">
                  <p>QR Code Data: verified_rx_link_{selectedPrescription._id.slice(-6)}</p>
                  <p>Digital Stamp: AUTHORIZED_BY_DR_NARESH_TREHAN</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Prescriptions;
