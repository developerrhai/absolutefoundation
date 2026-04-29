import { useState, useEffect } from "react";
import { 
  ChevronRight, ChevronDown, MapPin, Users, BookOpen, 
  GraduationCap, User, Clock, X, Search, Calendar
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import api from "@/lib/service";

// --- Data Organization Logic (Unchanged) ---
const organizeData = (rows) => {
  const tree = {};
  if (!rows || !Array.isArray(rows)) return tree;
  rows.forEach((row) => {
    const { branch_name, batch, board_name, standard_name, subject_name, teacher_name, chapter, notes } = row;
    if (!tree?.[branch_name]) tree[branch_name] = { batches: {} };
    const batchKey = batch?.name || "Unassigned Batch";
    if (!tree[branch_name].batches[batchKey]) {
      tree[branch_name].batches[batchKey] = { details: batch, boards: {} };
    }
    const boardKey = `${board_name || 'N/A'} - ${standard_name || 'N/A'}`;
    if (!tree[branch_name].batches[batchKey].boards[boardKey]) {
      tree[branch_name].batches[batchKey].boards[boardKey] = { subjects: {} };
    }
    if (!subject_name) return;
    if (!tree[branch_name].batches[batchKey].boards[boardKey].subjects[subject_name]) {
      tree[branch_name].batches[batchKey].boards[boardKey].subjects[subject_name] = {
        teacher: teacher_name, chapters: [], notes: notes || []
      };
    }
    if (chapter?.name) {
      const subject = tree[branch_name].batches[batchKey].boards[boardKey].subjects[subject_name];
      if (!subject.chapters.some(c => c.name === chapter.name)) subject.chapters.push(chapter);
    }
  });
  return tree;
};

export function TeacherUpdatesContent() {
  const [nestedData, setNestedData] = useState({});
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalItems: 0 });
  
  // 1. Updated Filter State
  const [filters, setFilters] = useState({ 
    teacher_name: "", 
    branch_name: "", 
    subject_name: "",
    standard_name: "",
    board_name: "",
    start_date: "",
    end_date: ""
  });

  const [options, setOptions] = useState({ 
    teachers: [], 
    branches: [], 
    subjects: [],
    standards: [], // New
    boards: []     // New
  });

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [tRes, bRes, sRes, stdRes, brdRes] = await Promise.all([
          api.get("/teachers"), 
          api.get("/branches"), 
          api.get("/subjects"),
          api.get("/standards"), // Ensure these endpoints exist
          api.get("/boards")     // Ensure these endpoints exist
        ]);
        setOptions({
          teachers: tRes.data.data || [],
          branches: bRes.data.branches || [],
          subjects: sRes.data || [],
          standards: stdRes?.data?.data || [],
          boards: brdRes.data || []
        });
      } catch (err) { console.error("Error fetching options:", err); }
    };
    fetchOptions();
  }, []);

  const fetchChain = async (page = 1) => {
    try {
      setLoading(true);
      // Constructing params - URLSearchParams handles empty values automatically
      const cleanFilters = Object.fromEntries(Object.entries(filters).filter(([_, v]) => v !== ""));
      const params = new URLSearchParams({ 
        page: page.toString(), 
        limit: "10", 
        ...cleanFilters 
      }).toString();

      const res = await api.get(`/admin/schedule?${params}`);
      if (res.data.success) {
        setNestedData(organizeData(res.data.data));
        setPagination(res.data.pagination);
      }
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  useEffect(() => { fetchChain(pagination.currentPage); }, [pagination.currentPage, filters]);

  const resetFilters = () => {
    setFilters({ 
      teacher_name: "", branch_name: "", subject_name: "",
      standard_name: "", board_name: "", start_date: "", end_date: ""
    });
  };

  return (
    <div className="p-6 max-w-5xl mx-auto bg-white min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600"><GraduationCap size={24}/></div>
            Teacher updates
          </h2>
          <p className="text-slate-500 text-sm mt-1 font-medium tracking-tight">Advanced Teacher & Batch Analytics</p>
        </div>
        <Badge variant="outline" className="bg-slate-50 border-slate-200 text-slate-600 px-3 py-1 rounded-full">
          {pagination.totalItems} Results
        </Badge>
      </div>

      {/* --- Advanced Filter Bar --- */}
      <div className="flex flex-col gap-4 mb-10 p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
        <div className="flex flex-wrap items-center gap-3">
          <FilterDropdown label="Branch" value={filters.branch_name} options={options.branches.map(b => b.branch_name)} onChange={(v) => setFilters({...filters, branch_name: v})} />
          <FilterDropdown label="Teacher" value={filters.teacher_name} options={options.teachers.map(t => t.name)} onChange={(v) => setFilters({...filters, teacher_name: v})} />
          <FilterDropdown label="Subject" value={filters.subject_name} options={[...new Set(options.subjects.map(s => s.name))]} onChange={(v) => setFilters({...filters, subject_name: v})} />
          <FilterDropdown label="Standard" value={filters.standard_name} options={options.standards.map(s => s.name)} onChange={(v) => setFilters({...filters, standard_name: v})} />
          <FilterDropdown label="Board" value={filters.board_name} options={options.boards.map(b => b.name)} onChange={(v) => setFilters({...filters, board_name: v})} />
        </div>

        <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 pt-3">
          <div className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-1.5 rounded-xl">
            <Calendar size={14} className="text-slate-400" />
            <span className="text-[10px] font-bold text-slate-400 uppercase">Batch Start After:</span>
            <input 
              type="date" 
              className="text-xs font-bold text-slate-600 outline-none bg-transparent"
              value={filters.start_date}
              onChange={(e) => setFilters({...filters, start_date: e.target.value})}
            />
          </div>
          <div className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-1.5 rounded-xl">
            <Calendar size={14} className="text-slate-400" />
            <span className="text-[10px] font-bold text-slate-400 uppercase">Batch End Before:</span>
            <input 
              type="date" 
              className="text-xs font-bold text-slate-600 outline-none bg-transparent"
              value={filters.end_date}
              onChange={(e) => setFilters({...filters, end_date: e.target.value})}
            />
          </div>
          {Object.values(filters).some(x => x !== "") && (
            <Button variant="ghost" size="sm" onClick={resetFilters} className="text-rose-500 hover:bg-rose-50 h-9">
              <X size={14} className="mr-1" /> Reset Filters
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="space-y-4 animate-pulse">
          {[1,2,3].map(i => <div key={i} className="h-20 bg-slate-50 rounded-xl" />)}
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(nestedData).map(([name, branch]) => (
            <BranchNode key={name} name={name} batches={branch.batches} />
          ))}
          {Object.keys(nestedData).length === 0 && (
            <div className="text-center py-20 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
              <Search className="mx-auto text-slate-300 mb-2" size={32} />
              <p className="text-slate-500 font-medium">No results found for selected filters.</p>
            </div>
          )}
        </div>
      )}

      {/* Pagination (Unchanged) */}
      <div className="mt-16 pt-8 border-t border-slate-100 flex items-center justify-center gap-4">
        <Button variant="ghost" size="sm" disabled={pagination.currentPage === 1} onClick={() => setPagination(p => ({...p, currentPage: p.currentPage-1}))}>Previous</Button>
        <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">Page {pagination.currentPage} / {pagination.totalPages}</span>
        <Button variant="ghost" size="sm" disabled={pagination.currentPage === pagination.totalPages} onClick={() => setPagination(p => ({...p, currentPage: p.currentPage+1}))}>Next</Button>
      </div>
    </div>
  );
}

