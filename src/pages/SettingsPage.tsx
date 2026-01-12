import React, { useRef, useState } from 'react';
import { Settings, Upload } from 'lucide-react';
import { Button, Card, ThemedSelect } from '../components/ui';
const SettingsPage = ({
  onImport,
  fontChoice,
  onFontChange,
  fontOptions
}: {
  onImport: (data: any) => void;
  fontChoice: string;
  onFontChange: (value: string) => void;
  fontOptions: { id: string; label: string; stack: string }[];
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<string>('');

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    setStatus('Reading files...');

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string);
          let type = 'unknown';

          if (file.name.includes('defenses') || (data.towers && Array.isArray(data.towers))) type = 'towers';
          else if (file.name.includes('shards') || (data.shards && Array.isArray(data.shards))) type = 'shards';
          else if (file.name.includes('mods') || (data.mods && Array.isArray(data.mods))) type = 'mods';
          else if (file.name.includes('materials')) type = 'towers';

          if (Array.isArray(data)) {
             if (data[0]?.hero) type = 'mods';
             if (data[0]?.upgradeLevels) type = 'shards';
             if (data[0]?.base_def_power) type = 'towers';
          }

          console.log(`Importing ${file.name} as ${type}`);
          onImport({ type, data, filename: file.name });
          setStatus(`Imported ${file.name}`);
        } catch (err) {
          console.error('JSON Parse Error', err);
          setStatus(`Error parsing ${file.name}`);
        }
      };
      reader.readAsText(file);
    });
  };

  return (
    <div className="p-8 max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
            <Settings className="text-red-500" />
            Settings
          </h1>
          <p className="text-zinc-400">Import and export your data.</p>
        </div>
      </div>

      <Card>
        <h3 className="text-lg font-bold text-white mb-2">Import Data</h3>
        <p className="text-zinc-400 text-sm mb-4">
          Import data from `.json` files. You can import towers, shards, and mods.
        </p>
        <div className="flex items-center gap-4">
          <Button
            variant="primary"
            icon={Upload}
            onClick={() => fileInputRef.current?.click()}
          >
            Select Files
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".json"
            className="hidden"
            onChange={handleFileUpload}
          />
          <span className="text-sm text-zinc-500">{status}</span>
        </div>
      </Card>

      <Card className="mt-6">
        <h3 className="text-lg font-bold text-white mb-2">Typography</h3>
        <p className="text-zinc-400 text-sm mb-4">
          Choose a code font for readability. The app will fall back if a font is not installed.
        </p>
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="w-full md:w-72">
            <ThemedSelect value={fontChoice} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => onFontChange(e.target.value)}>
              {fontOptions.map(option => (
                <option key={option.id} value={option.id}>{option.label}</option>
              ))}
            </ThemedSelect>
          </div>
          <span className="text-xs text-zinc-500">Applies instantly across the app.</span>
        </div>
        <div className="mt-4 text-sm text-zinc-400">
          Preview: The quick brown fox jumps over the lazy dog. 0123456789
        </div>
      </Card>
    </div>
  );
};

export default SettingsPage;
