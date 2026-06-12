const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { 
  loginMoodle, 
  validateToken,
  getSiteInfo, 
  getMyCourses, 
  getAssignments, 
  getMySubmissions, 
  timeLeft, 
  shortCourseName,
  getSubmissionStatus,
  isExpired,
  filterAssignmentByClass,
  formatDate,
  uploadFileToDraft,
  submitAssignmentFile,
  submitAssignmentText,
  getCourseContents
} = require('./moodleAPI');

const SESSION_FILE = path.join(app.getPath('userData'), 'sessions.json');
const FILTER_FILE = path.join(app.getPath('userData'), 'courseFilter.json');

// =====================
// Session helpers
// =====================
function loadSessions() {
  try {
    if (fs.existsSync(SESSION_FILE)) {
      const data = fs.readFileSync(SESSION_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error loading sessions:', err);
  }
  return {};
}

function saveSessions(sessions) {
  try {
    const dir = path.dirname(SESSION_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(SESSION_FILE, JSON.stringify(sessions, null, 2));
  } catch (err) {
    console.error('Error saving sessions:', err);
  }
}

function clearCurrentSession() {
  if (currentSession) {
    const sessions = loadSessions();
    delete sessions[currentSession.userId];
    saveSessions(sessions);
    currentSession = null;
  }
}

// =====================
// Course filter helpers
// =====================
// Filter disimpan per userId: { [userId]: { enabledCourseIds: number[] } }
function loadFilter(userId) {
  try {
    if (fs.existsSync(FILTER_FILE)) {
      const data = JSON.parse(fs.readFileSync(FILTER_FILE, 'utf8'));
      return data[userId] ?? null;
    }
  } catch (err) {
    console.error('Error loading filter:', err);
  }
  return null;
}

function saveFilter(userId, filterData) {
  try {
    let all = {};
    if (fs.existsSync(FILTER_FILE)) {
      all = JSON.parse(fs.readFileSync(FILTER_FILE, 'utf8'));
    }
    all[userId] = filterData;
    fs.writeFileSync(FILTER_FILE, JSON.stringify(all, null, 2));
  } catch (err) {
    console.error('Error saving filter:', err);
  }
}

let mainWindow;
let currentSession = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: '#181825',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    titleBarStyle: 'hiddenInset',
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(() => {
  createWindow();

  // Load session terakhir saat startup
  const sessions = loadSessions();
  const sessionIds = Object.keys(sessions);
  if (sessionIds.length > 0) {
    const lastSession = sessions[sessionIds[sessionIds.length - 1]];
    currentSession = lastSession;
    console.log('✅ Session loaded:', lastSession.fullname);
  }

  // =====================
  // IPC: LOGIN
  // =====================
  ipcMain.handle('moodle:login', async (event, username, password) => {
    try {
      const token = await loginMoodle(username, password);
      const userInfo = await getSiteInfo(token);
      
      currentSession = {
        token,
        userId: userInfo.userid,
        fullname: userInfo.fullname,
        username,
        loginTime: new Date().toISOString()
      };
      
      const sessions = loadSessions();
      sessions[userInfo.userid] = currentSession;
      saveSessions(sessions);
      
      return { success: true, user: currentSession };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // =====================
  // IPC: LOGOUT
  // =====================
  ipcMain.handle('moodle:logout', async () => {
    clearCurrentSession();
    return { success: true };
  });

  // =====================
  // IPC: GET COURSES (untuk settings filter)
  // =====================
  ipcMain.handle('moodle:getCourses', async () => {
    if (!currentSession) return { success: false, error: 'Belum login' };

    try {
      const validation = await validateToken(currentSession.token);
      if (!validation.valid) {
        clearCurrentSession();
        return { success: false, error: 'Sesi expired. Silakan login ulang.', tokenExpired: true };
      }

      const courses = await getMyCourses(currentSession.token, currentSession.userId);
      if (!Array.isArray(courses)) return { success: true, data: [] };

      // Kembalikan id + fullname saja (cukup untuk UI filter)
      const simplified = courses.map(c => ({
        id: c.id,
        fullname: c.fullname,
        shortname: c.shortname || ''
      }));

      return { success: true, data: simplified };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // =====================
  // IPC: GET FILTER
  // =====================
  ipcMain.handle('moodle:getFilter', async () => {
    if (!currentSession) return { success: false, error: 'Belum login' };
    const filter = loadFilter(currentSession.userId);
    // null berarti belum diset → tampilkan semua
    return { success: true, data: filter };
  });

  // =====================
  // IPC: SAVE FILTER
  // =====================
  ipcMain.handle('moodle:saveFilter', async (event, filterData) => {
    if (!currentSession) return { success: false, error: 'Belum login' };
    if (filterData && typeof filterData === 'object' && !Array.isArray(filterData)) {
      saveFilter(currentSession.userId, filterData);
    } else {
      saveFilter(currentSession.userId, { enabledCourseIds: filterData });
    }
    return { success: true };
  });

  // =====================
  // IPC: GET STATUS TUGAS (WITH TOKEN VALIDATION + COURSE FILTER)
  // =====================
  ipcMain.handle('moodle:getStatus', async () => {
    if (!currentSession) return { success: false, error: 'Belum login' };

    try {
      console.log('🔒 Memvalidasi token Moodle...');
      const validation = await validateToken(currentSession.token);
      
      if (!validation.valid) {
        console.log('⚠️ Token expired atau invalid, clearing session...');
        clearCurrentSession();
        return { 
          success: false, 
          error: 'Sesi Moodle sudah expired. Silakan login ulang.',
          tokenExpired: true 
        };
      }
      
      console.log('✅ Token valid, melanjutkan...');

      // 1. Ambil Mata Kuliah
      let courses = await getMyCourses(currentSession.token, currentSession.userId);
      if (!Array.isArray(courses)) {
        console.warn('⚠️ getMyCourses tidak mengembalikan array:', courses);
        courses = [];
      }
      console.log(`✅ Berhasil mengambil ${courses.length} mata kuliah`);

      // 2. Terapkan filter kelas (jika sudah diset user)
      const savedFilterRaw = loadFilter(currentSession.userId);
      let savedFilter = savedFilterRaw;
      
      // Unpack nested legacy structure if present
      if (savedFilterRaw && savedFilterRaw.enabledCourseIds && typeof savedFilterRaw.enabledCourseIds === 'object' && !Array.isArray(savedFilterRaw.enabledCourseIds)) {
        savedFilter = savedFilterRaw.enabledCourseIds;
      }

      let filteredCourses = courses;

      if (savedFilter && Array.isArray(savedFilter.enabledCourseIds) && savedFilter.enabledCourseIds.length > 0) {
        const enabledSet = new Set(savedFilter.enabledCourseIds);
        filteredCourses = courses.filter(c => enabledSet.has(c.id));
        console.log(`🔍 Filter aktif: ${filteredCourses.length} dari ${courses.length} kelas ditampilkan`);
      }

      const courseIds = filteredCourses.map(c => c.id);

      if (filteredCourses.length === 0) {
        return {
          success: true,
          data: {
            stats: { total: 0, sudah: 0, belum: 0, urgent: 0, persen: 0 },
            urgentTasks: [],
            submittedTasks: [],
            allTasks: [],
            noCourses: true
          }
        };
      }

      // 3. Ambil Tugas
      const assignmentData = await getAssignments(currentSession.token, courseIds);
      
      const allAssignments = [];
      if (Array.isArray(assignmentData)) {
        assignmentData.forEach(course => {
          if (course.assignments && Array.isArray(course.assignments)) {
            course.assignments.forEach(a => {
              // Apply keyword filter if set for this course
              const keywordsStr = savedFilter?.courseKeywords?.[course.id];
              let shouldInclude = true;
              if (keywordsStr && keywordsStr.trim()) {
                const keywords = keywordsStr.split(',').map(k => k.trim().toLowerCase()).filter(Boolean);
                if (keywords.length > 0) {
                  const assignmentName = a.name.toLowerCase();
                  shouldInclude = keywords.some(keyword => assignmentName.includes(keyword));
                }
              }

              if (shouldInclude) {
                allAssignments.push({
                  ...a,
                  courseName: course.fullname,
                  courseShort: shortCourseName(course.fullname)
                });
              }
            });
          }
        });
      }

      // 4. Filter: Tugas dalam 10 hari ke depan
      const now = Date.now();
      const tenDaysInMs = 10 * 24 * 60 * 60 * 1000;
      
      const relevantTasks = allAssignments.filter(a => {
        if (!a.duedate) return false;
        const deadline = a.duedate * 1000;
        return deadline > (now - tenDaysInMs);
      });

      const assignIds = relevantTasks
        .map(a => a.id)
        .filter(id => id && Number.isInteger(id));
      
      console.log(`📝 Mengambil status untuk ${assignIds.length} tugas...`);
      
      if (assignIds.length === 0) {
        console.log('⚠️ Tidak ada assignment ID yang valid');
        return {
          success: true,
          data: {
            stats: { total: 0, sudah: 0, belum: 0, urgent: 0, persen: 0 },
            urgentTasks: [],
            submittedTasks: [],
            allTasks: []
          }
        };
      }
      
      const submissionData = await getMySubmissions(currentSession.token, assignIds, currentSession.userId);

      // 5. Mapping Status
      const statusMap = {};
      if (Array.isArray(submissionData)) {
        submissionData.forEach(sd => {
          if (sd.submissions?.length > 0) {
            statusMap[sd.assignmentid] = sd.submissions[0].status;
          }
        });
      }

      const sudah = relevantTasks.filter(a => statusMap[a.id] === 'submitted');
      const belum = relevantTasks.filter(a => statusMap[a.id] !== 'submitted');
      
      const urgent = belum.filter(a => {
        if (!a.duedate) return false;
        return (a.duedate * 1000 - now) < 24 * 60 * 60 * 1000;
      });

      const total = relevantTasks.length;
      const persen = total === 0 ? 0 : Math.round((sudah.length / total) * 100);

      return {
        success: true,
        data: {
          stats: { total, sudah: sudah.length, belum: belum.length, urgent: urgent.length, persen },
          urgentTasks: urgent.map(a => ({
            id: a.id,
            name: a.name,
            course: a.courseShort,
            deadline: timeLeft(a.duedate),
            isCritical: (a.duedate * 1000 - now) < 12 * 60 * 60 * 1000
          })),
          submittedTasks: sudah.map(a => ({
            id: a.id,
            name: a.name,
            course: a.courseShort,
            deadline: timeLeft(a.duedate)
          })),
          allTasks: relevantTasks.map(a => ({
            id: a.id,
            name: a.name,
            course: a.courseShort,
            deadline: timeLeft(a.duedate),
            duedate: a.duedate,
            isSubmitted: statusMap[a.id] === 'submitted'
          }))
        }
      };
    } catch (error) {
      console.error('Error getting status:', error);
      
      if (error.message === 'TOKEN_EXPIRED' || 
          error.message.includes('Can\'t find data record') ||
          error.message.toLowerCase().includes('invalidtoken')) {
        clearCurrentSession();
        return { 
          success: false, 
          error: 'Sesi Moodle sudah expired. Silakan login ulang.',
          tokenExpired: true 
        };
      }
      
      return { success: false, error: error.message };
    }
  });

  // =====================
  // IPC: CHECK SESSION
  // =====================
  ipcMain.handle('moodle:checkSession', async () => {
    if (!currentSession) return { success: false, error: 'No session' };
    
    try {
      const validation = await validateToken(currentSession.token);
      if (!validation.valid) {
        clearCurrentSession();
        return { success: false, error: 'Session expired' };
      }
      return { success: true, user: currentSession };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // =====================
  // IPC: SUBMIT TEKS ONLINE
  // =====================
  ipcMain.handle('moodle:submitText', async (event, assignmentId, text) => {
    if (!currentSession) return { success: false, error: 'Belum login' };

    try {
      const validation = await validateToken(currentSession.token);
      if (!validation.valid) {
        clearCurrentSession();
        return { success: false, error: 'Sesi expired. Silakan login ulang.', tokenExpired: true };
      }

      const result = await submitAssignmentText(currentSession.token, assignmentId, text);
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // =====================
  // IPC: SUBMIT FILE
  // =====================
  ipcMain.handle('moodle:submitFile', async (event, assignmentId, filePath) => {
    if (!currentSession) return { success: false, error: 'Belum login' };

    try {
      const validation = await validateToken(currentSession.token);
      if (!validation.valid) {
        clearCurrentSession();
        return { success: false, error: 'Sesi expired. Silakan login ulang.', tokenExpired: true };
      }

      const fileBuffer = fs.readFileSync(filePath);
      const filename = path.basename(filePath);
      const mimeType = 'application/octet-stream';

      const draftItemId = await uploadFileToDraft(currentSession.token, filename, fileBuffer, mimeType);
      const result = await submitAssignmentFile(currentSession.token, assignmentId, draftItemId);

      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // =====================
  // IPC: PILIH FILE
  // =====================
  ipcMain.handle('dialog:chooseFile', async () => {
    const result = await dialog.showOpenDialog(mainWindow, { properties: ['openFile'] });
    if (result.canceled || result.filePaths.length === 0) return { success: false };
    return { success: true, filePath: result.filePaths[0] };
  });

  // =====================
  // IPC: GET COURSE DETAIL
  // =====================
  ipcMain.handle('moodle:getCourseDetail', async (event, courseId) => {
    if (!currentSession) return { success: false, error: 'Belum login' };

    try {
      // 1. Ambil semua tugas dari course ini
      const assignmentData = await getAssignments(currentSession.token, [courseId]);
      
      const courseAssignments = [];
      if (Array.isArray(assignmentData) && assignmentData.length > 0) {
        const courseObj = assignmentData[0];
        if (courseObj.assignments && Array.isArray(courseObj.assignments)) {
          courseObj.assignments.forEach(a => {
            courseAssignments.push({
              id: a.id,
              name: a.name,
              duedate: a.duedate,
              deadline: timeLeft(a.duedate)
            });
          });
        }
      }

      // Terapkan filter keyword jika ada
      const savedFilterRaw = loadFilter(currentSession.userId);
      let savedFilter = savedFilterRaw;
      if (savedFilterRaw && savedFilterRaw.enabledCourseIds && typeof savedFilterRaw.enabledCourseIds === 'object' && !Array.isArray(savedFilterRaw.enabledCourseIds)) {
        savedFilter = savedFilterRaw.enabledCourseIds;
      }

      let filteredAssignments = courseAssignments;
      const keywordsStr = savedFilter?.courseKeywords?.[courseId];
      if (keywordsStr && keywordsStr.trim()) {
        const keywords = keywordsStr.split(',').map(k => k.trim().toLowerCase()).filter(Boolean);
        if (keywords.length > 0) {
          filteredAssignments = courseAssignments.filter(a => {
            const assignmentName = a.name.toLowerCase();
            return keywords.some(keyword => assignmentName.includes(keyword));
          });
        }
      }

      // Ambil status submission tugas
      const assignIds = filteredAssignments.map(a => a.id);
      let submissionStatusMap = {};
      if (assignIds.length > 0) {
        const submissionData = await getMySubmissions(currentSession.token, assignIds, currentSession.userId);
        if (Array.isArray(submissionData)) {
          submissionData.forEach(sd => {
            if (sd.submissions?.length > 0) {
              submissionStatusMap[sd.assignmentid] = sd.submissions[0].status;
            }
          });
        }
      }

      const finalAssignments = filteredAssignments.map(a => ({
        ...a,
        isSubmitted: submissionStatusMap[a.id] === 'submitted'
      }));

      // 2. Ambil materi PDF/Word
      const contents = await getCourseContents(currentSession.token, courseId);
      const materials = [];

      if (Array.isArray(contents)) {
        contents.forEach(section => {
          if (section.modules && Array.isArray(section.modules)) {
            section.modules.forEach(mod => {
              if (mod.modname === 'resource' && mod.contents && Array.isArray(mod.contents)) {
                mod.contents.forEach(file => {
                  const name = file.filename || '';
                  const ext = name.split('.').pop().toLowerCase();
                  if (ext === 'pdf' || ext === 'docx' || ext === 'doc') {
                    materials.push({
                      name: name,
                      url: file.fileurl,
                      type: ext,
                      size: file.filesize ? `${(file.filesize / 1024).toFixed(1)} KB` : 'Ukuran tidak diketahui'
                    });
                  }
                });
              }
            });
          }
        });
      }

      return {
        success: true,
        data: {
          assignments: finalAssignments,
          materials: materials
        }
      };

    } catch (error) {
      console.error('Error in moodle:getCourseDetail:', error);
      return { success: false, error: error.message };
    }
  });

  // =====================
  // IPC: OPEN MATERIAL URL
  // =====================
  ipcMain.handle('dialog:openMaterial', async (event, fileUrl) => {
    if (!currentSession) return { success: false, error: 'Belum login' };
    const { shell } = require('electron');
    const separator = fileUrl.includes('?') ? '&' : '?';
    const authenticatedUrl = `${fileUrl}${separator}token=${currentSession.token}`;
    await shell.openExternal(authenticatedUrl);
    return { success: true };
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});