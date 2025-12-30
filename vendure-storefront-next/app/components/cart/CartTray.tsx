'use client';

import { XMarkIcon } from '@heroicons/react/24/outline';
import { useCart } from '@/app/providers/cart-context';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { shopClient } from '@/app/providers/cart-data.client';
import { graphql } from '@/app/providers/gql';
import { print } from 'graphql';

const activeOrderQuery = graphql(`
  query ActiveOrderInTray {
    activeOrder {
      id
      totalQuantity
      totalWithTax
      currencyCode
      lines {
        id
        productVariant {
          id
          name
          price
          featuredAsset {
            id
            preview
          }
        }
        unitPriceWithTax
        quantity
        linePriceWithTax
      }
    }
  }
`);

export function CartTray() {
    const { isCartOpen, setIsCartOpen } = useCart();
    const [order, setOrder] = useState<any>(null);

    useEffect(() => {
        if (isCartOpen) {
            // Fetch cart data whenever tray opens
            const queryString = print(activeOrderQuery as any);
            shopClient.request<any>(queryString)
                .then((data: any) => setOrder(data.activeOrder))
                .catch(err => console.error('Failed to fetch cart', err));
        }
    }, [isCartOpen]);

    if (!isCartOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-hidden">
            <div className="absolute inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setIsCartOpen(false)} />

            <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
                <div className="w-screen max-w-md transform transition ease-in-out duration-500 sm:duration-700 translate-x-0">
                    <div className="flex h-full flex-col overflow-y-scroll bg-white shadow-xl">
                        <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
                            <div className="flex items-start justify-between">
                                <h2 className="text-lg font-medium text-gray-900">Shopping cart</h2>
                                <div className="ml-3 flex h-7 items-center">
                                    <button
                                        type="button"
                                        className="relative -m-2 p-2 text-gray-400 hover:text-gray-500"
                                        onClick={() => setIsCartOpen(false)}
                                    >
                                        <span className="sr-only">Close panel</span>
                                        <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                                    </button>
                                </div>
                            </div>

                            <div className="mt-8">
                                <div className="flow-root">
                                    <ul role="list" className="-my-6 divide-y divide-gray-200">
                                        {order?.lines.map((line: any) => (
                                            <li key={line.id} className="flex py-6">
                                                <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
                                                    <img
                                                        src={line.productVariant.featuredAsset?.preview + '?preset=tiny' || ''}
                                                        alt={line.productVariant.name}
                                                        className="h-full w-full object-cover object-center"
                                                    />
                                                </div>

                                                <div className="ml-4 flex flex-1 flex-col">
                                                    <div>
                                                        <div className="flex justify-between text-base font-medium text-gray-900">
                                                            <h3>{line.productVariant.name}</h3>
                                                            <p className="ml-4">
                                                                {(line.linePriceWithTax / 100).toLocaleString('en-US', {
                                                                    style: 'currency',
                                                                    currency: order.currencyCode,
                                                                })}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-1 items-end justify-between text-sm">
                                                        <p className="text-gray-500">Qty {line.quantity}</p>
                                                    </div>
                                                </div>
                                            </li>
                                        ))}
                                        {(!order || order.lines.length === 0) && (
                                            <p className="text-center text-gray-500 py-10">Your cart is empty</p>
                                        )}
                                    </ul>
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-gray-200 px-4 py-6 sm:px-6">
                            <div className="flex justify-between text-base font-medium text-gray-900">
                                <p>Subtotal (inc. tax)</p>
                                <p>
                                    {((order?.totalWithTax || 0) / 100).toLocaleString('en-US', {
                                        style: 'currency',
                                        currency: order?.currencyCode || 'USD',
                                    })}
                                </p>
                            </div>
                            <p className="mt-0.5 text-sm text-gray-500">Shipping and taxes calculated at checkout.</p>
                            <div className="mt-6">
                                <Link
                                    href="/checkout"
                                    onClick={() => setIsCartOpen(false)}
                                    className="flex items-center justify-center rounded-md border border-transparent bg-primary-600 px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-primary-700"
                                >
                                    Checkout
                                </Link>
                            </div>
                            <div className="mt-6 flex justify-center text-center text-sm text-gray-500">
                                <p>
                                    or{' '}
                                    <button
                                        type="button"
                                        className="font-medium text-primary-600 hover:text-primary-500"
                                        onClick={() => setIsCartOpen(false)}
                                    >
                                        Continue Shopping
                                        <span aria-hidden="true"> &rarr;</span>
                                    </button>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
