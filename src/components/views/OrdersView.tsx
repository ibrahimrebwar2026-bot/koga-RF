import React, { useState, useEffect } from 'react';
import { collection, getDocs, where, addDoc, updateDoc, doc, onSnapshot, query, orderBy, deleteDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Order, Item, Role, Market } from '../../types';
import { ShoppingCart, Plus, Printer, CheckCircle, Search, X, DollarSign, CreditCard, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

export default function OrdersView({ role }: { role: Role }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);

  // New Order State
  const [showNewOrder, setShowNewOrder] = useState(false);
  const [repName, setRepName] = useState('');
  const [marketName, setMarketName] = useState('');
  const [location, setLocation] = useState('');
  const [selectedItems, setSelectedItems] = useState<{item: Item, quantity: number, unit: 'piece'|'carton'}[]>([]);
  
  // Selection
  const [searchTerm, setSearchTerm] = useState('');

  // Settlement
  const [settlingOrder, setSettlingOrder] = useState<Order | null>(null);

  useEffect(() => {
    const qOrders = query(collection(db, 'orders'), orderBy('timestamp', 'desc'));
    const unsubOrders = onSnapshot(qOrders, (snapshot) => {
      const ordersData: Order[] = [];
      snapshot.forEach((doc) => {
        ordersData.push({ id: doc.id, ...doc.data() } as Order);
      });
      setOrders(ordersData);
    });

    const qItems = query(collection(db, 'items'));
    const unsubItems = onSnapshot(qItems, (snapshot) => {
      const itemsData: Item[] = [];
      snapshot.forEach((doc) => {
        itemsData.push({ id: doc.id, ...doc.data() } as Item);
      });
      setItems(itemsData);
    });

    const qMarkets = query(collection(db, 'markets'));
    const unsubMarkets = onSnapshot(qMarkets, (snapshot) => {
      const marketsData: Market[] = [];
      snapshot.forEach((doc) => {
        marketsData.push({ id: doc.id, ...doc.data() } as Market);
      });
      setMarkets(marketsData);
      setLoading(false);
    });

    return () => {
      unsubOrders();
      unsubItems();
      unsubMarkets();
    };
  }, []);

  const handleMarketChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setMarketName(val);
    const existingMarket = markets.find(m => m.name === val);
    if (existingMarket) {
      setLocation(existingMarket.location);
    }
  };

  const handleAddItemToOrder = (item: Item) => {
    const exists = selectedItems.find(si => si.item.id === item.id);
    if (exists) {
      const newQty = exists.quantity + 1;
      const totalPieces = exists.unit === 'carton' ? newQty * (exists.item.ratio || 1) : newQty;
      if (totalPieces > exists.item.quantity) {
        alert('بڕی داواکراو لە کۆگا بەردەست نییە');
        return;
      }
      setSelectedItems(selectedItems.map(si => 
        si.item.id === item.id ? { ...si, quantity: newQty } : si
      ));
    } else {
      if (item.quantity < 1) {
        alert('بڕی داواکراو لە کۆگا بەردەست نییە');
        return;
      }
      setSelectedItems([...selectedItems, { item, quantity: 1, unit: 'piece' }]);
    }
  };

  const handleUpdateItemQuantity = (id: string, qty: number, unit?: 'piece'|'carton') => {
    if (qty <= 0) {
      setSelectedItems(selectedItems.filter(si => si.item.id !== id));
      return;
    }
    
    const item = selectedItems.find(si => si.item.id === id);
    if (item) {
      const selectedUnit = unit || item.unit;
      const totalPieces = selectedUnit === 'carton' ? qty * (item.item.ratio || 1) : qty;
      if (totalPieces > item.item.quantity) {
        alert('بڕی داواکراو لە کۆگا بەردەست نییە. تەنها ' + item.item.quantity + ' دانە ماوە.');
        return;
      }
    }

    setSelectedItems(selectedItems.map(si => 
      si.item.id === id ? { ...si, quantity: qty, unit: unit || si.unit } : si
    ));
  };

  const submitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedItems.length === 0) {
      alert('هیچ کاڵایەک هەڵنەبژێردراوە');
      return;
    }

    const totalAmount = selectedItems.reduce((acc, curr) => {
      const price = curr.unit === 'carton' ? curr.item.sellingPrice * (curr.item.ratio || 1) : curr.item.sellingPrice;
      return acc + (price * curr.quantity);
    }, 0);
    const orderItems = selectedItems.map(si => ({
      itemId: si.item.id,
      name: si.item.name,
      price: si.unit === 'carton' ? si.item.sellingPrice * (si.item.ratio || 1) : si.item.sellingPrice,
      quantity: si.quantity,
      unit: si.unit
    }));

    try {
      await addDoc(collection(db, 'orders'), {
        repName,
        marketName,
        location,
        totalAmount,
        items: orderItems,
        status: 'pending',
        timestamp: Date.now()
      });
      
      setShowNewOrder(false);
      setRepName('');
      setMarketName('');
      setLocation('');
      setSelectedItems([]);
      alert('داواکارییەکە بەسەرکەوتووی نێردرا');
    } catch (error) {
      console.error(error);
      alert('هەڵەیەک ڕوویدا');
    }
  };

  const updateOrderStatus = async (order: Order, status: Order['status']) => {
    try {
      if (status === 'completed' && order.status !== 'completed') {
        for (const item of order.items) {
          const itemRef = doc(db, 'items', item.itemId);
          const itemSnap = await getDoc(itemRef);
          if (itemSnap.exists()) {
            const newQty = (itemSnap.data().quantity || 0) - item.quantity;
            await updateDoc(itemRef, { quantity: newQty });
          }
        }
      }
      await updateDoc(doc(db, 'orders', order.id), { status });
    } catch (error) {
      console.error(error);
    }
  };

  const settleOrder = async (type: 'cash' | 'debt') => {
    if (!settlingOrder) return;
    try {
      // 1. Create a transaction
      await addDoc(collection(db, 'transactions'), {
        type,
        amount: settlingOrder.totalAmount,
        date: Date.now(),
        description: type === 'cash' ? `نەقدی ئۆردەری مارکێتی ${settlingOrder.marketName}` : `قەرزی ئۆردەری مارکێتی ${settlingOrder.marketName}`,
        relatedEntityId: settlingOrder.marketName
      });
      // 2. Mark order as accounted
      await updateDoc(doc(db, 'orders', settlingOrder.id), { 
        status: 'completed',
        paymentStatus: type
      });
      setSettlingOrder(null);
    } catch (error) {
      console.error(error);
      alert('هەڵەیەک ڕوویدا لە کاتی تۆمارکردنی حیسابات');
    }
  };

  const handleDeleteOrder = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'orders', id));
    } catch (error) {
      console.error(error);
      alert('هەڵەیەک ڕوویدا لە کاتی سڕینەوەی ئۆردەر');
    }
  };

  const printOrder = async (order: Order) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    let oldDebt = 0;
    try {
      const q = query(collection(db, 'transactions'), where('type', '==', 'debt'), where('relatedEntityId', '==', order.marketName));
      const snapshot = await getDocs(q);
      snapshot.forEach(doc => {
        const data = doc.data();
        if (!data.date || data.date < order.timestamp) {
          oldDebt += data.amount || 0;
        }
      });
    } catch (e) {
      console.error('Error fetching old debt', e);
    }
    
    const marketObj = markets.find(m => m.name === order.marketName);
    const marketPhone = marketObj?.phone || '-';

    const printContent = `
      <div dir="rtl" style="font-family: sans-serif; padding: 20px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <img src="${window.location.origin}/LOGO1.jpg" alt="Logo" style="width: 80px; height: 80px; object-fit: contain; margin-bottom: 10px;" />
          <h1 style="margin: 0; color: #1e293b; font-size: 24px;">کۆمپانیای RF</h1>
          <h2 style="margin: 5px 0; color: #333; font-size: 18px;">بۆ بازرگانی گشتی</h2>
          <p style="margin: 5px 0; font-size: 14px;">ناونیشان: هەولێر-ڕێگای کەرکوک</p>
          <p style="margin: 5px 0; font-size: 14px;">ژمارە مۆبایل: 07506144894</p>
        </div>
        
        <hr style="border: 0; border-top: 2px solid #1e293b; margin: 15px 0;" />
        
        <div style="display: flex; justify-content: space-between; margin-bottom: 20px; font-size: 14px;">
          <div style="text-align: right; flex: 1;">
            <p style="margin: 5px 0;"><strong>بۆ:</strong> ${order.marketName}</p>
            <p style="margin: 5px 0;"><strong>ژمارەی مۆبایل:</strong> ${marketPhone}</p>
            <p style="margin: 5px 0;"><strong>ناونیشان:</strong> ${order.location}</p>
            <p style="margin: 5px 0;"><strong>مەندووب:</strong> ${order.repName}</p>
          </div>
          <div style="text-align: left; flex: 1;">
            <p style="margin: 5px 0;"><strong>ژ.وەسڵ:</strong> ${order.id.slice(-6).toUpperCase()}</p>
            <p style="margin: 5px 0;"><strong>بەروار:</strong> ${format(order.timestamp, 'yyyy/MM/dd')}</p>
            <p style="margin: 5px 0;"><strong>کات:</strong> ${format(order.timestamp, 'HH:mm')}</p>
          </div>
        </div>
        
        <hr style="border: 0; border-top: 2px solid #1e293b; margin: 15px 0;" />
        
        <table style="width: 100%; border-collapse: collapse; text-align: center; font-size: 14px;">
          <thead>
            <tr style="background-color: #f3f4f6;">
              <th style="padding: 8px; border: 1px solid #ccc;">ژ</th>
              <th style="padding: 8px; border: 1px solid #ccc;">کۆدی کاڵا</th>
              <th style="padding: 8px; border: 1px solid #ccc;">ناوی کاڵا</th>
              <th style="padding: 8px; border: 1px solid #ccc;">عددی مەواد</th>
              <th style="padding: 8px; border: 1px solid #ccc;">کۆی بڕی کارتۆن</th>
              <th style="padding: 8px; border: 1px solid #ccc;">نرخی تاک</th>
              <th style="padding: 8px; border: 1px solid #ccc;">نرخی کارتۆن</th>
              <th style="padding: 8px; border: 1px solid #ccc;">کۆی گشتی</th>
            </tr>
          </thead>
          <tbody>
            ${order.items.map((item, index) => {
              const globalItem = items.find(i => i.id === item.itemId);
              const barcode = globalItem?.barcode || '-';
              const ratio = globalItem?.ratio || 1;
              const cartonQty = (item.quantity / ratio).toFixed(2);
              const cartonPrice = (item.price * ratio).toLocaleString();
              const unitLabel = item.unit === 'carton' ? 'کارتۆن' : 'دانە';
              return `
                <tr>
                  <td style="padding: 8px; border: 1px solid #ccc;">${index + 1}</td>
                  <td style="padding: 8px; border: 1px solid #ccc; font-family: monospace;">${barcode}</td>
                  <td style="padding: 8px; border: 1px solid #ccc; text-align: right;">${item.name}</td>
                  <td style="padding: 8px; border: 1px solid #ccc;">${item.quantity} ${unitLabel}</td>
                  <td style="padding: 8px; border: 1px solid #ccc;">${cartonQty}</td>
                  <td style="padding: 8px; border: 1px solid #ccc;">${item.price.toLocaleString()}</td>
                  <td style="padding: 8px; border: 1px solid #ccc;">${cartonPrice}</td>
                  <td style="padding: 8px; border: 1px solid #ccc; font-weight: bold;">${(item.price * item.quantity).toLocaleString()}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
          <tfoot>
            <tr>
              <th colspan="7" style="padding: 10px; border: 1px solid #ccc; text-align: left; font-size: 16px;">کۆی گشتی:</th>
              <th style="padding: 10px; border: 1px solid #ccc; font-size: 16px; color: #4338ca;">${order.totalAmount.toLocaleString()} د.ع</th>
            </tr>
          </tfoot>
        </table>
      </div>
    `;

    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Print Order</title>
          </head>
          <body onload="window.print();window.close()">
            ${printContent}
          </body>
        </html>
      `);
      printWindow.document.close();
      
      // Mark as printed automatically
      updateOrderStatus(order, 'printed');
    }
  };

  const filteredItems = items.filter(item => 
    item.name.includes(searchTerm) || item.barcode.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
        <h2 className="text-xl font-bold text-slate-800">{role === 'admin' ? 'تەسفییەکردن' : role === 'cashvan' ? 'کاشڤان نەقدە' : 'بەشی ئۆردەرەکان'}</h2>
        {(role === 'sales_rep' || role === 'admin' || role === 'cashvan') && (
          <button
            onClick={() => setShowNewOrder(!showNewOrder)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition flex items-center gap-2 font-medium text-sm"
          >
            <Plus size={18} />
            <span>ئۆردەری نوێ</span>
          </button>
        )}
      </div>

      {showNewOrder && (role === 'sales_rep' || role === 'admin' || role === 'cashvan') && (
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-6">
          <h3 className="text-lg font-bold mb-4 text-slate-800 border-b border-slate-100 pb-3">فۆڕمی داواکاری نوێ</h3>
          <form onSubmit={submitOrder} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-slate-600 mb-1">{role === 'cashvan' ? 'ناوی کاشڤان' : 'ناوی مەندووب'}</label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  value={repName}
                  onChange={(e) => setRepName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm text-slate-600 mb-1">ناوی مارکێت / شوێن</label>
                <input
                  type="text"
                  required
                  list="market-list"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  value={marketName}
                  onChange={handleMarketChange}
                />
                <datalist id="market-list">
                  {markets.map(m => (
                    <option key={m.id} value={m.name} />
                  ))}
                </datalist>
              </div>
              <div>
                <label className="block text-sm text-slate-600 mb-1">ناونیشان / گەڕەک</label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Items Selection */}
              <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50">
                <div className="mb-4 relative">
                  <input
                    type="text"
                    placeholder="گەڕان بەدوای کاڵا..."
                    className="w-full pr-10 pl-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <Search className="absolute right-3 top-2.5 text-slate-400" size={18} />
                </div>
                <div className="h-64 overflow-y-auto space-y-2 pr-2">
                  {filteredItems.map(item => (
                    <div key={item.id} className="flex justify-between items-center p-3 bg-white rounded-xl border border-slate-200 shadow-sm">
                      <div>
                        <div className="font-semibold text-slate-800 text-sm">{item.name}</div>
                        <div className="text-xs text-slate-500 mt-0.5">بەردەستە: <span dir="ltr">{item.quantity}</span> | نرخ: <span dir="ltr">{item.sellingPrice}</span></div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleAddItemToOrder(item)}
                        disabled={item.quantity <= 0}
                        className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 disabled:opacity-50 transition"
                      >
                        <Plus size={20} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Selected Items */}
              <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50">
                <h4 className="font-semibold text-slate-800 mb-4 text-sm">کاڵا هەڵبژێردراوەکان</h4>
                <div className="h-64 overflow-y-auto space-y-2 pr-2">
                  {selectedItems.length === 0 ? (
                    <div className="text-center text-slate-500 py-8 text-sm">هیچ کاڵایەک نەخراوەتە سەبەتەکەوە</div>
                  ) : (
                    selectedItems.map((si) => (
                      <div key={si.item.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-white rounded-xl border border-slate-200 shadow-sm gap-2">
                        <div className="font-semibold text-slate-800 text-sm flex-1">{si.item.name}</div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-slate-500 font-mono" dir="ltr">{si.item.sellingPrice}</span>
                          <div className="flex items-center gap-2 border border-slate-200 rounded-lg px-2 py-1">
                            <input 
                              type="number" 
                              min="1"
                              className="w-12 outline-none text-center text-sm font-medium"
                              value={si.quantity}
                              onChange={(e) => handleUpdateItemQuantity(si.item.id, Number(e.target.value))}
                              dir="ltr"
                            />
                          </div>
                          <span className="font-bold min-w-[80px] text-left text-slate-800 text-sm" dir="ltr">
                            {(si.quantity * si.item.sellingPrice).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div className="mt-4 pt-4 border-t border-slate-200 flex justify-between items-center">
                  <div className="font-bold text-slate-800 text-sm">کۆی گشتی:</div>
                  <div className="font-bold text-xl text-indigo-600" dir="ltr">
                    {selectedItems.reduce((acc, curr) => acc + (curr.quantity * (curr.unit === 'carton' ? curr.item.sellingPrice * (curr.item.ratio || 1) : curr.item.sellingPrice)), 0).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="px-8 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition font-bold text-sm shadow-sm"
              >
                ناردنی داواکاری بۆ کۆگا
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Orders List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-10 text-slate-500">خەریکی هێنانە...</div>
        ) : orders.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 text-center text-slate-500 text-sm">
            هیچ داواکارییەک نییە
          </div>
        ) : (
          orders.map((order) => (
            <div key={order.id} className={`p-5 rounded-2xl shadow-sm border flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${order.status === 'pending' ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <h3 className="font-bold text-lg text-slate-800">{order.marketName}</h3>
                  <span className={`px-2.5 py-1 rounded text-xs font-bold ${
                    order.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                    order.status === 'printed' ? 'bg-indigo-100 text-indigo-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {order.status === 'pending' ? 'چاوەڕێ' :
                     order.status === 'printed' ? 'چاپکراو' : 'تەواوکراو'}
                  </span>
                </div>
                <div className="text-sm text-slate-600 grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
                  <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span> <strong>مەندووب:</strong> {order.repName}</div>
                  <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span> <strong>شوێن:</strong> {order.location}</div>
                  <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span> <strong>بەروار:</strong> <span dir="ltr" className="font-mono text-xs">{format(order.timestamp, 'yyyy-MM-dd HH:mm')}</span></div>
                  <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span> <strong>ژمارەی کاڵا:</strong> {order.items.reduce((acc, curr) => acc + curr.quantity, 0)} دانە</div>
                </div>
              </div>

              <div className="flex items-center gap-6 border-t border-slate-100 lg:border-t-0 lg:border-r lg:border-slate-100 pt-4 lg:pt-0 lg:pr-6">
                <div className="text-left">
                  <div className="text-sm text-slate-500 mb-1">کۆی گشتی</div>
                  <div className="font-bold text-xl text-slate-900" dir="ltr">{order.totalAmount.toLocaleString()}</div>
                </div>
                
                <div className="flex gap-2">
                  {(role === 'admin' || role === 'warehouse') && (
                    <button
                      onClick={() => printOrder(order)}
                      className="p-2.5 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition"
                      title="چاپکردن"
                    >
                      <Printer size={20} />
                    </button>
                  )}
                  {role === 'warehouse' && order.status !== 'completed' && (
                    <button
                      onClick={() => updateOrderStatus(order, 'completed')}
                      className="p-2.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition"
                      title="تەواوکردن"
                    >
                      <CheckCircle size={20} />
                    </button>
                  )}
                  {role === 'admin' && (!order.paymentStatus) && (
                    <button
                      onClick={() => setSettlingOrder(order)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium flex items-center justify-center"
                    >
                      تەسفیەکردن
                    </button>
                  )}
                  {order.paymentStatus === 'cash' && (
                    <div className="px-3 py-2 bg-green-50 text-green-700 rounded-lg text-sm font-bold border border-green-100 flex items-center justify-center">نەقدە</div>
                  )}
                  {order.paymentStatus === 'debt' && (
                    <div className="px-3 py-2 bg-amber-50 text-amber-700 rounded-lg text-sm font-bold border border-amber-100 flex items-center justify-center">قەرزە</div>
                  )}
                  {role === 'admin' && (
                    <button
                      onClick={() => handleDeleteOrder(order.id)}
                      className="p-2.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition"
                      title="سڕینەوە"
                    >
                      <Trash2 size={20} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Settlement Modal */}
      {settlingOrder && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800 text-lg">تەسفیەکردنی ئۆردەر</h3>
              <button onClick={() => setSettlingOrder(null)} className="text-slate-500 hover:text-slate-700">
                <X size={24} />
              </button>
            </div>
            <div className="p-6">
              <p className="text-slate-600 mb-6 text-center leading-relaxed">
                ئایا دەتەوێت ئۆردەری مارکێتی <strong className="text-slate-800">{settlingOrder.marketName}</strong> چۆن لە حیساباتدا تۆمار بکەیت؟
              </p>
              
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => settleOrder('cash')}
                  className="flex flex-col items-center gap-3 p-4 border-2 border-green-100 rounded-xl hover:bg-green-50 hover:border-green-300 transition group"
                >
                  <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                    <DollarSign size={24} />
                  </div>
                  <span className="font-bold text-green-700">بە نەقد</span>
                </button>
                
                <button
                  onClick={() => settleOrder('debt')}
                  className="flex flex-col items-center gap-3 p-4 border-2 border-amber-100 rounded-xl hover:bg-amber-50 hover:border-amber-300 transition group"
                >
                  <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                    <CreditCard size={24} />
                  </div>
                  <span className="font-bold text-amber-700">بە قەرز</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
