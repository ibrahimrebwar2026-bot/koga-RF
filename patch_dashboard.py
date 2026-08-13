import re

with open('src/components/Dashboard.tsx', 'r') as f:
    content = f.read()

# Replace desktop header logo
old_desktop = """          <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
            <Package size={24} />
          </div>"""
new_desktop = """          <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-slate-200">
            <img src="/LOGO1.jpg" alt="Logo" className="w-full h-full object-cover" />
          </div>"""
content = content.replace(old_desktop, new_desktop)

# Replace mobile header logo
old_mobile = """          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
            <Package size={20} />
          </div>"""
new_mobile = """          <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 border border-slate-200">
            <img src="/LOGO1.jpg" alt="Logo" className="w-full h-full object-cover" />
          </div>"""
content = content.replace(old_mobile, new_mobile)

# Replace sidebar logo on mobile
old_sidebar_mobile = """             <h1 className="font-bold text-slate-800">کۆمپانیای RF</h1>"""
new_sidebar_mobile = """             <div className="flex items-center gap-2">
               <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 border border-slate-200">
                 <img src="/LOGO1.jpg" alt="Logo" className="w-full h-full object-cover" />
               </div>
               <h1 className="font-bold text-slate-800">کۆمپانیای RF</h1>
             </div>"""
content = content.replace(old_sidebar_mobile, new_sidebar_mobile)


with open('src/components/Dashboard.tsx', 'w') as f:
    f.write(content)
