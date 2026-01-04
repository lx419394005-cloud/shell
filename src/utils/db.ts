/**
 * 极简 IndexedDB 封装
 * 用于 PWA 大容量图片存储
 */

const DB_NAME = 'pics-ai-db';
const IMAGE_STORE = 'images';
const CHAT_STORE = 'chats';
const AGENT_STORE = 'agents';
const CONFIG_STORE = 'configs';
const DB_VERSION = 3;

/**
 * 初始化数据库
 */
const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // 图片存储
      if (!db.objectStoreNames.contains(IMAGE_STORE)) {
        db.createObjectStore(IMAGE_STORE, { keyPath: 'id' });
      }
      
      // 聊天会话存储
      if (!db.objectStoreNames.contains(CHAT_STORE)) {
        db.createObjectStore(CHAT_STORE, { keyPath: 'id' });
      }

      // 自定义 Agent 存储
      if (!db.objectStoreNames.contains(AGENT_STORE)) {
        db.createObjectStore(AGENT_STORE, { keyPath: 'id' });
      }

      // API 配置存储
      if (!db.objectStoreNames.contains(CONFIG_STORE)) {
        db.createObjectStore(CONFIG_STORE, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

/**
 * 通用的数据库操作封装
 */
const performAction = async <T>(storeName: string, mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, mode);
    const store = transaction.objectStore(storeName);
    const request = action(store);
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

/**
 * 保存图片到数据库
 */
export const saveImageToDB = async (item: any) => {
  return performAction(IMAGE_STORE, 'readwrite', (store) => store.put(item));
};

/**
 * 获取所有历史图片
 */
export const getAllImagesFromDB = async (): Promise<any[]> => {
  const results = await performAction<any[]>(IMAGE_STORE, 'readonly', (store) => store.getAll());
  return results.sort((a, b) => b.timestamp - a.timestamp);
};

/**
 * 删除图片
 */
export const deleteImageFromDB = async (id: string) => {
  return performAction(IMAGE_STORE, 'readwrite', (store) => store.delete(id));
};

/**
 * 清空所有图片
 */
export const clearAllImagesFromDB = async () => {
  return performAction(IMAGE_STORE, 'readwrite', (store) => store.clear());
};

/**
 * 聊天会话操作
 */
export const saveChatSessionToDB = async (session: any) => {
  return performAction(CHAT_STORE, 'readwrite', (store) => store.put(session));
};

export const getAllChatSessionsFromDB = async (): Promise<any[]> => {
  const results = await performAction<any[]>(CHAT_STORE, 'readonly', (store) => store.getAll());
  return results.sort((a, b) => b.updatedAt - a.updatedAt);
};

export const deleteChatSessionFromDB = async (id: string) => {
  return performAction(CHAT_STORE, 'readwrite', (store) => store.delete(id));
};

/**
 * Agent 操作
 */
export const saveAgentToDB = async (agent: any) => {
  return performAction(AGENT_STORE, 'readwrite', (store) => store.put(agent));
};

export const getAllAgentsFromDB = async (): Promise<any[]> => {
  return performAction<any[]>(AGENT_STORE, 'readonly', (store) => store.getAll());
};

export const deleteAgentFromDB = async (id: string) => {
  return performAction(AGENT_STORE, 'readwrite', (store) => store.delete(id));
};

/**
 * API 配置操作
 */
export const saveApiConfigToDB = async (config: any) => {
  return performAction(CONFIG_STORE, 'readwrite', (store) => store.put(config));
};

export const getAllApiConfigsFromDB = async (): Promise<any[]> => {
  return performAction<any[]>(CONFIG_STORE, 'readonly', (store) => store.getAll());
};

export const deleteApiConfigFromDB = async (id: string) => {
  return performAction(CONFIG_STORE, 'readwrite', (store) => store.delete(id));
};

/**
 * 清空数据库 (按 Store)
 */
export const clearStore = async (storeName: string) => {
  return performAction(storeName, 'readwrite', (store) => store.clear());
};

/**
 * 清空所有数据
 */
export const clearAllDB = async () => {
  await clearStore(IMAGE_STORE);
  await clearStore(CHAT_STORE);
  await clearStore(AGENT_STORE);
};
