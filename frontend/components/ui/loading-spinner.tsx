// components/ui/loading-spinner.tsx
import React from 'react';

export default function LoadingSpinner() {
    return (
        <div className="flex justify-center">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
    );
}