import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { User, Bell, Shield, CircleHelp as HelpCircle, LogOut, Store, Printer, Wifi, CreditCard, Coffee, Plus, CreditCard as Edit, Trash2, Save, X, ArrowUp, ArrowDown, Database, Key, CircleCheck as CheckCircle, CircleAlert as AlertCircle } from 'lucide-react-native';
import { initializeSupabase, clearSupabaseConfig, loadSupabaseConfig, isSupabaseConfigured } from '@/lib/supabase';
import { useDatabase } from '@/hooks/useDatabase';

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
    id: 'mock-menu-5',
    name: 'チーズケーキ',
    price: 520,
    image: 'https://images.pexels.com/photos/1126359/pexels-photo-1126359.jpeg?auto=compress&cs=tinysrgb&w=300',
    category: 'デザート',
    description: '濃厚でクリーミーなNYチーズケーキ',
  },
  {
    id: 'mock-menu-6',
    name: '本日の日替わり定食',
    price: 980,
    image: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=300',
    category: '定食',
    description: '季節の食材を使った栄養バランスの良い定食',
  },
  {
    id: 'mock-menu-7',
    name: 'アメリカーノ',
    price: 350,
    image: 'https://images.pexels.com/photos/1251175/pexels-photo-1251175.jpeg?auto=compress&cs=tinysrgb&w=300',
    category: 'ドリンク',
    description: 'すっきりとした味わいのアメリカーノ',
  },
  {
    id: 'mock-menu-9',
    name: 'ティラミス',
    price: 580,
    image: 'https://images.pexels.com/photos/6880219/pexels-photo-6880219.jpeg?auto=compress&cs=tinysrgb&w=300',
    category: 'デザート',
    description: 'イタリア伝統のティラミス',
  },
];

