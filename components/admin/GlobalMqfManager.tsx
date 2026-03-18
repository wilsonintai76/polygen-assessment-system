import React, { useState } from "react";
import { GlobalMqf, DublinAccord } from "../../types";
import { Search, Plus, Edit, Trash2, X, Save, AlertCircle } from "lucide-react";

interface GlobalMqfManagerProps {
  attributes: GlobalMqf[];
  onUpdate: (attrs: GlobalMqf[]) => void;
  dublinAccords: DublinAccord[];
  onUpdateDublin: (attrs: DublinAccord[]) => void;
}

export const GlobalMqfManager: React.FC<GlobalMqfManagerProps> = ({
  attributes,
  onUpdate,
  dublinAccords,
  onUpdateDublin,
}) => {
  const [activeTab, setActiveTab] = useState<"mqf" | "dublin">("mqf");
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<
    GlobalMqf | DublinAccord | null
  >(null);
  const [formData, setFormData] = useState({ code: "", description: "" });

  const currentList = activeTab === "mqf" ? attributes : dublinAccords;

  const filteredAttributes = currentList.filter(
    (attr) =>
      attr.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      attr.description.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleOpenModal = (item?: GlobalMqf | DublinAccord) => {
    if (item) {
      setEditingItem(item);
      setFormData({ code: item.code, description: item.description });
    } else {
      setEditingItem(null);
      setFormData({ code: "", description: "" });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
    setFormData({ code: "", description: "" });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code || !formData.description) return;

    if (activeTab === "mqf") {
      if (editingItem) {
        const updatedAttributes = attributes.map((attr) =>
          attr.id === editingItem.id
            ? {
                ...attr,
                code: formData.code.toUpperCase(),
                description: formData.description,
              }
            : attr,
        );
        onUpdate(updatedAttributes);
      } else {
        const newAttribute: GlobalMqf = {
          id: `local-${Date.now()}`,
          code: formData.code.toUpperCase(),
          description: formData.description,
        };
        onUpdate([...attributes, newAttribute]);
      }
    } else {
      if (editingItem) {
        const updatedAttributes = dublinAccords.map((attr) =>
          attr.id === editingItem.id
            ? {
                ...attr,
                code: formData.code.toUpperCase(),
                description: formData.description,
              }
            : attr,
        );
        onUpdateDublin(updatedAttributes);
      } else {
        const newAttribute: DublinAccord = {
          id: `local-${Date.now()}`,
          code: formData.code.toUpperCase(),
          description: formData.description,
        };
        onUpdateDublin([...dublinAccords, newAttribute]);
      }
    }
    handleCloseModal();
  };

  const handleDelete = (id: string) => {
    if (activeTab === "mqf") {
      onUpdate(attributes.filter((attr) => attr.id !== id));
    } else {
      onUpdateDublin(dublinAccords.filter((attr) => attr.id !== id));
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight uppercase">
            Global MQF / DA Standards
          </h2>
          <p className="text-slate-500 font-bold uppercase text-[10px] md:text-[11px] tracking-widest mt-2">
            Manage centralized attributes for curriculum alignment
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-blue-500/30 hover:bg-blue-700 transition active:scale-95 flex items-center gap-2"
        >
          <Plus size={18} strokeWidth={3} />
          <span className="uppercase tracking-wider text-xs">Add Standard</span>
        </button>
      </div>

      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setActiveTab("mqf")}
          className={`px-6 py-3 rounded-xl font-bold text-sm uppercase tracking-wider transition-colors ${activeTab === "mqf" ? "bg-slate-900 text-white shadow-lg" : "bg-white text-slate-500 hover:bg-slate-100 border border-slate-200"}`}
        >
          Global MQF
        </button>
        <button
          onClick={() => setActiveTab("dublin")}
          className={`px-6 py-3 rounded-xl font-bold text-sm uppercase tracking-wider transition-colors ${activeTab === "dublin" ? "bg-slate-900 text-white shadow-lg" : "bg-white text-slate-500 hover:bg-slate-100 border border-slate-200"}`}
        >
          Dublin Accord
        </button>
      </div>

      <div className="bg-white rounded-[24px] shadow-xl border border-slate-100 overflow-hidden">
        {/* Toolbar */}
        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="relative w-full md:w-96">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Search code or description..."
              className="w-full pl-12 pr-4 py-3 bg-white border-2 border-slate-100 rounded-xl text-sm font-bold text-slate-700 focus:border-blue-500 outline-none transition"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            {filteredAttributes.length} Records Found
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest w-32">
                  Code
                </th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Description
                </th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right w-32">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredAttributes.length > 0 ? (
                filteredAttributes.map((item) => (
                  <tr
                    key={item.id}
                    className="group hover:bg-blue-50/50 transition-colors"
                  >
                    <td className="px-8 py-5">
                      <div className="inline-flex items-center justify-center px-3 py-1 rounded-lg bg-slate-100 text-slate-700 font-black text-xs border border-slate-200 group-hover:bg-white group-hover:border-blue-200 group-hover:text-blue-700 transition-colors">
                        {item.code}
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className="text-sm font-bold text-slate-700">
                        {item.description}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleOpenModal(item)}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit size={16} strokeWidth={2.5} />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={16} strokeWidth={2.5} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="px-8 py-12 text-center">
                    <div className="flex flex-col items-center justify-center opacity-30">
                      <AlertCircle size={48} className="mb-4 text-slate-400" />
                      <p className="text-sm font-bold text-slate-500">
                        No standards found matching your search.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="bg-slate-900 p-6 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-black text-white uppercase tracking-tight">
                  {editingItem ? "Edit Standard" : "New Standard"}
                </h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                  {editingItem
                    ? "Update existing definition"
                    : `Add to ${activeTab === "mqf" ? "Global MQF" : "Dublin Accord"} registry`}
                </p>
              </div>
              <button
                onClick={handleCloseModal}
                className="text-slate-400 hover:text-white transition"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  Standard Code
                </label>
                <input
                  autoFocus
                  type="text"
                  className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl outline-none focus:border-blue-500 font-bold text-slate-700 transition placeholder:text-slate-300 uppercase"
                  placeholder={
                    activeTab === "mqf" ? "e.g. DK1, MQF1" : "e.g. WA1, DA1"
                  }
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      code: e.target.value.toUpperCase(),
                    })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  Description
                </label>
                <textarea
                  className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl outline-none focus:border-blue-500 font-bold text-slate-700 transition placeholder:text-slate-300 min-h-[120px] resize-none"
                  placeholder="Enter the full description of the standard..."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  required
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 bg-slate-100 text-slate-600 font-bold py-4 rounded-xl hover:bg-slate-200 transition text-sm uppercase tracking-wider"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-500/30 hover:bg-blue-700 transition active:scale-95 text-sm uppercase tracking-wider flex items-center justify-center gap-2"
                >
                  <Save size={18} />
                  Save Standard
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
