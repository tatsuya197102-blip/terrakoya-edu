export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="relative">
        {/* 外側の円 */}
        <div className="w-16 h-16 border-4 border-blue-200 rounded-full animate-spin border-t-blue-600" />
        {/* 内側のアイコン */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xl">🎨</span>
        </div>
      </div>
      <p className="mt-4 text-gray-500 text-sm animate-pulse">
        読み込み中...
      </p>
    </div>
  );
}