import { useEffect, useState } from 'react';
import { useSupabase } from './useSupabase';
import { DatabaseService } from '@/lib/database';

export const useDatabase = () => {
  const { supabase, isLoading: supabaseLoading } = useSupabase();
  const [database, setDatabase] = useState<DatabaseService | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [migrationCompleted, setMigrationCompleted] = useState(false);

  useEffect(() => {
    const initDatabase = async () => {
      try {
        console.log('データベース初期化開始...');
        if (supabase) {
          console.log('Supabaseクライアントが利用可能です');
          const db = new DatabaseService(supabase);
          // 初期データを投入
          await db.seedInitialData();
          setDatabase(db);
          setError(null);
          console.log('データベース初期化完了');
        } else {
          console.log('Supabaseクライアントが利用できません');
          setDatabase(null);
        }
      } catch (err) {
        console.error('Database initialization error:', err);
        setError(err instanceof Error ? err.message : 'データベース初期化エラー');
        setDatabase(null);
      } finally {
        setIsLoading(false);
      }
    };

    if (!supabaseLoading) {
      initDatabase();
    }
  }, [supabase, supabaseLoading]);

  const migrateMockData = async (mockTables: any[], mockMenuItems: any[], mockOrderHistory: any[]) => {
    if (!database) {
      throw new Error('データベースが初期化されていません');
    }
    
    try {
      await database.migrateMockDataToSupabase(mockTables, mockMenuItems, mockOrderHistory);
      setMigrationCompleted(true);
      return true;
    } catch (error) {
      console.error('モックデータ移行エラー:', error);
      throw error;
    }
  };
  return { 
    database, 
    isLoading: isLoading || supabaseLoading, 
    error,
    isConnected: !!database,
    migrateMockData,
    migrationCompleted
  };
};