import { useState, useEffect } from 'react';
import { LayoutDashboard, BookOpen, LogOut, Bell, CheckCircle2, Clock, AlertTriangle, Loader2, Upload, X, Send, Filter, ArrowLeft, FileText, ChevronRight } from 'lucide-react';
import CourseFilterSettings from './CourseFilterSettings';

function App() {
  const [session, setSession] = useState(null);
  const [statusData, setStatusData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [submitModal, setSubmitModal] = useState(null); // { id, name }
  const [submitText, setSubmitText] = useState('');
  const [submitFilePath, setSubmitFilePath] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');
  const [showFilter, setShowFilter] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'courses' | 'course-detail'
  const [coursesList, setCoursesList] = useState([]);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [coursesError, setCoursesError] = useState('');
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [courseDetailData, setCourseDetailData] = useState(null);
  const [courseDetailLoading, setCourseDetailLoading] = useState(false);
  const [courseDetailError, setCourseDetailError] = useState('');

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
    <div className="flex h-screen bg-[#181825]">
      <aside className="w-64 bg-[#1e1e2e] border-r border-[#313244] flex flex-col">
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <BookOpen className="text-white" size={20} />
          </div>
          <h1 className="text-xl font-bold text-white">Lany Desktop</h1>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          <button
            onClick={() => { setActiveTab('dashboard'); fetchStatus(); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
              activeTab === 'dashboard' ? 'bg-primary text-white font-bold' : 'text-gray-400 hover:text-white hover:bg-[#313244]'
            }`}
          >
            <LayoutDashboard size={20} /> Dashboard
          </button>
          
          <button
            onClick={() => { setActiveTab('courses'); loadAllCourses(); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
              activeTab === 'courses' || activeTab === 'course-detail' ? 'bg-primary text-white font-bold' : 'text-gray-400 hover:text-white hover:bg-[#313244]'
            }`}
          >
            <BookOpen size={20} /> Mata Kuliah
          </button>

          <button
            onClick={() => setShowFilter(true)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-gray-400 hover:text-white hover:bg-[#313244]"
          >
            <Filter size={20} /> Filter Kelas
          </button>
        </nav>

        <div className="p-4 border-t border-[#313244]">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-xs font-bold text-white">
              {session?.fullname?.charAt(0) || 'U'}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-white truncate">{session?.fullname || 'User'}</p>
              <p className="text-xs text-gray-500 truncate">Online</p>
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

      <main className="flex-1 overflow-y-auto p-8">
        {activeTab === 'dashboard' && (
          <header className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-2xl font-bold text-white">Dashboard Tugas</h2>
              <p className="text-gray-400">Tugas dengan deadline 10 hari ke depan</p>
            </div>
            <button onClick={fetchStatus} className="p-2 bg-[#1e1e2e] rounded-lg hover:bg-[#313244] text-gray-400 hover:text-white transition">
              <Bell size={20} />
            </button>
          </header>
        )}

        {activeTab === 'courses' && (
          <header className="mb-8">
            <h2 className="text-2xl font-bold text-white">Mata Kuliah Anda</h2>
            <p className="text-gray-400">Pilih mata kuliah untuk melihat seluruh tugas dan materi</p>
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
                <StatCard label="Total Tugas" value={statusData.stats.total} icon={BookOpen} color="blue" />
                <StatCard label="Sudah Dikumpul" value={statusData.stats.sudah} icon={CheckCircle2} color="green" />
                <StatCard label="Belum Dikumpul" value={statusData.stats.belum} icon={Clock} color="yellow" />
                <StatCard label="Deadline < 24 Jam" value={statusData.stats.urgent} icon={AlertTriangle} color="red" />
              </div>

              <div className="bg-[#1e1e2e] p-6 rounded-xl border border-[#313244]">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-lg font-bold text-white">Progress Pengumpulan</h3>
                  <span className="text-2xl font-bold text-primary">{statusData.stats.persen}%</span>
                </div>
                <div className="w-full h-4 bg-[#313244] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-green-400 transition-all duration-500"
                    style={{ width: `${statusData.stats.persen}%` }}
                  ></div>
                </div>
                <p className="text-gray-400 text-sm mt-2">
                  {statusData.stats.sudah} dari {statusData.stats.total} tugas telah dikumpulkan.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-[#1e1e2e] p-6 rounded-xl border border-[#313244]">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <AlertTriangle className="text-red-400" size={20} /> Segera Dikumpulkan
                  </h3>
                  {statusData.urgentTasks.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">🎉 Tidak ada tugas urgent!</p>
                  ) : (
                    <div className="space-y-3 max-h-[400px] overflow-y-auto overflow-x-hidden pr-2">
                      {statusData.urgentTasks.map((task, idx) => (
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
                  {statusData.submittedTasks.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">Belum ada tugas yang dikumpul.</p>
                  ) : (
                    <div className="space-y-3 max-h-[400px] overflow-y-auto overflow-x-hidden pr-2">
                      {statusData.submittedTasks.map((task, idx) => (
                        <div key={idx} className="p-4 bg-green-500/5 border border-green-500/10 rounded-lg flex items-start gap-3">
                          <CheckCircle2 className="text-green-400 mt-1 flex-shrink-0" size={18} />

                          <div className="min-w-0 flex-1">
                            <p className="text-white font-medium text-sm break-words">{task.name}</p>
                            <p className="text-gray-500 text-xs mt-1 break-words">{task.course} • {task.deadline}</p>
                          </div>

                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Semua Tugas */}
              <div className="bg-[#1e1e2e] p-6 rounded-xl border border-[#313244]">
                <h3 className="text-lg font-bold text-white mb-4">📋 Semua Tugas (10 Hari Ke Depan)</h3>
                {statusData.allTasks.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">Tidak ada tugas dalam 10 hari ke depan.</p>
                ) : (
                  <div className="space-y-2">
                    {statusData.allTasks.map((task, idx) => (
                      <div key={idx} className={`p-4 rounded-lg border flex items-center justify-between ${
                        task.isSubmitted ? 'bg-green-500/5 border-green-500/20' : 'bg-yellow-500/5 border-yellow-500/20'
                      }`}>
                        <div className="flex items-center gap-3">
                          {task.isSubmitted ? (
                            <CheckCircle2 className="text-green-400" size={20} />
                          ) : (
                            <Clock className="text-yellow-400" size={20} />
                          )}
                          <div>
                            <p className="text-white font-medium">{task.name}</p>
                            <p className="text-gray-400 text-sm">{task.course}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`text-sm font-medium ${
                            task.isSubmitted ? 'text-green-400' : 'text-yellow-400'
                          }`}>
                            {task.deadline}
                          </span>
                          {!task.isSubmitted && (
                            <button
                              onClick={() => openSubmitModal(task)}
                              className="text-xs font-medium bg-primary/20 hover:bg-primary/30 text-primary px-3 py-1.5 rounded-lg transition"
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
                    {courseDetailData.assignments.map((task, idx) => (
                      <div
                        key={idx}
                        className={`p-4 rounded-lg border flex flex-col transition duration-200 ${
                          task.isSubmitted
                            ? 'bg-green-500/5 border-green-500/20 hover:bg-green-500/10 text-green-400'
                            : 'bg-red-500/5 border-red-500/20 hover:bg-red-500/10 text-red-400'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <p className="text-white font-medium break-words flex-1 pr-2">{task.name}</p>
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-md shrink-0 ${
                            task.isSubmitted ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                          }`}>
                            {task.isSubmitted ? 'Selesai' : 'Belum Selesai'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center mt-4">
                          <span className="text-gray-400 text-sm">{task.deadline}</span>
                          {!task.isSubmitted && (
                            <button
                              onClick={() => openSubmitModal(task)}
                              className="text-xs font-semibold bg-primary hover:bg-primary/90 text-white px-3.5 py-2 rounded-lg transition"
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