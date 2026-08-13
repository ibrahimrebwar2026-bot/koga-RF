import re

with open('src/components/views/OrdersView.tsx', 'r') as f:
    content = f.read()

# We need to replace the `const printContent = ` block.
# We will use regex to find the `const printContent = ` up to `const printWindow = window.open`

replacement = """
    const marketObj = markets.find(m => m.name === order.marketName);
    const marketPhone = marketObj?.phone || '-';

    const printContent = `
      <div dir="rtl" style="font-family: sans-serif; padding: 20px;">
        <div style="text-align: center; margin-bottom: 20px;">
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
              return `
                <tr>
                  <td style="padding: 8px; border: 1px solid #ccc;">${index + 1}</td>
                  <td style="padding: 8px; border: 1px solid #ccc; font-family: monospace;">${barcode}</td>
                  <td style="padding: 8px; border: 1px solid #ccc; text-align: right;">${item.name}</td>
                  <td style="padding: 8px; border: 1px solid #ccc;">${item.quantity}</td>
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

    const printWindow ="""

pattern = re.compile(r"const printContent = `[\s\S]*?`;\s*const printWindow =", re.MULTILINE)
new_content = pattern.sub(replacement, content)

with open('src/components/views/OrdersView.tsx', 'w') as f:
    f.write(new_content)

