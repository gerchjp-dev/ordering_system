import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Modal,
} from 'react-native';
import { Plus, Minus, ArrowLeft, ChevronDown, CircleCheck as CheckCircle, Clock } from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useDatabase } from '@/hooks/useDatabase';

interface MenuItem {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
}

interface CartItem extends MenuItem {
  quantity: number;
}

const menuItems: MenuItem[] = [
  {
    id: 'mock-menu-1',
    name: '本日の日替わり定食',
    price: 980,
    image: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=300',
    category: '定食',
  },
  {
    id: 'mock-menu-2',
    name: '鶏の唐揚げ定食',
    price: 850,
    image: 'https://images.pexels.com/photos/2338407/pexels-photo-2338407.jpeg?auto=compress&cs=tinysrgb&w=300',
    category: '定食',
  },
  {
    id: 'mock-menu-3',
    name: '焼き魚定食',
    price: 920,
    image: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=300',
    category: '定食',
  },
  {
    id: 'mock-menu-4',
    name: '緑茶',
    price: 200,
    image: 'https://images.pexels.com/photos/1638280/pexels-photo-1638280.jpeg?auto=compress&cs=tinysrgb&w=300',
    category: 'ドリンク',
  },
  {
    id: 'mock-menu-5',
    name: 'ほうじ茶',
    price: 200,
    image: 'https://images.pexels.com/photos/1638280/pexels-photo-1638280.jpeg?auto=compress&cs=tinysrgb&w=300',
    category: 'ドリンク',
  },
  {
    id: 'mock-menu-6',
    name: 'わらび餅',
    price: 380,
    image: 'https://images.pexels.com/photos/1126359/pexels-photo-1126359.jpeg?auto=compress&cs=tinysrgb&w=300',
    category: 'デザート',
  },
  {
    id: 'mock-menu-7',
    name: 'みたらし団子',
    price: 320,
    image: 'https://images.pexels.com/photos/6880219/pexels-photo-6880219.jpeg?auto=compress&cs=tinysrgb&w=300',
    category: 'デザート',
  },
  {
    id: 'mock-menu-8',
    name: '抹茶',
    price: 350,
    image: 'https://images.pexels.com/photos/1638280/pexels-photo-1638280.jpeg?auto=compress&cs=tinysrgb&w=300',
    category: 'ドリンク',
  },
  {
    id: 'mock-menu-9',
    name: 'あんみつ',
    price: 450,
    image: 'https://images.pexels.com/photos/1126359/pexels-photo-1126359.jpeg?auto=compress&cs=tinysrgb&w=300',
    category: 'デザート',
  },
];

