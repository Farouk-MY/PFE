import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, XCircle, Home, ArrowRight, ShoppingBag, AlertTriangle } from 'lucide-react';

type CheckoutStatusProps = {
    status: 'success' | 'failed';
    orderId?: string;
    errorMessage?: string;
    onRetry?: () => void;
};

export default function CheckoutStatus({
                                           status,
                                           orderId,
                                           errorMessage = "We couldn't process your order. Please try again.",
                                           onRetry
                                       }: CheckoutStatusProps) {
    const router = useRouter();
    const [animate, setAnimate] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setAnimate(true), 100);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="min-h-[70vh] flex items-center justify-center p-4">
            <div
                className={`max-w-md w-full p-8 rounded-2xl shadow-xl border transition-all duration-700 transform ${
                    animate ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                } ${
                    status === 'success'
                        ? 'bg-gradient-to-br from-green-50 to-emerald-100 border-green-200 dark:from-green-900/20 dark:to-emerald-900/30 dark:border-green-800/40'
                        : 'bg-gradient-to-br from-red-50 to-rose-100 border-red-200 dark:from-red-900/20 dark:to-rose-900/30 dark:border-red-800/40'
                }`}
            >
                <div className="flex flex-col items-center text-center">
                    <div className={`relative p-4 rounded-full mb-6 transition-all duration-1000 ${
                        animate ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
                    } ${
                        status === 'success'
                            ? 'bg-green-100 dark:bg-green-900/30'
                            : 'bg-red-100 dark:bg-red-900/30'
                    }`}>
                        {status === 'success' ? (
                            <CheckCircle className="h-16 w-16 text-green-600 dark:text-green-400" />
                        ) : (
                            <XCircle className="h-16 w-16 text-red-600 dark:text-red-400" />
                        )}
                    </div>

                    <h1 className={`text-3xl font-bold mb-3 ${
                        status === 'success' ? 'text-green-800 dark:text-green-400' : 'text-red-800 dark:text-red-400'
                    }`}>
                        {status === 'success' ? 'Order Confirmed!' : 'Order Failed'}
                    </h1>

                    <p className="text-lg mb-6 text-slate-600 dark:text-slate-300">
                        {status === 'success'
                            ? `Your order #${orderId} has been successfully placed.`
                            : 'We encountered an issue with your order.'}
                    </p>

                    {status === 'success' && (
                        <div className="w-full bg-white/70 dark:bg-slate-800/50 p-4 rounded-xl mb-8 backdrop-blur-sm">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-slate-500 dark:text-slate-400">Order ID</span>
                                <span className="font-mono font-medium">{orderId}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-slate-500 dark:text-slate-400">Status</span>
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300">
                                    Processing
                                </span>
                            </div>
                        </div>
                    )}

                    {status === 'failed' && errorMessage && (
                        <div className="w-full bg-white/70 dark:bg-slate-800/50 p-4 rounded-xl mb-8 backdrop-blur-sm">
                            <div className="flex items-center gap-2 mb-2">
                                <AlertTriangle className="h-5 w-5 text-red-500" />
                                <span className="text-sm font-medium text-red-600 dark:text-red-400">Error Details</span>
                            </div>
                            <p className="text-sm text-slate-700 dark:text-slate-300 break-words">
                                {errorMessage}
                            </p>
                        </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                        <button
                            onClick={() => router.push('/')}
                            className={`flex items-center justify-center gap-2 rounded-xl px-6 py-3 font-medium transition-all hover:translate-y-0.5 ${
                                status === 'success'
                                    ? 'bg-white text-slate-800 shadow-md hover:shadow-sm dark:bg-slate-900 dark:text-slate-100'
                                    : 'bg-white text-slate-800 shadow-md hover:shadow-sm dark:bg-slate-900 dark:text-slate-100'
                            }`}
                        >
                            <Home className="h-4 w-4" />
                            Home
                        </button>

                        {status === 'success' ? (
                            <button
                                onClick={() => router.push('/profile/orders')}
                                className="flex items-center justify-center gap-2 rounded-xl px-6 py-3 font-medium bg-green-600 text-white shadow-md hover:shadow-sm hover:bg-green-700 transition-all hover:translate-y-0.5 dark:bg-green-700 dark:hover:bg-green-600"
                            >
                                My Orders
                                <ArrowRight className="h-4 w-4" />
                            </button>
                        ) : (
                            <button
                                onClick={onRetry}
                                className="flex items-center justify-center gap-2 rounded-xl px-6 py-3 font-medium bg-red-600 text-white shadow-md hover:shadow-sm hover:bg-red-700 transition-all hover:translate-y-0.5 dark:bg-red-700 dark:hover:bg-red-600"
                            >
                                Try Again
                                <ShoppingBag className="h-4 w-4" />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}