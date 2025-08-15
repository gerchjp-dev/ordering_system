import React, { useState } from 'react';
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
import { Plus, Users, Clock, CircleCheck as CheckCircle, Circle as XCircle, CreditCard as Edit, Trash2 } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useDatabase } from '@/hooks/useDatabase';
import { Table as DBTable } from '@/lib/database';

interface Table {
  id: string;
  number: string;
  seats: number;
  status: 'available' | 'occupied' | 'reserved' | 'cleaning';
  orderStartTime?: Date;
  customerCount?: number;
  orders: CartItem[];
  totalAmount: number;
}

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  category: string;
}

const initialTables: Table[] = [
  { id: 'mock-1', number: 'T1', seats: 2, status: 'available', orders: [], totalAmount: 0 },
  { id: 'mock-2', number: 'T2', seats: 4, status: 'occupied', orderStartTime: new Date(Date.now() - 30 * 60 * 1000), customerCount: 3, orders: [
    { id: 'mock-item-1', name: '本日の日替わり定食', price: 980, quantity: 2, category: '定食' },
    { id: 'mock-item-4', name: '緑茶', price: 200, quantity: 2, category: 'ドリンク' }
  ], totalAmount: 2360 },
  { id: 'mock-3', number: 'T3', seats: 2, status: 'available', orders: [], totalAmount: 0 },
  { id: 'mock-4', number: 'T4', seats: 6, status: 'reserved', orders: [], totalAmount: 0 },
  { id: 'mock-5', number: 'T5', seats: 4, status: 'cleaning', orders: [], totalAmount: 0 },
  { id: 'mock-6', number: 'T6', seats: 2, status: 'occupied', orderStartTime: new Date(Date.now() - 15 * 60 * 1000), customerCount: 2, orders: [
    { id: 'mock-item-2', name: '鶏の唐揚げ定食', price: 850, quantity: 1, category: '定食' },
    { id: 'mock-item-5', name: 'ほうじ茶', price: 200, quantity: 1, category: 'ドリンク' }
  ], totalAmount: 1050 },
  { id: 'mock-7', number: 'T7', seats: 4, status: 'available', orders: [], totalAmount: 0 },
  { id: 'mock-8', number: 'T8', seats: 8, status: 'available', orders: [], totalAmount: 0 },
];

