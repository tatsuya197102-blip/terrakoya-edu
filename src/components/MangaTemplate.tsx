import React, { useState } from 'react';

interface Panel {
  panelNumber: number;
  description: string;
  imageUrl?: string;
}

interface Story {
  id: number;
  title: string;
  panels: Panel[];
}

interface MangaTemplateProps {
  story: Story;
  onSave?: (panels: Panel[]) => void;
}

export default function MangaTemplate({ story, onSave }: MangaTemplateProps) {
  const [panels, setPanels] = useState<Panel[]>(story.panels);
  const [selectedPanel, setSelectedPanel] = useState<number>(0);

  const handleImageUpload = (panelIndex: number, file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const imageUrl = e.target?.result as string;
      const newPanels = [...panels];
      newPanels[panelIndex].imageUrl = imageUrl;
      setPanels(newPanels);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    onSave?.(panels);
  };

  const handleDownloadPDF = async () => {
    // PDFダウンロード機能（html2canvas + jsPDF）
    const html2canvas = (await import('html2canvas')).default;
    const jsPDF = (await import('jspdf')).jsPDF;

    const element = document.getElementById(`manga-${story.id}`);
    if (!element) return;

    const canvas = await html2canvas(element, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const imgWidth = 210;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
    pdf.save(`${story.title}.pdf`);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 border-4 border-orange-400">
      <h2 className="text-2xl font-bold text-orange-600 mb-4">{story.title}</h2>

      {/* 4パネルグリッド */}
      <div
        id={`manga-${story.id}`}
        className="grid grid-cols-2 gap-4 mb-6 bg-gray-50 p-4 rounded"
      >
        {panels.map((panel, idx) => (
          <div
            key={idx}
            className={`border-4 border-black aspect-square bg-white flex flex-col items-center justify-center cursor-pointer transition-all ${
              selectedPanel === idx ? 'ring-4 ring-orange-500' : ''
            }`}
            onClick={() => setSelectedPanel(idx)}
          >
            {panel.imageUrl ? (
              <img
                src={panel.imageUrl}
                alt={`Panel ${panel.panelNumber}`}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-center p-4">
                <p className="text-sm font-bold text-gray-700 mb-2">
                  Panel {panel.panelNumber}
                </p>
                <p className="text-xs text-gray-600 mb-4">{panel.description}</p>
                <label className="cursor-pointer">
                  <span className="bg-orange-400 text-white px-3 py-1 rounded text-sm font-bold hover:bg-orange-500">
                    絵を描く
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        handleImageUpload(idx, e.target.files[0]);
                      }
                    }}
                  />
                </label>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* パネル詳細表示 */}
      <div className="bg-orange-50 border-2 border-orange-300 rounded p-4 mb-4">
        <p className="font-bold text-gray-700">Panel {panels[selectedPanel].panelNumber}</p>
        <p className="text-gray-600 mt-1">{panels[selectedPanel].description}</p>
      </div>

      {/* 保存・ダウンロード */}
      <div className="flex gap-3">
        <button
          onClick={handleSave}
          className="flex-1 bg-orange-400 text-white font-bold py-2 px-4 rounded hover:bg-orange-500 transition"
        >
          💾 保存する
        </button>
        <button
          onClick={handleDownloadPDF}
          className="flex-1 bg-blue-400 text-white font-bold py-2 px-4 rounded hover:bg-blue-500 transition"
        >
          📥 PDFでダウンロード
        </button>
      </div>
    </div>
  );
}
