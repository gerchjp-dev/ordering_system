import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Clock, Receipt, Trash2, RefreshCw } from 'lucide-react-native';
import { useDatabase } from '@/hooks/useDatabase';

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
                <Text style={styles.orderDate}>{formatDate(order.timestamp)}</Text>
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
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
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
});