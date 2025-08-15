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
import { Plus, Minus, CreditCard, ArrowLeft, ChevronDown } from 'lucide-react-native';
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
  const [cart, setCart] = useState<CartItem[]>([]);
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

  // テーブルの既存注文を読み込み
  useEffect(() => {
    if (currentTableId && (global as any).getTableOrders) {
      const existingOrders = (global as any).getTableOrders(currentTableId);
      if (existingOrders) {
        setCart(existingOrders);
      }
    }
    
    // 利用可能なテーブル一覧を取得
    if ((global as any).getAllTables) {
      const tables = (global as any).getAllTables();
      setAvailableTables(tables);
    }
  }, [currentTableId]);

  // カートが変更されるたびにテーブルの注文を更新
  useEffect(() => {
    if (currentTableId && (global as any).updateTableOrder) {
      const totalAmount = getTotalPrice();
      (global as any).updateTableOrder(currentTableId, cart, totalAmount);
    }
  }, [cart, currentTableId]);

  const addToCart = (item: MenuItem) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(cartItem => cartItem.id === item.id);
      if (existingItem) {
        return prevCart.map(cartItem =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      } else {
        return [...prevCart, { ...item, quantity: 1 }];
      }
    });
  };

  const removeFromCart = (id: string) => {
    setCart(prevCart => {
      return prevCart.reduce((acc, item) => {
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

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const processPayment = () => {
    console.log('processPayment called');
    console.log('Cart:', cart);
    console.log('Current table ID:', currentTableId);
    
    if (cart.length === 0) {
      Alert.alert('エラー', 'カートが空です');
      return;
    }
    
    console.log('Showing payment confirmation');
    Alert.alert(
      '支払い確認',
      `テーブル: ${tableNumber}\n\n注文内容:\n${cart.map(item => `・${item.name} × ${item.quantity} = ¥${(item.price * item.quantity).toLocaleString()}`).join('\n')}\n\n合計金額: ¥${getTotalPrice().toLocaleString()}\n\n会計を完了しますか？`,
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '支払い完了',
          onPress: async () => {
            console.log('Payment completion started');
            
            try {
              // 注文履歴データを準備
              const orderData = {
                id: Date.now().toString(),
                tableNumber: tableNumber as string,
                items: cart.map(item => ({
                  name: item.name,
                  quantity: item.quantity,
                  price: item.price
                })),
                total: getTotalPrice(),
                timestamp: new Date(),
              };
              
              // データベースに注文履歴を保存
              if (database && isConnected) {
                console.log('💾 データベースに注文履歴を保存中...');
                await database.createOrderHistory({
                  table_number: tableNumber as string,
                  items: orderData.items,
                  total_amount: getTotalPrice(),
                });
                console.log('✅ 注文履歴保存完了');
                
                // データベースからテーブルを削除
                console.log('🗑️ データベースからテーブル削除中...');
                await database.deleteTable(currentTableId);
                console.log('✅ テーブル削除完了');
              } else {
                console.log('⚠️ データベース未接続 - ローカル処理のみ');
              }
              
              // グローバル関数でローカル状態も更新
              if ((global as any).completePayment) {
                console.log('🔄 ローカル状態更新中...');
                await (global as any).completePayment(currentTableId, orderData);
                console.log('✅ ローカル状態更新完了');
              }
              
              console.log('Showing completion alert');
              Alert.alert(
                '支払い完了',
                `🎉 テーブル ${tableNumber}の支払いが完了しました！\n\n💰 合計金額: ¥${getTotalPrice().toLocaleString()}\n📝 注文履歴に保存されました\n🗑️ テーブルが削除されました\n\n接続状態: ${isConnected ? '🟢 データベース連携' : '🔴 ローカルのみ'}`,
                [
                  {
                    text: 'OK',
                    onPress: () => {
                      console.log('Navigating back');
                      router.back();
                    },
                  },
                ]
              );
            } catch (error) {
              console.error('支払い処理エラー:', error);
              Alert.alert(
                'エラー', 
                `❌ 支払い処理中にエラーが発生しました:\n\n${error instanceof Error ? error.message : '不明なエラー'}\n\n接続状態: ${isConnected ? '🟢 データベース連携' : '🔴 ローカルのみ'}\n\nデバッグ情報をコンソールで確認してください。`
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
            テーブル {tableNumber} - {cart.length > 0 ? '追加注文' : '注文'}
          </Text>
          <ChevronDown size={20} color="#FFFFFF" />
        </TouchableOpacity>
        {cart.length > 0 && (
          <TouchableOpacity
            style={styles.paymentHeaderButton}
            onPress={processPayment}
          >
            <CreditCard size={20} color="#FFFFFF" />
          </TouchableOpacity>
        )}
        {cart.length === 0 && <View style={styles.placeholder} />}
      </View>

      <ScrollView style={styles.menuSection}>
        {categories.map(category => (
          <View key={category} style={styles.categorySection}>
            <Text style={styles.categoryTitle}>{category}</Text>
            {currentMenuItems
              .filter(item => item.category === category)
              .map(item => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.menuItem}
                  onPress={() => addToCart(item)}
                >
                  <Image source={{ uri: item.image }} style={styles.menuImage} />
                  <View style={styles.menuInfo}>
                    <Text style={styles.menuName}>{item.name}</Text>
                    <Text style={styles.menuCategory}>{item.category}</Text>
                    <Text style={styles.menuPrice}>¥{item.price}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => addToCart(item)}
                  >
                    <Plus size={24} color="#FFFFFF" />
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
          </View>
        ))}
      </ScrollView>

      <View style={styles.cartSection}>
        <Text style={styles.sectionTitle}>注文内容</Text>
        {cart.length === 0 ? (
          <Text style={styles.emptyCart}>カートが空です</Text>
        ) : (
          <>
            <ScrollView style={styles.cartItems} showsVerticalScrollIndicator={false}>
              {cart.map(item => (
                <View key={item.id} style={styles.cartItem}>
                  <Text style={styles.cartItemName}>{item.name}</Text>
                  <View style={styles.quantityControls}>
                    <TouchableOpacity
                      style={styles.quantityButton}
                      onPress={() => removeFromCart(item.id)}
                    >
                      <Minus size={16} color="#8B4513" />
                    </TouchableOpacity>
                    <Text style={styles.quantity}>{item.quantity}</Text>
                    <TouchableOpacity
                      style={styles.quantityButton}
                      onPress={() => addToCart(item)}
                    >
                      <Plus size={16} color="#8B4513" />
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.cartItemPrice}>
                    ¥{item.price * item.quantity}
                  </Text>
                </View>
              ))}
            </ScrollView>
            <View style={styles.totalSection}>
              <Text style={styles.totalText}>合計: ¥{getTotalPrice()}</Text>
              <TouchableOpacity
                style={styles.paymentButton}
                onPress={processPayment}
              >
                <CreditCard size={24} color="#FFFFFF" />
                <Text style={styles.paymentButtonText}>支払い</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>

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
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
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
  placeholder: {
    width: 40,
  },
  paymentHeaderButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuSection: {
    flex: 1,
    padding: 15,
  },
  categorySection: {
    marginBottom: 25,
  },
  categoryTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#8B4513',
    marginBottom: 15,
  },
  menuItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  menuImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  menuInfo: {
    flex: 1,
    marginLeft: 15,
  },
  menuName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
  },
  menuCategory: {
    fontSize: 12,
    color: '#666666',
    marginTop: 2,
  },
  menuPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#8B4513',
    marginTop: 4,
  },
  addButton: {
    backgroundColor: '#8B4513',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartSection: {
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: 350,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#8B4513',
    marginBottom: 15,
  },
  emptyCart: {
    textAlign: 'center',
    color: '#666666',
    fontSize: 16,
    padding: 20,
  },
  cartItems: {
    maxHeight: 200,
  },
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  cartItemName: {
    flex: 1,
    fontSize: 16,
    color: '#333333',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 10,
  },
  quantityButton: {
    backgroundColor: '#F5E6D3',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantity: {
    marginHorizontal: 15,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
  },
  cartItemPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#8B4513',
  },
  totalSection: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 2,
    borderTopColor: '#8B4513',
  },
  totalText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#8B4513',
    textAlign: 'center',
    marginBottom: 15,
  },
  paymentButton: {
    backgroundColor: '#8B4513',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 10,
  },
  paymentButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
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