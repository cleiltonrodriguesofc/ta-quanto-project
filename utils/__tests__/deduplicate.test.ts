// Force Supabase mode BEFORE importing api
// process.env.EXPO_PUBLIC_USE_SUPABASE = 'true'; // This line is removed

// import { api } from '../api'; // This line is removed


jest.mock('../supabase', () => ({
    supabase: {
        from: jest.fn(() => ({
            select: jest.fn(() => ({
                eq: jest.fn(() => ({
                    eq: jest.fn(() => ({
                        order: jest.fn(() => ({
                            limit: jest.fn(() => ({
                                maybeSingle: jest.fn().mockResolvedValue({
                                    data: {
                                        price: 10.00,
                                        timestamp: new Date().toISOString()
                                    },
                                    error: null
                                }),
                            })),
                        })),
                    })),
                })),
            })),
            upsert: jest.fn().mockResolvedValue({ error: null }),
        })),
    },
}));

describe('Deduplication Test', () => {
    let api: any;

    beforeEach(() => {
        process.env.EXPO_PUBLIC_USE_SUPABASE = 'true';
        jest.resetModules();
        // Re-require api after setting env var
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        api = require('../api').api;
    });

    afterAll(() => {
        delete process.env.EXPO_PUBLIC_USE_SUPABASE;
    });

    it('should skip adding price if duplicate exists', async () => {
        const logSpy = jest.spyOn(console, 'log').mockImplementation();

        await api.addPrice({
            id: '123',
            price: 10.00,
            barcode: '123456',
            supermarket: 'Market A',
            productName: 'Test',
            timestamp: new Date().toISOString()
        });

        expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Skipping duplicate'));
        logSpy.mockRestore();
    });
});
