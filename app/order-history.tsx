import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { Clock, Receipt, Trash2, RefreshCw, ArrowLeft, Edit, Save, X, Plus, Minus } from 'lucide-react-native';
import { useDatabase } from '@/hooks/useDatabase';
import { useRouter } from 'expo-router';

interface OrderHistoryItem {
  id: string;
  tableNumber: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  total: number;
  timestamp: Date;
}

const mockOrderHistory: OrderHistoryItem[] = [
  {
    id: 'mock-history-1',
    tableNumber: '田中テーブル',
    items: [
      { name: '本日の日替わり定食', quantity: 2, price: 980 },
      { name: '緑茶', quantity: 2, price: 200 },
    ],
    total: 2360,
    timestamp: new Date('2024-01-15T12:30:00'),
  },
  {
    id: 'mock-history-2',
    tableNumber: '窓際席',
    items: [
      { name: '鶏の唐揚げ定食', quantity: 1, price: 850 },
      { name: 'ほうじ茶', quantity: 1, price: 200 },
    ],
    total: 1050,
    timestamp: new Date('2024-01-15T13:15:00'),
  },
  {
    id: 'mock-history-3',
    tableNumber: '佐藤テーブル',
    items: [
      { name: 'わらび餅', quantity: 1, price: 380 },
      { name: '抹茶', quantity: 1, price: 350 },
    ],
    total: 730,
    timestamp: new Date('2024-01-15T14:00:00'),
  },
];

