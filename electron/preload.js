const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  login: (username, password) => ipcRenderer.invoke('moodle:login', username, password),
  logout: () => ipcRenderer.invoke('moodle:logout'),
  getStatus: () => ipcRenderer.invoke('moodle:getStatus'),
  checkSession: () => ipcRenderer.invoke('moodle:checkSession'),
  submitText: (assignmentId, text) => ipcRenderer.invoke('moodle:submitText', assignmentId, text),
  submitFile: (assignmentId, filePath) => ipcRenderer.invoke('moodle:submitFile', assignmentId, filePath),
  chooseFile: () => ipcRenderer.invoke('dialog:chooseFile'),

  // Filter kelas
  getCourses: () => ipcRenderer.invoke('moodle:getCourses'),
  getFilter: () => ipcRenderer.invoke('moodle:getFilter'),
  saveFilter: (enabledCourseIds) => ipcRenderer.invoke('moodle:saveFilter', enabledCourseIds),

  // Detail kelas & materi
  getCourseDetail: (courseId) => ipcRenderer.invoke('moodle:getCourseDetail', courseId),
  openMaterial: (fileUrl) => ipcRenderer.invoke('dialog:openMaterial', fileUrl),
});