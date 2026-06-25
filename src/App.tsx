function App() {
  return (
    <div className="min-h-screen bg-baby-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
        <div className="text-6xl mb-4">🍼</div>
        <h1 className="text-2xl font-bold text-baby-700 mb-2">
          宝宝饮食记录
        </h1>
        <p className="text-gray-500 mb-6">
          项目初始化完成，等待功能设计
        </p>
        <div className="bg-baby-100 rounded-xl p-4 text-left text-sm text-baby-800">
          <p className="font-semibold mb-2">📋 技术栈</p>
          <ul className="space-y-1 list-disc list-inside">
            <li>Vite + React 18 + TypeScript</li>
            <li>Tailwind CSS（快速出 UI）</li>
            <li>移动端优先，PWA 就绪</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default App
