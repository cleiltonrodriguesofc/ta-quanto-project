
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import ShopScreen from '../(tabs)/shop';
import { useSupermarketSession } from '@/context/SupermarketContext';
import * as basketService from '@/utils/basketService';
import * as supermarketService from '@/utils/supermarketService';

// Mock Dependencies
jest.mock('expo-router', () => ({
    useRouter: () => ({
        push: jest.fn(),
        replace: jest.fn(),
        back: jest.fn(),
    }),
    useFocusEffect: (cb: any) => cb(), // Execute immediately
}));

jest.mock('react-i18next', () => {
    const t = (key: string) => key;
    const stableTranslation = { t };
    return {
        useTranslation: () => stableTranslation,
    };
});

jest.mock('@/context/AuthContext', () => {
    const stableUser = { id: 'test-user-id' };
    return {
        useAuth: () => ({
            user: stableUser,
        }),
    };
});

jest.mock('@/context/SupermarketContext', () => ({
    useSupermarketSession: jest.fn(),
    BasketItem: {}, // Mock type if needed, but usually just interfaces
}));

jest.mock('@/utils/basketService');
jest.mock('@/utils/supermarketService');

jest.mock('@/components/SupermarketSelector', () => ({
    SupermarketSelector: () => <></>,
}));

// Mock Modal
jest.mock('react-native', () => {
    const RN = jest.requireActual('react-native');
    const MockModal = ({ visible, children }: any) => {
        return visible ? children : null;
    };
    MockModal.displayName = 'Modal';
    RN.Modal = MockModal;
    return RN;
});

// Mock Alert
jest.spyOn(Alert, 'alert');

const mockUseSupermarketSession = useSupermarketSession as jest.Mock;
const mockBasketService = basketService as jest.Mocked<typeof basketService>;

