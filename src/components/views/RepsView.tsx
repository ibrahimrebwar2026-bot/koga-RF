import React, { useState, useEffect } from 'react';
import { collection, addDoc, onSnapshot, query, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { SalesRep } from '../../types';
import { Users, Truck } from 'lucide-react';
import { Plus, Edit2, Trash2 } from 'lucide-react';

export default function RepsView() {
  const [reps, setReps] = useState<SalesRep[]>([]);
  const [cashvans, setCashvans] = useState<SalesRep[]>([]);
  const [activeTab, setActiveTab] = useState<'reps' | 'cashvans'>('reps');
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState('');

  useEffect(() => {
    const qReps = query(collection(db, 'reps'));
    const unsubReps = onSnapshot(qReps, (snapshot) => {
      const repsData: SalesRep[] = [];
      snapshot.forEach((doc) => {
        repsData.push({ id: doc.id, ...doc.data() } as SalesRep);
      });
      setReps(repsData);
      setLoading(false);
    });

    const qCashvans = query(collection(db, 'cashvans'));
    const unsubCashvans = onSnapshot(qCashvans, (snapshot) => {
      const cvData: SalesRep[] = [];
      snapshot.forEach((doc) => {
        cvData.push({ id: doc.id, ...doc.data() } as SalesRep);
      });
      setCashvans(cvData);
    });

    return () => {
      unsubReps();
      unsubCashvans();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || !isEditing) return;

    try {
      await updateDoc(doc(db, activeTab === 'reps' ? 'reps' : 'cashvans', editId), { name, phone });
      resetForm();
    } catch (error) {
      console.error(error);
    }
  };

  const resetForm = () => {
    setName('');
    setPhone('');
    setIsEditing(false);
    setEditId('');
  };

  const handleEdit = (rep: SalesRep) => {
    setName(rep.name);
    setPhone(rep.phone);
    setIsEditing(true);
    setEditId(rep.id);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, activeTab === 'reps' ? 'reps' : 'cashvans', id));
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-2 bg-white p-2 rounded-xl shadow-sm border border-slate-200">
        <button
          onClick={() => { setActiveTab('reps'); resetForm(); }}
          className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition ${activeTab === 'reps' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}
        >
          <div className="flex justify-center items-center gap-2">
            <Users size={18} /> مەندووبەکان
          </div>
        </button>
        <button
          onClick={() => { setActiveTab('cashvans'); resetForm(); }}
          className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition ${activeTab === 'cashvans' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}
        >
          <div className="flex justify-center items-center gap-2">
            <Truck size={18} /> کاشڤانەکان
          </div>
        </button>
      </div>

      {isEditing && (
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold mb-4 text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2">
            {activeTab === 'reps' ? 'دەستکاریکردنی مەندووب' : 'دەستکاریکردنی کاشڤان'}
          </h3>
          <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm text-slate-600 mb-1">{activeTab === 'reps' ? 'ناوی مەندووب' : 'ناوی کاشڤان'}</label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm text-slate-600 mb-1">ژمارەی تەلەفۆن</label>
              <input
                type="tel"
                required
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                dir="ltr"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition flex items-center gap-2 text-sm h-10"
              >
                <Edit2 size={18} />
                <span>پاشەکەوتکردن</span>
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-2 bg-slate-100 text-slate-600 font-medium rounded-lg hover:bg-slate-200 transition text-sm h-10"
              >
                پاشگەزبوونەوە
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <h4 className="font-bold text-slate-700 flex items-center gap-2">{activeTab === 'reps' ? '👥 لیستی مەندووبەکان' : '🚚 لیستی کاشڤانەکان'}</h4>
        </div>
        {loading ? (
          <div className="text-center py-10 text-slate-500">خەریکی هێنانە...</div>
        ) : (
          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-right">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                <tr>
                  <th className="px-4 py-3 font-semibold">ناو</th>
                  <th className="px-4 py-3 font-semibold">تەلەفۆن</th>
                  <th className="px-4 py-3 font-semibold">فرۆش</th>
                  <th className="px-4 py-3 font-semibold">قازانج</th>
                  <th className="px-4 py-3 font-semibold">کردارەکان</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-slate-50">
                {(activeTab === 'reps' ? reps : cashvans).map(rep => (
                  <tr key={rep.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-4 py-4 font-medium text-slate-900">{rep.name}</td>
                    <td className="px-4 py-4 text-slate-500 font-mono text-xs" dir="ltr">{rep.phone}</td>
                    <td className="px-4 py-4 text-slate-900 font-bold" dir="ltr">{rep.totalSales.toLocaleString()}</td>
                    <td className="px-4 py-4 text-green-600 font-bold" dir="ltr">{rep.totalProfit.toLocaleString()}</td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(rep)}
                          className="text-indigo-600 font-bold px-2 py-1 hover:bg-indigo-50 rounded transition"
                        >
                          دەستکاری
                        </button>
                        <button
                          onClick={() => handleDelete(rep.id)}
                          className="text-red-600 font-bold px-2 py-1 hover:bg-red-50 rounded transition"
                        >
                          سڕینەوە
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {(activeTab === 'reps' ? reps : cashvans).length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-slate-500">
                      {activeTab === 'reps' ? 'هیچ مەندووبێک نەدۆزرایەوە' : 'هیچ کاشڤانێک نەدۆزرایەوە'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
