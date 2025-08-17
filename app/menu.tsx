import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
  TextInput,
} from 'react-native';
import { Coffee, ArrowLeft, ShoppingCart, Plus } from 'lucide-react-native';
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
    id: 'teishoku-1',
    name: '本日の日替わり定食',
    price: 980,
    image: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=300',
    category: '定食',
    description: '季節の食材を使った栄養バランスの良い定食',
  },
  {
    id: 'teishoku-2',
    name: '鶏の唐揚げ定食',
    price: 850,
    image: 'https://images.pexels.com/photos/2338407/pexels-photo-2338407.jpeg?auto=compress&cs=tinysrgb&w=300',
    category: '定食',
    description: 'ジューシーな鶏の唐揚げとご飯、味噌汁、小鉢のセット',
  },
  {
    id: 'teishoku-3',
    name: '焼き魚定食',
    price: 920,
    image: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=300',
    category: '定食',
    description: '新鮮な魚の塩焼きとご飯、味噌汁、小鉢のセット',
  },
  {
    id: 'teishoku-4',
    name: '豚の生姜焼き定食',
    price: 890,
    image: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=300',
    category: '定食',
    description: '甘辛い生姜焼きとご飯、味噌汁、小鉢のセット',
  },
  {
    id: 'teishoku-5',
    name: 'ハンバーグ定食',
    price: 950,
    image: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=300',
    category: '定食',
    description: 'ジューシーなハンバーグとご飯、味噌汁、小鉢のセット',
  },
  {
    id: 'teishoku-6',
    name: '天ぷら定食',
    price: 1080,
    image: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=300',
    category: '定食',
    description: 'サクサクの天ぷらとご飯、味噌汁、小鉢のセット',
  },
  {
    id: 'teishoku-7',
    name: 'カツ定食',
    price: 980,
    image: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=300',
    category: '定食',
    description: 'サクサクのとんかつとご飯、味噌汁、小鉢のセット',
  },
  {
    id: 'drink-1',
    name: 'エスプレッソ',
    price: 300,
    image: 'https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=300',
    category: 'ドリンク',
    description: '濃厚なイタリアンエスプレッソ',
  },
  {
    id: 'drink-2',
    name: 'カプチーノ',
    price: 420,
    image: 'https://images.pexels.com/photos/312418/pexels-photo-312418.jpeg?auto=compress&cs=tinysrgb&w=300',
    category: 'ドリンク',
    description: 'ふわふわミルクフォームのカプチーノ',
  },
  {
    id: 'drink-3',
    name: 'ラテ',
    price: 450,
    image: 'https://images.pexels.com/photos/324028/pexels-photo-324028.jpeg?auto=compress&cs=tinysrgb&w=300',
    category: 'ドリンク',
    description: 'なめらかなミルクとエスプレッソのハーモニー',
  },
  {
    id: 'drink-4',
    name: '緑茶',
    price: 200,
    image: 'https://images.pexels.com/photos/1638280/pexels-photo-1638280.jpeg?auto=compress&cs=tinysrgb&w=300',
    category: 'ドリンク',
    description: '香り高い緑茶',
  },
  {
    id: 'drink-5',
    name: 'ほうじ茶',
    price: 200,
    image: 'https://images.pexels.com/photos/1638280/pexels-photo-1638280.jpeg?auto=compress&cs=tinysrgb&w=300',
    category: 'ドリンク',
    description: '香ばしいほうじ茶',
  },
  {
    id: 'drink-6',
    name: '抹茶',
    price: 350,
    image: 'https://images.pexels.com/photos/1638280/pexels-photo-1638280.jpeg?auto=compress&cs=tinysrgb&w=300',
    category: 'ドリンク',
    description: '本格的な抹茶',
  },
  {
    id: 'dessert-1',
    name: 'チーズケーキ',
    price: 520,
    image: 'https://images.pexels.com/photos/1126359/pexels-photo-1126359.jpeg?auto=compress&cs=tinysrgb&w=300',
    category: 'デザート',
    description: '濃厚でクリーミーなNYチーズケーキ',
  },
  {
    id: 'dessert-2',
    name: 'わらび餅',
    price: 380,
    image: 'https://images.pexels.com/photos/1126359/pexels-photo-1126359.jpeg?auto=compress&cs=tinysrgb&w=300',
    category: 'デザート',
    description: 'なめらかなわらび餅',
  },
  {
    id: 'dessert-3',
    name: 'みたらし団子',
    price: 320,
    image: 'https://images.pexels.com/photos/6880219/pexels-photo-6880219.jpeg?auto=compress&cs=tinysrgb&w=300',
    category: 'デザート',
    description: '甘辛いみたらし団子',
  },
  {
    id: 'dessert-4',
    name: 'あんみつ',
    price: 450,
    image: 'https://images.pexels.com/photos/1126359/pexels-photo-1126359.jpeg?auto=compress&cs=tinysrgb&w=300',
    category: 'デザート',
    description: '和風あんみつ',
  },
];

