const FormData = require('form-data');

const MOODLE_URL = 'https://learning-if.polibatam.ac.id';
const API_ENDPOINT = `${MOODLE_URL}/webservice/rest/server.php`;
const TOKEN_ENDPOINT = `${MOODLE_URL}/login/token.php`;
const UPLOAD_ENDPOINT = `${MOODLE_URL}/webservice/upload.php`;
const SERVICE_NAME = 'moodle_mobile_app';

// =====================
// Helper: panggil Moodle REST API (mendukung array params)
// =====================
async function callMoodle(token, wsfunction, params = {}) {
  const body = new URLSearchParams();
  body.append('wstoken', token);
  body.append('wsfunction', wsfunction);
  body.append('moodlewsrestformat', 'json');

  Object.keys(params).forEach(key => {
    const value = params[key];
    if (Array.isArray(value)) {
      value.forEach((v, i) => body.append(`${key}[${i}]`, v));
    } else {
      body.append(key, value);
    }
  });

  const res = await fetch(API_ENDPOINT, { method: 'POST', body });
  const text = await res.text();

  if (!text || text.trim() === '') {
    throw new Error(`Response kosong dari server untuk ${wsfunction}`);
  }

  let data;
  try {
    data = JSON.parse(text);
  } catch (e) {
    throw new Error(`Response tidak valid dari server: ${text.slice(0, 100)}`);
  }

  if (data && data.exception) throw new Error(data.message || data.exception);
  return data;
}

// =====================
// Login -> dapatkan token
// =====================
async function loginMoodle(username, password) {
  const params = new URLSearchParams({ username, password, service: SERVICE_NAME });
  const res = await fetch(`${TOKEN_ENDPOINT}?${params}`);
  const data = await res.json();

  if (data.error) throw new Error(data.error || 'Login gagal');
  if (!data.token) throw new Error('Token tidak ditemukan. Cek username/password.');

  return data.token;
}

