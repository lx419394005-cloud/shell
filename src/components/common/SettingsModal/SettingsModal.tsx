import React, { useState, useEffect } from 'react';
import { Settings, Plus, Trash2, Key, Globe, Shield, Check, Info, Save, X, MessageSquare, Palette } from 'lucide-react';
import { Modal } from '../Modal/Modal';
import { Button } from '../Button/Button';
import { cn } from '@/utils/cn';
import { type ApiConfig } from '@/types';
import { saveApiConfigToDB, getAllApiConfigsFromDB, deleteApiConfigFromDB } from '@/utils/db';
import { getActiveApiConfig } from '@/utils/apiConfig';

export interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigsChange?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onConfigsChange,
}) => {
  const [configs, setConfigs] = useState<ApiConfig[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingConfig, setEditingConfig] = useState<ApiConfig | null>(null);
  const [activeChatApi, setActiveChatApi] = useState<ApiConfig | null>(null);
  const [activeImageApi, setActiveImageApi] = useState<ApiConfig | null>(null);
  
  const [formData, setFormData] = useState<Partial<ApiConfig>>({
    name: '',
    baseUrl: '',
    apiKey: '',
    isActive: true,
    type: 'all'
  });

  // 加载配置
  const loadConfigs = async () => {
    const data = await getAllApiConfigsFromDB();
    setConfigs(data);
    
    // 加载当前激活的配置
    const chatConfig = await getActiveApiConfig('chat');
    const imageConfig = await getActiveApiConfig('image');
    setActiveChatApi(chatConfig);
    setActiveImageApi(imageConfig);
  };

  useEffect(() => {
    if (isOpen) {
      loadConfigs();
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.baseUrl || !formData.apiKey) return;

    const newConfig: ApiConfig = {
      id: editingConfig?.id || Date.now().toString(),
      name: formData.name,
      baseUrl: formData.baseUrl,
      apiKey: formData.apiKey,
      isActive: formData.isActive ?? true,
      type: formData.type || 'all'
    };

    await saveApiConfigToDB(newConfig);
    setIsAdding(false);
    setEditingConfig(null);
    setFormData({ name: '', baseUrl: '', apiKey: '', isActive: true, type: 'all' });
    loadConfigs();
    onConfigsChange?.();
  };

  const handleDelete = async (id: string) => {
    if (confirm('确定要删除此配置吗？')) {
      await deleteApiConfigFromDB(id);
      loadConfigs();
      onConfigsChange?.();
    }
  };

  const toggleActive = async (config: ApiConfig) => {
    const updated = { ...config, isActive: !config.isActive };
    await saveApiConfigToDB(updated);
    loadConfigs();
    onConfigsChange?.();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="API 设置"
      size="2xl"
    >
      <div className="p-6 space-y-6">
        {/* 当前状态概览 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-[var(--color-primary-soft)] border border-[var(--color-primary)]/20">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="w-4 h-4 text-[var(--color-primary)]" />
              <span className="text-xs font-bold text-[var(--color-primary)] uppercase tracking-wider">当前对话 API</span>
            </div>
            <div className="space-y-1">
              <div className="text-sm font-bold text-[var(--color-text)]">
                {activeChatApi ? activeChatApi.name : '未配置'}
              </div>
              <div className="text-[10px] text-[var(--color-text-secondary)] truncate font-mono">
                {activeChatApi ? `${activeChatApi.apiKey.slice(0, 12)}***` : '请添加 API 配置'}
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100 dark:bg-indigo-500/10 dark:border-indigo-500/20">
            <div className="flex items-center gap-2 mb-2">
              <Palette className="w-4 h-4 text-indigo-500" />
              <span className="text-xs font-bold text-indigo-500 uppercase tracking-wider">当前绘图 API</span>
            </div>
            <div className="space-y-1">
              <div className="text-sm font-bold text-[var(--color-text)]">
                {activeImageApi ? activeImageApi.name : '未配置'}
              </div>
              <div className="text-[10px] text-[var(--color-text-secondary)] truncate font-mono">
                {activeImageApi ? `${activeImageApi.apiKey.slice(0, 12)}***` : '请添加 API 配置'}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-[var(--color-border)]">
          <div>
            <h3 className="text-lg font-bold text-[var(--color-text)]">API 管理</h3>
            <p className="text-sm text-[var(--color-text-secondary)]">添加你的自定义 API Key 和接口地址</p>
          </div>
          <Button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2"
            gradient={false}
          >
            <Plus className="w-4 h-4" />
            添加配置
          </Button>
        </div>

        {/* 配置列表 */}
        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
          {configs.length === 0 && !isAdding && (
            <div className="text-center py-12 bg-[var(--color-surface)] rounded-2xl border-2 border-dashed border-[var(--color-border)]">
              <Settings className="w-12 h-12 text-[var(--color-text-muted)] mx-auto mb-4 opacity-20" />
              <p className="text-[var(--color-text-secondary)]">暂无 API 配置</p>
            </div>
          )}

          {configs.map((config) => (
            <div
              key={config.id}
              className={cn(
                "p-4 rounded-2xl border transition-all group",
                config.isActive 
                  ? "bg-[var(--color-bg-card)] border-[var(--color-primary-soft)] shadow-sm" 
                  : "bg-[var(--color-surface)] border-[var(--color-border)] opacity-60"
              )}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "p-2 rounded-xl",
                    config.isActive ? "bg-[var(--color-primary-soft)] text-[var(--color-primary)]" : "bg-zinc-200 text-zinc-500"
                  )}>
                    {config.type === 'image' ? <Shield className="w-5 h-5" /> : <Globe className="w-5 h-5" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-[var(--color-text)]">{config.name}</h4>
                      <span className="text-[10px] px-2 py-0.5 bg-[var(--color-surface)] rounded-full text-[var(--color-text-secondary)] uppercase">
                        {config.type === 'all' ? '通用' : config.type === 'image' ? '绘图' : '聊天'}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--color-text-secondary)] truncate max-w-[240px] mt-1">{config.baseUrl}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => toggleActive(config)}
                    className={cn(
                      "p-2 rounded-full transition-colors",
                      config.isActive ? "text-[var(--color-primary)] hover:bg-[var(--color-primary-soft)]" : "text-zinc-400 hover:bg-zinc-100"
                    )}
                    title={config.isActive ? "停用" : "启用"}
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setEditingConfig(config);
                      setFormData(config);
                      setIsAdding(true);
                    }}
                    className="p-2 text-blue-500 hover:bg-blue-50 rounded-full transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(config.id)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 添加/编辑 表单 */}
        {(isAdding || editingConfig) && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
            <div className="bg-[var(--color-bg-card)] w-full max-w-md rounded-3xl shadow-2xl border border-[var(--color-border)] overflow-hidden animate-in fade-in zoom-in duration-200">
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-bold text-[var(--color-text)]">
                    {editingConfig ? '编辑配置' : '添加 API 配置'}
                  </h3>
                  <button 
                    type="button"
                    onClick={() => {
                      setIsAdding(false);
                      setEditingConfig(null);
                    }}
                    className="p-2 hover:bg-[var(--color-surface)] rounded-full transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-[var(--color-text-secondary)] uppercase mb-1.5 block">配置名称</label>
                    <input
                      required
                      type="text"
                      placeholder="例如：OpenAI, DeepSeek..."
                      className="w-full h-11 px-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl text-sm focus:border-[var(--color-primary)] outline-none"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[var(--color-text-secondary)] uppercase mb-1.5 block">API Base URL</label>
                    <div className="relative">
                      <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
                      <input
                        required
                        type="url"
                        placeholder="https://api.openai.com/v1"
                        className="w-full h-11 pl-10 pr-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl text-sm focus:border-[var(--color-primary)] outline-none"
                        value={formData.baseUrl}
                        onChange={e => setFormData({ ...formData, baseUrl: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[var(--color-text-secondary)] uppercase mb-1.5 block">API Key</label>
                    <div className="relative">
                      <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
                      <input
                        required
                        type="password"
                        placeholder="sk-..."
                        className="w-full h-11 pl-10 pr-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl text-sm focus:border-[var(--color-primary)] outline-none"
                        value={formData.apiKey}
                        onChange={e => setFormData({ ...formData, apiKey: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[var(--color-text-secondary)] uppercase mb-1.5 block">应用范围</label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['all', 'chat', 'image'] as const).map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setFormData({ ...formData, type: t })}
                          className={cn(
                            "py-2 rounded-xl text-xs font-bold border transition-all",
                            formData.type === t 
                              ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)]" 
                              : "bg-[var(--color-surface)] text-[var(--color-text-secondary)] border-[var(--color-border)] hover:border-[var(--color-primary)]"
                          )}
                        >
                          {t === 'all' ? '通用' : t === 'chat' ? '聊天' : '绘图'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <Button
                    type="button"
                    variant="ghost"
                    className="flex-1"
                    onClick={() => {
                      setIsAdding(false);
                      setEditingConfig(null);
                    }}
                  >
                    取消
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 flex items-center justify-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    保存配置
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="bg-blue-50 dark:bg-blue-500/10 p-4 rounded-2xl flex items-start gap-3 border border-blue-100 dark:border-blue-500/20">
          <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
          <div className="text-xs text-blue-600 dark:text-blue-400 leading-relaxed">
            <p className="font-bold mb-1">使用提示：</p>
            <p>1. 启用多个配置时，系统将优先尝试匹配类型的配置。</p>
            <p>2. API Key 会安全地保存在你本地的浏览器数据库中。</p>
            <p>3. 确保你的 API 服务支持 CORS 跨域请求，否则可能导致请求失败。</p>
          </div>
        </div>
      </div>
    </Modal>
  );
};
