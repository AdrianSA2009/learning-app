import { useState, useEffect } from 'react';
import { LayoutDashboard, BookOpen, LogOut, Bell, CheckCircle2, Clock, AlertTriangle, Loader2, Upload, X, Send, Filter, ArrowLeft, FileText, ChevronRight, CheckSquare, Plus, Trash2, Calendar, AlertCircle, Check, Sun, Moon, Menu } from 'lucide-react';
import CourseFilterSettings from './CourseFilterSettings';

function App() {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    try {
      const saved = localStorage.getItem('theme');
      return saved ? saved === 'dark' : true; // default dark
    } catch (e) {
      return true;
    }
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const [session, setSession] = useState(null);
  const [statusData, setStatusData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [submitModal, setSubmitModal] = useState(null); // { id, name }
  const [submitText, setSubmitText] = useState('');
  const [submitFilePath, setSubmitFilePath] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');
  const [showFilter, setShowFilter] = useState(false);
  const [editModal, setEditModal] = useState(null);
  const [editText, setEditText] = useState('');
  const [editFilePath, setEditFilePath] = useState('');
  const [editing, setEditing] = useState(false);
  const [editError, setEditError] = useState('');
  const [editSuccess, setEditSuccess] = useState('');

  // States untuk Todo List
  const [todos, setTodos] = useState(() => {
    try {
      const saved = localStorage.getItem('todos');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const [newTodoTitle, setNewTodoTitle] = useState('');
  const [newTodoDesc, setNewTodoDesc] = useState('');
  const [newTodoDueDate, setNewTodoDueDate] = useState('');
  const [newTodoCourse, setNewTodoCourse] = useState('');
  const [todoFilter, setTodoFilter] = useState('all');
  const [todoSearch, setTodoSearch] = useState('');

  useEffect(() => {
    localStorage.setItem('todos', JSON.stringify(todos));
  }, [todos]);

  // Request Notification permission
  useEffect(() => {
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Notification engine untuk deadline 24j, 12j, 6j (hanya untuk tugas Moodle)
  useEffect(() => {
    const checkDeadlines = () => {
      const nowSec = Math.floor(Date.now() / 1000);
      let sent = {};
      try {
        sent = JSON.parse(localStorage.getItem('sent_deadline_notifications') || '{}');
      } catch (e) {
        sent = {};
      }
      let updated = false;

      // Pengecekan Tugas Moodle
      if (statusData?.allTasks) {
        statusData.allTasks.forEach(task => {
          if (task.isSubmitted || !task.duedate) return;
          const diffSec = task.duedate - nowSec;
          const hoursLeft = diffSec / 3600;
          const taskId = `moodle_${task.id}`;

          if (!sent[taskId]) {
            sent[taskId] = { '24h': false, '12h': false, '6h': false };
          }

          if (hoursLeft > 0) {
            let triggeredLevel = null;
            if (hoursLeft <= 24 && hoursLeft > 12 && !sent[taskId]['24h']) {
              triggeredLevel = '24j';
              sent[taskId]['24h'] = true;
            } else if (hoursLeft <= 12 && hoursLeft > 6 && !sent[taskId]['12h']) {
              triggeredLevel = '12j';
              sent[taskId]['12h'] = true;
              sent[taskId]['24h'] = true;
            } else if (hoursLeft <= 6 && hoursLeft > 0 && !sent[taskId]['6h']) {
              triggeredLevel = '6j';
              sent[taskId]['6h'] = true;
              sent[taskId]['12h'] = true;
              sent[taskId]['24h'] = true;
            }

            if (triggeredLevel) {
              updated = true;
              showDesktopNotification(
                `⏰ Tugas Moodle Mendekati Deadline (${triggeredLevel})`,
                `Tugas "${task.name}" (${task.course}) akan berakhir dalam kurang dari ${triggeredLevel}.`
              );
            }
          }
        });
      }

      if (updated) {
        localStorage.setItem('sent_deadline_notifications', JSON.stringify(sent));
      }
    };

    const showDesktopNotification = (title, body) => {
      if (typeof Notification !== 'undefined') {
        if (Notification.permission === 'granted') {
          new Notification(title, { body });
        }
      }
    };

    // Jalankan setiap 30 detik
    checkDeadlines();
    const interval = setInterval(checkDeadlines, 30000);
    return () => clearInterval(interval);
  }, [statusData]);

  const handleAddTodo = (e) => {
    e.preventDefault();
    if (!newTodoTitle.trim()) return;

    const newTodo = {
      id: Date.now().toString(),
      title: newTodoTitle.trim(),
      desc: newTodoDesc.trim(),
      dueDate: newTodoDueDate,
      course: newTodoCourse.trim(),
      isCompleted: false,
      createdAt: new Date().toISOString()
    };

    setTodos(prev => [newTodo, ...prev]);
    setNewTodoTitle('');
    setNewTodoDesc('');
    setNewTodoDueDate('');
    setNewTodoCourse('');
  };

  const handleToggleTodo = (id) => {
    setTodos(prev => prev.map(todo => {
      if (todo.id === id) {
        const nextStatus = !todo.isCompleted;
        if (nextStatus) {
          try {
            const sent = JSON.parse(localStorage.getItem('sent_deadline_notifications') || '{}');
            delete sent[`todo_${id}`];
            localStorage.setItem('sent_deadline_notifications', JSON.stringify(sent));
          } catch(e) {}
        }
        return { ...todo, isCompleted: nextStatus };
      }
      return todo;
    }));
  };

  const handleDeleteTodo = (id) => {
    setTodos(prev => prev.filter(todo => todo.id !== id));
    try {
      const sent = JSON.parse(localStorage.getItem('sent_deadline_notifications') || '{}');
      delete sent[`todo_${id}`];
      localStorage.setItem('sent_deadline_notifications', JSON.stringify(sent));
    } catch(e) {}
  };

  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'courses' | 'course-detail'
  const [coursesList, setCoursesList] = useState([]);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [coursesError, setCoursesError] = useState('');
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [courseDetailData, setCourseDetailData] = useState(null);
  const [courseDetailLoading, setCourseDetailLoading] = useState(false);
  const [courseDetailError, setCourseDetailError] = useState('');
  const [dashboardCourseFilter, setDashboardCourseFilter] = useState('all');

  const dashboardCourses = statusData?.allTasks
    ? Array.from(new Set(statusData.allTasks.map(t => t.course)))
    : [];

  const displayUrgentTasks = statusData
    ? (dashboardCourseFilter === 'all' ? statusData.urgentTasks : statusData.urgentTasks.filter(t => t.course === dashboardCourseFilter))
    : [];

  const displaySubmittedTasks = statusData
    ? (dashboardCourseFilter === 'all' ? statusData.submittedTasks : statusData.submittedTasks.filter(t => t.course === dashboardCourseFilter))
    : [];

  const displayAllTasksRaw = statusData
    ? (dashboardCourseFilter === 'all' ? statusData.allTasks : statusData.allTasks.filter(t => t.course === dashboardCourseFilter))
    : [];

  const now = Date.now() / 1000; // duedate dalam detik (Unix timestamp)

  const displayAllTasks = [...displayAllTasksRaw]
    .filter(t => !t.duedate || t.duedate >= now) // sembunyikan tugas yang sudah lewat deadline
    .sort((a, b) => {
      if (a.isSubmitted !== b.isSubmitted) {
        return a.isSubmitted ? 1 : -1;
      }
      const duedateA = a.duedate || Infinity;
      const duedateB = b.duedate || Infinity;
      return duedateA - duedateB;
    });

  const dynamicStats = statusData ? {
    total: displayAllTasks.length,
    sudah: displaySubmittedTasks.length,
    belum: displayAllTasks.filter(t => !t.isSubmitted).length,
    urgent: displayUrgentTasks.length,
    persen: displayAllTasks.length === 0 ? 0 : Math.round((displaySubmittedTasks.length / displayAllTasks.length) * 100)
  } : { total: 0, sudah: 0, belum: 0, urgent: 0, persen: 0 };

  useEffect(() => {
    checkExistingSession();
  }, []);

  const checkExistingSession = async () => {
    try {
      const result = await window.electronAPI.checkSession();
      if (result.success) {
        setSession(result.user);
        await fetchStatus();
      } else {
        console.log('Session expired, showing login screen');
        setSession(null);
      }
    } catch (err) {
      console.log('No existing session:', err.message);
      setSession(null);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setLoginError('');

    const result = await window.electronAPI.login(loginForm.username, loginForm.password);

    if (result.success) {
      setSession(result.user);
      fetchStatus();
    } else {
      setLoginError(result.error);
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await window.electronAPI.logout();
    setSession(null);
    setStatusData(null);
    setLoginForm({ username: '', password: '' });
  };

  const fetchStatus = async () => {
    setLoading(true);
    const result = await window.electronAPI.getStatus();

    if (result.success) {
      setStatusData(result.data);
    } else {
      if (result.tokenExpired) {
        setSession(null);
        setStatusData(null);
        setLoginError('Sesi sudah expired. Silakan login ulang.');
      } else {
        setLoginError(result.error);
      }
    }
    setLoading(false);
  };

  const loadAllCourses = async () => {
    setCoursesLoading(true);
    setCoursesError('');
    try {
      const result = await window.electronAPI.getCourses();
      if (result.success) {
        setCoursesList(result.data);
      } else {
        setCoursesError(result.error || 'Gagal memuat mata kuliah.');
      }
    } catch (err) {
      setCoursesError(err.message);
    }
    setCoursesLoading(false);
  };

  const viewCourseDetail = async (course) => {
    setSelectedCourse(course);
    setActiveTab('course-detail');
    setCourseDetailLoading(true);
    setCourseDetailError('');
    setCourseDetailData(null);
    try {
      const result = await window.electronAPI.getCourseDetail(course.id);
      if (result.success) {
        setCourseDetailData(result.data);
      } else {
        setCourseDetailError(result.error || 'Gagal memuat detail mata kuliah.');
      }
    } catch (err) {
      setCourseDetailError(err.message);
    }
    setCourseDetailLoading(false);
  };

  const handleOpenMaterial = async (url) => {
    try {
      await window.electronAPI.openMaterial(url);
    } catch (err) {
      alert('Gagal membuka materi: ' + err.message);
    }
  };

  const openSubmitModal = (task) => {
    setSubmitModal(task);
    setSubmitText('');
    setSubmitFilePath('');
    setSubmitError('');
    setSubmitSuccess('');
  };

  const closeSubmitModal = () => {
    setSubmitModal(null);
    setSubmitText('');
    setSubmitFilePath('');
    setSubmitError('');
    setSubmitSuccess('');
  };

  const handleChooseFile = async () => {
    try {
      const result = await window.electronAPI.chooseFile();
      if (result?.success && result.filePath) {
        setSubmitFilePath(result.filePath);
      }
    } catch (err) {
      setSubmitError('Gagal membuka dialog file: ' + err.message);
    }
  };

  const handleSubmitTask = async () => {
    if (!submitModal) return;
    setSubmitting(true);
    setSubmitError('');
    setSubmitSuccess('');

    try {
      let result;
      if (submitFilePath) {
        result = await window.electronAPI.submitFile(submitModal.id, submitFilePath);
      } else if (submitText.trim()) {
        result = await window.electronAPI.submitText(submitModal.id, submitText.trim());
      } else {
        setSubmitError('Isi teks atau pilih file terlebih dahulu.');
        setSubmitting(false);
        return;
      }

      if (result.success) {
        setSubmitSuccess('Tugas berhasil dikumpulkan!');
        await fetchStatus();
        setTimeout(() => closeSubmitModal(), 1200);
      } else {
        if (result.tokenExpired) {
          setSession(null);
          setStatusData(null);
          setSubmitModal(null);
          setLoginError('Sesi sudah expired. Silakan login ulang.');
        } else {
          setSubmitError(result.error || 'Gagal mengumpulkan tugas.');
        }
      }
    } catch (err) {
      setSubmitError(err.message);
    }
    setSubmitting(false);
  };

  const openEditModal = (task) => {
    setEditModal(task);
    setEditText('');
    setEditFilePath('');
    setEditError('');
    setEditSuccess('');
    setShowUncollectConfirm(false);
  };

  const closeEditModal = () => {
    setEditModal(null);
    setEditText('');
    setEditFilePath('');
    setEditError('');
    setEditSuccess('');
  };

  const handleChooseEditFile = async () => {
    try {
      const result = await window.electronAPI.chooseFile();
      if (result?.success && result.filePath) {
        setEditFilePath(result.filePath);
      }
    } catch (err) {
      setEditError('Gagal membuka dialog file: ' + err.message);
    }
  };

  const handleEditSubmit = async () => {
    if (!editModal) return;
    if (!editFilePath && !editText.trim()) {
      setEditError('Isi teks atau pilih file terlebih dahulu.');
      return;
    }
    setEditing(true);
    setEditError('');
    setEditSuccess('');
    try {
      let result;
      if (editFilePath) {
        result = await window.electronAPI.submitFile(editModal.id, editFilePath);
      } else {
        result = await window.electronAPI.submitText(editModal.id, editText.trim());
      }
      if (result.success) {
        setEditSuccess('Tugas berhasil diperbarui!');
        await fetchStatus();
        if (selectedCourse) {
          const r = await window.electronAPI.getCourseDetail(selectedCourse.id);
          if (r.success) setCourseDetailData(r.data);
        }
        setTimeout(() => closeEditModal(), 1200);
      } else {
        if (result.tokenExpired) {
          setSession(null); setStatusData(null); setEditModal(null);
          setLoginError('Sesi sudah expired. Silakan login ulang.');
        } else {
          setEditError(result.error || 'Gagal memperbarui tugas.');
        }
      }
    } catch (err) {
      setEditError(err.message);
    }
    setEditing(false);
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-[#181825] flex items-center justify-center p-4">
        <div className="bg-[#1e1e2e] p-8 rounded-2xl shadow-2xl w-full max-w-md border border-[#313244]">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/20">
              <BookOpen className="text-white" size={32} />
            </div>
            <h1 className="text-2xl font-bold text-white">Lany Desktop</h1>
            <p className="text-gray-400 mt-2">Login ke E-Learning untuk melanjutkan</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Username / NIM</label>
              <input
                type="text"
                required
                className="w-full bg-[#11111b] border border-[#313244] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary transition"
                placeholder="Masukkan NIM Anda"
                value={loginForm.username}
                onChange={(e) => setLoginForm({...loginForm, username: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Password</label>
              <input
                type="password"
                required
                className="w-full bg-[#11111b] border border-[#313244] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary transition"
                placeholder="Masukkan password"
                value={loginForm.password}
                onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
              />
            </div>

            {loginError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm">
                {loginError}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : 'Masuk'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#181825] overflow-hidden">
      {/* Sidebar Overlay for Mobile */}
      {isSidebarOpen && (
        <div 
          onClick={() => setIsSidebarOpen(false)} 
          className="fixed inset-0 bg-black/60 z-30 md:hidden"
        />
      )}

      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-[#1e1e2e] border-r border-[#313244] flex flex-col transition-transform duration-300 ease-in-out md:translate-x-0 md:static ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="p-6 flex items-center justify-between md:justify-start gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <BookOpen className="text-white" size={20} />
            </div>
            <h1 className="text-xl font-bold text-white">Lany Desktop</h1>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="p-1 text-[var(--text-muted)] hover:text-[var(--text-color)] md:hidden hover:bg-[var(--card-hover-bg)] rounded-lg"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          <button
            onClick={() => { setActiveTab('dashboard'); fetchStatus(); setIsSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
              activeTab === 'dashboard' ? 'bg-primary text-white font-bold' : 'text-gray-400 hover:text-white hover:bg-[#313244]'
            }`}
          >
            <LayoutDashboard size={20} /> Dashboard
          </button>
          
          <button
            onClick={() => { setActiveTab('courses'); loadAllCourses(); setIsSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
              activeTab === 'courses' || activeTab === 'course-detail' ? 'bg-primary text-white font-bold' : 'text-gray-400 hover:text-white hover:bg-[#313244]'
            }`}
          >
            <BookOpen size={20} /> Mata Kuliah
          </button>

          <button
            onClick={() => { setActiveTab('todo'); setIsSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
              activeTab === 'todo' ? 'bg-primary text-white font-bold' : 'text-gray-400 hover:text-white hover:bg-[#313244]'
            }`}
          >
            <CheckSquare size={20} /> Todo List
          </button>

          <button
            onClick={() => { setShowFilter(true); setIsSidebarOpen(false); }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-gray-400 hover:text-white hover:bg-[#313244]"
          >
            <Filter size={20} /> Filter Kelas
          </button>
        </nav>

        <div className="p-4 border-t border-[var(--border-color)]">
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-color)] hover:bg-[var(--card-hover-bg)] rounded-lg transition mb-4"
          >
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            <span>{isDarkMode ? 'Mode Terang' : 'Mode Gelap'}</span>
          </button>

          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-xs font-bold text-white">
              {session?.fullname?.charAt(0) || 'U'}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-[var(--text-color)] truncate">{session?.fullname || 'User'}</p>
              <p className="text-xs text-[var(--text-muted)] truncate">Online</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2 text-red-400 hover:bg-red-500/10 rounded-lg transition"
          >
            <LogOut size={18} /> Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        {/* Mobile Header / Top Bar */}
        <div className="flex items-center justify-between md:hidden mb-6 bg-[#1e1e2e] p-3 rounded-xl border border-[#313244]">
          <div className="flex items-center gap-2">
            <BookOpen className="text-primary" size={24} />
            <h1 className="text-lg font-bold text-white">Lany Desktop</h1>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-[#313244]"
          >
            <Menu size={24} />
          </button>
        </div>
        {activeTab === 'dashboard' && (
          <header className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
            <div>
              <h2 className="text-2xl font-bold text-white">Dashboard Tugas</h2>
              <p className="text-gray-400">Tugas dengan deadline 10 hari ke depan</p>
            </div>
            <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto">
              {statusData && dashboardCourses.length > 0 && (
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <span className="text-gray-400 text-sm font-medium shrink-0">Filter Matkul:</span>
                  <select
                    value={dashboardCourseFilter}
                    onChange={(e) => setDashboardCourseFilter(e.target.value)}
                    className="bg-[#1e1e2e] border border-[#313244] text-white rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-primary transition cursor-pointer w-full sm:w-auto"
                  >
                    <option value="all">Semua Mata Kuliah</option>
                    {dashboardCourses.map((course, idx) => (
                      <option key={idx} value={course}>{course}</option>
                    ))}
                  </select>
                </div>
              )}
              <button onClick={fetchStatus} className="p-2 bg-[#1e1e2e] rounded-lg hover:bg-[#313244] text-gray-400 hover:text-white transition hidden sm:inline-block">
                <Bell size={20} />
              </button>
            </div>
          </header>
        )}

        {activeTab === 'courses' && (
          <header className="mb-8">
            <h2 className="text-2xl font-bold text-white">Mata Kuliah Anda</h2>
            <p className="text-gray-400">Pilih mata kuliah untuk melihat seluruh tugas dan materi</p>
          </header>
        )}

        {activeTab === 'todo' && (
          <header className="mb-8">
            <h2 className="text-2xl font-bold text-white">Todo List Anda</h2>
            <p className="text-gray-400">Kelola tugas pribadi dan dapatkan notifikasi sistem sebelum deadline</p>
          </header>
        )}

        {activeTab === 'course-detail' && (
          <header className="mb-8">
            <button
              onClick={() => setActiveTab('courses')}
              className="flex items-center gap-2 text-primary hover:underline mb-4 font-medium"
            >
              <ArrowLeft size={16} /> Kembali ke Daftar Mata Kuliah
            </button>
            <h2 className="text-2xl font-bold text-white">{selectedCourse?.fullname}</h2>
            <p className="text-gray-400">{selectedCourse?.shortname}</p>
          </header>
        )}

        {loginError && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm mb-6">
            {loginError}
          </div>
        )}

        {activeTab === 'dashboard' && (
          loading && !statusData ? (
            <div className="flex items-center justify-center h-64 text-gray-400">
              <Loader2 className="animate-spin mr-2" /> Memuat data tugas...
            </div>
          ) : statusData ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <StatCard label="Total Tugas" value={dynamicStats.total} icon={BookOpen} color="blue" />
                <StatCard label="Sudah Dikumpul" value={dynamicStats.sudah} icon={CheckCircle2} color="green" />
                <StatCard label="Belum Dikumpul" value={dynamicStats.belum} icon={Clock} color="yellow" />
                <StatCard label="Deadline < 24 Jam" value={dynamicStats.urgent} icon={AlertTriangle} color="red" />
              </div>

              <div className="bg-[#1e1e2e] p-6 rounded-xl border border-[#313244]">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-lg font-bold text-white">Progress Pengumpulan</h3>
                  <span className="text-2xl font-bold text-primary">{dynamicStats.persen}%</span>
                </div>
                <div className="w-full h-4 bg-[#313244] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-green-400 transition-all duration-500"
                    style={{ width: `${dynamicStats.persen}%` }}
                  ></div>
                </div>
                <p className="text-gray-400 text-sm mt-2">
                  {dynamicStats.sudah} dari {dynamicStats.total} tugas telah dikumpulkan.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-[#1e1e2e] p-6 rounded-xl border border-[#313244]">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <AlertTriangle className="text-red-400" size={20} /> Segera Dikumpulkan
                  </h3>
                  {displayUrgentTasks.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">🎉 Tidak ada tugas urgent!</p>
                  ) : (
                    <div className="space-y-3 max-h-[400px] overflow-y-auto overflow-x-hidden pr-2">
                      {displayUrgentTasks.map((task, idx) => (
                        <div key={idx} className={`p-4 rounded-lg border ${task.isCritical ? 'bg-red-500/10 border-red-500/20' : 'bg-yellow-500/10 border-yellow-500/20'}`}>
                          <p className="text-white font-medium break-words">{task.name}</p>
                          <div className="flex justify-between items-center mt-2 text-sm">
                            <span className="text-gray-400">{task.course}</span>
                            <span className={task.isCritical ? 'text-red-400 font-bold' : 'text-yellow-400'}> {task.deadline}</span>
                          </div>
                          <button
                            onClick={() => openSubmitModal(task)}
                            className="mt-3 w-full flex items-center justify-center gap-2 bg-primary/20 hover:bg-primary/30 text-primary text-sm font-medium py-2 rounded-lg transition"
                          >
                            <Send size={16} /> Kumpulkan Sekarang
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="bg-[#1e1e2e] p-6 rounded-xl border border-[#313244]">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <CheckCircle2 className="text-green-400" size={20} /> Sudah Dikumpulkan
                  </h3>
                  {displaySubmittedTasks.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">Belum ada tugas yang dikumpul.</p>
                  ) : (
                    <div className="space-y-3 max-h-[400px] overflow-y-auto overflow-x-hidden pr-2">
                      {displaySubmittedTasks.map((task, idx) => (
                        <div key={idx} className="p-4 bg-green-500/5 border border-green-500/10 rounded-lg flex items-start gap-3">
                          <CheckCircle2 className="text-green-400 mt-1 flex-shrink-0" size={18} />

                          <div className="min-w-0 flex-1">
                            <p className="text-white font-medium text-sm break-words">{task.name}</p>
                            <p className="text-gray-500 text-xs mt-1 break-words">{task.course} • {task.deadline}</p>
                          </div>

                          <button
                            onClick={() => openEditModal(task)}
                            className="text-xs font-medium bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 px-3 py-1.5 rounded-lg transition shrink-0"
                          >
                            Edit
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Semua Tugas */}
              <div className="bg-[#1e1e2e] p-6 rounded-xl border border-[#313244]">
                <h3 className="text-lg font-bold text-white mb-4">📋 Semua Tugas (10 Hari Ke Depan)</h3>
                {displayAllTasks.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">Tidak ada tugas dalam 10 hari ke depan.</p>
                ) : (
                  <div className="space-y-2">
                    {displayAllTasks.map((task, idx) => (
                      <div key={idx} className={`p-4 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        task.isSubmitted ? 'bg-green-500/5 border-green-500/20' : 'bg-yellow-500/5 border-yellow-500/20'
                      }`}>
                        <div className="flex items-center gap-3 min-w-0">
                          {task.isSubmitted ? (
                            <CheckCircle2 className="text-green-400 shrink-0" size={20} />
                          ) : (
                            <Clock className="text-yellow-400 shrink-0" size={20} />
                          )}
                          <div className="min-w-0">
                            <p className="text-white font-medium truncate break-all" title={task.name}>{task.name}</p>
                            <p className="text-gray-400 text-sm">{task.course}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto mt-2 sm:mt-0 pt-2 sm:pt-0 border-t border-[var(--border-color)]/30 sm:border-0 shrink-0">
                          <span className={`text-sm font-medium ${
                            task.isSubmitted ? 'text-green-400' : 'text-yellow-400'
                          }`}>
                            {task.deadline}
                          </span>
                          {task.isSubmitted ? (
                            <button
                              onClick={() => openEditModal(task)}
                              className="text-xs font-semibold bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 px-3 py-1.5 rounded-lg transition"
                            >
                              Edit
                            </button>
                          ) : (
                            <button
                              onClick={() => openSubmitModal(task)}
                              className="text-xs font-semibold bg-primary/20 hover:bg-primary/30 text-primary px-3 py-1.5 rounded-lg transition"
                            >
                              Kumpulkan
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-400 mt-20">
              <p>Data tidak tersedia. Silakan refresh.</p>
            </div>
          )
        )}

        {activeTab === 'courses' && (
          coursesLoading ? (
            <div className="flex items-center justify-center h-64 text-gray-400">
              <Loader2 className="animate-spin mr-2" /> Memuat daftar mata kuliah...
            </div>
          ) : coursesError ? (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm">
              {coursesError}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {coursesList.map((course) => (
                <div
                  key={course.id}
                  onClick={() => viewCourseDetail(course)}
                  className="bg-[#1e1e2e] p-6 rounded-xl border border-[#313244] hover:border-primary/50 transition duration-300 cursor-pointer flex flex-col justify-between group hover:shadow-lg hover:shadow-primary/5"
                >
                  <div>
                    <div className="inline-block bg-primary/10 text-primary text-xs font-semibold px-2.5 py-1 rounded-md mb-4">
                      {course.shortname || 'Mata Kuliah'}
                    </div>
                    <h3 className="text-lg font-bold text-white group-hover:text-primary transition duration-300 break-words line-clamp-3">
                      {course.fullname}
                    </h3>
                  </div>
                  <div className="flex items-center justify-end mt-6 text-gray-500 group-hover:text-primary transition">
                    <span className="text-sm font-medium mr-1">Detail</span>
                    <ChevronRight size={16} className="transform group-hover:translate-x-1 transition duration-300" />
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {activeTab === 'course-detail' && (
          courseDetailLoading ? (
            <div className="flex items-center justify-center h-64 text-gray-400">
              <Loader2 className="animate-spin mr-2" /> Memuat detail mata kuliah...
            </div>
          ) : courseDetailError ? (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm">
              {courseDetailError}
            </div>
          ) : courseDetailData ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Kolom Tugas */}
              <div className="bg-[#1e1e2e] p-6 rounded-xl border border-[#313244] flex flex-col">
                <h3 className="text-lg font-bold text-white mb-4 font-bold flex items-center justify-between">
                  <span>📋 Daftar Tugas</span>
                  {selectedCourse && window.localStorage && (
                    <span className="text-xs text-gray-400 font-normal">
                      Sesuai filter aktif
                    </span>
                  )}
                </h3>
                {courseDetailData.assignments.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">🎉 Tidak ada tugas untuk mata kuliah ini.</p>
                ) : (
                  <div className="space-y-3 max-h-[500px] overflow-y-auto overflow-x-hidden pr-2">
                    {[...courseDetailData.assignments]
                      .sort((a, b) => {
                        const now = Date.now() / 1000;
                        const aOverdue = !a.isSubmitted && a.duedate && a.duedate < now;
                        const bOverdue = !b.isSubmitted && b.duedate && b.duedate < now;

                        // Grup: 0 = belum & belum lewat, 1 = sudah lewat, 2 = sudah dikumpul
                        const getGroup = (t, isOverdue) => {
                          if (t.isSubmitted) return 2;
                          if (isOverdue) return 1;
                          return 0;
                        };

                        const groupA = getGroup(a, aOverdue);
                        const groupB = getGroup(b, bOverdue);

                        if (groupA !== groupB) return groupA - groupB;

                        // Dalam grup yang sama: urutkan berdasarkan deadline terdekat
                        const duedateA = a.duedate || Infinity;
                        const duedateB = b.duedate || Infinity;
                        return duedateA - duedateB;
                      })
                      .map((task, idx) => {
                        const isOverdue = !task.isSubmitted && task.duedate && task.duedate < Date.now() / 1000;
                        const cardStyle = task.isSubmitted
                          ? 'bg-green-500/5 border-green-500/20 hover:bg-green-500/10'
                          : isOverdue
                          ? 'bg-gray-500/5 border-gray-500/20 hover:bg-gray-500/10'
                          : 'bg-red-500/5 border-red-500/20 hover:bg-red-500/10';
                        const badgeStyle = task.isSubmitted
                          ? 'bg-green-500/10 text-green-400'
                          : isOverdue
                          ? 'bg-gray-500/10 text-gray-400'
                          : 'bg-red-500/10 text-red-400';
                        const badgeLabel = task.isSubmitted ? 'Selesai' : isOverdue ? 'Sudah Lewat' : 'Belum Selesai';

                        return (
                        <div
                          key={idx}
                          className={`p-4 rounded-lg border flex flex-col transition duration-200 ${cardStyle}`}
                        >
                          <div className="flex justify-between items-start">
                            <p className="text-white font-medium break-words flex-1 pr-2">{task.name}</p>
                            <span className={`text-xs font-semibold px-2.5 py-1 rounded-md shrink-0 ${badgeStyle}`}>
                              {badgeLabel}
                            </span>
                          </div>
                          <div className="flex justify-between items-center mt-4">
                            <span className="text-gray-400 text-sm">{task.deadline}</span>
                            {task.isSubmitted ? (
                              <button
                                onClick={() => openEditModal(task)}
                                className="text-xs font-semibold bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 px-3.5 py-2 rounded-lg transition"
                              >
                                Edit
                              </button>
                            ) : (
                              <button
                                onClick={() => openSubmitModal(task)}
                                className="text-xs font-semibold bg-primary hover:bg-primary/90 text-white px-3.5 py-2 rounded-lg transition"
                              >
                                Kumpulkan
                              </button>
                            )}
                          </div>
                        </div>
                        );
                      })}
                  </div>
                )}
              </div>

              {/* Kolom Materi */}
              <div className="bg-[#1e1e2e] p-6 rounded-xl border border-[#313244] flex flex-col">
                <h3 className="text-lg font-bold text-white mb-4">📚 Materi & Dokumen (PDF/Word)</h3>
                {courseDetailData.materials.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">Tidak ada materi PDF atau Word untuk mata kuliah ini.</p>
                ) : (
                  <div className="space-y-3 max-h-[500px] overflow-y-auto overflow-x-hidden pr-2">
                    {courseDetailData.materials.map((material, idx) => (
                      <div
                        key={idx}
                        className="p-4 bg-[#181825] border border-[#313244] hover:border-primary/30 rounded-lg flex items-center justify-between transition duration-200"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1 mr-4">
                          <FileText className="text-primary shrink-0" size={24} />
                          <div className="min-w-0">
                            <p className="text-white font-medium text-sm truncate" title={material.name}>
                              {material.name}
                            </p>
                            <p className="text-gray-500 text-xs mt-0.5">{material.size} • {material.type.toUpperCase()}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleOpenMaterial(material.url)}
                          className="text-xs font-semibold bg-primary text-white hover:bg-primary/90 px-3.5 py-2 rounded-lg transition shrink-0"
                        >
                          Buka Materi
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : null
        )}

        {activeTab === 'todo' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* Form Tambah Todo */}
            <div className="lg:col-span-1 bg-[#1e1e2e] p-6 rounded-2xl border border-[#313244] shadow-xl">
              <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <Plus className="text-primary" size={20} /> Tambah Todo Baru
              </h3>
              <form onSubmit={handleAddTodo} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Judul Tugas <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Belajar UTS Matematika"
                    value={newTodoTitle}
                    onChange={(e) => setNewTodoTitle(e.target.value)}
                    className="w-full bg-[#11111b] border border-[#313244] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-primary transition"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Mata Kuliah / Kategori</label>
                  <input
                    type="text"
                    placeholder="Contoh: Kalkulus 2"
                    value={newTodoCourse}
                    onChange={(e) => setNewTodoCourse(e.target.value)}
                    className="w-full bg-[#11111b] border border-[#313244] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-primary transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Tenggat Waktu / Deadline</label>
                  <input
                    type="datetime-local"
                    value={newTodoDueDate}
                    onChange={(e) => setNewTodoDueDate(e.target.value)}
                    className="w-full bg-[#11111b] border border-[#313244] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-primary transition cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Keterangan / Detail</label>
                  <textarea
                    rows={3}
                    placeholder="Tambahkan catatan jika diperlukan..."
                    value={newTodoDesc}
                    onChange={(e) => setNewTodoDesc(e.target.value)}
                    className="w-full bg-[#11111b] border border-[#313244] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-primary transition resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary/95 text-white font-bold py-3 rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:shadow-primary/30"
                >
                  <Plus size={18} /> Tambah Ke Daftar
                </button>
              </form>
            </div>

            {/* Daftar Todo */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-[#1e1e2e] p-6 rounded-2xl border border-[#313244] shadow-xl">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                  {/* Filter Tabs */}
                  <div className="flex bg-[#11111b] p-1 rounded-xl border border-[#313244]">
                    <button
                      onClick={() => setTodoFilter('all')}
                      className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
                        todoFilter === 'all' ? 'bg-primary text-white' : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      Semua
                    </button>
                    <button
                      onClick={() => setTodoFilter('pending')}
                      className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
                        todoFilter === 'pending' ? 'bg-yellow-500/10 text-yellow-400' : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      Belum Selesai
                    </button>
                    <button
                      onClick={() => setTodoFilter('completed')}
                      className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
                        todoFilter === 'completed' ? 'bg-green-500/10 text-green-400' : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      Selesai
                    </button>
                  </div>

                  {/* Search Bar */}
                  <input
                    type="text"
                    placeholder="Cari tugas todo..."
                    value={todoSearch}
                    onChange={(e) => setTodoSearch(e.target.value)}
                    className="w-full sm:w-64 bg-[#11111b] border border-[#313244] rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-primary transition"
                  />
                </div>

                {/* Todo Items Container */}
                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                  {todos
                    .filter(todo => {
                      if (todoFilter === 'pending') return !todo.isCompleted;
                      if (todoFilter === 'completed') return todo.isCompleted;
                      return true;
                    })
                    .filter(todo => {
                      if (!todoSearch.trim()) return true;
                      return todo.title.toLowerCase().includes(todoSearch.toLowerCase()) || 
                             (todo.desc && todo.desc.toLowerCase().includes(todoSearch.toLowerCase())) ||
                             (todo.course && todo.course.toLowerCase().includes(todoSearch.toLowerCase()));
                    })
                    .length === 0 ? (
                      <div className="text-center py-16 text-gray-500">
                        <CheckSquare className="mx-auto mb-4 text-[#313244]" size={48} />
                        <p>Tidak ada todo list yang ditemukan</p>
                      </div>
                    ) : (
                      todos
                        .filter(todo => {
                          if (todoFilter === 'pending') return !todo.isCompleted;
                          if (todoFilter === 'completed') return todo.isCompleted;
                          return true;
                        })
                        .filter(todo => {
                          if (!todoSearch.trim()) return true;
                          return todo.title.toLowerCase().includes(todoSearch.toLowerCase()) || 
                                 (todo.desc && todo.desc.toLowerCase().includes(todoSearch.toLowerCase())) ||
                                 (todo.course && todo.course.toLowerCase().includes(todoSearch.toLowerCase()));
                        })
                        .map((todo) => {
                          const hasDeadline = !!todo.dueDate;
                          const deadlineDate = new Date(todo.dueDate);
                          const isOverdue = hasDeadline && !todo.isCompleted && deadlineDate.getTime() < Date.now();
                          
                          // Sisa waktu dalam jam
                          const hoursLeft = hasDeadline ? (deadlineDate.getTime() - Date.now()) / (3600 * 1000) : null;
                          
                          let borderClass = 'border-[#313244]';
                          let leftStrip = 'bg-primary/20';
                          
                          if (todo.isCompleted) {
                            borderClass = 'border-green-500/10 opacity-60';
                            leftStrip = 'bg-green-500';
                          } else if (isOverdue) {
                            borderClass = 'border-red-500/20';
                            leftStrip = 'bg-red-500';
                          } else if (hasDeadline) {
                            if (hoursLeft <= 6) {
                              borderClass = 'border-red-500/30 bg-red-500/5';
                              leftStrip = 'bg-red-500 animate-pulse';
                            } else if (hoursLeft <= 12) {
                              borderClass = 'border-orange-500/30 bg-orange-500/5';
                              leftStrip = 'bg-orange-500';
                            } else if (hoursLeft <= 24) {
                              borderClass = 'border-yellow-500/30 bg-yellow-500/5';
                              leftStrip = 'bg-yellow-500';
                            }
                          }

                          return (
                            <div
                              key={todo.id}
                              className={`bg-[#181825] border rounded-xl flex items-stretch overflow-hidden transition-all duration-300 hover:translate-x-1 group ${borderClass}`}
                            >
                              {/* Left Urgency Color Strip */}
                              <div className={`w-1.5 shrink-0 ${leftStrip}`} />

                              <div className="flex-1 p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                <div className="space-y-1.5 flex-1 min-w-0">
                                  <div className="flex flex-wrap items-center gap-2">
                                    {todo.course && (
                                      <span className="bg-[#11111b] border border-[#313244] text-primary text-xs font-semibold px-2 py-0.5 rounded-md">
                                        {todo.course}
                                      </span>
                                    )}
                                    {hasDeadline && !todo.isCompleted && (
                                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-md flex items-center gap-1 ${
                                        isOverdue 
                                          ? 'bg-red-500/10 text-red-400' 
                                          : hoursLeft <= 6
                                          ? 'bg-red-500/10 text-red-400'
                                          : hoursLeft <= 12
                                          ? 'bg-orange-500/10 text-orange-400'
                                          : hoursLeft <= 24
                                          ? 'bg-yellow-500/10 text-yellow-400'
                                          : 'bg-[#11111b] border border-[#313244] text-gray-400'
                                      }`}>
                                        <Clock size={12} />
                                        {isOverdue 
                                          ? 'Lewat Deadline' 
                                          : hoursLeft <= 24 
                                          ? `${Math.ceil(hoursLeft)} jam lagi`
                                          : deadlineDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
                                        }
                                      </span>
                                    )}
                                  </div>

                                  <h4 className={`text-base font-bold text-white break-words ${
                                    todo.isCompleted ? 'line-through text-gray-500' : ''
                                  }`}>
                                    {todo.title}
                                  </h4>

                                  {todo.desc && (
                                    <p className={`text-sm text-gray-400 break-words ${
                                      todo.isCompleted ? 'line-through text-gray-600' : ''
                                    }`}>
                                      {todo.desc}
                                    </p>
                                  )}
                                </div>

                                <div className="flex items-center gap-3 self-end md:self-center shrink-0">
                                  {/* Mark Status Button */}
                                  <button
                                    onClick={() => handleToggleTodo(todo.id)}
                                    className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-all ${
                                      todo.isCompleted
                                        ? 'bg-green-500/20 border-green-500/30 text-green-400 hover:bg-green-500/30'
                                        : 'border-[#313244] text-gray-400 hover:border-green-500/50 hover:text-green-400'
                                    }`}
                                    title={todo.isCompleted ? "Tandai Belum Selesai" : "Tandai Selesai"}
                                  >
                                    {todo.isCompleted ? <Check size={18} /> : <div className="w-4.5 h-4.5 rounded-md border border-gray-500 group-hover:border-green-500" />}
                                  </button>

                                  {/* Delete Button */}
                                  <button
                                    onClick={() => handleDeleteTodo(todo.id)}
                                    className="w-9 h-9 rounded-xl border border-[#313244] text-gray-400 hover:border-red-500/50 hover:text-red-400 flex items-center justify-center transition"
                                    title="Hapus Todo"
                                  >
                                    <Trash2 size={18} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })
                    )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {submitModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-[#1e1e2e] rounded-2xl border border-[#313244] w-full max-w-md p-6 shadow-2xl">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-bold text-white">Kumpulkan Tugas</h3>
                <p className="text-gray-400 text-sm mt-1 truncate">{submitModal.name}</p>
              </div>
              <button onClick={closeSubmitModal} className="text-gray-400 hover:text-white transition">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Teks Jawaban (opsional)</label>
                <textarea
                  rows={4}
                  className="w-full bg-[#11111b] border border-[#313244] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary transition resize-none"
                  placeholder="Tulis jawaban di sini..."
                  value={submitText}
                  onChange={(e) => setSubmitText(e.target.value)}
                  disabled={!!submitFilePath}
                />
              </div>

              <div className="text-center text-gray-500 text-xs">— atau —</div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Lampirkan File</label>
                <button
                  onClick={handleChooseFile}
                  disabled={!!submitText.trim()}
                  className="w-full flex items-center justify-center gap-2 bg-[#11111b] border border-[#313244] hover:border-primary text-gray-300 px-4 py-3 rounded-lg transition disabled:opacity-50"
                >
                  <Upload size={18} />
                  {submitFilePath ? submitFilePath.split(/[\\/]/).pop() : 'Pilih File'}
                </button>
              </div>

              {submitError && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm">
                  {submitError}
                </div>
              )}
              {submitSuccess && (
                <div className="bg-green-500/10 border border-green-500/20 text-green-400 px-4 py-3 rounded-lg text-sm">
                  {submitSuccess}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={closeSubmitModal}
                  className="flex-1 bg-[#313244] hover:bg-[#3a3a52] text-white font-medium py-3 rounded-lg transition"
                >
                  Batal
                </button>
                <button
                  onClick={handleSubmitTask}
                  disabled={submitting}
                  className="flex-1 bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="animate-spin" size={18} /> : 'Kumpulkan'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {editModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-[#1e1e2e] rounded-2xl border border-[#313244] w-full max-w-md p-6 shadow-2xl">
            <div>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-white">Edit Pengumpulan</h3>
                  <p className="text-gray-400 text-sm mt-1 truncate max-w-xs">{editModal.name}</p>
                </div>
                <button onClick={closeEditModal} className="text-gray-400 hover:text-white transition">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Teks Jawaban Baru (opsional)</label>
                  <textarea
                    rows={4}
                    className="w-full bg-[#11111b] border border-[#313244] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary transition resize-none"
                    placeholder="Tulis jawaban baru di sini..."
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    disabled={!!editFilePath}
                  />
                </div>

                <div className="text-center text-gray-500 text-xs">— atau —</div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Ganti File</label>
                  <button
                    onClick={handleChooseEditFile}
                    disabled={!!editText.trim()}
                    className="w-full flex items-center justify-center gap-2 bg-[#11111b] border border-[#313244] hover:border-primary text-gray-300 px-4 py-3 rounded-lg transition disabled:opacity-50"
                  >
                    <Upload size={18} />
                    {editFilePath ? editFilePath.split(/[\/]/).pop() : 'Pilih File Baru'}
                  </button>
                </div>

                {editError && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm">
                    {editError}
                  </div>
                )}
                {editSuccess && (
                  <div className="bg-green-500/10 border border-green-500/20 text-green-400 px-4 py-3 rounded-lg text-sm">
                    {editSuccess}
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={closeEditModal}
                    className="flex-1 bg-[#313244] hover:bg-[#3a3a52] text-white font-medium py-3 rounded-lg transition"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleEditSubmit}
                    disabled={editing}
                    className="flex-1 bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {editing ? <Loader2 className="animate-spin" size={18} /> : 'Simpan'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showFilter && (
        <CourseFilterSettings
          onClose={() => {
            setShowFilter(false);
            fetchStatus();
          }}
        />
      )}
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color }) {
  const colorMap = {
    blue: 'bg-blue-500/10 text-blue-400',
    green: 'bg-green-500/10 text-green-400',
    yellow: 'bg-yellow-500/10 text-yellow-400',
    red: 'bg-red-500/10 text-red-400',
  };
  return (
    <div className="bg-[#1e1e2e] p-6 rounded-xl border border-[#313244] flex items-center justify-between">
      <div>
        <p className="text-gray-400 text-sm">{label}</p>
        <p className="text-3xl font-bold text-white mt-1">{value}</p>
      </div>
      <div className={`p-4 rounded-lg ${colorMap[color]}`}>
        <Icon size={24} />
      </div>
    </div>
  );
}

export default App;