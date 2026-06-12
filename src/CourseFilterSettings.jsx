// CourseFilterSettings.jsx
import { useState, useEffect } from "react";

export default function CourseFilterSettings({ onClose }) {
  const [courses, setCourses] = useState([]);
  const [search, setSearch] = useState("");
  const [enabledIds, setEnabledIds] = useState(new Set());
  const [courseKeywords, setCourseKeywords] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Sub-modal states
  const [editingCourse, setEditingCourse] = useState(null);
  const [tempKeywords, setTempKeywords] = useState("");

  // Load courses and saved filter configuration
  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [coursesRes, filterRes] = await Promise.all([
          window.electronAPI.getCourses(),
          window.electronAPI.getFilter(),
        ]);

        if (!coursesRes.success) throw new Error(coursesRes.error);
        setCourses(coursesRes.data);

        if (filterRes.success && filterRes.data) {
          let filterData = filterRes.data;

          // Unpack nested legacy structure if present
          if (filterData.enabledCourseIds && typeof filterData.enabledCourseIds === 'object' && !Array.isArray(filterData.enabledCourseIds)) {
            filterData = filterData.enabledCourseIds;
          }

          if (filterData.enabledCourseIds && Array.isArray(filterData.enabledCourseIds)) {
            setEnabledIds(new Set(filterData.enabledCourseIds));
          } else {
            setEnabledIds(new Set(coursesRes.data.map((c) => c.id)));
          }

          if (filterData.courseKeywords && typeof filterData.courseKeywords === 'object') {
            setCourseKeywords(filterData.courseKeywords);
          } else {
            setCourseKeywords({});
          }
        } else {
          setEnabledIds(new Set(coursesRes.data.map((c) => c.id)));
          setCourseKeywords({});
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = courses.filter(
    (c) =>
      c.fullname.toLowerCase().includes(search.toLowerCase()) ||
      (c.shortname && c.shortname.toLowerCase().includes(search.toLowerCase()))
  );

  function openEditKeywords(course) {
    setEditingCourse(course);
    setTempKeywords(courseKeywords[course.id] || "");
  }

  function saveKeywords() {
    setCourseKeywords((prev) => ({
      ...prev,
      [editingCourse.id]: tempKeywords,
    }));
    setEditingCourse(null);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const ids = Array.from(enabledIds);
      await window.electronAPI.saveFilter({
        enabledCourseIds: ids,
        courseKeywords: courseKeywords,
      });
      onClose?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  // Active filters list
  const activeFilters = Object.entries(courseKeywords)
    .filter(([id, keywords]) => keywords && keywords.trim())
    .map(([id, keywords]) => {
      const course = courses.find((c) => String(c.id) === String(id));
      return {
        id,
        name: course ? course.fullname : `Mata Kuliah #${id}`,
        shortname: course ? course.shortname : "",
        keywords,
      };
    });

  if (loading) {
    return (
      <div style={styles.overlay}>
        <div style={styles.modal}>
          <p style={{ color: "#cdd6f4", textAlign: "center", padding: "40px" }}>Memuat kelas...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.overlay}>
        <div style={styles.modal}>
          <p style={{ color: "#f38ba8", padding: "20px" }}>Error: {error}</p>
          <div style={styles.footer}>
            <button style={styles.btnSecondary} onClick={onClose}>Tutup</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose?.()}>
      <style>{`
        .course-row-hover {
          transition: all 0.2s ease;
        }
        .course-row-hover:hover {
          background-color: var(--card-hover-bg) !important;
          border-color: var(--border-color) !important;
        }
        .btn-close-hover:hover {
          background-color: var(--card-hover-bg) !important;
          color: #f38ba8 !important;
        }
        .input-focus:focus {
          border-color: #5865F2 !important;
        }
        .btn-hover:hover {
          opacity: 0.95 !important;
          filter: brightness(1.05);
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { transform: scale(0.96); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>

      <div style={styles.modal}>
        {/* Header */}
        <div style={styles.header}>
          <div>
            <h2 style={styles.title}>
              <span style={{ fontSize: "20px" }}>🔧</span> Atur filter kelas
            </h2>
            <p style={styles.subtitle}>Pilih mata kuliah untuk mengatur kata kunci filter:</p>
          </div>
          <button className="btn-close-hover" style={styles.btnClose} onClick={onClose}>✕</button>
        </div>

        {/* Tips Box */}
        <div style={styles.tipsBox}>
          <strong>💡 Tips:</strong> Gunakan kata kunci kelas Anda (misal: <code>'2c pagi'</code>, <code>'IF2C'</code>, <code>'pagi'</code>) agar tugas kelas lain tidak muncul.
        </div>

        {/* Search */}
        <input
          className="input-focus"
          style={styles.searchInput}
          type="text"
          placeholder="Cari mata kuliah..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {/* Course List */}
        <div style={styles.list}>
          {filtered.length === 0 && (
            <p style={{ color: "var(--text-muted)", textAlign: "center", padding: "16px 0" }}>
              Tidak ada kelas yang cocok
            </p>
          )}
          {filtered.map((course) => {
            const hasActiveFilter = courseKeywords[course.id] && courseKeywords[course.id].trim();
            return (
              <div
                key={course.id}
                className="course-row-hover"
                style={styles.courseRow}
                onClick={() => openEditKeywords(course)}
              >
                <div style={styles.courseInfo}>
                  <span style={styles.courseName}>
                    {course.fullname} {course.shortname ? `(${course.shortname})` : ""}
                  </span>
                  {hasActiveFilter && (
                    <span style={styles.keywordBadge} title={courseKeywords[course.id]}>
                      Filter: {courseKeywords[course.id]}
                    </span>
                  )}
                </div>
                <div style={styles.courseDetails}>
                  <span style={{ color: "var(--text-muted)", fontSize: "14px" }}>v</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Active Filters Summary */}
        <div style={styles.activeSummary}>
          <strong style={{ fontSize: "13px", color: "var(--text-color)" }}>Filter aktif saat ini:</strong>
          {activeFilters.length === 0 ? (
            <p style={{ color: "var(--text-muted)", fontSize: "13px", margin: "4px 0 0" }}>
              Tidak ada filter aktif (semua tugas ditampilkan)
            </p>
          ) : (
            <div style={styles.activeList}>
              {activeFilters.map((af) => (
                <span key={af.id} style={styles.activeListItemBadge} title={af.name}>
                  {af.shortname || af.name.split("/").pop()}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Bottom Note */}
        <div style={styles.bottomNote}>
          Kosongkan keyword untuk menghapus filter - tugas yang judulnya tidak sesuai akan disembunyikan
        </div>

        {/* Footer */}
        <div style={styles.footer}>
          <button style={styles.btnSecondary} onClick={onClose}>Batal</button>
          <button
            className="btn-hover"
            style={styles.btnPrimary}
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Menyimpan..." : "Simpan Filter"}
          </button>
        </div>
      </div>

      {/* Nested Keyword Edit Modal (Matches Image exactly) */}
      {editingCourse && (
        <div style={styles.subOverlay} onClick={(e) => e.target === e.currentTarget && setEditingCourse(null)}>
          <div style={styles.subModal}>
            {/* Header */}
            <div style={styles.subHeader}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "20px" }}>🔧</span>
                <h2 style={styles.subTitle}>{editingCourse.shortname || "Edit Filter"}</h2>
              </div>
              <button className="btn-close-hover" style={styles.btnClose} onClick={() => setEditingCourse(null)}>✕</button>
            </div>

            {/* Warning Card */}
            <div style={styles.warningCard}>
              <span style={{ fontSize: "16px", marginRight: "8px", marginTop: "2px" }}>⚠️</span>
              <span style={{ fontSize: "13px", lineHeight: "1.4", color: "#f9e2af" }}>
                This form will be submitted to <strong>lany asisstant</strong>. Do not share passwords or other sensitive information.
              </span>
            </div>

            {/* Form Fields */}
            <div style={styles.formGroup}>
              <label style={styles.label}>
                <span style={{ marginRight: "6px" }}>📚</span> Mata Kuliah (tidak bisa diubah) <span style={{ color: "#f38ba8" }}>*</span>
              </label>
              <input
                type="text"
                readOnly
                value={editingCourse.fullname}
                style={styles.readonlyInput}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>
                <span style={{ marginRight: "6px" }}>🔍</span> Kata Kunci (pisahkan dengan koma)
              </label>
              <input
                className="input-focus"
                type="text"
                placeholder="contoh: 2c pagi, IF2C, pagi"
                value={tempKeywords}
                onChange={(e) => setTempKeywords(e.target.value)}
                style={styles.textInput}
                autoFocus
              />
            </div>

            {/* Sub-modal Footer */}
            <div style={styles.subFooter}>
              <button style={styles.btnSecondary} onClick={() => setEditingCourse(null)}>Cancel</button>
              <button className="btn-hover" style={styles.btnSubmit} onClick={saveKeywords}>Submit</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(11, 11, 17, 0.7)",
    backdropFilter: "blur(4px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    animation: "fadeIn 0.2s ease-out",
  },
  subOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(11, 11, 17, 0.6)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1100,
    animation: "fadeIn 0.15s ease-out",
  },
  modal: {
    background: "var(--card-bg-color)",
    border: "1px solid var(--border-color)",
    borderRadius: "16px",
    width: "480px",
    maxWidth: "90vw",
    maxHeight: "85vh",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    boxShadow: "0 24px 48px rgba(0,0,0,0.5)",
    animation: "scaleIn 0.2s ease-out",
  },
  subModal: {
    background: "var(--sub-modal-bg)",
    border: "1px solid var(--border-color)",
    borderRadius: "16px",
    width: "440px",
    maxWidth: "90vw",
    display: "flex",
    flexDirection: "column",
    boxShadow: "0 32px 64px rgba(0,0,0,0.6)",
    animation: "scaleIn 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)",
    padding: "20px",
    gap: "16px",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: "20px 20px 10px",
    borderBottom: "1px solid var(--border-color)",
  },
  subHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "1px solid var(--border-color)",
    paddingBottom: "12px",
  },
  title: {
    margin: 0,
    fontSize: "18px",
    fontWeight: 600,
    color: "var(--text-color)",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  subTitle: {
    margin: 0,
    fontSize: "18px",
    fontWeight: 600,
    color: "var(--text-color)",
  },
  subtitle: {
    margin: "4px 0 0",
    fontSize: "13px",
    color: "var(--text-muted)",
  },
  btnClose: {
    background: "none",
    border: "none",
    color: "var(--text-muted)",
    fontSize: "18px",
    cursor: "pointer",
    padding: "4px",
    borderRadius: "6px",
    lineHeight: 1,
    transition: "background 0.2s, color 0.2s",
  },
  tipsBox: {
    background: "rgba(137, 180, 250, 0.05)",
    border: "1px solid rgba(137, 180, 250, 0.15)",
    borderRadius: "8px",
    padding: "10px 12px",
    margin: "12px 16px 4px",
    fontSize: "12px",
    color: "#89b4fa",
    lineHeight: "1.4",
  },
  searchInput: {
    margin: "8px 16px 10px",
    padding: "10px 14px",
    background: "var(--bg-input)",
    border: "1px solid var(--border-color)",
    borderRadius: "8px",
    color: "var(--text-color)",
    fontSize: "14px",
    outline: "none",
    width: "calc(100% - 32px)",
    boxSizing: "border-box",
    transition: "border-color 0.2s",
  },
  list: {
    overflowY: "auto",
    flex: 1,
    padding: "0 16px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    maxHeight: "200px",
  },
  courseRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "12px",
    borderRadius: "8px",
    background: "var(--bg-input)",
    border: "1px solid var(--border-color)",
    cursor: "pointer",
    userSelect: "none",
  },
  courseInfo: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    flex: 1,
    minWidth: 0,
    paddingRight: "8px",
  },
  courseName: {
    color: "var(--text-color)",
    fontSize: "14px",
    fontWeight: 500,
    lineHeight: "1.4",
    wordBreak: "break-word",
  },
  keywordBadge: {
    background: "rgba(137, 180, 250, 0.1)",
    border: "1px solid rgba(137, 180, 250, 0.2)",
    borderRadius: "6px",
    padding: "2px 6px",
    fontSize: "11px",
    color: "#89b4fa",
    alignSelf: "flex-start",
    maxWidth: "100%",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  courseDetails: {
    display: "flex",
    alignItems: "center",
  },
  activeSummary: {
    margin: "12px 16px 10px",
    padding: "12px",
    background: "var(--bg-color)",
    border: "1px solid var(--border-color)",
    borderRadius: "8px",
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  activeList: {
    margin: 0,
    padding: 0,
    display: "flex",
    flexWrap: "wrap",
    gap: "6px",
    maxHeight: "80px",
    overflowY: "auto",
  },
  activeListItemBadge: {
    fontSize: "11px",
    color: "var(--text-muted)",
    background: "var(--card-hover-bg)",
    border: "1px solid var(--border-color)",
    borderRadius: "6px",
    padding: "3px 8px",
    maxWidth: "150px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  bottomNote: {
    margin: "0 16px 14px",
    fontSize: "11px",
    color: "var(--text-muted)",
    textAlign: "center",
  },
  footer: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "10px",
    padding: "14px 20px",
    borderTop: "1px solid var(--border-color)",
  },
  btnSecondary: {
    padding: "9px 18px",
    background: "transparent",
    border: "1px solid var(--border-color)",
    borderRadius: "8px",
    color: "var(--text-color)",
    fontSize: "14px",
    cursor: "pointer",
  },
  btnPrimary: {
    padding: "9px 20px",
    background: "#89b4fa",
    border: "none",
    borderRadius: "8px",
    color: "var(--bg-color)",
    fontSize: "14px",
    fontWeight: 600,
    cursor: "pointer",
  },
  warningCard: {
    background: "rgba(249, 226, 175, 0.05)",
    border: "1px solid rgba(249, 226, 175, 0.2)",
    borderRadius: "8px",
    padding: "12px",
    display: "flex",
    alignItems: "flex-start",
  },
  formGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  label: {
    fontSize: "13px",
    fontWeight: 600,
    color: "var(--text-color)",
    display: "flex",
    alignItems: "center",
  },
  readonlyInput: {
    padding: "10px 12px",
    background: "var(--bg-color)",
    border: "1px solid var(--border-color)",
    borderRadius: "8px",
    color: "var(--text-muted)",
    fontSize: "14px",
    outline: "none",
    cursor: "not-allowed",
  },
  textInput: {
    padding: "10px 12px",
    background: "var(--bg-input)",
    border: "1px solid var(--border-color)",
    borderRadius: "8px",
    color: "var(--text-color)",
    fontSize: "14px",
    outline: "none",
    transition: "border-color 0.2s",
  },
  subFooter: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "10px",
    marginTop: "4px",
  },
  btnSubmit: {
    padding: "9px 20px",
    background: "#5865F2",
    border: "none",
    borderRadius: "8px",
    color: "#ffffff",
    fontSize: "14px",
    fontWeight: 600,
    cursor: "pointer",
  },
};