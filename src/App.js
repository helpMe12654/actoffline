const React = window.React
const { useState, useEffect, useRef } = React

const API = 'https://actoffline.onrender.com/api'

// Простые стили для красоты
const styles = {
  container: { fontFamily: 'Arial, sans-serif', maxWidth: 600, margin: '0 auto', padding: 20 },
  header: { background: '#2196F3', color: '#fff', padding: 15, borderRadius: 8, marginBottom: 20, textAlign: 'center' },
  card: { background: '#fff', border: '1px solid #ddd', borderRadius: 8, padding: 15, marginBottom: 15, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' },
  button: { background: '#4CAF50', color: 'white', border: 'none', padding: '10px 15px', borderRadius: 5, cursor: 'pointer', fontSize: 14, marginRight: 10 },
  buttonRed: { background: '#f44336', color: 'white', border: 'none', padding: '10px 15px', borderRadius: 5, cursor: 'pointer', fontSize: 14 },
  buttonGray: { background: '#9e9e9e', color: 'white', border: 'none', padding: '10px 15px', borderRadius: 5, cursor: 'pointer', fontSize: 14 },
  input: { width: '100%', padding: 10, marginTop: 5, marginBottom: 15, border: '1px solid #ccc', borderRadius: 5, boxSizing: 'border-box', fontSize: 16 },
  status: { display: 'inline-block', padding: '3px 8px', borderRadius: 12, fontSize: 12, color: '#fff', marginLeft: 10 },
  offlineBadge: { background: '#FF9800', color: '#fff', padding: '10px', borderRadius: 5, marginBottom: 15, textAlign: 'center', fontWeight: 'bold' }
}

export default function App() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedTask, setSelectedTask] = useState(null)
  const [syncMessage, setSyncMessage] = useState('')
  const [offlineCount, setOfflineCount] = useState(0)

  const loadTasks = () => {
    if (!navigator.onLine) { setLoading(false); return }
    fetch(`${API}/tasks`)
      .then((r) => r.json())
      .then((data) => { setTasks(data); setLoading(false) })
      .catch((err) => { if (navigator.onLine) setError(err.message); setLoading(false) })
  }

  const checkOffline = () => {
    const queue = JSON.parse(localStorage.getItem('offlineActs') || '[]')
    setOfflineCount(queue.length)
  }

  useEffect(() => {
    loadTasks()
    checkOffline()
    const handleOnline = () => syncOfflineActs()
    window.addEventListener('online', handleOnline)
    return () => window.removeEventListener('online', handleOnline)
  }, [])

  const syncOfflineActs = async () => {
    const queue = JSON.parse(localStorage.getItem('offlineActs') || '[]')
    if (queue.length === 0) return
    setSyncMessage('Синхронизация...')
    let successCount = 0
    for (const act of queue) {
      try {
        const res = await fetch(`${API}/acts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(act),
        })
        if (res.ok) successCount++
      } catch (e) { console.error(e) }
    }
    const remaining = queue.slice(successCount)
    localStorage.setItem('offlineActs', JSON.stringify(remaining))
    setOfflineCount(remaining.length)
    setSyncMessage(`Синхронизировано: ${successCount}`)
    loadTasks()
    setTimeout(() => setSyncMessage(''), 3000)
  }

  const clearQueue = () => {
    localStorage.removeItem('offlineActs')
    checkOffline()
    setSyncMessage('Очередь очищена')
    setTimeout(() => setSyncMessage(''), 3000)
  }

  if (loading) return <div style={styles.container}>Загрузка...</div>
  if (error) return <div style={styles.container}>Ошибка: {error}</div>

  if (selectedTask) {
    return (
      <ActForm
        task={selectedTask}
        onClose={() => {
          setSelectedTask(null)
          loadTasks()
          setTimeout(() => checkOffline(), 100)
        }}
      />
    )
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={{ margin: 0 }}>АктОффлайн</h1>
      </div>

      {offlineCount > 0 && (
        <div style={styles.offlineBadge}>
          Ожидают синхронизации: {offlineCount} актов
        </div>
      )}

      <div style={{ marginBottom: 20 }}>
        <button style={styles.button} onClick={syncOfflineActs} disabled={offlineCount === 0}>
          Синхронизировать
        </button>
        {offlineCount > 0 && (
          <button style={styles.buttonRed} onClick={clearQueue}>
            Очистить
          </button>
        )}
        {syncMessage && <span style={{ marginLeft: 10, color: 'green', fontWeight: 'bold' }}>{syncMessage}</span>}
      </div>

      <h2>Задания</h2>
      {tasks.length === 0 && <p>Заданий нет</p>}
      
      {tasks.map((task) => (
        <div key={task.id} style={styles.card}>
          <div style={{ fontWeight: 'bold', fontSize: 18 }}>{task.address}</div>
          <div style={{ color: '#666', marginTop: 5 }}>{task.clientName}</div>
          <div style={{ marginTop: 10 }}>
            <span style={{ ...styles.status, background: task.status === 'done' ? '#4CAF50' : '#2196F3' }}>
              {task.status === 'done' ? 'Выполнено' : 'В ожидании'}
            </span>
          </div>
          <button style={{ ...styles.button, marginTop: 15 }} onClick={() => setSelectedTask(task)}>
            Заполнить акт
          </button>
        </div>
      ))}
    </div>
  )
}

function ActForm({ task, onClose }) {
  const [clientFio, setClientFio] = useState(task.clientName)
  const [works, setWorks] = useState('')
  const [amount, setAmount] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  
  const canvasRef = useRef(null)
  const isDrawing = useRef(false)

  const startDrawing = (e) => {
    isDrawing.current = true
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const rect = canvas.getBoundingClientRect()
    const x = (e.clientX || e.touches[0].clientX) - rect.left
    const y = (e.clientY || e.touches[0].clientY) - rect.top
    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  const draw = (e) => {
    if (!isDrawing.current) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const rect = canvas.getBoundingClientRect()
    const x = (e.clientX || e.touches[0].clientX) - rect.left
    const y = (e.clientY || e.touches[0].clientY) - rect.top
    ctx.lineTo(x, y)
    ctx.stroke()
  }

  const stopDrawing = () => { isDrawing.current = false }

  const clearCanvas = () => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)
  }

  const handleSave = async () => {
    if (!clientFio || !works || !amount) { setMessage('Заполните все поля'); return }
    const canvas = canvasRef.current
    const blank = document.createElement('canvas')
    blank.width = canvas.width
    blank.height = canvas.height
    if (canvas.toDataURL() === blank.toDataURL()) { setMessage('Поставьте подпись'); return }

    const signatureBase64 = canvas.toDataURL('image/png')
    const act = {
      taskId: task.id,
      clientFio,
      works: [{ description: works }],
      totalAmount: Number(amount),
      signatureBase64,
      createdAt: new Date().toISOString(),
    }

    setSaving(true)
    setMessage('')

    if (navigator.onLine) {
      try {
        await fetch(`${API}/acts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(act),
        })
        setMessage('Акт сохранён на сервере')
      } catch (e) {
        saveOffline(act)
        setMessage('Нет связи с сервером. Акт сохранён офлайн.')
      }
    } else {
      saveOffline(act)
      setMessage('Нет интернета. Акт сохранён офлайн.')
    }
    setSaving(false)
  }

  const saveOffline = (act) => {
    const queue = JSON.parse(localStorage.getItem('offlineActs') || '[]')
    queue.push(act)
    localStorage.setItem('offlineActs', JSON.stringify(queue))
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={{ margin: 0 }}>Заполнение акта</h2>
      </div>
      
      <button style={styles.buttonGray} onClick={onClose}>← Назад к списку</button>
      
      <div style={{ ...styles.card, marginTop: 15 }}>
        <p><strong>Адрес:</strong> {task.address}</p>

        <label>ФИО клиента</label>
        <input style={styles.input} value={clientFio} onChange={(e) => setClientFio(e.target.value)} />

        <label>Перечень работ</label>
        <textarea style={{ ...styles.input, height: 60 }} value={works} onChange={(e) => setWorks(e.target.value)} />

        <label>Сумма (руб.)</label>
        <input style={styles.input} type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />

        <label>Подпись клиента</label>
        <div style={{ border: '2px dashed #ccc', borderRadius: 5, width: 300, height: 150, background: '#fafafa', marginTop: 5 }}>
          <canvas
            ref={canvasRef}
            width={300}
            height={150}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
            style={{ touchAction: 'none' }}
          />
        </div>
        <button style={{ ...styles.buttonGray, marginTop: 10 }} onClick={clearCanvas}>Очистить подпись</button>
      </div>

      <button style={styles.button} onClick={handleSave} disabled={saving}>
        {saving ? 'Сохранение...' : 'Сохранить акт'}
      </button>

      {message && <p style={{ color: '#4CAF50', fontWeight: 'bold' }}>{message}</p>}
    </div>
  )
}