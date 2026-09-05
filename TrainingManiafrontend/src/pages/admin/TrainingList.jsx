import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MoreVertical,
  Youtube,
  FileText,
  Clock,
  Users,
  PlayCircle,
  Edit,
  Trash2,
  Lock
} from 'lucide-react';

const TrainingList = ({ onCreateNew }) => {
  const navigate = useNavigate();
  const [trainings, setTrainings] = React.useState([]);

  const fetchTrainings = async () => {
    try {
      const adminInfo = JSON.parse(localStorage.getItem('adminInfo'));
      const adminId = adminInfo ? adminInfo.id : null;

      const res = await fetch('/api/admin/trainings/', {
        headers: {
          'X-Admin-ID': adminId
        }
      });
      if (res.ok) {
        const data = await res.json();
        const mapped = data.map(t => ({
          id: t.id,
          title: t.title,
          uniqueCode: t.unique_code,
          type: t.pdf_file ? 'pdf' : 'youtube', // Simplified logic matching likely usage
          thumbnail: t.thumbnail,
          duration: t.duration || 'N/A',
          candidates: t.enrollment_count || 0,
          status: 'Active',
          date: t.created_at ? new Date(t.created_at).toLocaleDateString() : 'N/A'
        }));
        setTrainings(mapped);
      }
    } catch (err) {
      console.error("Failed to load trainings:", err);
    }
  };

  useEffect(() => {
    fetchTrainings();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this training module?')) {
      try {
        const res = await fetch(`/api/admin/trainings/${id}/`, { method: 'DELETE' });
        if (res.ok) {
          setTrainings(trainings.filter(t => t.id !== id));
        } else {
          alert("Failed to delete training.");
        }
      } catch (err) {
        console.error("Delete error:", err);
      }
    }
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Training Modules</h2>
          <p className="text-slate-500">Manage your existing courses and assessments.</p>
        </div>
      </div>

      {trainings.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-300">
          <p className="text-slate-500 mb-4">No training modules found.</p>
          <button
            onClick={onCreateNew}
            className="text-indigo-600 font-bold hover:underline cursor-pointer"
          >
            Create your first module
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trainings.map((training) => (
            <div key={training.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-all group">
              {/* Thumbnail Area */}
              <div className="h-48 bg-slate-50 relative overflow-hidden">
                {training.thumbnail ? (
                  <img src={training.thumbnail} alt={training.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className={`w-full h-full flex items-center justify-center ${training.type === 'youtube' ? 'bg-indigo-50' : 'bg-orange-50'}`}>
                    {training.type === 'youtube' ? (
                      <Youtube className="w-16 h-16 text-indigo-300" />
                    ) : (
                      <FileText className="w-16 h-16 text-orange-300" />
                    )}
                  </div>
                )}

                <div className="absolute top-4 right-4 flex gap-2">
                  {training.uniqueCode && (
                    <div className="bg-slate-900/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-white shadow-sm border border-slate-700">
                      {training.uniqueCode}
                    </div>
                  )}
                  <div className="bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-slate-900 shadow-sm">
                    {training.status}
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-2 rounded-lg ${training.type === 'youtube' ? 'bg-red-50 text-red-600' : 'bg-orange-50 text-orange-600'}`}>
                    {training.type === 'youtube' ? <Youtube className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                  </div>
                  <button className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer">
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </div>

                <h3 className="text-lg font-bold text-slate-900 mb-2 line-clamp-1">{training.title}</h3>

                <div className="flex items-center gap-4 text-sm text-slate-500 mb-6">
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-1.5" />
                    {training.duration}
                  </div>
                  <div className="flex items-center">
                    <Users className="w-4 h-4 mr-1.5" />
                    {training.candidates}
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                  <button
                    onClick={() => training.candidates > 0 ? null : navigate(`/admin/training/${training.id}`)}
                    className={`flex-1 flex items-center justify-center py-2 rounded-lg font-semibold transition-colors text-sm ${training.candidates > 0
                        ? 'bg-slate-50 text-slate-400 cursor-not-allowed'
                        : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100 cursor-pointer'
                      }`}
                    title={training.candidates > 0 ? "Cannot edit module with enrolled candidates" : "Edit Module"}
                  >
                    {training.candidates > 0 ? <Lock className="w-4 h-4 mr-2" /> : <Edit className="w-4 h-4 mr-2" />}
                    {training.candidates > 0 ? 'Locked' : 'Edit'}
                  </button>
                  <button
                    onClick={() => handleDelete(training.id)}
                    className="flex items-center justify-center p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TrainingList;
