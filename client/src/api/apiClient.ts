console.log('Convex API Client Initialized');
import { ConvexHttpClient } from "convex/browser";

const convexUrl = import.meta.env.VITE_CONVEX_URL || "http://localhost:3210";
export const convexClient = new ConvexHttpClient(convexUrl);

export const mapIds = (data: any): any => {
    if (Array.isArray(data)) {
        return data.map(item => mapIds(item));
    }
    if (data && typeof data === 'object') {
        const mapped = { ...data };
        if (mapped._id) {
            mapped.id = mapped._id;
        }
        return mapped;
    }
    return data;
};

// Deprecate fetch based apiClient, used for temporary fallback if any components depend directly on it
export const apiClient = {
    async request(endpoint: string) {
        throw new Error(`API client is deprecated and replaced by Convex: ${endpoint}`);
    },
    get(endpoint: string) { return this.request(endpoint); },
    post(endpoint: string) { return this.request(endpoint); },
    put(endpoint: string) { return this.request(endpoint); },
    delete(endpoint: string) { return this.request(endpoint); },
};
