// File: CartContext.js
import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);

  useEffect(() => {
    axios.get('/api/cart').then(res => {
      if (res.data.cart) setCart(res.data.cart);
    });
  }, []);

  const addToCart = (product) => {
    const updatedCart = [...cart, product];
    setCart(updatedCart);
    axios.post('/api/cart', { cart: updatedCart });
  };

  const clearCart = () => {
    setCart([]);
    axios.delete('/api/cart');
  };

  return (
    <CartContext.Provider value={{ cart, addToCart, clearCart }}>
      {children}
    </CartContext.Provider>
  );
};

// File: server.js (Node.js Backend)
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

mongoose.connect('mongodb://127.0.0.1:27017/mashauri_cart', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const CartSchema = new mongoose.Schema({
  items: Array,
});

const Cart = mongoose.model('Cart', CartSchema);

app.get('/api/cart', async (req, res) => {
  const cart = await Cart.findOne();
  res.json({ cart: cart ? cart.items : [] });
});

app.post('/api/cart', async (req, res) => {
  let cart = await Cart.findOne();
  if (!cart) cart = new Cart();
  cart.items = req.body.cart;
  await cart.save();
  res.json({ message: 'Cart saved successfully' });
});

app.delete('/api/cart', async (req, res) => {
  await Cart.deleteMany();
  res.json({ message: 'Cart cleared' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// File: ProductPage.js
import React from 'react';
import { useCart } from './CartContext';

const products = [
  { id: 1, name: 'Product A', price: 100 },
  { id: 2, name: 'Product B', price: 150 },
];

const ProductPage = () => {
  const { addToCart } = useCart();

  return (
    <div>
      <h1>Products</h1>
      {products.map(product => (
        <div key={product.id}>
          <h3>{product.name}</h3>
          <p>${product.price}</p>
          <button onClick={() => addToCart(product)}>Add to Cart</button>
        </div>
      ))}
    </div>
  );
};

export default ProductPage;

// File: CartPage.js
import React from 'react';
import { useCart } from './CartContext';
import { useNavigate } from 'react-router-dom';

const CartPage = () => {
  const { cart, clearCart } = useCart();
  const navigate = useNavigate();
  const total = cart.reduce((sum, item) => sum + item.price, 0);

  const handleCheckout = () => {
    clearCart();
    navigate('/payment?success=true');
  };

  return (
    <div>
      <h2>Your Cart</h2>
      {cart.map((item, index) => (
        <div key={index}>
          {item.name} - ${item.price}
        </div>
      ))}
      <h3>Total: ${total}</h3>
      <button onClick={handleCheckout}>Checkout</button>
    </div>
  );
};

export default CartPage;

// File: PaymentPage.js
import React from 'react';
import { useLocation } from 'react-router-dom';

const PaymentPage = () => {
  const location = useLocation();
  const success = new URLSearchParams(location.search).get('success');

  return (
    <div>
      <h2>Payment {success === 'true' ? 'Success' : 'Failure'}</h2>
      {success === 'true' ? <p>Thank you for your purchase!</p> : <p>There was an error processing your payment.</p>}
    </div>
  );
};

export default PaymentPage;