const React = window.React
const { useState, useEffect, useRef } = React

const API = 'https://actoffline.onrender.com/api'

const styles = {
  app: { fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif', backgroundColor: '#f4f7f6', minHeight: '100vh', paddingBottom: 40 },
  header: { backgroundColor: '#ffffff', padding: '15px 20px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 10 },
  logo: { fontSize: 20, fontWeight: 'bold', color: '#2196F3', margin: 0 },
  container: { maxWidth: 600, margin: '0 auto', padding: '20px' },
  tabs: { display: 'flex', marginBottom: 20, backgroundColor: '#e0e0e0', borderRadius: 8, padding: 4 },
  tab: { flex: 1, textAlign: 'center', padding: '10px 0', borderRadius: 6, cursor: 'pointer', fontWeight: 'bold', color: '#555', transition: '0.2s' },
  tabActive: { backgroundColor: '#fff', color: '#2196F3', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 20, marginBottom: 15, boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid #eaeaea' },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 5 },
  cardSub: { fontSize: 14, color: '#777', marginBottom: 15 },
  btnPrimary: { backgroundColor: '#2196F3', color: '#fff', border: 'none', padding: '12px 20px', borderRadius: 8, fontSize: 16, fontWeight: 'bold', cursor: 'pointer', width: '100%', transition: 'background 0.2s' },
  btnSuccess: { backgroundColor: '#4CAF50', color: '#fff', border: 'none', padding: '12px 20px', borderRadius: 8, fontSize: 16, fontWeight: 'bold', cursor: 'pointer', width: '100%' },
  input: { width: '100%', padding: '12px', marginBottom: 15, border: '1px solid #ccc', borderRadius: 8, fontSize: 16, boxSizing: 'border-box', outline: 'none' },
  label: { display: 'block', marginBottom: 5, fontWeight: 'bold', fontSize: 14, color: '#444' },
  badge: { display: 'inline-block', padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100, padding: 20 },
  modalContent: { backgroundColor: '#fff', borderRadius: 12, padding: 20, width: '100%', maxWidth: 400, boxShadow: '0 10px 25px rgba(0,0,0,0.2)' },
  offlineBar: { backgroundColor: '#FF9800', color: '#fff', padding: 10, textAlign: 'center', fontWeight: 'bold', position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 15 }
}

export default function App() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedTask, setSelectedTask] = useState(null)
  const [viewingTask, setViewingTask] = useState(null)
  const [offlineCount, setOfflineCount] = useState(0)
  const [syncMessage, setSyncMessage] = useState('')
  
  const [activeTab, setActiveTab] = useState('active')
  
  const [showAddModal, setShowAddModal] = useState(false)
  const [newAddress, setNewAddress] = useState('')
  const [newClient, setNewClient] = useState('')
  const [newWorks, setNewWorks] = useState('')
  const [clientType, setClientType] = useState('individual')
  const [companyCode, setCompanyCode] = useState('')

  const loadTasks = () => {
    if (!navigator.onLine) { setLoading(false); return }
    fetch(`${API}/tasks`)
      .then((r) => r.json())
      .then((data) => { setTasks(data); setLoading(false) })
      .catch(() => setLoading(false))
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
    setSyncMessage('')
    loadTasks()
  }

  const handleCreateTask = async () => {
    if (!newAddress || !newClient || !newWorks) return
    
    try {
      await fetch(`${API}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          address: newAddress, 
          clientName: newClient,
          type: clientType,
          companyCode: clientType === 'legal' ? companyCode : null,
          defaultWorks: newWorks
        })
      })
      setShowAddModal(false)
      setNewAddress('')
      setNewClient('')
      setNewWorks('')
      setCompanyCode('')
      setClientType('individual')
      loadTasks()
    } catch (e) {
      alert('Ошибка при создании задания')
    }
  }

  const handleDeleteTask = async (id) => {
    if (window.confirm('Вы уверены, что хотите удалить это задание?')) {
      try {
        await fetch(`${API}/tasks/${id}`, { method: 'DELETE' })
        loadTasks()
      } catch (e) {
        alert('Ошибка при удалении')
      }
    }
  }

  if (selectedTask) {
    return <ActForm task={selectedTask} onClose={() => { setSelectedTask(null); loadTasks(); checkOffline() }} />
  }

  if (viewingTask) {
    return <ViewAct task={viewingTask} onClose={() => setViewingTask(null)} />
  }

  const activeTasks = tasks.filter(t => t.status !== 'done')
  const doneTasks = tasks.filter(t => t.status === 'done')
  const currentTasks = activeTab === 'active' ? activeTasks : doneTasks

  return (
    <div style={styles.app}>
      <div style={styles.header}>
        <h1 style={styles.logo}>АктОффлайн</h1>
        <button style={{ ...styles.btnPrimary, width: 'auto', padding: '8px 15px', fontSize: 14 }} onClick={() => setShowAddModal(true)}>
          + Задание
        </button>
      </div>

      <div style={styles.container}>
        <div style={styles.tabs}>
          <div style={{ ...styles.tab, ...(activeTab === 'active' ? styles.tabActive : {}) }} onClick={() => setActiveTab('active')}>
            Активные ({activeTasks.length})
          </div>
          <div style={{ ...styles.tab, ...(activeTab === 'done' ? styles.tabActive : {}) }} onClick={() => setActiveTab('done')}>
            Выполненные ({doneTasks.length})
          </div>
        </div>

        {loading && <p style={{ textAlign: 'center', color: '#777' }}>Загрузка...</p>}
        {!loading && currentTasks.length === 0 && <p style={{ textAlign: 'center', color: '#777', marginTop: 40 }}>Заданий нет</p>}

        {currentTasks.map((task) => (
          <div key={task.id} style={styles.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <div style={styles.cardTitle}>
                  {task.clientName} 
                  {task.type === 'legal' && <span style={{fontSize: 12, color: '#2196F3', marginLeft: 5}}>(Юр. лицо)</span>}
                </div>
                <div style={styles.cardSub}>📍 {task.address}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10 }}>
                {task.status === 'done' ? (
                  <span style={{ ...styles.badge, backgroundColor: '#E8F5E9', color: '#4CAF50' }}>Выполнено</span>
                ) : (
                  <span style={{ ...styles.badge, backgroundColor: '#E3F2FD', color: '#2196F3' }}>В работе</span>
                )}
                <button 
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, padding: 0, opacity: 0.5 }}
                  title="Удалить задачу"
                  onClick={() => handleDeleteTask(task.id)}
                >
                  🗑️
                </button>
              </div>
            </div>
            {task.status !== 'done' ? (
              <button style={{ ...styles.btnPrimary, marginTop: 15 }} onClick={() => setSelectedTask(task)}>
                Заполнить акт
              </button>
            ) : (
              <button style={{ ...styles.btnPrimary, backgroundColor: '#f0f0f0', color: '#333', marginTop: 15 }} onClick={() => setViewingTask(task)}>
                Просмотреть акт
              </button>
            )}
          </div>
        ))}
      </div>

      {offlineCount > 0 && (
        <div style={styles.offlineBar}>
          <span>Не синхронизировано: {offlineCount}</span>
          <button style={{ ...styles.btnSuccess, width: 'auto', padding: '6px 12px', fontSize: 14 }} onClick={syncOfflineActs}>
            Синхронизировать
          </button>
        </div>
      )}

      {showAddModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h2 style={{ marginTop: 0, marginBottom: 20, fontSize: 20 }}>Новое задание</h2>
            
            <label style={styles.label}>Тип клиента</label>
            <div style={{ display: 'flex', gap: 10, marginBottom: 15 }}>
              <button 
                style={{ ...styles.input, marginBottom: 0, backgroundColor: clientType === 'individual' ? '#E3F2FD' : '#fff', borderColor: clientType === 'individual' ? '#2196F3' : '#ccc', cursor: 'pointer' }} 
                onClick={() => setClientType('individual')}
              >
                Физ. лицо
              </button>
              <button 
                style={{ ...styles.input, marginBottom: 0, backgroundColor: clientType === 'legal' ? '#E3F2FD' : '#fff', borderColor: clientType === 'legal' ? '#2196F3' : '#ccc', cursor: 'pointer' }} 
                onClick={() => setClientType('legal')}
              >
                Юр. лицо
              </button>
            </div>

            <label style={styles.label}>ФИО Клиента / Название</label>
            <input style={styles.input} value={newClient} onChange={e => setNewClient(e.target.value)} placeholder="Иванов Иван" />

            {clientType === 'legal' && (
              <>
                <label style={styles.label}>Код юр. лица (УНП)</label>
                <input style={styles.input} value={companyCode} onChange={e => setCompanyCode(e.target.value)} placeholder="123456789" />
              </>
            )}

            <label style={styles.label}>Адрес</label>
            <input style={styles.input} value={newAddress} onChange={e => setNewAddress(e.target.value)} placeholder="ул. Ленина, д. 1" />

            <label style={styles.label}>Наименование работ</label>
            <textarea style={{ ...styles.input, height: 60 }} value={newWorks} onChange={e => setNewWorks(e.target.value)} placeholder="Что нужно сделать..." />
            
            <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
              <button style={{ ...styles.btnPrimary, backgroundColor: '#ccc', color: '#333' }} onClick={() => setShowAddModal(false)}>Отмена</button>
              <button style={styles.btnSuccess} onClick={handleCreateTask}>Создать</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ActForm({ task, onClose }) {
  const [clientFio, setClientFio] = useState(task.clientName)
  const [works, setWorks] = useState(task.defaultWorks || '')
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
        setMessage('Успешно сохранено на сервере')
      } catch (e) {
        saveOffline(act)
        setMessage('Ошибка сети. Сохранено офлайн.')
      }
    } else {
      saveOffline(act)
      setMessage('Нет интернета. Сохранено офлайн.')
    }
    setSaving(false)
  }

  const saveOffline = (act) => {
    const queue = JSON.parse(localStorage.getItem('offlineActs') || '[]')
    queue.push(act)
    localStorage.setItem('offlineActs', JSON.stringify(queue))
  }

  return (
    <div style={styles.app}>
      <div style={styles.header}>
        <button style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', padding: 0 }} onClick={onClose}>←</button>
        <h2 style={{ margin: 0, fontSize: 18 }}>Новый акт</h2>
        <div style={{ width: 24 }}></div>
      </div>

      <div style={styles.container}>
        <div style={styles.card}>
          <p style={{ margin: '0 0 15px 0', color: '#777' }}>Задание: <strong>{task.address}</strong></p>

          <label style={styles.label}>ФИО клиента / Название</label>
          <input style={styles.input} value={clientFio} onChange={(e) => setClientFio(e.target.value)} />

          {task.type === 'legal' && task.companyCode && (
            <p style={{ margin: '-10px 0 15px 0', fontSize: 14, color: '#777' }}>УНП: {task.companyCode}</p>
          )}

          <label style={styles.label}>Перечень работ</label>
          <textarea style={{ ...styles.input, height: 80, resize: 'vertical' }} value={works} onChange={(e) => setWorks(e.target.value)} placeholder="Опишите выполненные работы..." />

          <label style={styles.label}>Сумма (руб.)</label>
          <input style={styles.input} type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />

          <label style={styles.label}>Подпись клиента</label>
          <div style={{ border: '2px dashed #ccc', borderRadius: 8, width: '100%', height: 200, background: '#fafafa', marginTop: 5, marginBottom: 10, overflow: 'hidden' }}>
            <canvas
              ref={canvasRef}
              width={400}
              height={200}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              style={{ touchAction: 'none', width: '100%', height: '100%' }}
            />
          </div>
          <button style={{ background: 'none', border: 'none', color: '#2196F3', cursor: 'pointer', padding: 0, fontSize: 14, marginBottom: 20 }} onClick={clearCanvas}>Очистить подпись</button>
        </div>

        <button style={styles.btnSuccess} onClick={handleSave} disabled={saving}>
          {saving ? 'Сохранение...' : 'Сохранить акт'}
        </button>

        {message && <p style={{ textAlign: 'center', color: message.includes('офлайн') ? '#FF9800' : '#4CAF50', fontWeight: 'bold', marginTop: 15 }}>{message}</p>}
      </div>
    </div>
  )
}

function ViewAct({ task, onClose }) {
  const [act, setAct] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${API}/tasks/${task.id}/act`)
      .then(r => r.json())
      .then(data => { setAct(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [task.id])

  return (
    <div style={styles.app}>
      <div style={styles.header}>
        <button style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', padding: 0 }} onClick={onClose}>←</button>
        <h2 style={{ margin: 0, fontSize: 18 }}>Просмотр акта</h2>
        <div style={{ width: 24 }}></div>
      </div>

      <div style={styles.container}>
        {loading ? (
          <p style={{ textAlign: 'center' }}>Загрузка данных...</p>
        ) : act ? (
          <div style={styles.card}>
            <h3 style={{ marginTop: 0, color: '#2196F3' }}>Акт выполнен</h3>
            <p><strong>Клиент:</strong> {act.clientFio}</p>
            {task.type === 'legal' && task.companyCode && <p style={{marginTop: -10}}><strong>УНП:</strong> {task.companyCode}</p>}
            <p><strong>Сумма:</strong> {act.totalAmount} руб.</p>
            
            <p><strong>Работы:</strong></p>
            <div style={{ background: '#f9f9f9', padding: 10, borderRadius: 5, marginBottom: 15 }}>
              {act.works.map((w, i) => <div key={i}>- {w.description}</div>)}
            </div>

            <p><strong>Подпись:</strong></p>
            <img src={act.signatureBase64} alt="Подпись" style={{ width: '100%', border: '1px solid #ccc', borderRadius: 8, background: '#fafafa' }} />
            
            <p style={{ fontSize: 12, color: '#999', marginTop: 15 }}>
              Дата: {new Date(act.createdAt).toLocaleString()}
            </p>
          </div>
        ) : (
          <p style={{ textAlign: 'center', color: '#f44336' }}>Акт не найден (возможно, он еще не синхронизирован)</p>
        )}
      </div>
    </div>
  )
}