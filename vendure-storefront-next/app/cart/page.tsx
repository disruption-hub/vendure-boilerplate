import { getActiveOrder } from '@/app/providers/cart-data.server';
import Link from 'next/link';

export default async function CartPage() {
    const cart = await getActiveOrder();

    if (!cart || cart.totalQuantity === 0) {
        return (
            <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8 text-center">
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">Your cart is empty</h1>
                <p className="mt-4 text-gray-500">
                    Looks like you haven't added any items to your cart yet.
                </p>
                <div className="mt-6">
                    <Link
                        href="/"
                        className="inline-flex items-center rounded-md border border-transparent bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                    >
                        Continue Shopping
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white">
            <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24 lg:px-0">
                <h1 className="text-3xl font-bold tracking-tight text-center text-gray-900 sm:text-4xl">
                    Shopping Cart
                </h1>

                <form className="mt-12">
                    <section aria-labelledby="cart-heading">
                        <h2 id="cart-heading" className="sr-only">
                            Items in your shopping cart
                        </h2>

                        <ul role="list" className="divide-y divide-gray-200 border-b border-t border-gray-200">
                            {cart.lines.map((line: any) => (
                                <li key={line.id} className="flex py-6">
                                    <div className="ml-4 flex flex-1 flex-col justify-between">
                                        <div>
                                            <div className="flex justify-between text-base font-medium text-gray-900">
                                                <h3>{line.productVariant.name}</h3>
                                                <p className="ml-4">
                                                    {line.linePriceWithTax / 100} {cart.currencyCode}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex flex-1 items-end justify-between text-sm">
                                            <p className="text-gray-500">Qty {line.quantity}</p>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </section>

                    <section aria-labelledby="summary-heading" className="mt-10">
                        <h2 id="summary-heading" className="sr-only">
                            Order summary
                        </h2>

                        <div>
                            <dl className="space-y-4">
                                <div className="flex items-center justify-between border-t border-gray-200 pt-4">
                                    <dt className="text-base font-medium text-gray-900">Order total</dt>
                                    <dd className="text-base font-medium text-gray-900">
                                        {cart.totalWithTax / 100} {cart.currencyCode}
                                    </dd>
                                </div>
                            </dl>
                        </div>

                        <div className="mt-10">
                            <Link
                                href="/checkout"
                                className="w-full block text-center rounded-md border border-transparent bg-primary-600 px-4 py-3 text-base font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-gray-50"
                            >
                                Checkout
                            </Link>
                        </div>
                    </section>
                </form>
            </div>
        </div>
    );
}
