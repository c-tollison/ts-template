import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { client } from '@/lib/api';

export function HelloWorldPage() {
    const [message, setMessage] = useState<string | null>(null);

    async function callApi() {
        const res = await client.api.test.$get();
        if (!res.ok) {
            setMessage('Request failed');
            return;
        }
        const data = await res.json();
        setMessage(data.body);
    }

    return (
        <div className="flex h-full flex-col items-center justify-center gap-4 p-8">
            <h1 className="text-4xl font-bold">Hello, world!</h1>
            <Button onClick={callApi}>Call API</Button>
            {message && <p className="text-sm text-gray-500">{message}</p>}
        </div>
    );
}
