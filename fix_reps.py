import re

with open('src/components/views/RepsView.tsx', 'r') as f:
    content = f.read()

# Add a state for active tab and cashvans list
imports_pattern = r"import \{ SalesRep \} from '\.\./\.\./types';"
content = re.sub(imports_pattern, "import { SalesRep } from '../../types';\nimport { Users, Truck } from 'lucide-react';", content)

states_pattern = r"const \[reps, setReps\] = useState<SalesRep\[\]>\(\[\]\);\n  const \[loading, setLoading\] = useState\(true\);"
states_replacement = """const [reps, setReps] = useState<SalesRep[]>([]);
  const [cashvans, setCashvans] = useState<SalesRep[]>([]);
  const [activeTab, setActiveTab] = useState<'reps' | 'cashvans'>('reps');
  const [loading, setLoading] = useState(true);"""
content = re.sub(states_pattern, states_replacement, content)

effects_pattern = r"useEffect\(\(\) => \{\n    const q = query\(collection\(db, 'reps'\)\);\n    const unsubscribe = onSnapshot\(q, \(snapshot\) => \{\n      const repsData: SalesRep\[\] = \[\];\n      snapshot\.forEach\(\(doc\) => \{\n        repsData\.push\(\{ id: doc\.id, \.\.\.doc\.data\(\) \} as SalesRep\);\n      \}\);\n      setReps\(repsData\);\n      setLoading\(false\);\n    \}\);\n    return \(\) => unsubscribe\(\);\n  \}, \[\]\);"
effects_replacement = """useEffect(() => {
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
  }, []);"""
content = re.sub(effects_pattern, effects_replacement, content)

submit_pattern = r"await updateDoc\(doc\(db, 'reps', editId\), \{ name, phone \}\);"
submit_replacement = "await updateDoc(doc(db, activeTab === 'reps' ? 'reps' : 'cashvans', editId), { name, phone });"
content = re.sub(submit_pattern, submit_replacement, content)

delete_pattern = r"await deleteDoc\(doc\(db, 'reps', id\)\);"
delete_replacement = "await deleteDoc(doc(db, activeTab === 'reps' ? 'reps' : 'cashvans', id));"
content = re.sub(delete_pattern, delete_replacement, content)

# Change return JSX
return_pattern = r"return \(\n    <div className=\"space-y-6\">\n      \{isEditing && \("
return_replacement = """return (
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

      {isEditing && ("""
content = re.sub(return_pattern, return_replacement, content)

edit_header_pattern = r"دەستکاریکردنی مەندووب"
edit_header_replacement = "{activeTab === 'reps' ? 'دەستکاریکردنی مەندووب' : 'دەستکاریکردنی کاشڤان'}"
content = re.sub(edit_header_pattern, edit_header_replacement, content)

name_label_pattern = r"<label className=\"block text-sm text-slate-600 mb-1\">ناوی مەندووب</label>"
name_label_replacement = "<label className=\"block text-sm text-slate-600 mb-1\">{activeTab === 'reps' ? 'ناوی مەندووب' : 'ناوی کاشڤان'}</label>"
content = re.sub(name_label_pattern, name_label_replacement, content)

list_header_pattern = r"<h4 className=\"font-bold text-slate-700 flex items-center gap-2\">👥 لیستی مەندووبەکان</h4>"
list_header_replacement = "<h4 className=\"font-bold text-slate-700 flex items-center gap-2\">{activeTab === 'reps' ? '👥 لیستی مەندووبەکان' : '🚚 لیستی کاشڤانەکان'}</h4>"
content = re.sub(list_header_pattern, list_header_replacement, content)

# update mapping variable
tbody_pattern = r"\{reps\.map\(rep => \("
tbody_replacement = "{(activeTab === 'reps' ? reps : cashvans).map(rep => ("
content = re.sub(tbody_pattern, tbody_replacement, content)

empty_pattern = r"\{reps\.length === 0 && \("
empty_replacement = "{(activeTab === 'reps' ? reps : cashvans).length === 0 && ("
content = re.sub(empty_pattern, empty_replacement, content)

empty_text_pattern = r"هیچ مەندووبێک نەدۆزرایەوە"
empty_text_replacement = "{activeTab === 'reps' ? 'هیچ مەندووبێک نەدۆزرایەوە' : 'هیچ کاشڤانێک نەدۆزرایەوە'}"
content = re.sub(empty_text_pattern, empty_text_replacement, content)

with open('src/components/views/RepsView.tsx', 'w') as f:
    f.write(content)