export default function OrderScreen() {
  const { database, isConnected } = useDatabase();
  const [confirmedOrders, setConfirmedOrders] = useState<CartItem[]>([]); // 確定済み注文
  const [pendingOrders, setPendingOrders] = useState<CartItem[]>([]); // 追加注文（未確定）
  const [showTableSelector, setShowTableSelector] = useState(false);
  const [availableTables, setAvailableTables] = useState<any[]>([]);
  const router = useRouter();
  const { tableId, tableNumber } = useLocalSearchParams();
  const currentTableId = tableId as string;

  // データベースからメニューを読み込み
  const [dbMenuItems, setDbMenuItems] = useState<MenuItem[]>([]);
  
  const loadMenuItems = async () => {
    if (!database) return;
    
    try {
      const items = await database.getMenuItems();
      const formattedItems: MenuItem[] = items.map(item => ({
        id: item.id.toString(),
        name: item.name,
        price: item.price,
        image: item.image_url || 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=300',
        category: item.category,
      }));
      setDbMenuItems(formattedItems);
    } catch (error) {
      console.error('メニュー読み込みエラー:', error);
    }
  };

  React.useEffect(() => {
    if (database) {
      loadMenuItems();
    }
  }, [database]);

  // データベース接続時はDBのメニューを使用、そうでなければモックデータ
  const currentMenuItems = isConnected && dbMenuItems.length > 0 ? dbMenuItems : menuItems;

  // テーブルの既存注文を読み込み（確定済み注文として表示）
  useEffect(() => {
    if (currentTableId && (global as any).getTableOrders) {
      const existingOrders = (global as any).getTableOrders(currentTableId);
      if (existingOrders && existingOrders.length > 0) {
        setConfirmedOrders(existingOrders);
      }
    }
    
    // 利用可能なテーブル一覧を取得
    if ((global as any).getAllTables) {
      const tables = (global as any).getAllTables();
      setAvailableTables(tables);
    }
  }, [currentTableId]);

  const addToPendingOrders = (item: MenuItem) => {
    setPendingOrders(prevOrders => {
      const existingItem = prevOrders.find(order => order.id === item.id);
      if (existingItem) {
        return prevOrders.map(order =>
          order.id === item.id
            ? { ...order, quantity: order.quantity + 1 }
            : order
        );
      } else {
        return [...prevOrders, { ...item, quantity: 1 }];
      }
    });
  };

  const removeFromPendingOrders = (id: string) => {
    setPendingOrders(prevOrders => {
      return prevOrders.reduce((acc, item) => {
        if (item.id === id) {
          if (item.quantity > 1) {
            acc.push({ ...item, quantity: item.quantity - 1 });
          }
        } else {
          acc.push(item);
        }
        return acc;
      }, [] as CartItem[]);
    });
  };

  const getPendingTotal = () => {
    return pendingOrders.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const getConfirmedTotal = () => {
    return confirmedOrders.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const getTotalAmount = () => {
    return getConfirmedTotal() + getPendingTotal();
  };

  const confirmPendingOrders = () => {
    if (pendingOrders.length === 0) {
      Alert.alert('エラー', '追加する注文がありません');
      return;
    }
    
    Alert.alert(
      '注文確定',
      `以下の注文を確定しますか？\n\n${pendingOrders.map(item => `・${item.name} × ${item.quantity} = ¥${(item.price * item.quantity).toLocaleString()}`).join('\n')}\n\n追加金額: ¥${getPendingTotal().toLocaleString()}`,
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '確定',
          onPress: async () => {
            try {
              console.log('📝 追加注文確定処理開始...');
              
              // 確定済み注文に追加
              const updatedConfirmedOrders = [...confirmedOrders];
              
              // 既存の注文と統合
              pendingOrders.forEach(pendingItem => {
                const existingIndex = updatedConfirmedOrders.findIndex(item => item.id === pendingItem.id);
                if (existingIndex >= 0) {
                  updatedConfirmedOrders[existingIndex].quantity += pendingItem.quantity;
                } else {
                  updatedConfirmedOrders.push(pendingItem);
                }
              });
              
              setConfirmedOrders(updatedConfirmedOrders);
              
              // データベースに注文を保存
              if (database && isConnected) {
                console.log('💾 Supabaseに追加注文を保存中...');
                for (const item of pendingOrders) {
                  await database.createOrder({
                    table_id: currentTableId,
                    menu_item_id: item.id,
                    quantity: item.quantity,
                    unit_price: item.price,
                  });
                }
                
                // テーブル状態を更新
                await database.updateTable(currentTableId, {
                  status: 'occupied',
                  customer_count: 1,
                  order_start_time: new Date().toISOString(),
                  total_amount: getTotalAmount(),
                });
                console.log('✅ Supabase注文保存完了');
              } else {
                console.log('⚠️ データベース未接続 - ローカル処理のみ');
              }
              
              // グローバル関数でローカル状態も更新
              if ((global as any).updateTableOrder) {
                (global as any).updateTableOrder(currentTableId, updatedConfirmedOrders, getTotalAmount());
              }
              
              if ((global as any).updateTableStatus) {
                (global as any).updateTableStatus(currentTableId, 'occupied', {
                  orderStartTime: new Date(),
                  customerCount: 1
                });
              }
              
              // 追加注文をクリア
              setPendingOrders([]);
              
              Alert.alert(
                '注文確定完了',
                `🎉 追加注文が確定されました！\n\n📝 ${pendingOrders.length}品目の追加注文\n💰 追加金額: ¥${getPendingTotal().toLocaleString()}\n💰 合計金額: ¥${getTotalAmount().toLocaleString()}`,
                [{ text: 'OK' }]
              );
            } catch (error) {
              console.error('❌ 注文確定エラー:', error);
              Alert.alert(
                'エラー',
                `注文確定中にエラーが発生しました:\n\n${error instanceof Error ? error.message : '不明なエラー'}\n\n接続状態: ${isConnected ? '🟢 データベース連携' : '🔴 ローカルのみ'}`
              );
            }
          },
        },
      ]
    );
  };

  const switchToTable = (newTableId: string, newTableNumber: string) => {
    setShowTableSelector(false);
    router.replace(`/order?tableId=${newTableId}&tableNumber=${newTableNumber}`);
  };

  const categories = ['定食', 'ドリンク', 'デザート'];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.tableSelector}
          onPress={() => setShowTableSelector(true)}
        >
          <Text style={styles.headerTitle}>
            テーブル {tableNumber} - 注文
          </Text>
          <ChevronDown size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        {/* 確定済み注文履歴 */}
        {confirmedOrders.length > 0 && (
          <View style={styles.confirmedOrdersSection}>
            <View style={styles.sectionHeader}>
              <CheckCircle size={20} color="#10B981" />
              <Text style={styles.sectionTitle}>注文履歴</Text>
            </View>
            <View style={styles.ordersList}>
              {confirmedOrders.map(item => (
                <View key={`confirmed-${item.id}`} style={styles.confirmedOrderItem}>
                  <Text style={styles.confirmedItemName}>{item.name}</Text>
                  <Text style={styles.confirmedItemQuantity}>× {item.quantity}</Text>
                  <Text style={styles.confirmedItemPrice}>¥{(item.price * item.quantity).toLocaleString()}</Text>
                </View>
              ))}
              <View style={styles.confirmedTotal}>
                <Text style={styles.confirmedTotalText}>履歴合計: ¥{getConfirmedTotal().toLocaleString()}</Text>
              </View>
            </View>
          </View>
        )}

        {/* 追加注文セクション */}
        <View style={styles.addOrderSection}>
          <View style={styles.sectionHeader}>
            <Plus size={20} color="#8B4513" />
            <Text style={styles.sectionTitle}>
              {confirmedOrders.length > 0 ? '追加注文' : '注文'}
            </Text>
          </View>

          {/* メニュー一覧 */}
          <View style={styles.menuSection}>
            {categories.map(category => (
              <View key={category} style={styles.categorySection}>
                <Text style={styles.categoryTitle}>{category}</Text>
                {currentMenuItems
                  .filter(item => item.category === category)
                  .map(item => (
                    <TouchableOpacity
                      key={item.id}
                      style={styles.menuItem}
                      onPress={() => addToPendingOrders(item)}
                    >
                      <Image source={{ uri: item.image }} style={styles.menuImage} />
                      <View style={styles.menuInfo}>
                        <Text style={styles.menuName}>{item.name}</Text>
                        <Text style={styles.menuCategory}>{item.category}</Text>
                        <Text style={styles.menuPrice}>¥{item.price}</Text>
                      </View>
                      <TouchableOpacity
                        style={styles.addButton}
                        onPress={() => addToPendingOrders(item)}
                      >
                        <Plus size={24} color="#FFFFFF" />
                      </TouchableOpacity>
                    </TouchableOpacity>
                  ))}
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* 追加注文カート */}
      {pendingOrders.length > 0 && (
        <View style={styles.pendingOrdersSection}>
          <View style={styles.pendingHeader}>
            <Clock size={16} color="#F59E0B" />
            <Text style={styles.pendingTitle}>追加注文 ({pendingOrders.length}品目)</Text>
            <Text style={styles.pendingTotal}>¥{getPendingTotal().toLocaleString()}</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pendingItems}>
            {pendingOrders.map(item => (
              <View key={`pending-${item.id}`} style={styles.pendingItem}>
                <Text style={styles.pendingItemName}>{item.name}</Text>
                <View style={styles.pendingItemControls}>
                  <TouchableOpacity
                    style={styles.pendingItemButton}
                    onPress={() => removeFromPendingOrders(item.id)}
                  >
                    <Minus size={12} color="#8B4513" />
                  </TouchableOpacity>
                  <Text style={styles.pendingItemQuantity}>{item.quantity}</Text>
                  <TouchableOpacity
                    style={styles.pendingItemButton}
                    onPress={() => addToPendingOrders(item)}
                  >
                    <Plus size={12} color="#8B4513" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </ScrollView>
          <TouchableOpacity
            style={styles.confirmButton}
            onPress={confirmPendingOrders}
          >
            <CheckCircle size={20} color="#FFFFFF" />
            <Text style={styles.confirmButtonText}>注文確定</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* テーブル選択モーダル */}
      <Modal
        visible={showTableSelector}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowTableSelector(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>テーブルを選択</Text>
            <ScrollView style={styles.tableList}>
              {availableTables.map(table => (
                <TouchableOpacity
                  key={table.id}
                  style={[
                    styles.tableOption,
                    table.id === currentTableId && styles.currentTableOption
                  ]}
                  onPress={() => switchToTable(table.id, table.number)}
                >
                  <View style={styles.tableOptionInfo}>
                    <Text style={[
                      styles.tableOptionName,
                      table.id === currentTableId && styles.currentTableText
                    ]}>
                      {table.number}
                    </Text>
                    <Text style={[
                      styles.tableOptionStatus,
                      table.id === currentTableId && styles.currentTableText
                    ]}>
                      {table.status === 'available' ? '空席' : 
                       table.status === 'occupied' ? '使用中' : 
                       table.status === 'reserved' ? '予約済み' : '清掃中'}
                    </Text>
                  </View>
                  {table.totalAmount > 0 && (
                    <Text style={[
                      styles.tableOptionAmount,
                      table.id === currentTableId && styles.currentTableText
                    ]}>
                      ¥{table.totalAmount.toLocaleString()}
                    </Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowTableSelector(false)}
            >
              <Text style={styles.closeButtonText}>閉じる</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tableSelector: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  confirmedOrdersSection: {
    backgroundColor: '#FFFFFF',
    margin: 15,
    borderRadius: 12,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginLeft: 8,
  },
  ordersList: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 10,
  },
  confirmedOrderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F8F8F8',
  },
  confirmedItemName: {
    flex: 1,
    fontSize: 16,
    color: '#333333',
  },
  confirmedItemQuantity: {
    fontSize: 14,
    color: '#666666',
    marginHorizontal: 10,
  },
  confirmedItemPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10B981',
  },
  confirmedTotal: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 2,
    borderTopColor: '#10B981',
  },
  confirmedTotalText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#10B981',
    textAlign: 'right',
  },
  addOrderSection: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 15,
    marginBottom: 15,
    borderRadius: 12,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  menuSection: {
    flex: 1,
  },
  categorySection: {
    marginBottom: 20,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#8B4513',
    marginBottom: 10,
  },
  menuItem: {
    backgroundColor: '#F5E6D3',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuImage: {
    width: 50,
    height: 50,
    borderRadius: 6,
  },
  menuInfo: {
    flex: 1,
    marginLeft: 12,
  },
  menuName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333333',
  },
  menuCategory: {
    fontSize: 12,
    color: '#666666',
    marginTop: 2,
  },
  menuPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#8B4513',
    marginTop: 2,
  },
  addButton: {
    backgroundColor: '#8B4513',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pendingOrdersSection: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 15,
    maxHeight: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  pendingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  pendingTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#F59E0B',
    marginLeft: 6,
    flex: 1,
  },
  pendingTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#8B4513',
  },
  pendingItems: {
    maxHeight: 80,
    marginBottom: 15,
  },
  pendingItem: {
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    padding: 10,
    marginRight: 10,
    minWidth: 120,
  },
  pendingItemName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 5,
  },
  pendingItemControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingItemButton: {
    backgroundColor: '#FFFFFF',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pendingItemQuantity: {
    marginHorizontal: 8,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333333',
  },
  confirmButton: {
    backgroundColor: '#8B4513',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
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
    padding: 20,
    width: '90%',
    maxWidth: 400,
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#8B4513',
    marginBottom: 15,
    textAlign: 'center',
  },
  tableList: {
    maxHeight: 300,
  },
  tableOption: {
    backgroundColor: '#F5E6D3',
    borderRadius: 8,
    padding: 15,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  currentTableOption: {
    backgroundColor: '#8B4513',
  },
  tableOptionInfo: {
    flex: 1,
  },
  tableOptionName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
  },
  tableOptionStatus: {
    fontSize: 12,
    color: '#666666',
    marginTop: 2,
  },
  currentTableText: {
    color: '#FFFFFF',
  },
  tableOptionAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#8B4513',
  },
  closeButton: {
    backgroundColor: '#8B4513',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 15,
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});