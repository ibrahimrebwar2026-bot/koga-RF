import React, { useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, doc, deleteDoc, onSnapshot, query } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Item, Role } from '../../types';
import { Plus, Search, Edit2, Trash2 } from 'lucide-react';

export default function InventoryView({ role }: { role: Role }) {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Form state
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState('');
  const [name, setName] = useState('');
  const [barcode, setBarcode] = useState('');
  const [cartonCostPrice, setCartonCostPrice] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [cartonQuantity, setCartonQuantity] = useState('');
  const [ratio, setRatio] = useState('');
  const [supplier, setSupplier] = useState('');
  const [filterSupplier, setFilterSupplier] = useState('');
  const [sortDate, setSortDate] = useState<'desc' | 'asc'>('desc');
  const [paymentType, setPaymentType] = useState<'cash' | 'debt'>('cash');

  useEffect(() => {
    const q = query(collection(db, 'items'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const itemsData: Item[] = [];
      snapshot.forEach((doc) => {
        itemsData.push({ id: doc.id, ...doc.data() } as Item);
      });
      setItems(itemsData);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedRatio = Number(ratio) || 1;
    const newQuantity = Math.round(Number(cartonQuantity) * parsedRatio); // Total pieces
    const costPricePerPiece = Number(cartonCostPrice) / parsedRatio; // Cost per piece
    
    const itemData = {
      name,
      barcode,
      costPrice: costPricePerPiece,
      sellingPrice: Number(sellingPrice),
      quantity: newQuantity,
      ratio: parsedRatio,
      supplier,
    };

    try {
      if (isEditing) {
        const oldItem = items.find(i => i.id === editId);
        const oldQuantity = oldItem ? oldItem.quantity : 0;
        
        await updateDoc(doc(db, 'items', editId), itemData);
        
        if (newQuantity > oldQuantity) {
          const quantityAdded = newQuantity - oldQuantity;
          await addDoc(collection(db, 'stock_history'), {
            itemId: editId,
            itemName: name,
            quantityAdded,
            date: Date.now()
          });
          
          await addDoc(collection(db, 'transactions'), {
            type: paymentType === 'cash' ? 'company_cash' : 'company_debt',
            amount: costPricePerPiece * quantityAdded,
            date: Date.now(),
            description: paymentType === 'cash' ? `نەقدی زیادکردنی کاڵای ${name}` : `قەرزی زیادکردنی کاڵای ${name}`,
            relatedEntityId: supplier || 'نەزانراو'
          });
        }
      } else {
        const docRef = await addDoc(collection(db, 'items'), { ...itemData, createdAt: Date.now() });
        
        if (newQuantity > 0) {
          await addDoc(collection(db, 'stock_history'), {
            itemId: docRef.id,
            itemName: name,
            quantityAdded: newQuantity,
            date: Date.now()
          });
          
          await addDoc(collection(db, 'transactions'), {
            type: paymentType === 'cash' ? 'company_cash' : 'company_debt',
            amount: costPricePerPiece * newQuantity,
            date: Date.now(),
            description: paymentType === 'cash' ? `نەقدی کڕینی کاڵای ${name}` : `قەرزی کڕینی کاڵای ${name}`,
            relatedEntityId: supplier || 'نەزانراو'
          });
        }

      }
      resetForm();
    } catch (error) {
      console.error("Error saving document: ", error);
      alert('هەڵەیەک ڕوویدا لە کاتی پاشەکەوتکردندا');
    }
  };

  const handleEdit = (item: Item) => {
    setIsEditing(true);
    setEditId(item.id);
    setName(item.name);
    setBarcode(item.barcode);
    setRatio(item.ratio?.toString() || '1');
    setCartonCostPrice(item.costPrice ? (item.costPrice * (item.ratio || 1)).toString() : '');
    setSellingPrice(item.sellingPrice?.toString() || '');
    setCartonQuantity(item.quantity ? (item.quantity / (item.ratio || 1)).toString() : '');
    setSupplier(item.supplier || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'items', id));
    } catch (error) {
      console.error("Error deleting document: ", error);
    }
  };

  const resetForm = () => {
    setIsEditing(false);
    setEditId('');
    setName('');
    setBarcode('');
    setCartonCostPrice('');
    setSellingPrice('');
    setCartonQuantity('');
    setRatio('');
    setSupplier('');
    setPaymentType('cash');
  };

  
  let filteredItems = items.filter(item => 
    (item.name.includes(searchTerm) || item.barcode.includes(searchTerm)) &&
    (filterSupplier ? item.supplier === filterSupplier : true)
  );

  filteredItems.sort((a, b) => {
    const dateA = a.createdAt || 0;
    const dateB = b.createdAt || 0;
    return sortDate === 'desc' ? dateB - dateA : dateA - dateB;
  });

  const uniqueSuppliers = Array.from(new Set(items.map(i => i.supplier).filter(Boolean)));


  return (
    <div className="space-y-6">
      {/* Form Section */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h3 className="text-lg font-bold mb-4 text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2">
          {isEditing ? 'دەستکاریکردنی کاڵا' : 'داخڵکردنی کاڵای نوێ'}
        </h3>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">ناوی کاڵا</label>
            <input
              type="text"
              required
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">بارکۆد (دەستی یان سکانەر)</label>
            <input
              type="text"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              dir="ltr"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">عددی کاڵا (بە کارتۆن)</label>
            <input
              type="number"
              required
              min="0"
              step="any"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={cartonQuantity}
              onChange={(e) => setCartonQuantity(e.target.value)}
              dir="ltr"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">بڕی کارتۆن (هەر کارتۆنێک چەندی تێدایە)</label>
            <input
              type="number"
              required
              min="1"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={ratio}
              onChange={(e) => setRatio(e.target.value)}
              dir="ltr"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">نرخ بە کارتۆن</label>
            <input
              type="number"
              required
              min="0"
              step="0.01"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={cartonCostPrice}
              onChange={(e) => setCartonCostPrice(e.target.value)}
              dir="ltr"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">نرخ بە تاک (بە عدد)</label>
            <input
              type="number"
              required
              min="0"
              step="0.01"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={sellingPrice}
              onChange={(e) => setSellingPrice(e.target.value)}
              dir="ltr"
            />
          </div>
          

          <div>
            <label className="block text-sm text-gray-600 mb-1">کۆمپانیا / شوێن</label>
            <input
              type="text"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={supplier}
              onChange={(e) => setSupplier(e.target.value)}
            />
          </div>
          <div className="lg:col-span-3 flex flex-col gap-3 mt-2">
          <div className="flex gap-4 items-center mb-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" checked={paymentType === 'cash'} onChange={() => setPaymentType('cash')} className="text-indigo-600" />
              <span className="text-sm font-medium text-slate-700">نەقد</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" checked={paymentType === 'debt'} onChange={() => setPaymentType('debt')} className="text-indigo-600" />
              <span className="text-sm font-medium text-slate-700">قەرز</span>
            </label>
          </div>
<div className="flex items-end gap-3">
            <button
              type="submit"
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition flex items-center gap-2"
            >
              {isEditing ? <Edit2 size={18} /> : <Plus size={18} />}
              <span>{isEditing ? 'پاشەکەوتکردنی گۆڕانکاری' : 'زیادکردنی کاڵا'}</span>
            </button>
            {isEditing && (
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition font-medium"
              >
                پاشگەزبوونەوە
              </button>
            )}
          </div>
          </div>
        </form>
      </div>

      {/* List Section */}
      <section className="bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
          <h4 className="font-bold text-slate-700 flex items-center gap-2">📊 لیستی کاڵاکان لە کۆگا</h4>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <select
              className="px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
              value={filterSupplier}
              onChange={(e) => setFilterSupplier(e.target.value)}
            >
              <option value="">هەموو کۆمپانیاکان</option>
              {uniqueSuppliers.map((sup, i) => (
                <option key={i} value={sup as string}>{sup}</option>
              ))}
            </select>
            <select
              className="px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
              value={sortDate}
              onChange={(e) => setSortDate(e.target.value as 'desc' | 'asc')}
            >
              <option value="desc">نوێترین</option>
              <option value="asc">کۆنترین</option>
            </select>
            <div className="relative w-full md:w-64">
              <input
                type="text"
                placeholder="گەڕان بەپێی ناو یان بارکۆد..."
                className="w-full pr-10 pl-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search className="absolute right-3 top-2.5 text-slate-400" size={18} />
            </div>
          </div>

        </div>

        {loading ? (
          <div className="text-center py-10 text-slate-500">خەریکی هێنانە...</div>
        ) : (
          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-right">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                <tr>
                  <th className="px-4 py-3 font-semibold">ناوی کاڵا</th>
                  <th className="px-4 py-3 font-semibold">کۆمپانیا</th>
                  <th className="px-4 py-3 font-semibold">بارکۆد</th>
                  <th className="px-4 py-3 font-semibold">تێچووی کارتۆن</th>
                  <th className="px-4 py-3 font-semibold">فرۆشتنی عدد</th>
                  <th className="px-4 py-3 font-semibold">ماوە (کارتۆن / دانە)</th>
                  <th className="px-4 py-3 font-semibold">قازانجی عدد</th>
                  <th className="px-4 py-3 font-semibold">کردارەکان</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-slate-50">
                {filteredItems.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-4 py-4 font-medium text-slate-900">{item.name}</td>
                    <td className="px-4 py-4 font-medium text-slate-600">{item.supplier || '-'}</td>
                    <td className="px-4 py-4 text-slate-500 font-mono text-xs" dir="ltr">{item.barcode || '-'}</td>
                    <td className="px-4 py-4 text-slate-900" dir="ltr">{((item.costPrice || 0) * (item.ratio || 1)).toLocaleString()}</td>
                    <td className="px-4 py-4 text-slate-900" dir="ltr">{(item.sellingPrice || 0).toLocaleString()}</td>
                    <td className="px-4 py-4 text-slate-900 font-medium" dir="ltr">
                      <span className={`${item.quantity < (item.ratio || 1) ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'} px-2 py-1 rounded text-xs font-bold`}>
                        {Math.floor((item.quantity || 0) / (item.ratio || 1))} کارتۆن و {(item.quantity || 0) % (item.ratio || 1)} دانە
                      </span>
                    </td>
                    <td className="px-4 py-4 text-green-600 font-bold" dir="ltr">{((item.sellingPrice || 0) - (item.costPrice || 0)).toLocaleString()}</td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(item)}
                          className="text-indigo-600 font-bold px-2 py-1 hover:bg-indigo-50 rounded transition"
                        >
                          دەستکاری
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="text-red-600 font-bold px-2 py-1 hover:bg-red-50 rounded transition"
                        >
                          سڕینەوە
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredItems.length === 0 && (
                  <tr>
                    <td colSpan={9} className="text-center py-8 text-slate-500">
                      هیچ کاڵایەک نەدۆزرایەوە
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
