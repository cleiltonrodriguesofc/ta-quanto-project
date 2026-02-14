import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Image,
    Alert,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Modal
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import {
    Trash2,
    Minus,
    Plus,
    ShoppingCart,
    ChevronRight,
    CirclePlus as PlusCircle,
    X,
    Search,
    ArrowLeft,
    Store,
    Camera,
    Save,
    List,
    RotateCw,
    Pencil
} from 'lucide-react-native';
import { useSupermarketSession, BasketItem } from '@/context/SupermarketContext';
import { useTranslation } from 'react-i18next';
import { getProductsBySupermarketName } from '@/utils/supermarketService';
import { SupermarketSelector } from '@/components/SupermarketSelector';
import { PriceEntry } from '@/types/price';
import { useAuth } from '@/context/AuthContext';
import { saveNamedBasket, getSavedBaskets, getSavedBasketItems, updateSavedBasket, deleteSavedBasket, renameSavedBasket } from '@/utils/basketService';

export default function ShopScreen() {
    const router = useRouter();
    const { t } = useTranslation();
    const {
        basket,
        removeFromBasket,
        updateBasketQuantity,
        setBasketQuantity,
        clearBasket,
        basketTotal,
        isShopMode,
        setShopMode,
        selectedSupermarket,
        setSelectedSupermarket,
        addToBasket,
        replaceBasket
    } = useSupermarketSession();

    const [currentStep, setCurrentStep] = useState<'SELECT' | 'BASKET' | 'LOOKUP' | 'SAVED_LISTS'>('BASKET');
    const [lookupProducts, setLookupProducts] = useState<PriceEntry[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoadingLookup, setIsLoadingLookup] = useState(false);
    const { user } = useAuth();
    const [isSaving, setIsSaving] = useState(false);
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [listName, setListName] = useState('');

    // Saved Lists State
    const [activeSavedListId, setActiveSavedListId] = useState<string | null>(null);
    const [savedLists, setSavedLists] = useState<any[]>([]);
    const [isLoadingSaved, setIsLoadingSaved] = useState(false);

    const [editingId, setEditingId] = useState<string | null>(null);
    const [editValue, setEditValue] = useState('');

    // Lookup Inline Quantity State
    const [lookupQuantities, setLookupQuantities] = useState<Record<string, number>>({});
    const [editingLookupBarcode, setEditingLookupBarcode] = useState<string | null>(null);
    const [lookupEditValue, setLookupEditValue] = useState('');

    useEffect(() => {
        if (!selectedSupermarket) {
            console.log('[Shop] No supermarket selected, forcing SELECT step');
            setCurrentStep('SELECT');
        } else if (currentStep === 'SELECT') {
            console.log('[Shop] Supermarket selected:', selectedSupermarket, 'moving to BASKET');
            setCurrentStep('BASKET');
        }
    }, [selectedSupermarket, currentStep]);

    useFocusEffect(
        useCallback(() => {
            if (!isShopMode) {
                setShopMode(true);
            }
        }, [isShopMode, setShopMode])
    );

    const loadLookupProducts = useCallback(async () => {
        if (!selectedSupermarket) return;
        setIsLoadingLookup(true);
        try {
            const products = await getProductsBySupermarketName(selectedSupermarket);
            // Deduplicate by barcode to show unique products
            const uniqueProducts: PriceEntry[] = [];
            const seenBarcodes = new Set();
            products.forEach(p => {
                if (!seenBarcodes.has(p.barcode)) {
                    seenBarcodes.add(p.barcode);
                    uniqueProducts.push(p);
                }
            });
            setLookupProducts(uniqueProducts);
        } catch (error) {
            console.error('Error loading lookup products:', error);
        } finally {
            setIsLoadingLookup(false);
        }
    }, [selectedSupermarket]);





    // List Management State
    const [editListModalVisible, setEditListModalVisible] = useState(false);
    const [renamingListId, setRenamingListId] = useState<string | null>(null);
    const [renamingListName, setRenamingListName] = useState('');

    const loadSavedLists = useCallback(async () => {
        if (!user) return;
        setIsLoadingSaved(true);
        console.log('[Shop] Fetching saved lists for user:', user.id);
        try {
            const lists = await getSavedBaskets(user.id);
            console.log('[Shop] Saved lists fetch success:', lists ? lists.length : 0, 'lists found');
            setSavedLists(lists || []);
        } catch (error) {
            console.error('[Shop] Error loading saved baskets:', error);
            Alert.alert(t('error'), t('save_error'));
        } finally {
            setIsLoadingSaved(false);
        }
    }, [user, t]);

    const handleRenameList = (listId: string, currentName: string) => {
        setRenamingListId(listId);
        setRenamingListName(currentName);
        setEditListModalVisible(true);
    };

    const confirmRenameList = async () => {
        if (!user || !renamingListId || !renamingListName.trim()) return;

        try {
            await renameSavedBasket(user.id, renamingListId, renamingListName);
            setEditListModalVisible(false);
            setRenamingListId(null);
            setRenamingListName('');
            Alert.alert(t('success'), t('list_renamed', 'List renamed successfully'));

            // Force refresh of the list
            await loadSavedLists();

            // If the renamed list is currently active, update the title in the header too (though header shows 'Shop Mode' usually, but good for consistency)
            if (activeSavedListId === renamingListId) {
                setListName(renamingListName);
            }
        } catch (error) {
            console.error('[Shop] Error renaming list:', error);
            Alert.alert(t('error'), t('error_renaming_list', 'Error renaming list'));
        }
    };

    const handleDeleteList = (listId: string) => {
        Alert.alert(
            t('delete_list', 'Delete List'),
            t('delete_list_confirm', 'Are you sure you want to delete this list? This cannot be undone.'),
            [
                { text: t('cancel'), style: 'cancel' },
                {
                    text: t('delete'),
                    style: 'destructive',
                    onPress: async () => {
                        if (!user) return;
                        try {
                            await deleteSavedBasket(user.id, listId);
                            console.log('[Shop] List deleted:', listId);

                            // If deleting the currently active list, clear the basket
                            if (activeSavedListId === listId) {
                                console.log('[Shop] Deleted active list, clearing basket session');
                                clearBasket(); // Clears items and storage
                                setActiveSavedListId(null);
                                setListName('');
                            }

                            await loadSavedLists(); // Refresh list
                        } catch (error) {
                            console.error('[Shop] Error deleting list:', error);
                            Alert.alert(t('error'), t('error_deleting_list', 'Error deleting list'));
                        }
                    }
                }
            ]
        );
    };

    useEffect(() => {
        if (currentStep === 'LOOKUP') {
            loadLookupProducts();
        } else if (currentStep === 'SAVED_LISTS') {
            loadSavedLists();
        }
    }, [currentStep, selectedSupermarket, loadLookupProducts, loadSavedLists]);

    const handleLoadSavedBasket = (savedBasket: any) => {
        Alert.alert(
            t('load_list'),
            t('load_list_confirm'),
            [
                { text: t('cancel'), style: 'cancel' },
                {
                    text: t('load'),
                    onPress: async () => {
                        setIsLoadingSaved(true);
                        try {
                            const items = await getSavedBasketItems(savedBasket.id);

                            // Use new replaceBasket to avoid duplication issues
                            const basketItems = items.map((item: any) => ({
                                id: Math.random().toString(36).substring(7), // Generate new IDs for the session
                                barcode: item.barcode,
                                productName: item.productName,
                                price: item.price,
                                quantity: item.quantity,
                                supermarket: savedBasket.supermarket,
                                imageUrl: item.imageUrl,
                                timestamp: new Date().toISOString()
                            }));

                            replaceBasket(basketItems);

                            setActiveSavedListId(savedBasket.id);
                            setListName(savedBasket.name);
                            setSelectedSupermarket(savedBasket.supermarket);
                            setCurrentStep('BASKET');

                        } catch (error) {
                            console.error('Error loading basket items:', error);
                            Alert.alert(t('error'), t('error'));
                        } finally {
                            setIsLoadingSaved(false);
                        }
                    }
                }
            ]
        );
    };

    const handleClearBasket = () => {
        console.log('[Shop] User requested to clear basket');
        Alert.alert(
            t('clear_basket'),
            t('clear_data_confirm'),
            [
                { text: t('cancel'), style: 'cancel', onPress: () => console.log('[Shop] Clear basket cancelled') },
                {
                    text: t('clear'), style: 'destructive', onPress: () => {
                        console.log('[Shop] Basket cleared');
                        clearBasket();
                    }
                },
            ]
        );
    };

    const startEditing = (item: BasketItem) => {
        setEditingId(item.id);
        setEditValue(item.quantity.toString());
    };

    const submitEdit = () => {
        if (editingId) {
            const val = parseInt(editValue);
            console.log('[Shop] Submitting quantity edit:', { id: editingId, value: val });
            if (!isNaN(val) && val > 0) {
                setBasketQuantity(editingId, val);
            }
            setEditingId(null);
        }
    };

    const getLookupQuantity = (barcode: string) => {
        return lookupQuantities[barcode] || 1;
    };

    const updateLookupQuantity = (barcode: string, delta: number) => {
        setLookupQuantities(prev => {
            const current = prev[barcode] || 1;
            const newVal = Math.max(1, current + delta);
            return { ...prev, [barcode]: newVal };
        });
    };

    const handleLookupQuantityEdit = (barcode: string, text: string) => {
        setLookupEditValue(text);
    };

    const submitLookupEdit = (barcode: string) => {
        const val = parseInt(lookupEditValue);
        if (!isNaN(val) && val > 0) {
            setLookupQuantities(prev => ({ ...prev, [barcode]: val }));
        }
        setEditingLookupBarcode(null);
    };

    const handleAddFromLookup = (product: PriceEntry) => {
        const qty = lookupQuantities[product.barcode] || 1;
        console.log('[Shop] Adding inline:', qty, 'for:', product.productName);

        addToBasket({
            barcode: product.barcode,
            productName: product.productName,
            price: product.price,
            quantity: qty,
            supermarket: selectedSupermarket || '',
            imageUrl: product.imageUrl,
            timestamp: new Date().toISOString(),
        });

        // Reset quantity for this barcode (cleanup)
        setLookupQuantities(prev => {
            const next = { ...prev };
            delete next[product.barcode];
            return next;
        });

        // The item will automatically disappear due to filteredLookup logic
    };

    const handleSaveList = async () => {
        if (!user) {
            Alert.alert(t('error'), t('login_required'));
            return;
        }

        if (basket.length === 0) {
            Alert.alert(t('error'), t('empty_basket'));
            return;
        }

        if (activeSavedListId) {
            // Confirm update
            confirmSaveList();
        } else {
            setShowSaveModal(true);
        }
    };

    const confirmSaveList = async () => {
        if (!listName || listName.trim() === '') return;

        setIsSaving(true);
        try {
            if (activeSavedListId) {
                await updateSavedBasket(
                    user!.id,
                    activeSavedListId,
                    basket,
                    basketTotal
                );
                Alert.alert(t('success'), t('list_saved'));
            } else {
                const currSupermarket = selectedSupermarket || 'Unknown';
                const newBasket = await saveNamedBasket(
                    user!.id,
                    listName,
                    basket,
                    currSupermarket,
                    basketTotal
                );
                setActiveSavedListId(newBasket.id);
                Alert.alert(t('success'), t('list_saved'));
            }
            setShowSaveModal(false);
        } catch (error) {
            console.error('[Shop] Failed to save list:', error);
            Alert.alert(t('error'), t('save_error'));
        } finally {
            setIsSaving(false);
        }
    };

    const renderItem = ({ item }: { item: BasketItem }) => (
        <View style={styles.itemCard}>
            <View style={styles.itemInfo}>
                {item.imageUrl ? (
                    <Image source={{ uri: item.imageUrl }} style={styles.itemImage} />
                ) : (
                    <View style={styles.placeholderImage}>
                        <ShoppingCart size={24} color="#9CA3AF" />
                    </View>
                )}
                <View style={styles.itemDetails}>
                    <Text style={styles.itemName} numberOfLines={1}>{item.productName}</Text>
                    <Text style={styles.itemPrice}>R${item.price.toFixed(2)}</Text>
                </View>
            </View>

            <View style={styles.itemActions}>
                <View style={styles.quantityControls}>
                    <TouchableOpacity
                        style={styles.qtyButton}
                        onPress={() => {
                            console.log('[Shop] Decrement quantity for:', item.productName);
                            updateBasketQuantity(item.id, -1);
                        }}
                    >
                        <Minus size={20} color="#3A7DE8" />
                    </TouchableOpacity>

                    {editingId === item.id ? (
                        <TextInput
                            style={styles.qtyInput}
                            value={editValue}
                            onChangeText={setEditValue}
                            keyboardType="number-pad"
                            autoFocus
                            onBlur={submitEdit}
                            onSubmitEditing={submitEdit}
                        />
                    ) : (
                        <TouchableOpacity onPress={() => startEditing(item)}>
                            <Text style={styles.qtyText}>{item.quantity}</Text>
                        </TouchableOpacity>
                    )}

                    <TouchableOpacity
                        style={styles.qtyButton}
                        onPress={() => {
                            console.log('[Shop] Increment quantity for:', item.productName);
                            updateBasketQuantity(item.id, 1);
                        }}
                    >
                        <Plus size={20} color="#3A7DE8" />
                    </TouchableOpacity>
                </View>

                <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => {
                        console.log('[Shop] Removing item:', item.productName);
                        removeFromBasket(item.id);
                    }}
                >
                    <Trash2 size={20} color="#EF4444" />
                </TouchableOpacity>
            </View>
        </View>
    );

    const filteredLookup = lookupProducts.filter(p =>
        p.productName.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !basket.some(b => b.barcode === p.barcode)
    );

    if (currentStep === 'SELECT') {
        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.title}>{t('shop_mode')}</Text>
                </View>
                <View style={styles.selectionContainer}>
                    <View style={styles.emptyIconContainer}>
                        <Store size={64} color="#3A7DE8" />
                    </View>
                    <Text style={styles.emptyTitle}>{t('where_shopping')}</Text>
                    <Text style={styles.emptySubtitle}>{t('select_supermarket_session_desc')}</Text>
                    <View style={{ width: '100%', paddingHorizontal: 20 }}>
                        <SupermarketSelector
                            selectedSupermarket={selectedSupermarket || ''}
                            onSelect={setSelectedSupermarket}
                        />
                    </View>
                </View>
            </View>
        );
    }

    if (currentStep === 'LOOKUP') {
        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => setCurrentStep('BASKET')} style={styles.backButton}>
                        <ArrowLeft size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                    <Text style={styles.title}>{t('add_to_basket')}</Text>
                    <View style={{ width: 24 }} />
                </View>

                <View style={styles.searchContainer}>
                    <View style={styles.searchInputContainer}>
                        <Search size={20} color="#9CA3AF" style={styles.searchIcon} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder={t('search_placeholder')}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            placeholderTextColor="#9CA3AF"
                        />
                        {searchQuery !== '' && (
                            <TouchableOpacity onPress={() => setSearchQuery('')}>
                                <X size={20} color="#9CA3AF" />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                {isLoadingLookup ? (
                    <View style={styles.emptyContainer}>
                        <ActivityIndicator size="large" color="#3A7DE8" />
                    </View>
                ) : (
                    <>
                        <FlatList
                            data={filteredLookup}
                            keyExtractor={(item) => item.id}
                            contentContainerStyle={styles.listContent}
                            renderItem={({ item }) => (
                                <View style={styles.itemCard}>
                                    <View style={styles.itemInfo}>
                                        {item.imageUrl ? (
                                            <Image source={{ uri: item.imageUrl }} style={styles.itemImage} />
                                        ) : (
                                            <View style={styles.placeholderImage}>
                                                <ShoppingCart size={24} color="#9CA3AF" />
                                            </View>
                                        )}
                                        <View style={styles.itemDetails}>
                                            <Text style={styles.itemName} numberOfLines={1}>{item.productName}</Text>
                                            <Text style={styles.itemPrice}>R${item.price.toFixed(2)}</Text>
                                        </View>
                                    </View>

                                    <View style={styles.lookupActions}>
                                        <View style={styles.quantityControlsSmall}>
                                            <TouchableOpacity
                                                style={styles.qtyButtonSmall}
                                                onPress={() => updateLookupQuantity(item.barcode, -1)}
                                            >
                                                <Minus size={16} color="#3A7DE8" />
                                            </TouchableOpacity>

                                            {editingLookupBarcode === item.barcode ? (
                                                <TextInput
                                                    style={styles.qtyInputSmall}
                                                    value={lookupEditValue}
                                                    onChangeText={handleLookupQuantityEdit}
                                                    keyboardType="number-pad"
                                                    autoFocus
                                                    onBlur={() => submitLookupEdit(item.barcode)}
                                                    onSubmitEditing={() => submitLookupEdit(item.barcode)}
                                                />
                                            ) : (
                                                <TouchableOpacity onPress={() => {
                                                    setEditingLookupBarcode(item.barcode);
                                                    setLookupEditValue(getLookupQuantity(item.barcode).toString());
                                                }}>
                                                    <Text style={styles.qtyTextSmall}>{getLookupQuantity(item.barcode)}</Text>
                                                </TouchableOpacity>
                                            )}

                                            <TouchableOpacity
                                                style={styles.qtyButtonSmall}
                                                onPress={() => updateLookupQuantity(item.barcode, 1)}
                                            >
                                                <Plus size={16} color="#3A7DE8" />
                                            </TouchableOpacity>
                                        </View>

                                        <TouchableOpacity
                                            style={styles.addButton}
                                            onPress={() => handleAddFromLookup(item)}
                                        >
                                            <Plus size={20} color="#FFFFFF" />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            )}
                            ListEmptyComponent={
                                <View style={styles.emptyContainer}>
                                    <Text style={styles.emptyTitle}>{t('no_products_found')}</Text>
                                    <Text style={styles.emptySubtitle}>{t('be_the_first')}</Text>
                                    <TouchableOpacity
                                        style={styles.scanLargeButton}
                                        onPress={() => {
                                            console.log('[Shop] Navigating to scanner from empty lookup');
                                            router.push('/scan?fromBasket=true');
                                        }}
                                    >
                                        <Camera size={24} color="#FFFFFF" />
                                        <Text style={styles.scanLargeButtonText}>{t('scan_product')}</Text>
                                    </TouchableOpacity>
                                </View>
                            }
                        />

                        <View style={styles.lookupFixedFooter}>
                            <TouchableOpacity
                                style={styles.scanSmallButton}
                                onPress={() => {
                                    console.log('[Shop] Navigating to scanner from lookup footer');
                                    router.push('/scan?fromBasket=true');
                                }}
                            >
                                <Camera size={20} color="#FFFFFF" />
                                <Text style={styles.scanSmallButtonText}>{t('scan_product')}</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.secondarySmallButton}
                                onPress={() => {
                                    console.log('[Shop] Returning to basket from lookup footer');
                                    setCurrentStep('BASKET');
                                }}
                            >
                                <ShoppingCart size={20} color="#3A7DE8" />
                                <Text style={styles.secondarySmallButtonText}>{t('view_basket')}</Text>
                            </TouchableOpacity>
                        </View>
                    </>
                )}
            </View>
        );
    }

    if (currentStep === 'SAVED_LISTS') {
        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => setCurrentStep('BASKET')} style={styles.backButton}>
                        <ArrowLeft size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                    <Text style={styles.title}>{t('saved_lists')}</Text>
                    <View style={{ width: 24 }} />
                </View>

                {/* Create New List Button */}
                <TouchableOpacity
                    style={styles.createListButton}
                    onPress={() => {
                        console.log('[Shop] Create new list requested');
                        setActiveSavedListId(null);
                        setListName('');
                        replaceBasket([]); // Start fresh
                        setCurrentStep('BASKET');
                    }}
                >
                    <PlusCircle size={20} color="#FFFFFF" />
                    <Text style={styles.createListButtonText}>{t('create_new_list', 'Create New List')}</Text>
                </TouchableOpacity>
                {/* Create New List Button (End) */}

                {isLoadingSaved ? (
                    <View style={styles.emptyContainer}>
                        <ActivityIndicator size="large" color="#3A7DE8" />
                    </View>
                ) : (
                    <FlatList
                        data={savedLists}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={styles.listContent}
                        renderItem={({ item }) => (
                            <View style={styles.itemCard}>
                                <TouchableOpacity
                                    style={[styles.itemInfo, { flex: 1 }]}
                                    onPress={() => handleLoadSavedBasket(item)}
                                >
                                    <View style={styles.placeholderImage}>
                                        <List size={24} color="#3A7DE8" />
                                    </View>
                                    <View style={styles.itemDetails}>
                                        <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                                        <Text style={styles.itemPrice}>{item.item_count} {t('items')} • R${Number(item.total_amount).toFixed(2)}</Text>
                                        <Text style={[styles.itemPrice, { fontSize: 12 }]}>{new Date(item.created_at).toLocaleDateString()}</Text>
                                    </View>
                                </TouchableOpacity>

                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                    <TouchableOpacity testID={`btn-load-list-${item.id}`} onPress={() => handleLoadSavedBasket(item)} style={{ padding: 6 }}>
                                        <RotateCw size={20} color="#3A7DE8" />
                                    </TouchableOpacity>
                                    <TouchableOpacity testID={`btn-rename-list-${item.id}`} onPress={() => handleRenameList(item.id, item.name)} style={{ padding: 6 }}>
                                        <Pencil size={20} color="#F59E0B" />
                                    </TouchableOpacity>
                                    <TouchableOpacity testID={`btn-delete-list-${item.id}`} onPress={() => handleDeleteList(item.id)} style={{ padding: 6 }}>
                                        <Trash2 size={20} color="#EF4444" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <Text style={styles.emptyTitle}>{t('no_saved_lists')}</Text>
                                <Text style={styles.emptySubtitle}>{t('save_list_hint')}</Text>
                            </View>
                        }
                    />
                )
                }
                {/* Edit List Modal */}
                <Modal
                    visible={editListModalVisible}
                    transparent={true}
                    animationType="fade"
                    onRequestClose={() => setEditListModalVisible(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>{t('rename_list', 'Rename List')}</Text>
                            <Text style={styles.modalSubtitle}>{t('enter_test_name', 'Enter new name')}</Text>

                            <TextInput
                                testID="input-rename-list"
                                style={styles.modalInput}
                                placeholder={t('list_name_placeholder')}
                                value={renamingListName}
                                onChangeText={setRenamingListName}
                                autoFocus={true}
                            />

                            <View style={styles.modalButtons}>
                                <TouchableOpacity
                                    style={styles.modalCancelButton}
                                    onPress={() => {
                                        setEditListModalVisible(false);
                                        setRenamingListName('');
                                    }}
                                >
                                    <Text style={styles.modalCancelButtonText}>{t('cancel')}</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    testID="btn-confirm-rename-list"
                                    style={[styles.modalSaveButton, (!renamingListName || renamingListName.trim() === '') && styles.modalSaveButtonDisabled]}
                                    onPress={confirmRenameList}
                                    disabled={!renamingListName || renamingListName.trim() === ''}
                                >
                                    <Text style={styles.modalSaveButtonText}>{t('save')}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>
            </View >
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.title}>{t('shop_mode')}</Text>
                    {selectedSupermarket && (
                        <TouchableOpacity onPress={() => setCurrentStep('SELECT')} style={styles.supermarketHeader}>
                            <Store size={14} color="#E0E7FF" />
                            <Text style={styles.supermarketText}>{selectedSupermarket}</Text>
                        </TouchableOpacity>
                    )}
                </View>
                <View style={{ flexDirection: 'row', gap: 16 }}>
                    <TouchableOpacity testID="btn-saved-lists" onPress={() => setCurrentStep('SAVED_LISTS')}>
                        <List size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                    {basket.length > 0 && (
                        <TouchableOpacity onPress={handleClearBasket}>
                            <Trash2 size={24} color="#FFFFFF" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {basket.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <View style={styles.emptyIconContainer}>
                        <ShoppingCart size={64} color="#CBD5E1" />
                    </View>
                    <Text style={styles.emptyTitle}>{t('empty_basket')}</Text>
                    <Text style={styles.emptySubtitle}>{t('start_sharing_community_msg')}</Text>
                    <TouchableOpacity
                        style={styles.addFirstButton}
                        onPress={() => {
                            console.log('[Shop] Navigating to LOOKUP from empty basket');
                            setCurrentStep('LOOKUP');
                        }}
                    >
                        <Text style={styles.addFirstButtonText}>{t('add_to_basket')}</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    style={{ flex: 1 }}
                >
                    <FlatList
                        data={basket}
                        renderItem={renderItem}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={styles.listContent}
                    />
                </KeyboardAvoidingView>
            )}

            {basket.length > 0 && (
                <View style={styles.footer}>
                    <View style={styles.totalSection}>
                        <View>
                            <Text style={styles.totalLabel}>{t('total')}</Text>
                            <Text style={styles.itemCount}>{basket.length} {t('items')}</Text>
                        </View>
                        <Text style={styles.totalAmount}>R${basketTotal.toFixed(2)}</Text>
                    </View>
                    <TouchableOpacity
                        style={styles.finishButton}
                        onPress={() => {
                            console.log('[Shop] User clicked Finish Shopping. Basket items:', basket.length, 'Total:', basketTotal);
                            Alert.alert(t('finish_shopping'), t('item_added_to_basket'), [
                                {
                                    text: 'OK', onPress: () => {
                                        console.log('[Shop] Shopping session finished and cleared');
                                        clearBasket();
                                        setShopMode(false);
                                        router.replace('/(tabs)');
                                    }
                                }
                            ]);
                        }}
                    >
                        <Text style={styles.finishButtonText}>{t('finish_shopping')}</Text>
                        <ChevronRight size={20} color="#FFFFFF" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.saveButton}
                        onPress={handleSaveList}
                        disabled={isSaving}
                    >
                        {isSaving ? (
                            <ActivityIndicator size="small" color="#3A7DE8" />
                        ) : (
                            <>
                                <Save size={20} color="#3A7DE8" />
                                <Text style={styles.saveButtonText}>{t('save_list')}</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            )}

            <TouchableOpacity
                style={styles.fab}
                onPress={() => {
                    console.log('[Shop] FAB clicked - moving to LOOKUP');
                    setCurrentStep('LOOKUP');
                }}
            >
                <PlusCircle size={24} color="#FFFFFF" />
            </TouchableOpacity>

            {/* Save List Modal */}
            <Modal
                visible={showSaveModal}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowSaveModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>{t('save_list')}</Text>
                        <Text style={styles.modalSubtitle}>{t('enter_list_name')}</Text>

                        <TextInput
                            testID="input-list-name"
                            style={styles.modalInput}
                            placeholder={t('list_name_placeholder')}
                            value={listName}
                            onChangeText={setListName}
                            autoFocus={true}
                        />

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={styles.modalCancelButton}
                                onPress={() => {
                                    setShowSaveModal(false);
                                    setListName('');
                                }}
                            >
                                <Text style={styles.modalCancelButtonText}>{t('cancel')}</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                testID="btn-confirm-save-list"
                                style={[styles.modalSaveButton, (!listName || listName.trim() === '') && styles.modalSaveButtonDisabled]}
                                onPress={confirmSaveList}
                                disabled={!listName || listName.trim() === '' || isSaving}
                            >
                                {isSaving ? (
                                    <ActivityIndicator size="small" color="#FFFFFF" />
                                ) : (
                                    <Text style={styles.modalSaveButtonText}>{t('save')}</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>



        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    header: {
        paddingTop: 60,
        paddingHorizontal: 20,
        paddingBottom: 20,
        backgroundColor: '#3A7DE8',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    backButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    supermarketHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 2,
    },
    supermarketText: {
        fontSize: 14,
        color: '#E0E7FF',
        fontWeight: '500',
    },
    selectionContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
    },
    searchContainer: {
        padding: 20,
        paddingBottom: 10,
    },
    searchInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        paddingHorizontal: 16,
        height: 48,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    searchIcon: {
        marginRight: 10,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: '#1F2937',
    },
    listContent: {
        padding: 20,
        paddingBottom: 100,
    },
    itemCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    itemInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    itemImage: {
        width: 48,
        height: 48,
        borderRadius: 8,
        backgroundColor: '#F1F5F9',
    },
    placeholderImage: {
        width: 48,
        height: 48,
        borderRadius: 8,
        backgroundColor: '#F1F5F9',
        alignItems: 'center',
        justifyContent: 'center',
    },
    itemDetails: {
        marginLeft: 12,
        flex: 1,
    },
    itemName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 2,
    },
    itemPrice: {
        fontSize: 14,
        color: '#6B7280',
        fontWeight: '500',
    },
    itemActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    quantityControls: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        borderRadius: 8,
        padding: 4,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    qtyButton: {
        padding: 4,
    },
    qtyText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1F2937',
        minWidth: 30,
        textAlign: 'center',
    },
    qtyInput: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#3A7DE8',
        minWidth: 30,
        textAlign: 'center',
        padding: 0,
    },
    removeButton: {
        padding: 4,
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
    },
    emptyIconContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#F1F5F9',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 8,
        textAlign: 'center',
    },
    emptySubtitle: {
        fontSize: 16,
        color: '#6B7280',
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 24,
    },
    addFirstButton: {
        backgroundColor: '#3A7DE8',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    addFirstButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    scanLargeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#10B981',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 8,
        gap: 8,
        marginTop: 10,
    },
    scanLargeButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    secondaryLargeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 8,
        gap: 8,
        marginTop: 12,
        borderWidth: 1,
        borderColor: '#3A7DE8',
    },
    secondaryLargeButtonText: {
        color: '#3A7DE8',
        fontSize: 16,
        fontWeight: '600',
    },
    lookupFixedFooter: {
        backgroundColor: '#FFFFFF',
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
        flexDirection: 'row',
        gap: 12,
    },
    scanSmallButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#3A7DE8',
        paddingVertical: 12,
        borderRadius: 8,
        gap: 8,
    },
    scanSmallButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: 'bold',
    },
    secondarySmallButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFFFFF',
        paddingVertical: 12,
        borderRadius: 8,
        gap: 8,
        borderWidth: 1,
        borderColor: '#3A7DE8',
    },
    secondarySmallButtonText: {
        color: '#3A7DE8',
        fontSize: 14,
        fontWeight: '600',
    },
    footer: {
        padding: 20,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
    },
    totalSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginBottom: 16,
    },
    totalLabel: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 4,
    },
    itemCount: {
        fontSize: 12,
        color: '#9CA3AF',
    },
    totalAmount: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    finishButton: {
        backgroundColor: '#3A7DE8',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 12,
        gap: 8,
    },
    finishButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    saveButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F1F5F9',
        paddingVertical: 12,
        borderRadius: 8,
        gap: 8,
        marginTop: 12,
    },
    saveButtonText: {
        color: '#3A7DE8',
        fontSize: 16,
        fontWeight: '600',
    },
    fab: {
        position: 'absolute',
        bottom: 30,
        right: 30,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#10B981',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 8,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 24,
        width: '100%',
        maxWidth: 400,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 8,
    },
    modalSubtitle: {
        fontSize: 16,
        color: '#6B7280',
        marginBottom: 20,
    },
    lookupActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    quantityControlsSmall: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F1F5F9',
        borderRadius: 8,
        padding: 4,
        gap: 8,
    },
    qtyButtonSmall: {
        width: 28,
        height: 28,
        borderRadius: 6,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 1,
        elevation: 1,
    },
    qtyInputSmall: {
        minWidth: 32,
        textAlign: 'center',
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1F2937',
        padding: 0,
    },
    qtyTextSmall: {
        minWidth: 32,
        textAlign: 'center',
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    addButton: {
        width: 36,
        height: 36,
        borderRadius: 8,
        backgroundColor: '#10B981', // Green for add action
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 2,
    },
    modalInput: {
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        color: '#1F2937',
        marginBottom: 20,
    },
    modalButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    modalCancelButton: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 8,
        backgroundColor: '#F1F5F9',
    },
    modalCancelButtonText: {
        color: '#64748B',
        fontSize: 16,
        fontWeight: '600',
    },
    modalSaveButton: {
        flex: 2,
        paddingVertical: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 8,
        backgroundColor: '#3A7DE8',
    },
    modalSaveButtonDisabled: {
        backgroundColor: '#CBD5E1',
    },
    modalSaveButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    createListButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#3A7DE8',
        margin: 16,
        padding: 12,
        borderRadius: 8,
        gap: 8,
    },
    createListButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