// --- Sub-Components (BranchNode, BatchNode, SubjectNode) stay the same as previous response ---

function FilterDropdown({ label, value, options, onChange }) {
  return (
    <select 
      value={value} 
      onChange={(e) => onChange(e.target.value)}
      className="bg-white border border-slate-200 text-xs font-bold text-slate-600 px-3 py-2 rounded-xl outline-none focus:ring-2 ring-emerald-100 transition-all cursor-pointer min-w-[140px]"
    >
      <option value="">All {label}s</option>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

// ... Include the BranchNode, BatchNode, and SubjectNode components from previous code ...
// --- Sub-Components with Collapse Logic ---

function BranchNode({ name, batches }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm transition-all">
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 bg-slate-50/50 hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
            <MapPin size={16} />
          </div>
          <h3 className="text-md font-bold text-slate-800 uppercase tracking-tight">{name}</h3>
        </div>
        {isExpanded ? <ChevronDown size={18} className="text-slate-400" /> : <ChevronRight size={18} className="text-slate-400" />}
      </button>

      {isExpanded && (
        <div className="p-4 ml-6 border-l-2 border-slate-100 space-y-6">
          {Object.entries(batches).map(([batchName, batch]: any) => (
            <BatchNode key={batchName} name={batchName} batch={batch} />
          ))}
        </div>
      )}
    </div>
  );
}

// function BatchNode({ name, batch }) {
//   const [isExpanded, setIsExpanded] = useState(true);

//   return (
//     <div className="space-y-4">
//       <button 
//         onClick={() => setIsExpanded(!isExpanded)}
//         className="flex items-center gap-3 group"
//       >
//         <Users size={18} className={`${isExpanded ? 'text-blue-500' : 'text-slate-300'} transition-colors`} />
//         <span className="font-bold text-slate-700 group-hover:text-blue-600 transition-colors">{name}</span>
//         <span className="text-[10px] font-mono bg-slate-50 px-2 py-0.5 rounded text-slate-400 border border-slate-100">
//           {batch.details?.start_time?.slice(0,5)} - {batch.details?.end_time?.slice(0,5)}
//         </span>
//         {isExpanded ? <ChevronDown size={14} className="text-slate-300" /> : <ChevronRight size={14} className="text-slate-300" />}
//       </button>

//       {isExpanded && (
//         <div className="ml-2 border-l-2 border-slate-50 pl-6 space-y-6 pt-2">
//           {Object.entries(batch.boards).map(([boardKey, board]: any) => (
//             <div key={boardKey} className="space-y-4">
//               <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic">{boardKey}</div>
//               <div className="space-y-4">
//                 {Object.entries(board.subjects).map(([subName, sub]: any) => (
//                   <SubjectNode key={subName} name={subName} sub={sub} />
//                 ))}
//               </div>
//             </div>
//           ))}
//         </div>
//       )}
//     </div>
//   );
// }


function BatchNode({ name, batch }) {
  const [isExpanded, setIsExpanded] = useState(true);

  // Helper to format dates cleanly
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { 
      day: '2-digit', 
      month: 'short', 
      year: '2-digit' 
    });
  };

  return (
    <div className="space-y-4">
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-3 group"
      >
        <Users size={18} className={`${isExpanded ? 'text-blue-500' : 'text-slate-300'} transition-colors`} />
        <span className="font-bold text-slate-700 group-hover:text-blue-600 transition-colors">{name}</span>
        
        {/* Time Badge */}
        <div className="flex items-center gap-1.5 text-[10px] font-mono bg-slate-50 px-2 py-0.5 rounded text-slate-400 border border-slate-100">
          <Clock size={10} />
          {batch.details?.start_time?.slice(0, 5)} - {batch.details?.end_time?.slice(0, 5)}
        </div>

        {/* Date Range Badge */}
        <div className="flex items-center gap-1.5 text-[10px] font-mono bg-blue-50/50 px-2 py-0.5 rounded text-blue-500 border border-blue-100/50">
          <Calendar size={10} />
          {formatDate(batch.details?.start_date)} — {formatDate(batch.details?.end_date)}
        </div>

        {isExpanded ? <ChevronDown size={14} className="text-slate-300" /> : <ChevronRight size={14} className="text-slate-300" />}
      </button>

      {isExpanded && (
        <div className="ml-2 border-l-2 border-slate-50 pl-6 space-y-6 pt-2">
          {Object.entries(batch.boards).map(([boardKey, board]: any) => (
            <div key={boardKey} className="space-y-4">
              <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic">{boardKey}</div>
              <div className="space-y-4">
                {Object.entries(board.subjects).map(([subName, sub]: any) => (
                  <SubjectNode key={subName} name={subName} sub={sub} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
function SubjectNode({ name, sub }) {
  const [isExpanded, setIsExpanded] = useState(false); // Sub-levels collapsed by default for cleanliness

  return (
    <div className="relative group">
      <div className="flex items-center justify-between mb-2">
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 group/btn"
        >
          <div className={`p-1.5 rounded-lg transition-colors ${isExpanded ? 'bg-blue-100 text-blue-600' : 'bg-slate-50 text-slate-400 group-hover/btn:bg-slate-100'}`}>
            <BookOpen size={14} />
          </div>
          <span className={`text-sm font-bold transition-colors ${isExpanded ? 'text-slate-900' : 'text-slate-600'}`}>{name}</span>
          {isExpanded ? <ChevronDown size={12} className="text-slate-300" /> : <ChevronRight size={12} className="text-slate-300" />}
        </button>
        
        <div className="flex items-center gap-2 text-[10px] font-semibold text-slate-400 bg-slate-50/50 px-2 py-1 rounded-lg border border-slate-100">
          <User size={10} /> {sub.teacher}
        </div>
      </div>

      {isExpanded && (
        <div className="ml-4 grid grid-cols-1 gap-2 mt-3 animate-in fade-in duration-300">
          {sub.chapters.map((chap: any, cIdx: number) => (
            <div key={cIdx} className="p-3 bg-emerald-50/30 border border-emerald-100/50 rounded-xl">
              <div className="text-xs font-bold text-slate-700 mb-1 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                {chap.name}
              </div>
              <div className="flex flex-wrap gap-1 ml-3.5">
                {chap.topics?.map((topic: any, tIdx: number) => (
                  <span key={tIdx} className="text-[9px] px-1.5 py-0.5 bg-white text-emerald-600 rounded border border-emerald-100 font-bold uppercase tracking-tight">
                    {topic.name}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}




