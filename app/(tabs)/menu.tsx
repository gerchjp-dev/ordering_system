import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Coffee, ArrowLeft, ShoppingCart } from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useDatabase } from '@/hooks/useDatabase';
import { Alert } from 'react-native';
import { MenuItem as DBMenuItem } from '@/lib/database';

interface MenuItem {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  description: string;
}

const initialMenuItems: MenuItem[] = [
  {
    id: 'mock-menu-1',
    name: 'エスプレッソ',
    price: 300,
    image: 'https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=300',
    category: 'ドリンク',
    description: '濃厚なイタリアンエスプレッソ',
  },
  {
    id: 'mock-menu-2',
    name: 'カプチーノ',
    price: 420,
    image: 'https://images.pexels.com/photos/312418/pexels-photo-312418.jpeg?auto=compress&cs=tinysrgb&w=300',
    category: 'ドリンク',
    description: 'ふわふわミルクフォームのカプチーノ',
  },
  {
    id: 'mock-menu-3',
    name: 'ラテ',
    price: 450,
    image: 'https://images.pexels.com/photos/324028/pexels-photo-324028.jpeg?auto=compress&cs=tinysrgb&w=300',
    category: 'ドリンク',
    description: 'なめらかなミルクとエスプレッソのハーモニー',
  },
  {
    id: 'mock-menu-4',
    name: 'クロワッサン',
    price: 280,
    image: 'https://images.pexels.com/photos/1775043/pexels-photo-1775043.jpeg?auto=compress&cs=tinysrgb&w=300',
    category: 'フード',
    description: 'バターたっぷりのサクサククロワッサン',
  },
  {
    id: 'mock-menu-5',
    name: 'チーズケーキ',
    price: 520,
    image: 'https://images.pexels.com/photos/1126359/pexels-photo-1126359.jpeg?auto=compress&cs=tinysrgb&w=300',
    category: 'デザート',
    description: '濃厚でクリーミーなNYチーズケーキ',
  },
];