export default function OrderHistoryScreen() {
  const { database, isConnected } = useDatabase();
  const [orderHistory, setOrderHistory] = useState<OrderHistoryItem[]>(mockOrderHistory);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const router = useRouter();

  // データベースから注文履歴を読み込み
  const loadOrderHistory = async () => {
    if (!database) return;
    
    try {
      setIsRefreshing(true);
      const dbHistory = await database.getOrderHistory();
      const formattedHistory: OrderHistoryItem[] = dbHistory.map(item => ({
       id: item.id.toString(),
        tableNumber: item.table_number,
        items: item.items,
        total: item.total_amount,
        timestamp: new Date(item.completed_at || ''),
      }));
      setOrderHistory(formattedHistory);
    } catch (error) {
      console.error('注文履歴読み込みエラー:', error);
      Alert.alert('エラー', '注文履歴の読み込みに失敗しました');
    } finally {
      setIsRefreshing(false);
    }
  };

  // グローバルな注文履歴も取得
  const loadGlobalOrderHistory = () => {
    if ((global as any).getOrderHistory) {
      const globalHistory = (global as any).getOrderHistory();
      if (globalHistory && globalHistory.length > 0) {
        setOrderHistory(prev => {
          // 重複を避けるため、IDでフィルタリング
          const existingIds = prev.map(item => item.id);
          const newItems = globalHistory.filter((item: any) => !existingIds.includes(item.id));
          return [...prev, ...newItems];
        });
      }
    }
  };

  useEffect(() => {
    if (database) {
      loadOrderHistory();
    } else {
      // データベース未接続時はグローバル履歴を確認
      loadGlobalOrderHistory();
    }
  }, [database]);

  // 定期的にグローバル履歴をチェック
  useEffect(() => {
    const interval = setInterval(() => {
      if (!database) {
        loadGlobalOrderHistory();
      }
    }, 5000); // 5秒ごとにチェック

    return () => clearInterval(interval);
  }, [database]);

  const handleRefresh = async () => {
    if (database) {
      await loadOrderHistory();
    } else {
      loadGlobalOrderHistory();
    }
  };

  const deleteOrderHistory = async (orderId: string) => {
    Alert.alert(
      '注文履歴削除',
      'この注文履歴を削除しますか？この操作は元に戻せません。',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除',
          style: 'destructive',
          onPress: async () => {
            try {
              // データベースから削除（実装時に追加）
              // if (database && isConnected) {
              //   await database.deleteOrderHistory(orderId);
              // }
              
              // ローカル状態から削除
              setOrderHistory(prev => prev.filter(order => order.id !== orderId));
              
              // グローバル状態からも削除
              if ((global as any).deleteOrderHistory) {
                (global as any).deleteOrderHistory(orderId);
              }
              
              Alert.alert('完了', '注文履歴が削除されました');
            } catch (error) {
              console.error('注文履歴削除エラー:', error);
              Alert.alert('エラー', '注文履歴の削除に失敗しました');
            }
          },
        },
      ]
    );
  };

  const startEditOrder = (order: OrderHistoryItem) => {
    setEditingOrder({ ...order });
    setShowEditModal(true);
  };

  const saveEditedOrder = async () => {
    if (!editingOrder) return;
    
    try {
      // データベースを更新（実装時に追加）
      // if (database && isConnected) {
      //   await database.updateOrderHistory(editingOrder.id, {
      //     table_number: editingOrder.tableNumber,
      //     items: editingOrder.items,
      //     total_amount: editingOrder.total,
      //   });
      // }
      
      // ローカル状態を更新
      setOrderHistory(prev => 
        prev.map(order => 
          order.id === editingOrder.id ? editingOrder : order
        )
      );
      
      // グローバル状態も更新
      if ((global as any).updateOrderHistory) {
        (global as any).updateOrderHistory(editingOrder.id, editingOrder);
      }
      
      setShowEditModal(false);
      setEditingOrder(null);
      Alert.alert('完了', '注文履歴が更新されました');
    } catch (error) {
      console.error('注文履歴更新エラー:', error);
      Alert.alert('エラー', '注文履歴の更新に失敗しました');
    }
  };

  const updateItemQuantity = (itemIndex: number, change: number) => {
    if (!editingOrder) return;
    
    const updatedItems = [...editingOrder.items];
    const newQuantity = updatedItems[itemIndex].quantity + change;
    
    if (newQuantity <= 0) {
      // 数量が0以下になる場合は項目を削除
      updatedItems.splice(itemIndex, 1);
    } else {
      updatedItems[itemIndex].quantity = newQuantity;
    }
    
    // 合計金額を再計算
    const newTotal = updatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    setEditingOrder({
      ...editingOrder,
      items: updatedItems,
      total: newTotal,
    });
  };

  const addNewItem = () => {
    if (!editingOrder) return;
    
    const newItem = {
      name: '新しい項目',
      quantity: 1,
      price: 0,
    };
    
    const updatedItems = [...editingOrder.items, newItem];
    const newTotal = updatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    setEditingOrder({
      ...editingOrder,
      items: updatedItems,
      total: newTotal,
    });
  };

  const updateItemName = (itemIndex: number, name: string) => {
    if (!editingOrder) return;
    
    const updatedItems = [...editingOrder.items];
    updatedItems[itemIndex].name = name;
    
    setEditingOrder({
      ...editingOrder,
      items: updatedItems,
    });
  };

  const updateItemPrice = (itemIndex: number, price: string) => {
    if (!editingOrder) return;
    
    const updatedItems = [...editingOrder.items];
    updatedItems[itemIndex].price = parseInt(price) || 0;
    
    // 合計金額を再計算
    const newTotal = updatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    setEditingOrder({
      ...editingOrder,
      items: updatedItems,
      total: newTotal,
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>注文履歴</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw 
              size={20} 
              color="#FFFFFF" 
              style={isRefreshing ? { opacity: 0.5 } : {}}
            />
          </TouchableOpacity>
          <Receipt size={24} color="#FFFFFF" />
          {isConnected && <View style={styles.connectedDot} />}
        </View>
      </View>

      <View style={styles.statusBar}>
        <Text style={styles.statusText}>
          {isConnected ? '🟢 データベース連携' : '🔴 ローカルデータ'} • {orderHistory.length}件の履歴
        </Text>
        {isRefreshing && <Text style={styles.refreshingText}>更新中...</Text>}
      </View>

      <ScrollView style={styles.content}>
        {orderHistory.length === 0 ? (
          <View style={styles.emptyState}>
            <Receipt size={64} color="#CCCCCC" />
            <Text style={styles.emptyText}>注文履歴がありません</Text>
            <TouchableOpacity
              style={styles.refreshEmptyButton}
              onPress={handleRefresh}
            >
              <Text style={styles.refreshEmptyButtonText}>更新</Text>
            </TouchableOpacity>
          </View>
        ) : (
          orderHistory.map(order => (
            <View key={order.id} style={styles.orderCard}>
              <View style={styles.orderHeader}>
                <Text style={styles.tableNumber}>{order.tableNumber}</Text>
                <View style={styles.orderHeaderRight}>
                  <Text style={styles.orderDate}>{formatDate(order.timestamp)}</Text>
                  <View style={styles.orderActions}>
                    <TouchableOpacity
                      style={styles.editButton}
                      onPress={() => startEditOrder(order)}
                    >
                      <Edit size={16} color="#8B4513" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => deleteOrderHistory(order.id)}
                    >
                      <Trash2 size={16} color="#DC2626" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
              
              <View style={styles.orderItems}>
                {order.items.map((item, index) => (
                  <View key={index} style={styles.orderItem}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemQuantity}>× {item.quantity}</Text>
                    <Text style={styles.itemPrice}>¥{(item.price * item.quantity).toLocaleString()}</Text>
                  </View>
                ))}
              </View>
              
              <View style={styles.orderTotal}>
                <Text style={styles.totalLabel}>合計</Text>
                <Text style={styles.totalAmount}>¥{order.total.toLocaleString()}</Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5E6D3',
  },
  header: {
    backgroundColor: '#8B4513',
    paddingTop: 40,
    paddingBottom: 15,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    position: 'relative',
  },
  refreshButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  connectedDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  statusBar: {
    backgroundColor: 'rgba(139, 69, 19, 0.1)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 12,
    color: '#8B4513',
    fontWeight: '600',
  },
  refreshingText: {
    fontSize: 12,
    color: '#8B4513',
    fontStyle: 'italic',
  },
  content: {
    flex: 1,
    padding: 15,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 18,
    color: '#666666',
    marginTop: 20,
    marginBottom: 20,
  },
  refreshEmptyButton: {
    backgroundColor: '#8B4513',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  refreshEmptyButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  orderHeaderRight: {
    alignItems: 'flex-end',
  },
  orderActions: {
    flexDirection: 'row',
    marginTop: 5,
    gap: 8,
  },
  editButton: {
    backgroundColor: '#F5E6D3',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    backgroundColor: '#FEE2E2',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tableNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#8B4513',
  },
  orderDate: {
    fontSize: 14,
    color: '#666666',
  },
  orderItems: {
    marginBottom: 10,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 5,
  },
  itemName: {
    flex: 1,
    fontSize: 14,
    color: '#333333',
  },
  itemQuantity: {
    fontSize: 14,
    color: '#666666',
    marginHorizontal: 10,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#8B4513',
  },
  orderTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 2,
    borderTopColor: '#8B4513',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#8B4513',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    width: '95%',
    maxWidth: 500,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#8B4513',
  },
  modalCloseButton: {
    backgroundColor: '#F5E6D3',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editContent: {
    padding: 20,
    maxHeight: 400,
  },
  editSection: {
    marginBottom: 20,
  },
  editLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#8B4513',
    marginBottom: 8,
  },
  editInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    backgroundColor: '#FFFFFF',
  },
  itemsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  addItemButton: {
    backgroundColor: '#8B4513',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  addItemButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  editItem: {
    backgroundColor: '#F5E6D3',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  itemNameInput: {
    flex: 1,
    marginBottom: 0,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    paddingHorizontal: 8,
  },
  quantityButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F5E6D3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333333',
    marginHorizontal: 12,
    minWidth: 20,
    textAlign: 'center',
  },
  priceInput: {
    width: 80,
    marginBottom: 0,
    textAlign: 'right',
  },
  totalSection: {
    backgroundColor: '#F5E6D3',
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#8B4513',
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  cancelButton: {
    backgroundColor: '#E5E5E5',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 0.4,
  },
  cancelButtonText: {
    color: '#666666',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  saveButton: {
    backgroundColor: '#8B4513',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 0.6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginLeft: 6,
  },
});