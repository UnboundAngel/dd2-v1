import React, { useEffect, useState } from 'react';
import { Check, CheckSquare, Columns, Edit2, Image as ImageIcon, Layout, Plus, Trash2, User } from 'lucide-react';
import { GENERIC_ICONS } from '../constants';
import { HeroImage } from '../components/HeroImage';
import { Button, ConfirmationModal, InlineInput, Modal } from '../components/ui';
import type { Checklist, ChecklistItem, DataRegistry } from '../types';

const IconPicker = ({ onSelect, registry }: { onSelect: (iconId: string) => void; registry: DataRegistry }) => (
  <div className="grid grid-cols-6 gap-2 max-h-[300px] overflow-y-auto p-1">
    {GENERIC_ICONS.map(i => {
      const Icon = i.icon;
      return (
        <button key={i.id} onClick={() => onSelect(i.id)} className="aspect-square flex flex-col items-center justify-center p-2 rounded hover:bg-zinc-800 transition-colors gap-1 border border-transparent hover:border-zinc-700">
          <Icon size={24} className="text-zinc-300" />
          <span className="text-[10px] text-zinc-500 truncate w-full text-center">{i.label}</span>
        </button>
      );
    })}
    {registry.heroes.map(h => (
      <button key={h.id} onClick={() => onSelect(h.id)} className="aspect-square flex flex-col items-center justify-center p-1 rounded hover:bg-zinc-800 transition-colors gap-1 border border-transparent hover:border-zinc-700">
        <HeroImage
          hero={h}
          className="w-8 h-8 object-contain"
          fallback={<div className={`w-8 h-8 rounded-full ${h.color}`} />}
        />
        <span className="text-[10px] text-zinc-500 truncate w-full text-center">{h.name}</span>
      </button>
    ))}
  </div>
);