export default function TablesScreen() {
  const { database, isLoading, error, isConnected } = useDatabase();
  const [tables, setTables] = useState<Table[]>(initialTables);
  const [isUsingMockData, setIsUsingMockData] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTableNumber, setNewTableNumber] = useState('');
  const [newTableSeats, setNewTableSeats] = useState('');
  const [editingTable, setEditingTable] = useState<Table | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [orderHistory, setOrderHistory] = useState<any[]>([]);
  const router = useRouter();

  // データベース接続状態の確認
  React.useEffect(() => {
    if (!isLoading && !isConnected) {
      Alert.alert(
        'データベース未設定',
        error || 'データベースが設定されていません。設定画面でデータベース接続を設定してください。\n\n現在はローカルデータで動作しています。',
        [
          { text: 'OK' },
          { 
            text: '設定画面へ', 
            onPress: () => router.push('/settings')
          }
        ]
      );
    }
  }, [isConnected, isLoading, error]);

  // データベースからテーブル一覧を読み込み
  const loadTables = async () => {
    if (!database) return;
    
    try {
      console.log('📊 Supabaseからテーブルデータを読み込み中...');
      const dbTables = await database.getTables();
      console.log('📊 読み込み完了:', dbTables.length, '件のテーブル');
      const formattedTables: Table[] = dbTables.map(table => ({
        id: table.id,
        number: table.number,
        seats: table.seats,
        status: table.status,
        orderStartTime: table.order_start_time ? new Date(table.order_start_time) : undefined,
        customerCount: table.customer_count || undefined,
        orders: [], // 注文は別途読み込み
        totalAmount: table.total_amount,
      }));
      setTables(formattedTables);
      console.log('✅ テーブル状態更新完了');
    } catch (error) {
      console.error('テーブル読み込みエラー:', error);
      Alert.alert('エラー', 'テーブルデータの読み込みに失敗しました');
    }
  };

  // データベース接続時にテーブルを読み込み
  React.useEffect(() => {
    if (database) {
      console.log('✅ データベース接続確認 - 実データを読み込み中...');
      setIsUsingMockData(false);
      loadTables();
    } else {
      console.log('⚠️ データベース未接続 - モックデータを使用中');
      setIsUsingMockData(true);
    }
  }, [database]);

  const getStatusColor = (status: Table['status']) => {
    switch (status) {
      case 'available':
        return '#10B981'; // Green
      case 'occupied':
        return '#EF4444'; // Red
      case 'reserved':
        return '#F59E0B'; // Yellow
      case 'cleaning':
        return '#6B7280'; // Gray
      default:
        return '#8B4513';
    }
  };

  const getStatusText = (status: Table['status']) => {
    switch (status) {
      case 'available':
        return '空席';
      case 'occupied':
        return '使用中';
      case 'reserved':
        return '予約済み';
      case 'cleaning':
        return '清掃中';
      default:
        return '';
    }
  };

  const getElapsedTime = (startTime?: Date) => {
    if (!startTime) return '';
    const elapsed = Math.floor((Date.now() - startTime.getTime()) / (1000 * 60));
    return `${elapsed}分`;
  };

  const handleTablePress = (table: Table) => {
    if (table.status === 'available' || table.status === 'reserved') {
      // 空席・予約済みの場合はメニュー選択画面に遷移
      router.push(`/menu?tableId=${table.id}&tableNumber=${table.number}&mode=order`);
    } else if (table.status === 'occupied') {
      // 使用中の場合は選択肢を表示
      const orderDetails = table.orders.length > 0 ? 
        `\n\n注文内容:\n${table.orders.map(item => `・${item.name} × ${item.quantity} = ¥${(item.price * item.quantity).toLocaleString()}`).join('\n')}` : 
        '\n\n注文内容: なし';
      
      Alert.alert(
        `テーブル ${table.number}`,
        `現在の注文: ${table.orders.length}件\n合計金額: ¥${table.totalAmount.toLocaleString()}${orderDetails}\n\n何をしますか？`,
        [
          { text: 'キャンセル', style: 'cancel' },
          {
            text: '追加注文',
            onPress: () => router.push(`/menu?tableId=${table.id}&tableNumber=${table.number}&mode=additional`),
          },
          {
            text: '支払い・退席',
            onPress: () => finishOrder(table.id),
          },
        ]
      );
    } else if (table.status === 'cleaning') {
      Alert.alert(
        `テーブル ${table.number}`,
        '清掃中です。清掃完了しましたか？',
        [
          { text: 'いいえ', style: 'cancel' },
          {
            text: '清掃完了',
            onPress: () => updateTableStatus(table.id, 'available'),
          },
        ]
      );
    }
  };

  const handleTableLongPress = (table: Table) => {
    if (table.status === 'available') {
      Alert.alert(
        `テーブル ${table.number}`,
        '何をしますか？',
        [
          { text: 'キャンセル', style: 'cancel' },
          {
            text: 'テーブル名変更',
            onPress: () => {
              setEditingTable(table);
              setShowEditModal(true);
            },
          },
          {
            text: 'テーブル削除',
            style: 'destructive',
            onPress: () => deleteTable(table.id),
          },
          {
            text: '予約済みに変更',
            onPress: () => updateTableStatus(table.id, 'reserved'),
          },
        ]
      );
    } else if (table.status === 'occupied') {
      Alert.alert(
        `テーブル ${table.number}`,
        '何をしますか？',
        [
          { text: 'キャンセル', style: 'cancel' },
          {
            text: '支払い・退席',
            onPress: () => finishOrder(table.id),
          },
          {
            text: 'テーブル削除（強制）',
            style: 'destructive',
            onPress: () => forceDeleteTable(table.id),
          },
        ]
      );
    } else if (table.status === 'reserved') {
      Alert.alert(
        `テーブル ${table.number}`,
        '何をしますか？',
        [
          { text: 'キャンセル', style: 'cancel' },
          {
            text: 'テーブル名変更',
            onPress: () => {
              setEditingTable(table);
              setShowEditModal(true);
            },
          },
          {
            text: 'テーブル削除',
            style: 'destructive',
            onPress: () => deleteTable(table.id),
          },
          {
            text: '予約解除',
            onPress: () => updateTableStatus(table.id, 'available'),
          },
        ]
      );
    } else if (table.status === 'cleaning') {
      Alert.alert(
        `テーブル ${table.number}`,
        '清掃完了しましたか？',
        [
          { text: 'いいえ', style: 'cancel' },
          {
            text: '完了',
            onPress: () => updateTableStatus(table.id, 'available'),
          },
        ]
      );
    }
  };

  const finishOrder = (tableId: string) => {
    const table = tables.find(t => t.id === tableId);
    if (!table) return;

    if (table.orders.length === 0) {
      Alert.alert(
        '注文なし',
        'このテーブルには注文がありません。テーブルを空席に戻しますか？',
        [
          { text: 'キャンセル', style: 'cancel' },
          {
            text: '空席に戻す',
            onPress: async () => {
              try {
                await updateTableStatus(tableId, 'available');
                Alert.alert('完了', 'テーブルを空席に戻しました');
              } catch (error) {
                console.error('テーブル状態更新エラー:', error);
                Alert.alert('エラー', 'テーブル状態の更新に失敗しました');
              }
            },
          },
        ]
      );
      return;
    }

    Alert.alert(
      '💳 支払い確認',
      `テーブル: ${table.number}\n\n注文内容:\n${table.orders.map(item => `・${item.name} × ${item.quantity} = ¥${(item.price * item.quantity).toLocaleString()}`).join('\n')}\n\n合計金額: ¥${table.totalAmount.toLocaleString()}\n\n会計を完了しますか？`,
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '支払い完了',
          onPress: async () => {
            console.log('💳 支払い処理開始 - テーブルID:', tableId);
            console.log('💳 データベース接続状態:', isConnected ? '接続済み' : '未接続');
            console.log('💳 使用データ:', isUsingMockData ? 'モックデータ' : 'リアルデータ');
            
            try {
              // 注文履歴データを準備
              const orderHistoryItem = {
                id: Date.now().toString(),
                tableNumber: table.number,
                items: table.orders.map(order => ({
                  name: order.name,
                  quantity: order.quantity,
                  price: order.price
                })),
                total: table.totalAmount,
                timestamp: new Date(),
              };
              
              if (database && isConnected && !isUsingMockData) {
                console.log('💾 データベースに注文履歴を保存中...');
                await database.createOrderHistory({
                  table_number: table.number,
                  items: orderHistoryItem.items,
                  total_amount: table.totalAmount,
                });
                console.log('✅ Supabase注文履歴保存完了');
                
                console.log('🗑️ データベースからテーブル削除中...');
                await database.deleteTable(tableId);
                console.log('✅ データベーステーブル削除完了');
              } else {
                console.log('⚠️ モックデータモード - ローカル処理のみ');
              }
              
              // 注文履歴に保存（ローカル用）
              console.log('📝 ローカル注文履歴に保存中...');
              setOrderHistory(prev => [...prev, orderHistoryItem]);
              console.log('✅ ローカル履歴保存完了');
              
              // ローカルテーブル状態を更新
              console.log('🗑️ ローカルテーブル状態更新中...');
              setTables(prevTables => {
                const updatedTables = prevTables.map(t => 
                  t.id === tableId 
                    ? { ...t, status: 'available' as const, orders: [], totalAmount: 0, orderStartTime: undefined, customerCount: undefined }
                    : t
                );
                console.log('✅ ローカルテーブル削除完了 - 残りテーブル数:', updatedTables.length);
                return updatedTables;
              });
              
              // 支払い完了後の確認
              console.log('🎉 支払い処理完了');
              Alert.alert(
                '支払い完了',
                `🎉 テーブル ${table.number}の会計が完了しました！\n\n💰 合計金額: ¥${table.totalAmount.toLocaleString()}\n📝 注文履歴に保存されました\n🔄 テーブルが空席に戻りました\n\n処理モード: ${isUsingMockData ? '🟡 モックデータ' : '🟢 データベース連携'}`,
                [{ text: 'OK' }]
              );
            } catch (error) {
              console.error('❌ 支払い処理エラー:', error);
              Alert.alert(
                'エラー', 
                `❌ 支払い処理中にエラーが発生しました:\n\n${error instanceof Error ? error.message : '不明なエラー'}\n\n処理モード: ${isUsingMockData ? '🟡 モックデータ' : '🟢 データベース連携'}\n\nデバッグ情報をコンソールで確認してください。`
              );
            }
          },
        },
      ]
    );
  };

  const saveOrderHistory = async (table: Table) => {
    if (!database) return;
    
    try {
      await database.createOrderHistory({
        table_number: table.number,
        items: table.orders.map(order => ({
          name: order.name,
          quantity: order.quantity,
          price: order.price
        })),
        total_amount: table.totalAmount,
      });
    } catch (error) {
      console.error('注文履歴保存エラー:', error);
      throw error;
    }
  };

  const deleteTableFromDB = async (tableId: string) => {
    if (database) {
      try {
        await database.deleteTable(tableId);
      } catch (error) {
        console.error('テーブル削除エラー:', error);
      }
    }
    // ローカル状態も更新
    setTables(prevTables => prevTables.filter(t => t.id !== tableId));
  };

  const forceDeleteTable = (tableId: string) => {
    const table = tables.find(t => t.id === tableId);
    if (!table) return;

    Alert.alert(
      '強制削除の確認',
      `⚠️ 警告: このテーブルは使用中です！\n\nテーブル: ${table.number}\n状態: ${getStatusText(table.status)}\n注文数: ${table.orders.length}件\n合計金額: ¥${table.totalAmount.toLocaleString()}\n\n注文データは失われます。本当に削除しますか？`,
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '強制削除',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('強制削除開始:', tableId);
              await deleteTableFromDB(tableId);
              console.log('強制削除完了');
              Alert.alert('完了', 'テーブルが強制削除されました');
            } catch (error) {
              console.error('強制削除エラー:', error);
              Alert.alert('エラー', '強制削除に失敗しました');
            }
          },
        },
      ]
    );
  };

  const deleteTable = (tableId: string) => {
    const table = tables.find(t => t.id === tableId);
    if (!table) return;

    if (table.status === 'occupied') {
      Alert.alert(
        '削除不可', 
        `このテーブルは現在使用中のため削除できません。\n\n理由: テーブル状態が「${getStatusText(table.status)}」\n注文数: ${table.orders.length}件\n合計金額: ¥${table.totalAmount.toLocaleString()}\n\n先に支払いを完了してから削除してください。`
      );
      return;
    }

    Alert.alert(
      'テーブル削除',
      `${table.number}を削除しますか？`,
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除',
          style: 'destructive',
          onPress: async () => {
            await deleteTableFromDB(tableId);
            Alert.alert('完了', 'テーブルが削除されました');
          },
        },
      ]
    );
  };

  const updateTableName = () => {
    if (!editingTable || !editingTable.number.trim()) {
      Alert.alert('エラー', 'テーブル名を入力してください');
      return;
    }

    updateTableInDB(editingTable.id, { number: editingTable.number });
    setShowEditModal(false);
    setEditingTable(null);
    Alert.alert('成功', 'テーブル名が変更されました');
  };

  const updateTableStatus = async (tableId: string, status: Table['status'], additionalUpdates?: Partial<Table>) => {
    const updates = { status, ...additionalUpdates };
    await updateTableInDB(tableId, updates);
  };

  const updateTableInDB = async (tableId: string, updates: Partial<Table>) => {
    console.log('🔄 テーブル更新開始 - ID:', tableId, 'Updates:', updates);
    
    if (database && isConnected) {
      try {
        console.log('💾 Supabaseでテーブル更新中...');
        const dbUpdates: any = {};
        if (updates.status) dbUpdates.status = updates.status;
        if (updates.number) dbUpdates.number = updates.number;
        if (updates.customerCount !== undefined) dbUpdates.customer_count = updates.customerCount;
        if (updates.orderStartTime) dbUpdates.order_start_time = updates.orderStartTime.toISOString();
        if (updates.totalAmount !== undefined) dbUpdates.total_amount = updates.totalAmount;
        
        await database.updateTable(tableId, dbUpdates);
        console.log('✅ Supabase更新完了');
      } catch (error) {
        console.error('❌ Supabaseテーブル更新エラー:', error);
        throw error;
      }
    } else {
      console.log('⚠️ データベース未接続 - ローカル更新のみ');
    }
    
    // ローカル状態も更新
    console.log('🔄 ローカル状態更新中...');
    setTables(prevTables =>
      prevTables.map(t =>
        t.id === tableId ? { ...t, ...updates } : t
      )
    );
    console.log('✅ ローカル状態更新完了');
  };

  const addNewTable = () => {
    if (!newTableNumber || !newTableSeats) {
      Alert.alert('エラー', 'テーブル番号と席数を入力してください');
      return;
    }

    addTableToDB({
      number: newTableNumber,
      seats: parseInt(newTableSeats),
    });
    
    setNewTableNumber('');
    setNewTableSeats('');
    setShowAddModal(false);
    Alert.alert('成功', '新しいテーブルが追加されました');
  };

  const addTableToDB = async (tableData: { number: string; seats: number }) => {
    if (database) {
      try {
        const newTable = await database.createTable({
          number: tableData.number,
          seats: tableData.seats,
          status: 'available',
          total_amount: 0,
        });
        
        // ローカル状態に追加
        const formattedTable: Table = {
          id: newTable.id.toString(),
          number: newTable.number,
          seats: newTable.seats,
          status: newTable.status,
          orders: [],
          totalAmount: newTable.total_amount,
        };
        
        setTables(prev => [...prev, formattedTable]);
        return;
      } catch (error) {
        console.error('テーブル追加エラー:', error);
      }
    }
    
    // データベース接続がない場合はローカルのみ
    const newTable: Table = {
      id: `mock-${Date.now()}`,
      number: tableData.number,
      seats: tableData.seats,
      status: 'available',
      orders: [],
      totalAmount: 0,
    };
    setTables(prev => [...prev, newTable]);
  };

  const getStatusStats = () => {
    const stats = tables.reduce((acc, table) => {
      acc[table.status] = (acc[table.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      available: stats.available || 0,
      occupied: stats.occupied || 0,
      reserved: stats.reserved || 0,
      cleaning: stats.cleaning || 0,
    };
  };

  const stats = getStatusStats();

  // テーブルの注文を更新する関数をグローバルに公開
  React.useEffect(() => {
    (global as any).updateTableStatus = async (tableId: string, status: string, additionalUpdates?: any) => {
      await updateTableStatus(tableId, status as Table['status'], additionalUpdates);
    };
    
    (global as any).updateTableOrder = (tableId: string, orders: CartItem[], totalAmount: number) => {
      updateTableInDB(tableId, { orders, totalAmount });
    };
    
    (global as any).getTableOrders = (targetTableId: string) => {
      const table = tables.find(t => t.id === targetTableId);
      return table ? table.orders : [];
    };
    
    (global as any).completePayment = async (tableId: string, orderData: any) => {
      console.log('completePayment called with tableId:', tableId);
      
      try {
        const table = tables.find(t => t.id === tableId);
        if (table && database) {
          console.log('データベースに注文履歴を保存中...');
          await saveOrderHistory(table);
          console.log('注文履歴保存完了');
        }
        
        // 注文履歴に追加
        console.log('Adding to order history:', orderData);
        setOrderHistory(prev => [...prev, orderData]);
        
        // テーブルを削除
        console.log('テーブル削除開始...');
        await deleteTableFromDB(tableId);
        console.log('テーブル削除完了');
      } catch (error) {
        console.error('支払い完了処理エラー:', error);
        throw error;
      }
    };
    
    (global as any).getOrderHistory = () => orderHistory;
    
    (global as any).getAllTables = () => tables;
  }, [tables, orderHistory, database]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>テーブル管理</Text>
        <View style={styles.headerInfo}>
          <Text style={styles.connectionText}>
            {isConnected ? '🟢 DB接続' : '🔴 ローカル'}
          </Text>
          <Text style={styles.dataSourceText}>
            {isUsingMockData ? 'モック' : 'リアル'}データ
          </Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
        >
          <Plus size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: '#10B981' }]}>{stats.available}</Text>
          <Text style={styles.statLabel}>空席</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: '#EF4444' }]}>{stats.occupied}</Text>
          <Text style={styles.statLabel}>使用中</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: '#F59E0B' }]}>{stats.reserved}</Text>
          <Text style={styles.statLabel}>予約済み</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: '#6B7280' }]}>{stats.cleaning}</Text>
          <Text style={styles.statLabel}>清掃中</Text>
        </View>
      </View>

      <ScrollView style={styles.tablesContainer}>
        <View style={styles.tablesGrid}>
          {tables.map(table => (
            <TouchableOpacity
              key={table.id}
              style={[
                styles.tableCard,
                { borderColor: getStatusColor(table.status) }
              ]}
              onPress={() => handleTablePress(table)}
              onLongPress={() => handleTableLongPress(table)}
            >
              <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(table.status) }]}>
                {table.status === 'available' && <CheckCircle size={16} color="#FFFFFF" />}
                {table.status === 'occupied' && <XCircle size={16} color="#FFFFFF" />}
                {table.status === 'reserved' && <Clock size={16} color="#FFFFFF" />}
                {table.status === 'cleaning' && <Users size={16} color="#FFFFFF" />}
              </View>
              
              <Text style={styles.tableNumber}>{table.number}</Text>
              <Text style={styles.tableSeats}>{table.seats}席</Text>
              <Text style={[styles.tableStatus, { color: getStatusColor(table.status) }]}>
                {getStatusText(table.status)}
              </Text>
              
              {table.status === 'occupied' && (
                <View style={styles.occupiedInfo}>
                  <Text style={styles.customerCount}>
                    {table.customerCount}名
                  </Text>
                  <Text style={styles.elapsedTime}>
                    {getElapsedTime(table.orderStartTime)}
                  </Text>
                  <Text style={styles.tableAmount}>
                    ¥{table.totalAmount.toLocaleString()}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <Modal
        visible={showAddModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>新しいテーブルを追加</Text>
            
            <TextInput
              style={styles.input}
              placeholder="テーブル番号 (例: T9)"
              value={newTableNumber}
              onChangeText={setNewTableNumber}
            />
            
            <TextInput
              style={styles.input}
              placeholder="席数"
              keyboardType="numeric"
              value={newTableSeats}
              onChangeText={setNewTableSeats}
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowAddModal(false)}
              >
                <Text style={styles.cancelButtonText}>キャンセル</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.saveButton}
                onPress={addNewTable}
              >
                <Text style={styles.saveButtonText}>追加</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* テーブル編集モーダル */}
      <Modal
        visible={showEditModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>テーブル名を変更</Text>
            
            {editingTable && (
              <TextInput
                style={styles.input}
                placeholder="テーブル名"
                value={editingTable.number}
                onChangeText={(text) => setEditingTable({...editingTable, number: text})}
              />
            )}
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setShowEditModal(false);
                  setEditingTable(null);
                }}
              >
                <Text style={styles.cancelButtonText}>キャンセル</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.saveButton}
                onPress={updateTableName}
              >
                <Text style={styles.saveButtonText}>保存</Text>
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
  headerInfo: {
    alignItems: 'center',
  },
  connectionText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  dataSourceText: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  addButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
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
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    color: '#666666',
    marginTop: 4,
  },
  tablesContainer: {
    flex: 1,
    paddingHorizontal: 15,
  },
  tablesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  tableCard: {
    backgroundColor: '#FFFFFF',
    width: '48%',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
  },
  statusIndicator: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tableNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 5,
  },
  tableSeats: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 5,
  },
  tableStatus: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 5,
  },
  occupiedInfo: {
    marginTop: 5,
  },
  customerCount: {
    fontSize: 12,
    color: '#666666',
  },
  elapsedTime: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '600',
  },
  tableAmount: {
    fontSize: 12,
    color: '#8B4513',
    fontWeight: 'bold',
    marginTop: 2,
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
    width: '80%',
    maxWidth: 300,
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
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
});