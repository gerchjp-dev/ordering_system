import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { Calendar, ArrowLeft, Plus, Clock, Users, FileText, X, Save, Trash2, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useRouter } from 'expo-router';

interface Reservation {
  id: string;
  date: string;
  time: string;
  customerName: string;
  customerCount: number;
  tableNumber: string;
  notes: string;
  menuRequests: string;
  createdAt: Date;
}

const mockReservations: Reservation[] = [
  {
    id: 'res-1',
    date: '2024-01-20',
    time: '12:00',
    customerName: '田中様',
    customerCount: 4,
    tableNumber: 'T4',
    notes: '窓際の席希望',
    menuRequests: '本日の日替わり定食×2、鶏の唐揚げ定食×2',
    createdAt: new Date('2024-01-15T10:00:00'),
  },
  {
    id: 'res-2',
    date: '2024-01-22',
    time: '18:30',
    customerName: '佐藤様',
    customerCount: 2,
    tableNumber: 'T2',
    notes: 'アレルギー: 卵',
    menuRequests: '焼き魚定食×2、緑茶×2',
    createdAt: new Date('2024-01-16T14:30:00'),
  },
];

export default function CalendarScreen() {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [reservations, setReservations] = useState<Reservation[]>(mockReservations);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [editingReservation, setEditingReservation] = useState<Reservation | null>(null);
  const [newReservation, setNewReservation] = useState({
    date: '',
    time: '',
    customerName: '',
    customerCount: '',
    tableNumber: '',
    notes: '',
    menuRequests: '',
  });

  // カレンダーの日付を生成
  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const current = new Date(startDate);
    
    for (let i = 0; i < 42; i++) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  };

  const formatDateKey = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const getReservationsForDate = (date: Date) => {
    const dateKey = formatDateKey(date);
    return reservations.filter(res => res.date === dateKey);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const openAddReservation = (date: Date) => {
    const dateKey = formatDateKey(date);
    setSelectedDate(dateKey);
    setNewReservation({
      ...newReservation,
      date: dateKey,
    });
    setShowAddModal(true);
  };

  const addReservation = () => {
    if (!newReservation.customerName || !newReservation.time || !newReservation.customerCount) {
      Alert.alert('エラー', 'お客様名、時間、人数を入力してください');
      return;
    }

    const reservation: Reservation = {
      id: `res-${Date.now()}`,
      date: newReservation.date,
      time: newReservation.time,
      customerName: newReservation.customerName,
      customerCount: parseInt(newReservation.customerCount),
      tableNumber: newReservation.tableNumber,
      notes: newReservation.notes,
      menuRequests: newReservation.menuRequests,
      createdAt: new Date(),
    };

    setReservations([...reservations, reservation]);
    setNewReservation({
      date: '',
      time: '',
      customerName: '',
      customerCount: '',
      tableNumber: '',
      notes: '',
      menuRequests: '',
    });
    setShowAddModal(false);
    Alert.alert('成功', '予約が追加されました');
  };

  const updateReservation = () => {
    if (!editingReservation) return;

    setReservations(prev =>
      prev.map(res =>
        res.id === editingReservation.id ? editingReservation : res
      )
    );
    setEditingReservation(null);
    Alert.alert('成功', '予約が更新されました');
  };

  const deleteReservation = (id: string) => {
    const reservation = reservations.find(res => res.id === id);
    Alert.alert(
      '予約削除',
      `${reservation?.customerName}様の予約を削除しますか？`,
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除',
          style: 'destructive',
          onPress: () => {
            setReservations(prev => prev.filter(res => res.id !== id));
            Alert.alert('完了', '予約が削除されました');
          },
        },
      ]
    );
  };

  const calendarDays = generateCalendarDays();
  const monthNames = [
    '1月', '2月', '3月', '4月', '5月', '6月',
    '7月', '8月', '9月', '10月', '11月', '12月'
  ];
  const dayNames = ['日', '月', '火', '水', '木', '金', '土'];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>予約カレンダー</Text>
        <Calendar size={24} color="#FFFFFF" />
      </View>

      <ScrollView style={styles.content}>
        {/* カレンダーヘッダー */}
        <View style={styles.calendarHeader}>
          <TouchableOpacity
            style={styles.navButton}
            onPress={() => navigateMonth('prev')}
          >
            <ChevronLeft size={24} color="#8B4513" />
          </TouchableOpacity>
          <Text style={styles.monthTitle}>
            {currentDate.getFullYear()}年 {monthNames[currentDate.getMonth()]}
          </Text>
          <TouchableOpacity
            style={styles.navButton}
            onPress={() => navigateMonth('next')}
          >
            <ChevronRight size={24} color="#8B4513" />
          </TouchableOpacity>
        </View>

        {/* 曜日ヘッダー */}
        <View style={styles.weekHeader}>
          {dayNames.map(day => (
            <Text key={day} style={styles.weekDay}>{day}</Text>
          ))}
        </View>

        {/* カレンダーグリッド */}
        <View style={styles.calendarGrid}>
          {calendarDays.map((day, index) => {
            const isCurrentMonth = day.getMonth() === currentDate.getMonth();
            const isToday = formatDateKey(day) === formatDateKey(new Date());
            const dayReservations = getReservationsForDate(day);
            
            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.calendarDay,
                  !isCurrentMonth && styles.otherMonthDay,
                  isToday && styles.todayDay,
                  dayReservations.length > 0 && styles.reservedDay,
                ]}
                onPress={() => openAddReservation(day)}
              >
                <Text style={[
                  styles.dayNumber,
                  !isCurrentMonth && styles.otherMonthText,
                  isToday && styles.todayText,
                  dayReservations.length > 0 && styles.reservedText,
                ]}>
                  {day.getDate()}
                </Text>
                {dayReservations.length > 0 && (
                  <View style={styles.reservationDot}>
                    <Text style={styles.reservationCount}>{dayReservations.length}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* 今日の予約一覧 */}
        <View style={styles.todayReservations}>
          <Text style={styles.sectionTitle}>今日の予約</Text>
          {getReservationsForDate(new Date()).length === 0 ? (
            <View style={styles.noReservations}>
              <Clock size={32} color="#CCCCCC" />
              <Text style={styles.noReservationsText}>今日の予約はありません</Text>
            </View>
          ) : (
            getReservationsForDate(new Date()).map(reservation => (
              <View key={reservation.id} style={styles.reservationCard}>
                <View style={styles.reservationHeader}>
                  <Text style={styles.reservationTime}>{reservation.time}</Text>
                  <Text style={styles.reservationCustomer}>{reservation.customerName}</Text>
                  <View style={styles.reservationActions}>
                    <TouchableOpacity
                      style={styles.editReservationButton}
                      onPress={() => setEditingReservation(reservation)}
                    >
                      <Edit size={16} color="#8B4513" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.deleteReservationButton}
                      onPress={() => deleteReservation(reservation.id)}
                    >
                      <Trash2 size={16} color="#DC2626" />
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={styles.reservationDetails}>
                  <Text style={styles.reservationInfo}>
                    <Users size={12} color="#666666" /> {reservation.customerCount}名 • テーブル {reservation.tableNumber}
                  </Text>
                  {reservation.notes && (
                    <Text style={styles.reservationNotes}>📝 {reservation.notes}</Text>
                  )}
                  {reservation.menuRequests && (
                    <Text style={styles.reservationMenu}>🍽️ {reservation.menuRequests}</Text>
                  )}
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* 予約追加モーダル */}
      <Modal
        visible={showAddModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>新しい予約</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowAddModal(false)}
              >
                <X size={20} color="#8B4513" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalBody}>
              <Text style={styles.selectedDateText}>
                予約日: {new Date(selectedDate).toLocaleDateString('ja-JP')}
              </Text>
              
              <TextInput
                style={styles.input}
                placeholder="時間 (例: 12:00)"
                value={newReservation.time}
                onChangeText={(text) => setNewReservation({...newReservation, time: text})}
              />
              
              <TextInput
                style={styles.input}
                placeholder="お客様名"
                value={newReservation.customerName}
                onChangeText={(text) => setNewReservation({...newReservation, customerName: text})}
              />
              
              <TextInput
                style={styles.input}
                placeholder="人数"
                keyboardType="numeric"
                value={newReservation.customerCount}
                onChangeText={(text) => setNewReservation({...newReservation, customerCount: text})}
              />
              
              <TextInput
                style={styles.input}
                placeholder="希望テーブル (例: T4)"
                value={newReservation.tableNumber}
                onChangeText={(text) => setNewReservation({...newReservation, tableNumber: text})}
              />
              
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="備考・特記事項"
                value={newReservation.notes}
                onChangeText={(text) => setNewReservation({...newReservation, notes: text})}
                multiline={true}
                numberOfLines={3}
              />
              
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="事前メニューリクエスト"
                value={newReservation.menuRequests}
                onChangeText={(text) => setNewReservation({...newReservation, menuRequests: text})}
                multiline={true}
                numberOfLines={3}
              />
            </ScrollView>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowAddModal(false)}
              >
                <Text style={styles.cancelButtonText}>キャンセル</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.saveButton}
                onPress={addReservation}
              >
                <Save size={16} color="#FFFFFF" />
                <Text style={styles.saveButtonText}>保存</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 予約編集モーダル */}
      <Modal
        visible={editingReservation !== null}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setEditingReservation(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>予約編集</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setEditingReservation(null)}
              >
                <X size={20} color="#8B4513" />
              </TouchableOpacity>
            </View>
            
            {editingReservation && (
              <ScrollView style={styles.modalBody}>
                <Text style={styles.selectedDateText}>
                  予約日: {new Date(editingReservation.date).toLocaleDateString('ja-JP')}
                </Text>
                
                <TextInput
                  style={styles.input}
                  placeholder="時間"
                  value={editingReservation.time}
                  onChangeText={(text) => setEditingReservation({...editingReservation, time: text})}
                />
                
                <TextInput
                  style={styles.input}
                  placeholder="お客様名"
                  value={editingReservation.customerName}
                  onChangeText={(text) => setEditingReservation({...editingReservation, customerName: text})}
                />
                
                <TextInput
                  style={styles.input}
                  placeholder="人数"
                  keyboardType="numeric"
                  value={editingReservation.customerCount.toString()}
                  onChangeText={(text) => setEditingReservation({...editingReservation, customerCount: parseInt(text) || 0})}
                />
                
                <TextInput
                  style={styles.input}
                  placeholder="希望テーブル"
                  value={editingReservation.tableNumber}
                  onChangeText={(text) => setEditingReservation({...editingReservation, tableNumber: text})}
                />
                
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="備考・特記事項"
                  value={editingReservation.notes}
                  onChangeText={(text) => setEditingReservation({...editingReservation, notes: text})}
                  multiline={true}
                  numberOfLines={3}
                />
                
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="事前メニューリクエスト"
                  value={editingReservation.menuRequests}
                  onChangeText={(text) => setEditingReservation({...editingReservation, menuRequests: text})}
                  multiline={true}
                  numberOfLines={3}
                />
              </ScrollView>
            )}
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setEditingReservation(null)}
              >
                <Text style={styles.cancelButtonText}>キャンセル</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.saveButton}
                onPress={updateReservation}
              >
                <Save size={16} color="#FFFFFF" />
                <Text style={styles.saveButtonText}>更新</Text>
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
  content: {
    flex: 1,
    padding: 15,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5E6D3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#8B4513',
  },
  weekHeader: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginBottom: 5,
    paddingVertical: 10,
  },
  weekDay: {
    flex: 1,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: 'bold',
    color: '#8B4513',
  },
  calendarGrid: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 5,
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  calendarDay: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    margin: 1,
    position: 'relative',
  },
  otherMonthDay: {
    opacity: 0.3,
  },
  todayDay: {
    backgroundColor: '#8B4513',
  },
  reservedDay: {
    backgroundColor: '#FEF3C7',
  },
  dayNumber: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333333',
  },
  otherMonthText: {
    color: '#CCCCCC',
  },
  todayText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  reservedText: {
    color: '#8B4513',
    fontWeight: 'bold',
  },
  reservationDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#EF4444',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reservationCount: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  todayReservations: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#8B4513',
    marginBottom: 15,
  },
  noReservations: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  noReservationsText: {
    fontSize: 16,
    color: '#666666',
    marginTop: 10,
  },
  reservationCard: {
    backgroundColor: '#F5E6D3',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  reservationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reservationTime: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#8B4513',
  },
  reservationCustomer: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    flex: 1,
    marginLeft: 10,
  },
  reservationActions: {
    flexDirection: 'row',
    gap: 8,
  },
  editReservationButton: {
    backgroundColor: '#FFFFFF',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteReservationButton: {
    backgroundColor: '#FFFFFF',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reservationDetails: {
    gap: 4,
  },
  reservationInfo: {
    fontSize: 14,
    color: '#666666',
  },
  reservationNotes: {
    fontSize: 12,
    color: '#8B4513',
    fontStyle: 'italic',
  },
  reservationMenu: {
    fontSize: 12,
    color: '#8B4513',
    fontStyle: 'italic',
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
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F5E6D3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBody: {
    padding: 20,
    maxHeight: 400,
  },
  selectedDateText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#8B4513',
    marginBottom: 15,
    textAlign: 'center',
    backgroundColor: '#F5E6D3',
    padding: 10,
    borderRadius: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    gap: 10,
  },
  cancelButton: {
    backgroundColor: '#E5E5E5',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666666',
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: '#8B4513',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 1,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginLeft: 6,
  },
});