'use client';

import { useState } from 'react';
import { PaymentActions } from './payment-actions';
import { SolConversion } from './sol-conversion';

type PizzaSize = 'GRANDE' | 'MEDIANA' | 'INDIVIDUAL';

interface PizzaItem {
  nombre: string;
  descripción: string;
  precios: { [key in PizzaSize]?: number };
}

interface CartItem {
  nombre: string;
  descripción: string;
  tamaño: PizzaSize;
  precio: number;
}

const menu: PizzaItem[] = [
  {
    nombre: 'MOZZARELLA',
    descripción: 'mozzarella con salsa de tomate',
    precios: { GRANDE: 18000, MEDIANA: 16000, INDIVIDUAL: 13500 },
  },
  {
    nombre: 'FUGAZETTA',
    descripción: 'mozzarella y cebolla',
    precios: { GRANDE: 24500, MEDIANA: 22500, INDIVIDUAL: 20000 },
  },
  {
    nombre: 'PANCETA',
    descripción: 'mozzarella, salsa de tomate y panceta crocante',
    precios: { GRANDE: 25000, MEDIANA: 23000, INDIVIDUAL: 21000 },
  },
  {
    nombre: 'JAMÓN Y MORRONES',
    descripción: 'mozzarella, jamón y morrones',
    precios: { GRANDE: 26500, MEDIANA: 24500, INDIVIDUAL: 22500 },
  },
  {
    nombre: 'ROQUEFORT',
    descripción: 'mozzarella, salsa de tomate natural y roquefort',
    precios: { GRANDE: 25800, MEDIANA: 23500, INDIVIDUAL: 21500 },
  },
  {
    nombre: 'CUATRO ESTACIONES',
    descripción: 'mozzarella y en idénticas proporciones: jamón y morrones, palmitos, champignones y veneciana',
    precios: { GRANDE: 29400, MEDIANA: 27300, INDIVIDUAL: 24500 },
  },
  // Puedes seguir agregando más pizzas del menú...
];

export default function Menu() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orderType, setOrderType] = useState<'retirar' | 'comer en el lugar'>('retirar');
  const [customerName, setCustomerName] = useState('');
  const total = cart.reduce((sum, item) => sum + item.precio, 0);

  const addToCart = (pizza: PizzaItem, tamaño: PizzaSize) => {
    const precio = pizza.precios[tamaño];
    if (!precio) return;

    const item: CartItem = {
      nombre: pizza.nombre,
      descripción: pizza.descripción,
      tamaño,
      precio,
    };
    setCart([...cart, item]);
  };

  const removeFromCart = (index: number) => {
    setCart(cart => cart.filter((_, i) => i !== index));
  };

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Pizzas</h1>
      {menu.map((pizza) => (
        <div key={pizza.nombre} className="border-b py-2">
          <h2 className="text-lg font-semibold">{pizza.nombre}</h2>
          <p className="text-sm">{pizza.descripción}</p>
          <div className="flex flex-wrap gap-2 mt-1">
            {(['GRANDE', 'MEDIANA', 'INDIVIDUAL'] as PizzaSize[]).map((tamaño) =>
              pizza.precios[tamaño] ? (
                <button
                  key={tamaño}
                  className="px-3 py-1 border rounded hover:bg-gray-100"
                  onClick={() => addToCart(pizza, tamaño)}
                >
                  {tamaño} - ${pizza.precios[tamaño]}
                </button>
              ) : null
            )}
          </div>
        </div>
      ))}

      <h2 className="text-xl font-bold mt-6">Carrito</h2>
      {cart.length === 0 ? (
        <p className="text-gray-500">El carrito está vacío.</p>
      ) : (
        <>
          <ul className="mt-2 space-y-1">
            {cart.map((item, index) => (
              <li key={index} className="text-sm">
                <span>
                  {item.nombre} ({item.tamaño}) - ${item.precio}
                </span>
                <button
                  className="ml-2 text-red-500 hover:text-red-700"
                  onClick={() => removeFromCart(index)}
                >
                  Eliminar
                </button>
              </li>
            ))}
            <li className="font-bold mt-2">Total: ${total}</li>
            <li className="text-lg font-semibold">
              <SolConversion arsTotal={total}>
                {(solTotal) => (
                  <>
                    Total (SOL): {solTotal.toFixed(4) + ' SOL'}
                  </>
                )}
              </SolConversion>
            </li>
          </ul>
          {/* Customer name input */}
          <div className="my-4">
            <label className="font-semibold mr-2" htmlFor="customerName">Nombre del cliente:</label>
            <input
              id="customerName"
              type="text"
              value={customerName}
              onChange={e => setCustomerName(e.target.value)}
              className="border rounded px-2 py-1"
              placeholder="Tu nombre"
            />
          </div>
          {/* Order type radio buttons */}
          <div className="my-4">
            <label className="font-semibold mr-4">Tipo de orden:</label>
            <label className="mr-4">
              <input
                type="radio"
                name="orderType"
                value="retirar"
                checked={orderType === 'retirar'}
                onChange={() => setOrderType('retirar')}
                className="mr-1"
              />
              Retirar
            </label>
            <label>
              <input
                type="radio"
                name="orderType"
                value="comer en el lugar"
                checked={orderType === 'comer en el lugar'}
                onChange={() => setOrderType('comer en el lugar')}
                className="mr-1"
              />
              Comer en el lugar
            </label>
          </div>
          <p className="text-lg font-semibold">Pagar con:</p>
          <SolConversion arsTotal={total}>
            {(solTotal) => (
              <PaymentActions
                solTotal={solTotal}
                arsTotal={total}
                cart={cart}
                customerName={customerName}
                businessId={undefined}
                businessName={undefined}
                orderType={orderType}
                clearCart={() => setCart([])}
              />
            )}
          </SolConversion>
        </>
      )}
    </div>
  );
}