export default function SettingsScreen() {
  const [notifications, setNotifications] = useState(true);
  const [receiptPrinting, setReceiptPrinting] = useState(true);
  const [soundEffects, setSoundEffects] = useState(true);
  const [supabaseConfigured, setSupabaseConfigured] = useState(false);
  const [showSupabaseModal, setShowSupabaseModal] = useState(false);
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseAnonKey, setSupabaseAnonKey] = useState('');
  const [isMigrating, setIsMigrating] = useState(false);
  const [showMenuManagement, setShowMenuManagement] = useState(false);
  const [showCategoryManagement, setShowCategoryManagement] = useState(false);
  const [menuItems, setMenuItems] = useState<MenuItem[]>(initialMenuItems);
  const [categories, setCategories] = useState(['定食', 'ドリンク', 'デザート']);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategoryIndex, setEditingCategoryIndex] = useState<number | null>(null);
  const [newItem, setNewItem] = useState({
    name: '',
    price: '',
    category: '定食',
    description: '',
    image: 'https://images.pexels.com/photos/312418/pexels-photo-312418.jpeg?auto=compress&cs=tinysrgb&w=300',
  });

  // データベースフックを追加
  const { database, migrateMockData } = useDatabase();
  // Supabase設定状態をチェック
  React.useEffect(() => {
    checkSupabaseConfig();
  }, []);

  const checkSupabaseConfig = async () => {
    const configured = await isSupabaseConfigured();
    setSupabaseConfigured(configured);
    if (configured) {
      await loadSupabaseConfig();
    }
  };

  const handleSupabaseSetup = async () => {
    if (!supabaseUrl.trim() || !supabaseAnonKey.trim()) {
      Alert.alert('エラー', 'URLとAPIキーの両方を入力してください');
      return;
    }

    try {
      setIsMigrating(true);
      await initializeSupabase(supabaseUrl.trim(), supabaseAnonKey.trim());
      setSupabaseConfigured(true);
      setShowSupabaseModal(false);
      setSupabaseUrl('');
      setSupabaseAnonKey('');
      
      // モックデータを移行
      Alert.alert(
        'データ移行',
        'Supabaseの設定が完了しました。現在のモックデータをデータベースに移行しますか？',
        [
          {
            text: 'スキップ',
            onPress: () => {
              setIsMigrating(false);
              Alert.alert('完了', 'Supabaseの設定が完了しました。');
            }
          },
          {
            text: '移行する',
            onPress: async () => {
              try {
                // グローバルからモックデータを取得
                const mockTables = (global as any).getAllTables?.() || [];
                const mockOrderHistory = (global as any).getOrderHistory?.() || [];
                
                if (migrateMockData) {
                  await migrateMockData(mockTables, initialMenuItems, mockOrderHistory);
                  Alert.alert('成功', 'モックデータがSupabaseに移行されました！');
                } else {
                  Alert.alert('エラー', 'データ移行機能が利用できません');
                }
              } catch (error) {
                console.error('移行エラー:', error);
                Alert.alert('エラー', 'データ移行中にエラーが発生しました');
              } finally {
                setIsMigrating(false);
              }
            }
          }
        ]
      );
    } catch (error) {
      setIsMigrating(false);
      Alert.alert('エラー', 'Supabaseの設定に失敗しました。URLとAPIキーを確認してください。');
    }
  };

  const handleSupabaseReset = () => {
    Alert.alert(
      'Supabase設定をリセット',
      'Supabaseの設定を削除しますか？この操作は元に戻せません。',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除',
          style: 'destructive',
          onPress: async () => {
            await clearSupabaseConfig();
            setSupabaseConfigured(false);
            Alert.alert('完了', 'Supabaseの設定が削除されました');
          },
        },
      ]
    );
  };

  const showComingSoon = () => {
    Alert.alert('近日公開', 'この機能は近日公開予定です');
  };

  const confirmLogout = () => {
    Alert.alert(
      'ログアウト',
      'ログアウトしますか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        { text: 'ログアウト', style: 'destructive', onPress: showComingSoon },
      ]
    );
  };

  const addMenuItem = () => {
    if (!newItem.name || !newItem.price) {
      Alert.alert('エラー', '商品名と価格を入力してください');
      return;
    }

    addMenuItemToDB({
      name: newItem.name,
      price: parseInt(newItem.price),
      category: newItem.category,
      description: newItem.description,
      image_url: newItem.image,
    });
    
    setNewItem({
      name: '',
      price: '',
      category: categories[0],
      description: '',
      image: 'https://images.pexels.com/photos/312418/pexels-photo-312418.jpeg?auto=compress&cs=tinysrgb&w=300',
    });
    setIsAddingItem(false);
    Alert.alert('成功', '新しいメニュー項目が追加されました');
  };

  const addMenuItemToDB = async (itemData: any) => {
    // データベース操作は実際のSupabase接続時に実装
    const item: MenuItem = {
      id: `mock-menu-${Date.now()}`,
      name: itemData.name,
      price: itemData.price,
      category: itemData.category,
      description: itemData.description,
      image: itemData.image_url,
    };
    setMenuItems([...menuItems, item]);
  };

  const updateMenuItem = () => {
    if (!editingItem) return;

    setMenuItems(prevItems =>
      prevItems.map(item =>
        item.id === editingItem.id ? editingItem : item
      )
    );
    setEditingItem(null);
    Alert.alert('成功', 'メニュー項目が更新されました');
  };

  const deleteMenuItem = (id: string) => {
    Alert.alert(
      '削除確認',
      'このメニュー項目を削除しますか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除',
          style: 'destructive',
          onPress: async () => {
            // データベース操作は実際のSupabase接続時に実装
            setMenuItems(menuItems.filter(item => item.id !== id));
          },
        },
      ]
    );
  };

  const addCategory = () => {
    if (!newCategoryName.trim()) {
      Alert.alert('エラー', 'カテゴリ名を入力してください');
      return;
    }

    if (categories.includes(newCategoryName.trim())) {
      Alert.alert('エラー', 'このカテゴリは既に存在します');
      return;
    }

    setCategories([...categories, newCategoryName.trim()]);
    setNewCategoryName('');
    Alert.alert('成功', '新しいカテゴリが追加されました');
  };

  const updateCategory = (index: number, newName: string) => {
    if (!newName.trim()) {
      Alert.alert('エラー', 'カテゴリ名を入力してください');
      return;
    }

    const oldCategoryName = categories[index];
    const updatedCategories = [...categories];
    updatedCategories[index] = newName.trim();
    
    // メニュー項目のカテゴリも更新
    setMenuItems(prevItems =>
      prevItems.map(item =>
        item.category === oldCategoryName
          ? { ...item, category: newName.trim() }
          : item
      )
    );
    
    setCategories(updatedCategories);
    setEditingCategoryIndex(null);
    Alert.alert('成功', 'カテゴリが更新されました');
  };

  const deleteCategory = (index: number) => {
    const categoryToDelete = categories[index];
    const itemsInCategory = menuItems.filter(item => item.category === categoryToDelete);
    
    if (itemsInCategory.length > 0) {
      Alert.alert(
        '削除できません',
        `このカテゴリには${itemsInCategory.length}個のメニュー項目があります。先にメニュー項目を削除するか、他のカテゴリに移動してください。`
      );
      return;
    }

    Alert.alert(
      'カテゴリ削除',
      `「${categoryToDelete}」カテゴリを削除しますか？`,
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除',
          style: 'destructive',
          onPress: () => {
            setCategories(categories.filter((_, i) => i !== index));
          },
        },
      ]
    );
  };

  const moveCategoryUp = (index: number) => {
    if (index === 0) return;
    const newCategories = [...categories];
    [newCategories[index - 1], newCategories[index]] = [newCategories[index], newCategories[index - 1]];
    setCategories(newCategories);
  };

  const moveCategoryDown = (index: number) => {
    if (index === categories.length - 1) return;
    const newCategories = [...categories];
    [newCategories[index], newCategories[index + 1]] = [newCategories[index + 1], newCategories[index]];
    setCategories(newCategories);
  };

  const groupedItems = categories.reduce((acc, category) => {
    acc[category] = menuItems.filter(item => item.category === category);
    return acc;
  }, {} as Record<string, MenuItem[]>);

  const SettingItem = ({ 
    icon, 
    title, 
    subtitle, 
    onPress, 
    showSwitch = false, 
    switchValue = false, 
    onSwitchChange 
  }: {
    icon: React.ReactNode;
    title: string;
    subtitle?: string;
    onPress?: () => void;
    showSwitch?: boolean;
    switchValue?: boolean;
    onSwitchChange?: (value: boolean) => void;
  }) => (
    <TouchableOpacity style={styles.settingItem} onPress={onPress}>
      <View style={styles.settingLeft}>
        <View style={styles.iconContainer}>
          {icon}
        </View>
        <View style={styles.settingText}>
          <Text style={styles.settingTitle}>{title}</Text>
          {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      {showSwitch && (
        <Switch
          value={switchValue}
          onValueChange={onSwitchChange}
          trackColor={{ false: '#E5E5E5', true: '#8B4513' }}
          thumbColor={switchValue ? '#FFFFFF' : '#FFFFFF'}
        />
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>設定</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>データベース設定</Text>
          <SettingItem
            icon={supabaseConfigured ? 
              <CheckCircle size={24} color="#10B981" /> : 
              <AlertCircle size={24} color="#EF4444" />
            }
            title="Supabase接続"
            subtitle={supabaseConfigured ? 
              "データベースに接続済み" : 
              "データベースに未接続 - 設定が必要です"
            }
            onPress={() => setShowSupabaseModal(true)}
          />
          {supabaseConfigured && (
            <SettingItem
              icon={<Trash2 size={24} color="#EF4444" />}
              title="データベース設定をリセット"
              subtitle="Supabase接続設定を削除"
              onPress={handleSupabaseReset}
            />
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>店舗設定</Text>
          <SettingItem
            icon={<Store size={24} color="#8B4513" />}
            title="店舗情報"
            subtitle="店舗名、住所、営業時間"
            onPress={showComingSoon}
          />
          <SettingItem
            icon={<Coffee size={24} color="#8B4513" />}
            title="メニュー管理"
            subtitle="メニュー項目の追加・編集・削除"
            onPress={() => setShowMenuManagement(true)}
          />
          <SettingItem
            icon={<Coffee size={24} color="#8B4513" />}
            title="カテゴリ管理"
            subtitle="メニューカテゴリの管理"
            onPress={() => setShowCategoryManagement(true)}
          />
          <SettingItem
            icon={<CreditCard size={24} color="#8B4513" />}
            title="支払い設定"
            subtitle="決済方法、税率設定"
            onPress={showComingSoon}
          />
          <SettingItem
            icon={<Printer size={24} color="#8B4513" />}
            title="レシート印刷"
            subtitle="注文完了時に自動印刷"
            showSwitch={true}
            switchValue={receiptPrinting}
            onSwitchChange={setReceiptPrinting}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>アプリ設定</Text>
          <SettingItem
            icon={<Bell size={24} color="#8B4513" />}
            title="通知"
            subtitle="新しい注文の通知を受信"
            showSwitch={true}
            switchValue={notifications}
            onSwitchChange={setNotifications}
          />
          <SettingItem
            icon={<Wifi size={24} color="#8B4513" />}
            title="オフラインモード"
            subtitle="インターネット接続なしでも動作"
            onPress={showComingSoon}
          />
          <SettingItem
            icon={<User size={24} color="#8B4513" />}
            title="音響効果"
            subtitle="ボタンタップ音とアラート音"
            showSwitch={true}
            switchValue={soundEffects}
            onSwitchChange={setSoundEffects}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>アカウント</Text>
          <SettingItem
            icon={<User size={24} color="#8B4513" />}
            title="プロフィール"
            subtitle="個人情報とアカウント設定"
            onPress={showComingSoon}
          />
          <SettingItem
            icon={<Shield size={24} color="#8B4513" />}
            title="セキュリティ"
            subtitle="パスワード変更、二段階認証"
            onPress={showComingSoon}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>サポート</Text>
          <SettingItem
            icon={<HelpCircle size={24} color="#8B4513" />}
            title="ヘルプ・サポート"
            subtitle="よくある質問、お問い合わせ"
            onPress={showComingSoon}
          />
        </View>

        <View style={styles.section}>
          <TouchableOpacity style={styles.logoutButton} onPress={confirmLogout}>
            <LogOut size={24} color="#DC2626" />
            <Text style={styles.logoutText}>ログアウト</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.versionInfo}>
          <Text style={styles.versionText}>バージョン 1.0.0</Text>
          <Text style={styles.versionSubtext}>© 2024 Cafe POS System</Text>
        </View>
      </ScrollView>

      {/* メニュー管理モーダル */}
      <Modal
        visible={showMenuManagement}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowMenuManagement(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>メニュー管理</Text>
              <View style={styles.modalHeaderButtons}>
                <TouchableOpacity
                  style={styles.modalHeaderButton}
                  onPress={() => setIsAddingItem(true)}
                >
                  <Plus size={20} color="#8B4513" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalHeaderButton}
                  onPress={() => setShowMenuManagement(false)}
                >
                  <X size={20} color="#8B4513" />
                </TouchableOpacity>
              </View>
            </View>

            {isAddingItem && (
              <View style={styles.addItemForm}>
                <Text style={styles.formTitle}>新しいメニュー項目</Text>
                <TextInput
                  style={styles.input}
                  placeholder="商品名"
                  value={newItem.name}
                  onChangeText={(text) => setNewItem({...newItem, name: text})}
                />
                <TextInput
                  style={styles.input}
                  placeholder="価格"
                  keyboardType="numeric"
                  value={newItem.price}
                  onChangeText={(text) => setNewItem({...newItem, price: text})}
                />
                <View style={styles.pickerContainer}>
                  <Text style={styles.pickerLabel}>カテゴリ:</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryPicker}>
                    {categories.map((category) => (
                      <TouchableOpacity
                        key={category}
                        style={[
                          styles.categoryOption,
                          newItem.category === category && styles.categoryOptionSelected
                        ]}
                        onPress={() => setNewItem({...newItem, category})}
                      >
                        <Text style={[
                          styles.categoryOptionText,
                          newItem.category === category && styles.categoryOptionTextSelected
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
                  value={newItem.description}
                  onChangeText={(text) => setNewItem({...newItem, description: text})}
                />
                <TextInput
                  style={styles.input}
                  placeholder="画像URL"
                  value={newItem.image}
                  onChangeText={(text) => setNewItem({...newItem, image: text})}
                />
                <View style={styles.buttonRow}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => setIsAddingItem(false)}
                  >
                    <Text style={styles.cancelButtonText}>キャンセル</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.saveButton}
                    onPress={addMenuItem}
                  >
                    <Text style={styles.saveButtonText}>保存</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <ScrollView style={styles.menuList}>
              {categories.map(category => (
                <View key={category} style={styles.categorySection}>
                  <Text style={styles.categoryTitle}>{category}</Text>
                  {groupedItems[category].map(item => (
                    <View key={item.id} style={styles.menuItem}>
                      <View style={styles.menuInfo}>
                        <Text style={styles.menuName}>{item.name}</Text>
                        <Text style={styles.menuDescription}>{item.description}</Text>
                        <Text style={styles.menuPrice}>¥{item.price}</Text>
                      </View>
                      <View style={styles.actionButtons}>
                        <TouchableOpacity
                          style={styles.editButton}
                          onPress={() => setEditingItem(item)}
                        >
                          <Edit size={16} color="#8B4513" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.deleteButton}
                          onPress={() => deleteMenuItem(item.id)}
                        >
                          <Trash2 size={16} color="#DC2626" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* メニュー項目編集モーダル */}
      <Modal
        visible={editingItem !== null}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setEditingItem(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>メニュー項目を編集</Text>
            {editingItem && (
              <>
                <TextInput
                  style={styles.input}
                  placeholder="商品名"
                  value={editingItem.name}
                  onChangeText={(text) => setEditingItem({...editingItem, name: text})}
                />
                <TextInput
                  style={styles.input}
                  placeholder="価格"
                  keyboardType="numeric"
                  value={editingItem.price.toString()}
                  onChangeText={(text) => setEditingItem({...editingItem, price: parseInt(text) || 0})}
                />
                <View style={styles.pickerContainer}>
                  <Text style={styles.pickerLabel}>カテゴリ:</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryPicker}>
                    {categories.map((category) => (
                      <TouchableOpacity
                        key={category}
                        style={[
                          styles.categoryOption,
                          editingItem.category === category && styles.categoryOptionSelected
                        ]}
                        onPress={() => setEditingItem({...editingItem, category})}
                      >
                        <Text style={[
                          styles.categoryOptionText,
                          editingItem.category === category && styles.categoryOptionTextSelected
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
                  value={editingItem.description}
                  onChangeText={(text) => setEditingItem({...editingItem, description: text})}
                />
                <TextInput
                  style={styles.input}
                  placeholder="画像URL"
                  value={editingItem.image}
                  onChangeText={(text) => setEditingItem({...editingItem, image: text})}
                />
                <View style={styles.buttonRow}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => setEditingItem(null)}
                  >
                    <Text style={styles.cancelButtonText}>キャンセル</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.saveButton}
                    onPress={updateMenuItem}
                  >
                    <Text style={styles.saveButtonText}>更新</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* カテゴリ管理モーダル */}
      <Modal
        visible={showCategoryManagement}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCategoryManagement(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>カテゴリ管理</Text>
              <TouchableOpacity
                style={styles.modalHeaderButton}
                onPress={() => setShowCategoryManagement(false)}
              >
                <X size={20} color="#8B4513" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.addCategorySection}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="新しいカテゴリ名"
                value={newCategoryName}
                onChangeText={setNewCategoryName}
              />
              <TouchableOpacity
                style={styles.addCategoryButton}
                onPress={addCategory}
              >
                <Plus size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.categoriesList}>
              {categories.map((category, index) => (
                <View key={index} style={styles.categoryItem}>
                  {editingCategoryIndex === index ? (
                    <View style={styles.editCategoryRow}>
                      <TextInput
                        style={[styles.input, styles.editCategoryInput]}
                        value={category}
                        onChangeText={(text) => {
                          const updatedCategories = [...categories];
                          updatedCategories[index] = text;
                          setCategories(updatedCategories);
                        }}
                      />
                      <TouchableOpacity
                        style={styles.saveIconButton}
                        onPress={() => updateCategory(index, category)}
                      >
                        <Save size={16} color="#10B981" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.cancelIconButton}
                        onPress={() => setEditingCategoryIndex(null)}
                      >
                        <X size={16} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={styles.categoryRow}>
                      <Text style={styles.categoryName}>{category}</Text>
                      <View style={styles.categoryActions}>
                        <TouchableOpacity
                          style={[styles.moveButton, index === 0 && styles.disabledButton]}
                          onPress={() => moveCategoryUp(index)}
                          disabled={index === 0}
                        >
                          <ArrowUp size={14} color={index === 0 ? "#CCCCCC" : "#8B4513"} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.moveButton, index === categories.length - 1 && styles.disabledButton]}
                          onPress={() => moveCategoryDown(index)}
                          disabled={index === categories.length - 1}
                        >
                          <ArrowDown size={14} color={index === categories.length - 1 ? "#CCCCCC" : "#8B4513"} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.editIconButton}
                          onPress={() => setEditingCategoryIndex(index)}
                        >
                          <Edit size={14} color="#8B4513" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.deleteIconButton}
                          onPress={() => deleteCategory(index)}
                        >
                          <Trash2 size={14} color="#DC2626" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Supabase設定モーダル */}
      <Modal
        visible={showSupabaseModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowSupabaseModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Supabase設定</Text>
              <TouchableOpacity
                style={styles.modalHeaderButton}
                onPress={() => setShowSupabaseModal(false)}
              >
                <X size={20} color="#8B4513" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.supabaseForm}>
              <Text style={styles.formDescription}>
                Supabaseプロジェクトの設定情報を入力してください
              </Text>
              
              <Text style={styles.inputLabel}>Project URL</Text>
              <TextInput
                style={styles.input}
                placeholder="https://your-project.supabase.co"
                value={supabaseUrl}
                onChangeText={setSupabaseUrl}
                autoCapitalize="none"
                autoCorrect={false}
              />
              
              <Text style={styles.inputLabel}>Anon Key</Text>
              <TextInput
                style={[styles.input, styles.keyInput]}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                value={supabaseAnonKey}
                onChangeText={setSupabaseAnonKey}
                autoCapitalize="none"
                autoCorrect={false}
                secureTextEntry={true}
                multiline={true}
              />
              
              <View style={styles.helpText}>
                <Text style={styles.helpTextContent}>
                  これらの情報はSupabaseプロジェクトの「Settings」→「API」で確認できます
                </Text>
              </View>
              
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => {
                    setShowSupabaseModal(false);
                    setSupabaseUrl('');
                    setSupabaseAnonKey('');
                  }}
                >
                  <Text style={styles.cancelButtonText}>キャンセル</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={handleSupabaseSetup}
                >
                  <Text style={styles.saveButtonText}>保存</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
          
          {isMigrating && (
            <View style={styles.migrationStatus}>
              <Text style={styles.migrationText}>データを移行中...</Text>
            </View>
          )}
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
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    padding: 15,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#8B4513',
    marginBottom: 15,
    marginLeft: 5,
  },
  settingItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    backgroundColor: '#F5E6D3',
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#666666',
    marginTop: 2,
  },
  logoutButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#DC2626',
    marginLeft: 10,
  },
  versionInfo: {
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 20,
  },
  versionText: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  versionSubtext: {
    fontSize: 12,
    color: '#999999',
    marginTop: 4,
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
    width: '95%',
    maxWidth: 500,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#8B4513',
  },
  modalHeaderButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  modalHeaderButton: {
    backgroundColor: '#F5E6D3',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addItemForm: {
    backgroundColor: '#F5E6D3',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#8B4513',
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 6,
    padding: 10,
    marginBottom: 8,
    fontSize: 14,
    backgroundColor: '#FFFFFF',
  },
  pickerContainer: {
    marginBottom: 8,
  },
  pickerLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 6,
  },
  categoryPicker: {
    flexDirection: 'row',
  },
  categoryOption: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    marginRight: 6,
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
    fontSize: 12,
  },
  categoryOptionTextSelected: {
    color: '#FFFFFF',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  cancelButton: {
    backgroundColor: '#E5E5E5',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    flex: 0.45,
  },
  cancelButtonText: {
    color: '#666666',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 14,
  },
  saveButton: {
    backgroundColor: '#8B4513',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    flex: 0.45,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 14,
  },
  menuList: {
    maxHeight: 400,
  },
  categorySection: {
    marginBottom: 15,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#8B4513',
    marginBottom: 8,
  },
  menuItem: {
    backgroundColor: '#F5E6D3',
    borderRadius: 8,
    padding: 12,
    marginBottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuInfo: {
    flex: 1,
  },
  menuName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333333',
  },
  menuDescription: {
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
  actionButtons: {
    flexDirection: 'row',
    gap: 6,
  },
  editButton: {
    backgroundColor: '#FFFFFF',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    backgroundColor: '#FFFFFF',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addCategorySection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    gap: 8,
  },
  addCategoryButton: {
    backgroundColor: '#8B4513',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoriesList: {
    maxHeight: 300,
  },
  categoryItem: {
    marginBottom: 8,
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F5E6D3',
    padding: 12,
    borderRadius: 8,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    flex: 1,
  },
  categoryActions: {
    flexDirection: 'row',
    gap: 6,
  },
  moveButton: {
    backgroundColor: '#FFFFFF',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#F0F0F0',
  },
  editIconButton: {
    backgroundColor: '#FFFFFF',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteIconButton: {
    backgroundColor: '#FFFFFF',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editCategoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  editCategoryInput: {
    flex: 1,
    marginBottom: 0,
  },
  saveIconButton: {
    backgroundColor: '#DCFCE7',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelIconButton: {
    backgroundColor: '#FEE2E2',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  supabaseForm: {
    paddingVertical: 10,
  },
  formDescription: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 6,
    marginTop: 10,
  },
  keyInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  helpText: {
    backgroundColor: '#F0F9FF',
    padding: 12,
    borderRadius: 8,
    marginTop: 15,
    marginBottom: 20,
  },
  helpTextContent: {
    fontSize: 12,
    color: '#0369A1',
    textAlign: 'center',
  },
  migrationStatus: {
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  migrationText: {
    fontSize: 14,
    color: '#92400E',
    textAlign: 'center',
    fontWeight: '600',
  },
});