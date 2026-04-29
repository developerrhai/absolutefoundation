import api from "./service";

// ── 1. BRANCHES ──────────────────────────────────────────────
export const getBranches = async () => {
  const res = await api.get("/branches");
  return res.data;
};

// ── 2. BATCHES ───────────────────────────────────────────────
export const getBatches = async (branch_id: number) => {
  // Using query params as per updated controller
  const res = await api.get(`/batches/${branch_id}`);
  return res.data;
};

// ── 3. BOARDS ────────────────────────────────────────────────
export const getBoards = async () => {
  const res = await api.get(`/boards`);
  return res.data;
};

// ── 4. STANDARDS ─────────────────────────────────────────────
export const getStandards = async (board_id: number, batch_id: number, branch_id: number) => {
  // Now requires both board and batch to find the specific intersection
  const res = await api.get(`/standards/filter?board_id=${board_id}&batch_id=${batch_id}&branch_id=${branch_id}`); // Assuming branch_id is same as batch_id for filtering
  return res.data;
};

// ── 5. SUBJECTS ──────────────────────────────────────────────
export const getSubjects = async (stand_id: number,  branch_id: number, batch_id: number, board_id: number)=> {
  // Simplified: stand_id inherently knows its Board and Batch
  const res = await api.get(`/subjects/filter?stand_id=${stand_id}&branch_id=${branch_id}&batch_id=${batch_id}&board_id=${board_id}`);
  return res.data;
};

// ── 6. CHAPTERS & TOPICS ─────────────────────────────────────
export const getChapters = async (sub_id: number, stand_id: number,  branch_id: number, batch_id: number, board_id: number) => {
  // Simplified: sub_id uniquely identifies the path
  const res = await api.get(`/chapters/filter?sub_id=${sub_id}?stand_id=${stand_id}&branch_id=${branch_id}&batch_id=${batch_id}&board_id=${board_id}`);
  return res.data;
};

// ── 7. NOTES ─────────────────────────────────────────────────
export const getNotes = async (chap_id: number, sub_id: number, stand_id: number,  branch_id: number, batch_id: number, board_id: number) => {
  // Simplified: chap_id uniquely identifies the chapter
  const res = await api.get(`/notes/filter?chap_id=${chap_id}?sub_id=${sub_id}?stand_id=${stand_id}&branch_id=${branch_id}&batch_id=${batch_id}&board_id=${board_id}`);
  return res.data;
};

// ── POST REQUESTS ────────────────────────────────────────────

// Upload Note
export const uploadNote = async (data: {
  chap_id: number;
  title: string;
  file_url: string; // Updated from file_base64 to match your component payload
}) => {
  const res = await api.post("/notes", data);
  return res.data;
};

// Generic Create Wrapper (Used by the AddNoteForm)
export const createCategories = async (url: string, payload: any) => {
  const res = await api.post(url, payload);
  return res.data;
};


export const getTeachers = async () => {
  const res = await api.get(`/teachers`);
  return res.data;
}