// =====================
// Validasi token
// =====================
async function validateToken(token) {
  try {
    const data = await callMoodle(token, 'core_webservice_get_site_info');
    return { valid: true, data };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}

// =====================
// Info site / user
// =====================
async function getSiteInfo(token) {
  return callMoodle(token, 'core_webservice_get_site_info');
}

// =====================
// Mata kuliah user
// =====================
async function getMyCourses(token, userId) {
  try {
    const data = await callMoodle(token, 'core_enrol_get_users_courses', { userid: userId });

    if (!Array.isArray(data)) {
      console.warn('⚠️ getMyCourses tidak mengembalikan array:', data);
      return [];
    }
    return data;
  } catch (error) {
    if (error.message && error.message.toLowerCase().includes('token')) {
      throw new Error('TOKEN_EXPIRED');
    }
    console.error('❌ Error fetching courses:', error.message);
    return [];
  }
}

// =====================
// Ambil semua tugas dari semua mata kuliah
// =====================
async function getAssignments(token, courseIds) {
  if (!courseIds || courseIds.length === 0) return [];

  try {
    const data = await callMoodle(token, 'mod_assign_get_assignments', {
      courseids: courseIds
    });
    return data.courses || [];
  } catch (error) {
    if (error.message && error.message.toLowerCase().includes('token')) {
      throw new Error('TOKEN_EXPIRED');
    }
    throw error;
  }
}

// =====================
// Status submission per assignment
// =====================
async function getMySubmissions(token, assignmentIds, userId) {
  if (!assignmentIds || assignmentIds.length === 0) return [];

  const validIds = assignmentIds.filter(id => id && Number.isInteger(id));
  if (validIds.length === 0) {
    console.warn('⚠️ Tidak ada assignment ID yang valid untuk getMySubmissions');
    return [];
  }

  const results = [];

  for (const id of validIds) {
    try {
      const data = await callMoodle(token, 'mod_assign_get_submission_status', {
        assignid: id,
        userid: userId
      });

      const status = data?.lastattempt?.submission?.status || 'new';
      results.push({
        assignmentid: id,
        submissions: [{ status }]
      });
    } catch (e) {
      if (e.message && e.message.toLowerCase().includes('token')) {
        throw new Error('TOKEN_EXPIRED');
      }
      results.push({
        assignmentid: id,
        submissions: [{ status: 'new' }]
      });
    }
  }

  return results;
}

// =====================
// Detail submission untuk satu assignment
// =====================
async function getSubmissionStatus(token, assignmentId, userId) {
  try {
    const data = await callMoodle(token, 'mod_assign_get_submission_status', {
      assignid: assignmentId,
      userid: userId
    });

    const lastAttempt = data.lastattempt;
    let isSubmitted = false;

    if (lastAttempt && lastAttempt.submission) {
      if (lastAttempt.submission.status === 'submitted') {
        isSubmitted = true;
      }
    }

    return { isSubmitted };
  } catch (error) {
    console.error(`Gagal mengambil status untuk assignid ${assignmentId}:`, error.message);
    return { isSubmitted: false };
  }
}

// =====================
// Upload file ke draft area Moodle
// =====================
async function uploadFileToDraft(token, filename, fileBuffer, mimeType) {
  const form = new global.FormData();

  const uploadUrl = `${UPLOAD_ENDPOINT}?token=${encodeURIComponent(token)}`;

  form.append('filearea', 'draft');
  form.append('itemid', '0');
  
  const blob = new global.Blob([fileBuffer], { type: mimeType });
  form.append('file_1', blob, filename);

  const res = await fetch(uploadUrl, {
    method: 'POST',
    body: form
  });
  const data = await res.json();

  if (!Array.isArray(data) || !data[0]?.itemid) {
    throw new Error('Gagal upload file ke Moodle: ' + JSON.stringify(data));
  }
  return data[0].itemid; // draft itemid
}

// =====================
// Submit tugas dengan file
// =====================
async function submitAssignmentFile(token, assignId, draftItemId) {
  return callMoodle(token, 'mod_assign_save_submission', {
    assignmentid: assignId,
    'plugindata[files_filemanager]': draftItemId
  });
}

// =====================
// Submit tugas dengan teks online
// =====================
async function submitAssignmentText(token, assignId, text) {
  return callMoodle(token, 'mod_assign_save_submission', {
    assignmentid: assignId,
    'plugindata[onlinetext_editor][text]': text,
    'plugindata[onlinetext_editor][format]': 1,
    'plugindata[onlinetext_editor][itemid]': 0
  });
}

// =====================
// Util waktu & format
// =====================
function timeLeft(dueDate) {
  if (!dueDate) return 'Tidak ada deadline';
  const diff = dueDate * 1000 - Date.now();
  if (diff <= 0) return 'Sudah lewat';
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  if (days > 0) return `${days} hari ${hours} jam lagi`;
  if (hours > 0) return `${hours} jam lagi`;
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return `${minutes} menit lagi`;
}

function shortCourseName(fullname) {
  if (!fullname) return 'Mata Kuliah';
  return fullname
    .replace(/\[.*?\]/g, '')
    .replace(/\(.*?\)/g, '')
    .replace(/\d{4}\/\d{4}/g, '')
    .trim()
    .substring(0, 40);
}

function isExpired(dueDate) {
  if (!dueDate) return false;
  return new Date(dueDate * 1000) < new Date();
}

function filterAssignmentByClass(assignment, userId) {
  if (!assignment.duedate) return false;
  if (isExpired(assignment.duedate)) return false;
  return true;
}

function formatDate(timestamp) {
  if (!timestamp) return 'Tidak ada tanggal';
  const date = new Date(timestamp * 1000);
  const options = {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  return date.toLocaleDateString('id-ID', options);
}

async function getCourseContents(token, courseId) {
  return callMoodle(token, 'core_course_get_contents', { courseid: courseId });
}

module.exports = {
  loginMoodle,
  validateToken,
  getSiteInfo,
  getMyCourses,
  getAssignments,
  getMySubmissions,
  getSubmissionStatus,
  uploadFileToDraft,
  submitAssignmentFile,
  submitAssignmentText,
  timeLeft,
  shortCourseName,
  isExpired,
  filterAssignmentByClass,
  formatDate,
  getCourseContents
};