export default function MenuScreen() {
  const { database, isConnected } = useDatabase();
  const router = useRouter();
  const { tableId, tableNumber, mode } = useLocalSearchParams();
  const [cart, setCart] = useState<any[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>(initialMenuItems);
  const [categories] = useState(['定食', 'ドリンク', 'デザート']);
  const [dailySpecialId, setDailySpecialId] = useState<string>('teishoku-1'); // 日替わり定食のID
  const [dailySpecialChildId, setDailySpecialChildId] = useState<string>('teishoku-2'); // 日替わり定食の子メニュー（実際の定食）
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [showAddMenuModal, setShowAddMenuModal] = useState(false);
  const [unavailableItems, setUnavailableItems] = useState<Set<string>>(new Set());
  const [newMenuItem, setNewMenuItem] = useState({
    name: '',
    price: '',
    category: '定食',
    description: '',
    image: 'https://images.pexels.com/photos/312418/pexels-photo-312418.jpeg?auto=compress&cs=tinysrgb&w=300',
  });

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

  const addMenuItem = async () => {
    if (!newMenuItem.name || !newMenuItem.price) {
      Alert.alert('エラー', '商品名と価格を入力してください');
      return;
    }

    try {
      const item: MenuItem = {
        id: `menu-${Date.now()}`,
        name: newMenuItem.name,
        price: parseInt(newMenuItem.price),
        category: newMenuItem.category,
        description: newMenuItem.description,
        image: newMenuItem.image,
      };

      if (database && isConnected) {
        await database.createMenuItem({
          name: item.name,
          price: item.price,
          category: item.category,
          description: item.description,
          image_url: item.image,
        });
        await loadMenuItems(); // データベースから再読み込み
      } else {
        setMenuItems(prev => [...prev, item]);
      }

      setNewMenuItem({
        name: '',
        price: '',
        category: categories[0],
        description: '',
        image: 'https://images.pexels.com/photos/312418/pexels-photo-312418.jpeg?auto=compress&cs=tinysrgb&w=300',
      });
      setShowAddMenuModal(false);
      Alert.alert('成功', '新しいメニュー項目が追加されました');
    } catch (error) {
      console.error('メニュー追加エラー:', error);
      Alert.alert('エラー', 'メニューの追加に失敗しました');
    }
  };

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
    // 提供不可のメニューは注文できない
    if (unavailableItems.has(item.id)) {
      Alert.alert('提供不可', 'このメニューは現在提供しておりません');
      return;
    }

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
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>メニュー管理</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.addMenuButton}
              onPress={() => setShowAddMenuModal(true)}
            >
              <Plus size={20} color="#FFFFFF" />
            </TouchableOpacity>
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

        {/* メニュー追加モーダル */}
        <Modal
          visible={showAddMenuModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowAddMenuModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>新しいメニュー項目を追加</Text>
              
              <TextInput
                style={styles.input}
                placeholder="商品名"
                value={newMenuItem.name}
                onChangeText={(text) => setNewMenuItem({...newMenuItem, name: text})}
              />
              
              <TextInput
                style={styles.input}
                placeholder="価格"
                keyboardType="numeric"
                value={newMenuItem.price}
                onChangeText={(text) => setNewMenuItem({...newMenuItem, price: text})}
              />
              
              <View style={styles.pickerContainer}>
                <Text style={styles.pickerLabel}>カテゴリ:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryPicker}>
                  {categories.map((category) => (
                    <TouchableOpacity
                      key={category}
                      style={[
                        styles.categoryOption,
                        newMenuItem.category === category && styles.categoryOptionSelected
                      ]}
                      onPress={() => setNewMenuItem({...newMenuItem, category})}
                    >
                      <Text style={[
                        styles.categoryOptionText,
                        newMenuItem.category === category && styles.categoryOptionTextSelected
                      ]}>
                        {category}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              
              <TextInput
                style={styles.input}
                placeholder="説明"
                value={newMenuItem.description}
                onChangeText={(text) => setNewMenuItem({...newMenuItem, description: text})}
              />
              
              <TextInput
                style={styles.input}
                placeholder="画像URL"
                value={newMenuItem.image}
                onChangeText={(text) => setNewMenuItem({...newMenuItem, image: text})}
              />
              
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setShowAddMenuModal(false)}
                >
                  <Text style={styles.cancelButtonText}>キャンセル</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={addMenuItem}
                >
                  <Text style={styles.saveButtonText}>追加</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    position: 'relative',
  },
  addMenuButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
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
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#8B4513',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
  },
  pickerContainer: {
    marginBottom: 15,
  },
  pickerLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  categoryPicker: {
    flexDirection: 'row',
  },
  categoryOption: {
    backgroundColor: '#F5E6D3',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 15,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  categoryOptionSelected: {
    backgroundColor: '#8B4513',
    borderColor: '#8B4513',
  },
  categoryOptionText: {
    color: '#8B4513',
    fontWeight: '600',
    fontSize: 14,
  },
  categoryOptionTextSelected: {
    color: '#FFFFFF',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  cancelButton: {
    backgroundColor: '#E5E5E5',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 0.45,
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
    flex: 0.45,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  menuActions: {
    flexDirection: 'column',
    gap: 8,
    alignItems: 'flex-end',
  },
  editMenuButton: {
    backgroundColor: '#8B4513',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    minWidth: 60,
  },
  editMenuButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  deleteMenuButton: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    minWidth: 60,
  },
  deleteMenuButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  dailySpecialButton: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    minWidth: 80,
  },
  dailySpecialButtonActive: {
    backgroundColor: '#10B981',
  },
  dailySpecialButtonText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  dailySpecialButtonTextActive: {
    color: '#FFFFFF',
  },
  childSpecialButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    minWidth: 80,
  },
  childSpecialButtonActive: {
    backgroundColor: '#059669',
  },
  childSpecialButtonText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  childSpecialButtonTextActive: {
    color: '#FFFFFF',
  },
  dailySpecialBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  dailySpecialText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  availabilityButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    minWidth: 60,
    marginBottom: 4,
  },
  availableButton: {
    backgroundColor: '#10B981',
  },
  unavailableButton: {
    backgroundColor: '#EF4444',
  },
  availabilityButtonText: {
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  availableButtonText: {
    color: '#FFFFFF',
  },
  unavailableButtonText: {
    color: '#FFFFFF',
  },
  unavailableText: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: 'bold',
    marginTop: 2,
  },
  menuItemUnavailable: {
    opacity: 0.6,
    backgroundColor: '#F5F5F5',
  },
  addButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  addButtonTextDisabled: {
    color: '#666666',
  },
});