export default function MenuScreen() {
  const { database, isConnected } = useDatabase();
  const router = useRouter();
  const { tableId, tableNumber, mode } = useLocalSearchParams();
  const [cart, setCart] = useState<any[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>(initialMenuItems);
  const [categories] = useState(['定食', 'ドリンク', 'デザート']);

  // データベースからメニューを読み込み
  const loadMenuItems = async () => {
    if (!database) return;
    
    try {
      const dbMenuItems = await database.getMenuItems();
      const formattedItems: MenuItem[] = dbMenuItems.map(item => ({
        id: item.id.toString(),
        name: item.name,
        price: item.price,
        image: item.image_url || '',
        category: item.category,
        description: item.description || '',
      }));
      setMenuItems(formattedItems);
    } catch (error) {
      console.error('メニュー読み込みエラー:', error);
    }
  };

  React.useEffect(() => {
    if (database) {
      loadMenuItems();
    }
  }, [database]);

  // テーブルの既存注文を読み込み
  React.useEffect(() => {
    if (tableId && (global as any).getTableOrders) {
      const existingOrders = (global as any).getTableOrders(tableId);
      if (existingOrders) {
        setCart(existingOrders);
      }
    }
  }, [tableId]);

  // テーブル状態を使用中に更新（初回注文時のみ）
  React.useEffect(() => {
    if (tableId && mode === 'order' && (global as any).updateTableStatus) {
      (global as any).updateTableStatus(tableId, 'occupied', {
        orderStartTime: new Date(),
        customerCount: 1
      });
    }
  }, [tableId, mode]);

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
      }, [] as any[]);
    });
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const confirmOrder = () => {
    if (cart.length === 0) {
      Alert.alert('エラー', 'カートが空です');
      return;
    }
    
    // 注文を確定
    Alert.alert(
      '注文確定',
      `テーブル ${tableNumber}\n\n注文内容:\n${cart.map(item => `・${item.name} × ${item.quantity} = ¥${(item.price * item.quantity).toLocaleString()}`).join('\n')}\n\n合計金額: ¥${getTotalPrice().toLocaleString()}\n\nこの内容で注文を確定しますか？`,
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '注文確定',
          onPress: async () => {
            try {
              console.log('📝 注文確定処理開始...');
              
              // データベースに注文を保存
              if (database && isConnected) {
                console.log('💾 Supabaseに注文を保存中...');
                for (const item of cart) {
                  await database.createOrder({
                    table_id: tableId as string,
                    menu_item_id: item.id,
                    quantity: item.quantity,
                    unit_price: item.price,
                  });
                }
                
                // テーブル状態を更新
                await database.updateTable(tableId as string, {
                  status: 'occupied',
                  customer_count: 1,
                  order_start_time: new Date().toISOString(),
                  total_amount: getTotalPrice(),
                });
                console.log('✅ Supabase注文保存完了');
              } else {
                console.log('⚠️ データベース未接続 - ローカル処理のみ');
              }
              
              // グローバル関数でローカル状態も更新
              if ((global as any).updateTableOrder) {
                (global as any).updateTableOrder(tableId, cart, getTotalPrice());
              }
              
              if ((global as any).updateTableStatus) {
                (global as any).updateTableStatus(tableId, 'occupied', {
                  orderStartTime: new Date(),
                  customerCount: 1
                });
              }
              
              Alert.alert(
                '注文確定完了',
                `🎉 テーブル ${tableNumber}の注文が確定されました！\n\n📝 ${cart.length}品目の注文\n💰 合計金額: ¥${getTotalPrice().toLocaleString()}\n\n支払いはテーブル管理画面から行えます。`,
                [
                  {
                    text: 'OK',
                    onPress: () => {
                      // カートをクリアしてテーブル管理画面に戻る
                      setCart([]);
                      router.back();
                    },
                  },
                ]
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

  // カートが変更されるたびにテーブルの注文を更新
  React.useEffect(() => {
    if (tableId && (global as any).updateTableOrder) {
      const totalAmount = getTotalPrice();
      (global as any).updateTableOrder(tableId, cart, totalAmount);
    }
  }, [cart, tableId]);

  const proceedToPayment = () => {
    if (cart.length === 0) {
      Alert.alert('エラー', 'カートが空です');
      return;
    }
    
    // 注文を確定
    Alert.alert(
      '注文確定',
      `テーブル ${tableNumber}\n\n注文内容:\n${cart.map(item => `・${item.name} × ${item.quantity} = ¥${(item.price * item.quantity).toLocaleString()}`).join('\n')}\n\n合計金額: ¥${getTotalPrice().toLocaleString()}\n\nこの内容で注文を確定しますか？`,
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '注文確定',
          onPress: async () => {
            try {
              console.log('📝 注文確定処理開始...');
              
              // データベースに注文を保存
              if (database && isConnected) {
                console.log('💾 Supabaseに注文を保存中...');
                for (const item of cart) {
                  await database.createOrder({
                    table_id: tableId as string,
                    menu_item_id: item.id,
                    quantity: item.quantity,
                    unit_price: item.price,
                  });
                }
                
                // テーブル状態を更新
                await database.updateTable(tableId as string, {
                  status: 'occupied',
                  customer_count: 1,
                  order_start_time: new Date().toISOString(),
                  total_amount: getTotalPrice(),
                });
                console.log('✅ Supabase注文保存完了');
              } else {
                console.log('⚠️ データベース未接続 - ローカル処理のみ');
              }
              
              // グローバル関数でローカル状態も更新
              if ((global as any).updateTableOrder) {
                (global as any).updateTableOrder(tableId, cart, getTotalPrice());
              }
              
              if ((global as any).updateTableStatus) {
                (global as any).updateTableStatus(tableId, 'occupied', {
                  orderStartTime: new Date(),
                  customerCount: 1
                });
              }
              
              Alert.alert(
                '注文確定完了',
                `🎉 テーブル ${tableNumber}の注文が確定されました！\n\n📝 ${cart.length}品目の注文\n💰 合計金額: ¥${getTotalPrice().toLocaleString()}\n\n支払いはテーブル管理画面から行えます。`,
                [
                  {
                    text: 'OK',
                    onPress: () => {
                      // カートをクリアしてテーブル管理画面に戻る
                      setCart([]);
                      router.back();
                    },
                  },
                ]
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

  const groupedItems = categories.reduce((acc, category) => {
    acc[category] = menuItems.filter(item => item.category === category);
    return acc;
  }, {} as Record<string, MenuItem[]>);

  // メニュー選択モードでない場合は通常のメニュー管理画面
  if (!tableId || !tableNumber) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>メニュー管理</Text>
          <View style={styles.connectionStatus}>
            <Coffee size={24} color="#FFFFFF" />
            {isConnected && <View style={styles.connectedDot} />}
          </View>
        </View>

        <ScrollView style={styles.content}>
          {categories.map(category => (
            <View key={category} style={styles.categorySection}>
              <Text style={styles.categoryTitle}>{category}</Text>
              {groupedItems[category].map(item => (
                <View key={item.id} style={styles.menuItem}>
                  <Image source={{ uri: item.image }} style={styles.menuImage} />
                  <View style={styles.menuInfo}>
                    <Text style={styles.menuName}>{item.name}</Text>
                    <Text style={styles.menuDescription}>{item.description}</Text>
                    <Text style={styles.menuPrice}>¥{item.price}</Text>
                  </View>
                </View>
              ))}
            </View>
          ))}
        </ScrollView>
      </View>
    );
  }

  // メニュー選択モード
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>
            テーブル {tableNumber}
          </Text>
          <Text style={styles.headerSubtitle}>
            {mode === 'order' ? '注文' : '追加注文'}
          </Text>
        </View>
        <View style={styles.connectionStatus}>
          <TouchableOpacity
            style={styles.cartButton}
            onPress={proceedToPayment}
          >
            <ShoppingCart size={20} color="#FFFFFF" />
            {cart.length > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{cart.length}</Text>
              </View>
            )}
          </TouchableOpacity>
          {isConnected && <View style={styles.connectedDot} />}
        </View>
      </View>

      <ScrollView style={styles.menuContent}>
        {categories.map(category => (
          <View key={category} style={styles.categorySection}>
            <Text style={styles.categoryTitle}>{category}</Text>
            {groupedItems[category].map(item => (
              <TouchableOpacity
                key={item.id}
                style={styles.menuItem}
                onPress={() => addToCart(item)}
              >
                <Image source={{ uri: item.image }} style={styles.menuImage} />
                <View style={styles.menuInfo}>
                  <Text style={styles.menuName}>{item.name}</Text>
                  <Text style={styles.menuDescription}>{item.description}</Text>
                  <Text style={styles.menuPrice}>¥{item.price}</Text>
                </View>
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={() => addToCart(item)}
                >
                  <Text style={styles.addButtonText}>+</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </ScrollView>

      {/* カート表示エリア */}
      {cart.length > 0 && (
        <View style={styles.cartPreview}>
          <View style={styles.cartHeader}>
            <Text style={styles.cartTitle}>注文内容 ({cart.length}品目)</Text>
            <Text style={styles.cartTotal}>¥{getTotalPrice().toLocaleString()}</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.cartItems}>
            {cart.map(item => (
              <View key={item.id} style={styles.cartItem}>
                <Text style={styles.cartItemName}>{item.name}</Text>
                <View style={styles.cartItemControls}>
                  <TouchableOpacity
                    style={styles.cartItemButton}
                    onPress={() => removeFromCart(item.id)}
                  >
                    <Text style={styles.cartItemButtonText}>-</Text>
                  </TouchableOpacity>
                  <Text style={styles.cartItemQuantity}>{item.quantity}</Text>
                  <TouchableOpacity
                    style={styles.cartItemButton}
                    onPress={() => addToCart(item)}
                  >
                    <Text style={styles.cartItemButtonText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </ScrollView>
          <TouchableOpacity
            style={styles.proceedButton}
            onPress={confirmOrder}
          >
            <Text style={styles.proceedButtonText}>注文確定</Text>
          </TouchableOpacity>
        </View>
      )}
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
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  connectionStatus: {
    alignItems: 'center',
    position: 'relative',
  },
  cartButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  cartBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  connectedDot: {
    position: 'absolute',
    bottom: -5,
    right: -5,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  content: {
    flex: 1,
    padding: 15,
  },
  menuContent: {
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
  addButton: {
    backgroundColor: '#8B4513',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
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
  menuDescription: {
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
  cartPreview: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 15,
    maxHeight: 250,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  cartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#8B4513',
  },
  cartTotal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#8B4513',
  },
  cartItems: {
    maxHeight: 120,
    marginBottom: 15,
  },
  cartItem: {
    backgroundColor: '#F5E6D3',
    borderRadius: 8,
    padding: 10,
    marginRight: 10,
    minWidth: 150,
  },
  cartItemName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 5,
  },
  cartItemControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartItemButton: {
    backgroundColor: '#8B4513',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartItemButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cartItemQuantity: {
    marginHorizontal: 10,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
  },
  proceedButton: {
    backgroundColor: '#8B4513',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  proceedButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});