const ChecklistsPage = ({
  registry,
  setRegistry,
  focusListId,
  focusToken
}: {
  registry: DataRegistry;
  setRegistry: React.Dispatch<React.SetStateAction<DataRegistry>>;
  focusListId?: string | null;
  focusToken?: number;
}) => {
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [inputState, setInputState] = useState<{ type: 'section' | 'item' | 'title' | 'note' | 'image' | 'list-create'; listId?: string; sectionId?: string; itemId?: string; value?: string } | null>(null);
  const [confirmState, setConfirmState] = useState<{ type: 'delete-list' | 'delete-section'; listId: string; sectionId?: string } | null>(null);
  const [newItemType, setNewItemType] = useState<'note' | 'level' | 'hero'>('note');
  const [newListIcon, setNewListIcon] = useState<string>('gamepad');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    if (!selectedListId && registry.checklists.length > 0) {
      setSelectedListId(registry.checklists[0].id);
    }
  }, [registry.checklists]);

  useEffect(() => {
    if (!focusListId) return;
    setSelectedListId(focusListId);
    setIsSidebarOpen(true);
  }, [focusListId, focusToken]);

  const selectedList = registry.checklists.find(l => l.id === selectedListId);

  const getListIcon = (iconId?: string) => {
    const generic = GENERIC_ICONS.find(g => g.id === iconId);
    if (generic) return <generic.icon size={20} className="text-zinc-300" />;
    const hero = registry.heroes.find(h => h.id === iconId);
    if (hero) {
      return (
        <HeroImage
          hero={hero}
          className="w-5 h-5 object-contain"
          fallback={<div className={`w-5 h-5 rounded-full ${hero.color}`} />}
        />
      );
    }
    return <CheckSquare size={20} className="text-zinc-300" />;
  };

  const handleAddSection = (title: string) => {
    if (!selectedListId || !title.trim()) return setInputState(null);
    setRegistry(prev => ({
      ...prev,
      checklists: prev.checklists.map(list => list.id !== selectedListId ? list : {
        ...list, sections: [...list.sections, { id: `s_${Date.now()}`, title, items: [] }]
      })
    }));
    setInputState(null);
  };

  const handleAddItem = (label: string) => {
    if (!inputState?.sectionId || !selectedListId) return setInputState(null);
    const newItem: ChecklistItem = {
      id: `i_${Date.now()}`,
      label,
      isCompleted: false,
      type: newItemType,
      currentValue: newItemType === 'level' ? 0 : undefined,
      maxValue: newItemType === 'level' ? 10 : undefined,
      linkedHeroId: newItemType === 'hero' ? registry.heroes[0].id : undefined
    };

    setRegistry(prev => ({
      ...prev,
      checklists: prev.checklists.map(l => l.id !== selectedListId ? l : {
        ...l,
        sections: l.sections.map(s => s.id !== inputState.sectionId ? s : { ...s, items: [...s.items, newItem] })
      })
    }));
    setInputState(null);
  };

  const handleCreateList = (title: string) => {
    if (!title.trim()) return setInputState(null);
    const newList: Checklist = {
      id: `cl_${Date.now()}`,
      title,
      category: 'Custom',
      icon: newListIcon,
      sections: [{ id: 's1', title: 'To Do', items: [] }, { id: 's2', title: 'Done', items: [] }]
    };
    setRegistry(prev => ({ ...prev, checklists: [...prev.checklists, newList] }));
    setInputState(null);
    setSelectedListId(newList.id);
  };

  const updateItem = (listId: string, sectionId: string, itemId: string, updates: Partial<ChecklistItem>) => {
    setRegistry(prev => ({
      ...prev,
      checklists: prev.checklists.map(l => l.id !== listId ? l : {
        ...l,
        sections: l.sections.map(s => s.id !== sectionId ? s : {
          ...s,
          items: s.items.map(i => i.id !== itemId ? i : { ...i, ...updates })
        })
      })
    }));
  };

  const renderCard = (listId: string, sectionId: string, item: ChecklistItem) => {
    return (
      <div key={item.id} className="group bg-zinc-900 border border-zinc-800 rounded-lg p-3 hover:border-zinc-600 transition-all shadow-sm relative animate-in zoom-in-95 duration-200">
        <div className="flex items-start justify-between gap-2 mb-2">
           <div className="flex-1 font-medium text-zinc-200 text-sm">{item.label}</div>
           <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {editMode ? (
                  <button onClick={() => setRegistry(prev => ({...prev, checklists: prev.checklists.map(l => l.id !== listId ? l : { ...l, sections: l.sections.map(s => s.id !== sectionId ? s : { ...s, items: s.items.filter(i => i.id !== item.id) }) }) }))} className="text-zinc-500 hover:text-red-500"><Trash2 size={14} /></button>
                ) : (
                  <button onClick={() => setInputState({ type: 'note', listId, sectionId, itemId: item.id })} className="text-zinc-500 hover:text-yellow-500"><Edit2 size={14} /></button>
                )}
           </div>
        </div>

        <div className="space-y-2">

          {item.type === 'note' && (
            <div className="text-xs text-zinc-500 italic">{item.notes || 'No notes yet.'}</div>
          )}

          {item.type === 'level' && (
            <div className="flex items-center gap-2">
              <input type="number" value={item.currentValue} max={item.maxValue} className="w-12 bg-zinc-950 border border-zinc-800 rounded p-1 text-xs text-white text-center" onChange={(e) => updateItem(listId, sectionId, item.id, { currentValue: Number(e.target.value) })} />
              <span className="text-xs text-zinc-500">/ {item.maxValue}</span>
              <div className="flex-1 h-2 bg-zinc-800 rounded overflow-hidden">
                <div className="h-full bg-red-500 transition-all" style={{ width: `${((item.currentValue || 0) / (item.maxValue || 1)) * 100}%` }} />
              </div>
            </div>
          )}

          {item.type === 'hero' && (
            <div className="flex items-center gap-2">
              <select value={item.linkedHeroId} onChange={(e) => updateItem(listId, sectionId, item.id, { linkedHeroId: e.target.value })} className="bg-zinc-950 border border-zinc-800 rounded p-1 text-xs text-white">
                {registry.heroes.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
              </select>
              {registry.heroes.find(h => h.id === item.linkedHeroId)?.iconUrl ? (
                <HeroImage
                  hero={registry.heroes.find(h => h.id === item.linkedHeroId)}
                  className="w-6 h-6 object-contain"
                  fallback={<User size={14} className="text-zinc-500" />}
                />
              ) : (
                <User size={14} className="text-zinc-500" />
              )}
            </div>
          )}

          {item.imageUrl && (
            <img src={item.imageUrl} alt="Item" className="w-full h-24 object-cover rounded" />
          )}
        </div>

        {editMode && (
          <button
            onClick={() => setInputState({ type: 'image', listId, sectionId, itemId: item.id })}
            className="text-xs text-zinc-500 hover:text-white mt-2 flex items-center gap-1"
          >
            <ImageIcon size={12} /> {item.imageUrl ? 'Edit Img' : 'Add Img'}
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="flex h-full animate-in fade-in slide-in-from-left-4 duration-500">
      <div className={`border-r border-zinc-900 bg-zinc-950 p-5 flex flex-col transition-all ${isSidebarOpen ? 'w-80' : 'w-16'} overflow-y-auto`}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <CheckSquare size={20} className="text-red-500" />
            {isSidebarOpen && <span className="font-bold text-white">Collections</span>}
          </div>
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-zinc-500 hover:text-white"><Columns size={20} /></button>
        </div>

        {isSidebarOpen && (
          <>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs text-zinc-500 uppercase tracking-wider">Lists</span>
              <button onClick={() => setInputState({ type: 'list-create' })} className="text-zinc-400 hover:text-white"><Plus size={16} /></button>
            </div>
            <div className="space-y-2 flex-1 overflow-y-auto">
              {registry.checklists.map((list) => (
                <button key={list.id} onClick={() => setSelectedListId(list.id)} className={`w-full flex items-center gap-3 p-2 rounded-md transition-all ${selectedListId === list.id ? 'bg-red-900/20 border border-red-700' : 'bg-zinc-900/50 hover:bg-zinc-900 border border-transparent'}`}>
                  <div className="w-8 h-8 rounded bg-zinc-900 flex items-center justify-center">
                    {getListIcon(list.icon)}
                  </div>
                  <div className="flex-1 text-left">
                    <div className="text-sm font-medium text-zinc-200">{list.title}</div>
                    <div className="text-[10px] text-zinc-500">{list.sections.length} sections</div>
                  </div>
                </button>
              ))}
              {registry.checklists.length === 0 && (
                <div className="text-xs text-zinc-600 text-center py-8">No lists yet.</div>
              )}
            </div>
          </>
        )}
      </div>

      <div className="flex-1 p-6 overflow-y-auto">
        {selectedList ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">{selectedList.title}</h2>
                <div className="text-xs text-zinc-500 uppercase tracking-wider">{selectedList.category}</div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm" onClick={() => setEditMode(!editMode)} icon={editMode ? Check : Edit2}>{editMode ? 'Done' : 'Edit'}</Button>
                <Button variant="primary" size="sm" icon={Trash2} onClick={() => setConfirmState({ type: 'delete-list', listId: selectedList.id })} className="bg-red-900/50 hover:bg-red-900 border-none" />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {selectedList.sections.map(section => (
                <div key={section.id} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">{section.title}</h3>
                    {editMode && (
                      <button onClick={() => setConfirmState({ type: 'delete-section', listId: selectedList.id, sectionId: section.id })} className="text-xs text-zinc-500 hover:text-red-500">Delete</button>
                    )}
                  </div>

                  <div className="space-y-2">
                    {section.items.map(item => renderCard(selectedList.id, section.id, item))}
                    {editMode && (
                      <button onClick={() => setInputState({ type: 'item', listId: selectedList.id, sectionId: section.id })} className="w-full p-3 border border-dashed border-zinc-800 rounded-lg text-zinc-500 hover:border-red-500 hover:text-red-400 transition-colors flex items-center justify-center gap-2 text-xs">
                        <Plus size={16} /> Add Card
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {editMode && (
                <button onClick={() => setInputState({ type: 'section' })} className="w-full h-24 border border-dashed border-zinc-800 rounded-lg text-zinc-500 hover:border-red-500 hover:text-red-400 transition-colors flex flex-col items-center justify-center gap-2">
                  <Plus size={20} />
                  <span className="text-xs">Add Section</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center text-zinc-600">
            <Layout size={64} className="mb-4 opacity-20" />
            <h3 className="text-xl font-bold text-zinc-400">No List Selected</h3>
            <p className="text-sm text-zinc-600">Create a list to start tracking.</p>
          </div>
        )}
      </div>

      <Modal isOpen={inputState?.type === 'section'} onClose={() => setInputState(null)} title="Add New Section">
        <InlineInput autoFocus placeholder="New Column Title..." onSave={handleAddSection} onCancel={() => setInputState(null)} />
      </Modal>

      <Modal isOpen={inputState?.type === 'item'} onClose={() => setInputState(null)} title="Add New Item">
        <div className="space-y-4">
          <div>
            <label className="text-xs text-zinc-500 uppercase">Item Type</label>
            <div className="flex gap-2 mt-1">
              {(['note', 'level', 'hero'] as const).map(type => (
                <button key={type} onClick={() => setNewItemType(type)} className={`px-3 py-1 rounded text-xs border ${newItemType === type ? 'border-red-500 text-white bg-red-900/20' : 'border-zinc-800 text-zinc-500'}`}>{type}</button>
              ))}
            </div>
          </div>
          <InlineInput autoFocus placeholder="Enter label..." onSave={handleAddItem} onCancel={() => setInputState(null)} />
        </div>
      </Modal>

      <Modal isOpen={inputState?.type === 'note'} onClose={() => setInputState(null)} title="Edit Notes">
        <InlineInput value={selectedList?.sections.find(s => s.id === inputState?.sectionId)?.items.find(i => i.id === inputState?.itemId)?.notes} placeholder="Add notes..." onSave={(val: string) => { if (inputState) updateItem(inputState.listId!, inputState.sectionId!, inputState.itemId!, { notes: val }); setInputState(null); }} onCancel={() => setInputState(null)} />
      </Modal>

      <Modal isOpen={inputState?.type === 'image'} onClose={() => setInputState(null)} title="Add Image">
        <InlineInput allowFile value={selectedList?.sections.find(s => s.id === inputState?.sectionId)?.items.find(i => i.id === inputState?.itemId)?.imageUrl} placeholder="Paste image URL..." onSave={(val: string) => { if (inputState) updateItem(inputState.listId!, inputState.sectionId!, inputState.itemId!, { imageUrl: val }); setInputState(null); }} onCancel={() => setInputState(null)} />
      </Modal>

      <Modal isOpen={inputState?.type === 'list-create'} onClose={() => setInputState(null)} title="Create New Collection">
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-zinc-500 uppercase block mb-1">Collection Title</label>
            <input
              autoFocus
              className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-white focus:border-red-500 outline-none"
              placeholder="e.g. Chaos 8 Farming, Tower Upgrades"
              onKeyDown={(e) => { if (e.key === 'Enter') handleCreateList(e.currentTarget.value); }}
            />
          </div>
          <div>
            <label className="text-xs font-bold text-zinc-500 uppercase block mb-2">Select Icon</label>
            <IconPicker registry={registry} onSelect={(icon) => setNewListIcon(icon)} />
          </div>
       </div>
      </Modal>

      <ConfirmationModal
        isOpen={!!confirmState}
        onClose={() => setConfirmState(null)}
        onConfirm={() => {
          if (confirmState?.type === 'delete-list') {
            setRegistry(prev => ({ ...prev, checklists: prev.checklists.filter(l => l.id !== confirmState.listId) }));
            setSelectedListId(null);
          } else if (confirmState?.type === 'delete-section') {
            setRegistry(prev => ({ ...prev, checklists: prev.checklists.map(l => l.id !== confirmState.listId ? l : { ...l, sections: l.sections.filter(s => s.id !== confirmState.sectionId) }) }));
          }
          setConfirmState(null);
        }}
        title="Confirm Deletion"
        message="Are you sure? This cannot be undone."
      />
    </div>
  );
};

export default ChecklistsPage;