describe('ShopScreen - Saved Lists Management', () => {
    const mockSetShopMode = jest.fn();
    const mockAddToBasket = jest.fn();
    const mockClearBasket = jest.fn();
    const mockSetSelectedSupermarket = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();

        // Default Context State
        mockUseSupermarketSession.mockReturnValue({
            basket: [],
            removeFromBasket: jest.fn(),
            updateBasketQuantity: jest.fn(),
            setBasketQuantity: jest.fn(),
            clearBasket: mockClearBasket,
            basketTotal: 0,
            isShopMode: true,
            setShopMode: mockSetShopMode,
            selectedSupermarket: 'Test Market',
            setSelectedSupermarket: mockSetSelectedSupermarket,
            addToBasket: mockAddToBasket,
            replaceBasket: jest.fn(),
        });

        // Mock console.log to verify logging requirements
        jest.spyOn(console, 'log').mockImplementation(() => { });
        jest.spyOn(console, 'error').mockImplementation(() => { });
    });

    const savedListsMock = [
        {
            id: 'list-1',
            name: 'Monthly Shopping',
            item_count: 5,
            total_amount: 150.00,
            created_at: new Date().toISOString(),
            supermarket: 'Test Market'
        },
        {
            id: 'list-2',
            name: 'Weekend BBQ',
            item_count: 3,
            total_amount: 85.50,
            created_at: new Date().toISOString(),
            supermarket: 'Test Market'
        }
    ];

    it('Scenario 1: Check Logs (Fetching Saved Lists)', async () => {
        mockBasketService.getSavedBaskets.mockResolvedValue(savedListsMock);

        const { getByTestId, findByText } = render(<ShopScreen />);

        // Navigate to Saved Lists
        fireEvent.press(getByTestId('btn-saved-lists'));

        await waitFor(() => {
            expect(mockBasketService.getSavedBaskets).toHaveBeenCalledWith('test-user-id');
            expect(console.log).toHaveBeenCalledWith('[Shop] Fetching saved lists for user:', 'test-user-id');
            expect(console.log).toHaveBeenCalledWith(
                '[Shop] Saved lists fetch success:',
                expect.any(Number),
                expect.stringContaining('lists found')
            );
        });

        // Use findByText to wait for the element to appear (async)
        expect(await findByText('Monthly Shopping')).toBeTruthy();
        expect(await findByText('Weekend BBQ')).toBeTruthy();
    });

    it('Scenario 2: Rename a List', async () => {
        mockBasketService.getSavedBaskets.mockResolvedValue(savedListsMock);
        mockBasketService.renameSavedBasket.mockResolvedValue();

        const { getByTestId, findByText, findByTestId } = render(<ShopScreen />);

        // Navigate
        fireEvent.press(getByTestId('btn-saved-lists'));
        await findByText('Monthly Shopping');

        // Press Rename on first list
        const renameBtn = await findByTestId('btn-rename-list-list-1');
        fireEvent.press(renameBtn);

        // Check modal
        const input = await findByTestId('input-rename-list');
        // Wait for modal transition/state update just in case, though usually synchronous in RN tests without animation mocks
        fireEvent.changeText(input, 'Monthly Shopping Updated');

        // Save
        fireEvent.press(await findByTestId('btn-confirm-rename-list'));

        await waitFor(() => {
            expect(mockBasketService.renameSavedBasket).toHaveBeenCalledWith(
                'test-user-id',
                'list-1',
                'Monthly Shopping Updated'
            );
            // Should fetch lists again
            expect(mockBasketService.getSavedBaskets).toHaveBeenCalledTimes(2); // Once for load, once after rename
        });
    });

    it('Scenario 3: Delete a List', async () => {
        mockBasketService.getSavedBaskets.mockResolvedValue(savedListsMock);
        mockBasketService.deleteSavedBasket.mockResolvedValue();

        // Mock Alert to auto-confirm
        (Alert.alert as jest.Mock).mockImplementation((title, message, buttons) => {
            // execute the confirm button onPress
            if (buttons && buttons.length >= 2) {
                buttons[1].onPress();
            }
        });

        const { getByTestId, findByText, findByTestId } = render(<ShopScreen />);

        fireEvent.press(getByTestId('btn-saved-lists'));
        await findByText('Monthly Shopping');

        // Press Delete
        const deleteBtn = await findByTestId('btn-delete-list-list-1');
        fireEvent.press(deleteBtn);

        await waitFor(() => {
            expect(mockBasketService.deleteSavedBasket).toHaveBeenCalledWith('test-user-id', 'list-1');
            expect(console.log).toHaveBeenCalledWith('[Shop] List deleted:', 'list-1');
            expect(mockBasketService.getSavedBaskets).toHaveBeenCalledTimes(2);
        });
    });

    it('Scenario 4: Load a List', async () => {
        mockBasketService.getSavedBaskets.mockResolvedValue(savedListsMock);
        mockBasketService.getSavedBasketItems.mockResolvedValue([
            { barcode: '111', productName: 'Item 1', price: 10, quantity: 2, imageUrl: '' },
            { barcode: '222', productName: 'Item 2', price: 20, quantity: 1, imageUrl: '' }
        ]);

        // Mock Alert to auto-confirm load
        (Alert.alert as jest.Mock).mockImplementation((title, message, buttons) => {
            if (buttons && buttons.length >= 2) {
                buttons[1].onPress();
            }
        });

        const { getByTestId, findByText, findByTestId } = render(<ShopScreen />);

        fireEvent.press(getByTestId('btn-saved-lists'));
        await findByText('Monthly Shopping');

        // Press Load
        const loadBtn = await findByTestId('btn-load-list-list-1');
        fireEvent.press(loadBtn);

        await waitFor(() => {
            expect(mockBasketService.getSavedBasketItems).toHaveBeenCalledWith('list-1');
            expect(mockUseSupermarketSession().replaceBasket).toHaveBeenCalledWith(expect.arrayContaining([
                expect.objectContaining({ productName: 'Item 1', quantity: 2 }),
                expect.objectContaining({ productName: 'Item 2', quantity: 1 })
            ]));
        });
    });

});
