import React from 'react';
import Navbar from '../common/Navbar';
import useStore from '../../store/useStore';
import { CreditCard, Download, ExternalLink, Receipt, Loader2, IndianRupee, X, ShieldCheck as ShieldCheckIcon } from 'lucide-react';
import api from '../../utils/api';
import { toast } from 'react-hot-toast';
import { formatCurrency } from '../../utils/mathUtils';

const Bills = () => {
  const { theme } = useStore();
  const [bills, setBills] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [payingBill, setPayingBill] = React.useState(null);
  const [processing, setProcessing] = React.useState(false);

  React.useEffect(() => {
    fetchBills();
  }, []);

  const fetchBills = async () => {
    try {
      const res = await api.get('/appointments/patient-summary');
      // Map appointments to bill format
      const appointments = res.data.appointments || [];
      const mappedBills = appointments.map(a => ({
        id: a.appointmentId?.slice(-6) || a._id.slice(-6),
        type: `${a.consultationType} Consultation`,
        doctor: a.doctorName,
        amount: a.fee || 450,
        date: new Date(a.date).toLocaleDateString(),
        status: a.paymentStatus || 'Pending',
        _id: a._id
      }));
      setBills(mappedBills);
    } catch (err) {
      toast.error("Failed to sync billing node");
    } finally {
      setLoading(false);
    }
  };

  const totalOutstanding = bills
    .filter(b => b.status === 'Pending')
    .reduce((acc, curr) => acc + (curr.amount || 0), 0);

  const lastTransaction = bills[0]?.amount || 0;

  const handlePaymentComplete = async (billId) => {
    try {
      setProcessing(true);
      await api.put(`/appointments/payment-status/${billId}`, { status: 'Paid' });
      toast.success("Payment Synchronized Successfully");
      setPayingBill(null);
      fetchBills();
    } catch (err) {
      toast.error("Failed to update payment status");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className={`flex min-h-screen transition-colors duration-500 ${theme === 'dark' ? 'bg-[#050505] text-slate-300' : 'bg-[#F8FAFC] text-slate-600'} text-left`}>
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <Navbar />
        <main className="p-8 lg:p-10 pb-32 overflow-y-auto custom-scrollbar">
          <header className="mb-10">
            <h1 className={`text-3xl font-black uppercase tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>Billing & Payments</h1>
            <p className="text-zinc-500 uppercase text-[10px] font-black tracking-widest mt-1">Financial Node Synchronization</p>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
            <div className="bg-blue-600 p-8 rounded-[40px] text-white shadow-2xl shadow-blue-600/30 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-white/20 transition-all"></div>
              <p className="text-blue-100 text-[10px] mb-2 uppercase font-black tracking-[0.2em]">Total Outstanding</p>
              <h2 className="text-5xl font-black tracking-tighter">₹{formatCurrency(totalOutstanding)}</h2>
              <button onClick={() => toast.info("Select a pending invoice to settle")} className="mt-8 bg-white text-blue-600 px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all w-full">Initialize Payment</button>
            </div>

            {[
              { label: 'Last Transaction', val: `₹${formatCurrency(lastTransaction)}`, sub: bills[0] ? `SYNCED ${bills[0].date}` : 'NO ACTIVITY', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
              { label: 'Cycle Spending', val: `₹${formatCurrency(bills.reduce((a,c) => a + (c.amount||0), 0))}`, sub: `${bills.length} TOTAL INVOICES`, color: 'text-blue-500', bg: 'bg-blue-500/10' }
            ].map((stat, i) => (
              <div key={i} className={`p-8 rounded-[40px] border shadow-sm transition-all duration-500 ${theme === 'dark' ? 'bg-[#0A0A0A] border-white/5 shadow-black/50' : 'bg-white border-slate-100'}`}>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{stat.label}</p>
                <h2 className={`text-4xl font-black tracking-tighter ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>{stat.val}</h2>
                <div className={`inline-block px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest mt-4 ${stat.bg} ${stat.color}`}>
                   {stat.sub}
                </div>
              </div>
            ))}
          </div>

          <div className={`rounded-[48px] border shadow-2xl overflow-hidden transition-all duration-500 ${theme === 'dark' ? 'bg-[#0A0A0A] border-white/5' : 'bg-white border-slate-100'}`}>
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[800px]">
                <thead className={`${theme === 'dark' ? 'bg-white/5 border-white/5 text-zinc-500' : 'bg-slate-50 border-slate-100 text-slate-400'} border-b text-[10px] font-black uppercase tracking-[0.2em]`}>
                  <tr>
                    <th className="p-8">Invoice ID</th>
                    <th className="p-8">Clinical Description</th>
                    <th className="p-8">Liability</th>
                    <th className="p-8">Sync Date</th>
                    <th className="p-8">Status</th>
                    <th className="p-8 text-right">Download</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${theme === 'dark' ? 'divide-white/5' : 'divide-slate-50'}`}>
                  {loading ? (
                    <tr>
                      <td colSpan="6" className="p-20 text-center">
                        <Loader2 className="animate-spin mx-auto text-blue-500" size={32} />
                        <p className="text-[10px] font-black uppercase mt-4 text-zinc-500">Synchronizing Billing Records...</p>
                      </td>
                    </tr>
                  ) : bills.length > 0 ? bills.map((bill) => (
                    <tr key={bill._id} className={`transition-all ${theme === 'dark' ? 'hover:bg-white/5' : 'hover:bg-slate-50/50'}`}>
                      <td className="p-8 text-xs font-black text-blue-500 tracking-widest">#{bill.id}</td>
                      <td className="p-8 text-left">
                        <p className={`text-sm font-black uppercase tracking-tight ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>{bill.type}</p>
                        <p className="text-[9px] font-bold text-slate-500 uppercase mt-1">{bill.doctor}</p>
                      </td>
                      <td className={`p-8 text-sm font-black ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>₹{formatCurrency(bill.amount)}</td>
                      <td className="p-8 text-[10px] font-bold text-slate-500 uppercase">{bill.date}</td>
                      <td className="p-8">
                        <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest ${
                          bill.status === 'Paid' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
                        }`}>
                          {bill.status}
                        </span>
                      </td>
                      <td className="p-8 text-right flex justify-end gap-2">
                        {bill.status === 'Pending' && (
                           <button
                             onClick={() => setPayingBill(bill)}
                             className="px-4 py-2 bg-[#2563eb] text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 transition-all flex items-center gap-2 shadow-lg shadow-blue-500/20"
                           >
                              <CreditCard size={14} />
                              Pay with Razorpay
                           </button>
                        )}
                        <button className={`p-3 rounded-2xl transition-all ${theme === 'dark' ? 'bg-white/5 text-zinc-500 hover:text-white' : 'bg-slate-50 text-slate-400 hover:text-blue-600'}`}>
                          <Download size={18} />
                        </button>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="6" className="p-20 text-center">
                        <Receipt className="mx-auto text-zinc-700 opacity-20 mb-4" size={48} />
                        <p className="text-[10px] font-black uppercase text-zinc-500">Financial Archive Empty</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>

        {/* Payment Modal */}
        {payingBill && (
          <div className="fixed inset-0 z-[2000] bg-black/60 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-300">
            <div className={`w-full max-w-md rounded-[48px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500 border ${theme === 'dark' ? 'bg-[#0A0A0A] border-white/5' : 'bg-white border-slate-100'}`}>
              <div className={`p-8 border-b flex items-center justify-between ${theme === 'dark' ? 'border-white/5 bg-white/5' : 'border-slate-50 bg-slate-50/50'}`}>
                 <h2 className={`text-xl font-black text-slate-800 tracking-tighter uppercase ${theme === 'dark' ? 'text-white' : ''}`}>Secure Payment</h2>
                 <button onClick={() => setPayingBill(null)} className={`p-3 rounded-2xl transition-all border ${theme === 'dark' ? 'bg-zinc-900 border-white/5 text-zinc-500 hover:text-white' : 'bg-white border-slate-200 text-slate-400 hover:bg-slate-100'}`}>
                    <X size={20} strokeWidth={3} />
                 </button>
              </div>
              <div className="p-8 space-y-8 text-center">
                 <div className="space-y-2">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount to Sync</p>
                    <h3 className={`text-4xl font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>₹{formatCurrency(payingBill.amount)}</h3>
                    <p className="text-[9px] font-bold text-blue-500 uppercase tracking-widest">{payingBill.type}</p>
                 </div>

                 <div className="p-6 bg-white/5 rounded-3xl border border-white/5 flex gap-4 text-left">
                    <ShieldCheckIcon className="text-emerald-500 shrink-0" size={24} />
                    <p className="text-[10px] font-bold text-slate-400 uppercase leading-relaxed">
                       Universal clinical data encryption active. Your transaction node is protected.
                    </p>
                 </div>

                 <div className="space-y-4">
                   <button
                     onClick={() => {
                        const options = {
                          key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_your_id',
                          amount: payingBill.amount * 100,
                          currency: "INR",
                          name: "Medi Consult",
                          description: `Payment for ${payingBill.type}`,
                          handler: async (response) => {
                            handlePaymentComplete(payingBill._id);
                          },
                          prefill: {
                            name: user.name,
                            email: user.email,
                          },
                          theme: { color: "#2563eb" },
                        };
                        const rzp = new window.Razorpay(options);
                        rzp.open();
                     }}
                     className="w-full py-5 bg-[#2563eb] text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-blue-500/30 hover:bg-blue-700 transition-all flex items-center justify-center gap-3"
                   >
                     Initialize Secure Payment
                   </button>
                 </div>

                 <button
                   onClick={() => handlePaymentComplete(payingBill._id)}
                   className="w-full py-4 text-[9px] font-black uppercase tracking-widest text-zinc-500 hover:text-zinc-300 transition-colors"
                 >
                   Simulate Successful Link (Dev Mode)
                 </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Bills;
