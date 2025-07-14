import React from 'react';
import { twMerge } from 'tailwind-merge';

export default function Tags({title}) {
    return (
        <div className={twMerge("inline-flex gap-2 border border-primary-400 text-primary-400 px-3 py-1 rounded-full uppercase items-center")}>
            <span>&#10038;</span>
            <span className='text-sm'>{title}</span>
        </div>
    );
}