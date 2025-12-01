import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Plus, Trash2, Check, Circle, CheckCircle2, ShoppingCart } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ShoppingList, ShoppingListItem } from '@/types/list';
import { useTranslation } from 'react-i18next';

const LIST_KEY = 'taquanto_shopping_list';

export default function ShoppingListScreen() {
  const { t } = useTranslation();
  const [items, setItems] = useState<ShoppingListItem[]>([]);
  const [newItemName, setNewItemName] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    loadList();
  }, []);

  const loadList = async () => {
    try {
      const storedList = await AsyncStorage.getItem(LIST_KEY);
      if (storedList) {
        setItems(JSON.parse(storedList));
      }
    } catch (error) {
      console.error('Error loading shopping list:', error);
    }
  };

  const saveList = async (newItems: ShoppingListItem[]) => {
    try {
      await AsyncStorage.setItem(LIST_KEY, JSON.stringify(newItems));
      setItems(newItems);
    } catch (error) {
      console.error('Error saving shopping list:', error);
      Alert.alert(t('error'), t('save_error'));
    }
  };

  const addItem = () => {
    if (!newItemName.trim()) return;

    const newItem: ShoppingListItem = {
      id: Date.now().toString(),
      productName: newItemName.trim(),
      isChecked: false,
    };

    const updatedList = [...items, newItem];
    saveList(updatedList);
    setNewItemName('');
    setIsAdding(false);
  };

  const toggleItem = (id: string) => {
    const updatedList = items.map(item =>
      item.id === id ? { ...item, isChecked: !item.isChecked } : item
    );
    saveList(updatedList);
  };

  const deleteItem = (id: string) => {
    const updatedList = items.filter(item => item.id !== id);
    saveList(updatedList);
  };

  const clearCompleted = () => {
    Alert.alert(
      t('clear_completed'),
      t('clear_completed_confirm'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('clear'),
          style: 'destructive',
          onPress: () => {
            const updatedList = items.filter(item => !item.isChecked);
            saveList(updatedList);
          },
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: ShoppingListItem }) => (
    <View style={styles.itemCard}>
      <TouchableOpacity
        style={styles.checkbox}
        onPress={() => toggleItem(item.id)}
      >
        {item.isChecked ? (
          <CheckCircle2 size={24} color="#10B981" />
        ) : (
          <Circle size={24} color="#D1D5DB" />
        )}
      </TouchableOpacity>

      <Text style={[styles.itemText, item.isChecked && styles.itemTextChecked]}>
        {item.productName}
      </Text>

      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => deleteItem(item.id)}
      >
        <Trash2 size={20} color="#EF4444" />
      </TouchableOpacity>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>{t('shopping_list')}</Text>
          {items.some(i => i.isChecked) && (
            <TouchableOpacity onPress={clearCompleted}>
              <Text style={styles.clearText}>{t('clear_completed')}</Text>
            </TouchableOpacity>
          )}
        </View>
        <Text style={styles.subtitle}>
          {t('items_remaining', { count: items.filter(i => !i.isChecked).length })}
        </Text>
      </View>

      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <ShoppingCart size={64} color="#E5E7EB" />
            <Text style={styles.emptyText}>{t('list_empty')}</Text>
            <Text style={styles.emptySubtext}>{t('list_empty_subtext')}</Text>
          </View>
        }
      />

      <View style={styles.inputContainer}>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder={t('add_item_placeholder')}
            value={newItemName}
            onChangeText={setNewItemName}
            onSubmitEditing={addItem}
            placeholderTextColor="#9CA3AF"
          />
          <TouchableOpacity
            style={[styles.addButton, !newItemName.trim() && styles.addButtonDisabled]}
            onPress={addItem}
            disabled={!newItemName.trim()}
          >
            <Plus size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
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
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 16,
    color: '#E0E7FF',
  },
  clearText: {
    color: '#E0E7FF',
    fontSize: 14,
    fontWeight: '600',
  },
  list: {
    padding: 20,
    paddingBottom: 100,
    flexGrow: 1,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  checkbox: {
    marginRight: 12,
  },
  itemText: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
  },
  itemTextChecked: {
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
  },
  deleteButton: {
    padding: 8,
  },
  inputContainer: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  inputWrapper: {
    flexDirection: 'row',
    gap: 12,
  },
  input: {
    flex: 1,
    height: 50,
    backgroundColor: '#F3F4F6',
    borderRadius: 25,
    paddingHorizontal: 20,
    fontSize: 16,
    color: '#1F2937',
  },
  addButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#3A7DE8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#9CA3AF',
  },
});