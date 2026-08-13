import re

with open('src/types.ts', 'r') as f:
    content = f.read()

# For OrderItem
old_order_item = """export interface OrderItem {
  itemId: string;
  name: string;
  quantity: number;
  price: number;
}"""

new_order_item = """export interface OrderItem {
  itemId: string;
  name: string;
  quantity: number;
  unit?: 'piece' | 'carton';
  price: number;
}"""
content = content.replace(old_order_item, new_order_item)

# For CashvanTransfer
old_transfer = """  items: {
    itemId: string;
    name: string;
    quantity: number;
    price: number;
  }[];"""

new_transfer = """  items: {
    itemId: string;
    name: string;
    quantity: number;
    unit?: 'piece' | 'carton';
    price: number;
  }[];"""
content = content.replace(old_transfer, new_transfer)

# For CashvanSale
old_sale = """  items: {
    itemId: string;
    name: string;
    quantity: number;
    price: number;
  }[];"""

new_sale = """  items: {
    itemId: string;
    name: string;
    quantity: number;
    unit?: 'piece' | 'carton';
    price: number;
  }[];"""
content = content.replace(old_sale, new_sale)

with open('src/types.ts', 'w') as f:
    f.write(content)
