import React, { useEffect, useState } from "react";
import { Trash2, Search, Pencil } from "lucide-react";
import axios from "axios";

/* ================= API CONFIG ================= */
const api = axios.create({
  baseURL: "http://localhost:5000/api/v1",
  withCredentials: true,
});

/* Attach token automatically */
api.interceptors.request.use((config) => {
  const token =
    localStorage.getItem("token") ||
    localStorage.getItem("adminToken");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default function AllUser() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");

  const [editUser, setEditUser] = useState(null);
  const [deleteUserData, setDeleteUserData] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    mobile: "",
    role: "",
  });

  /* ================= FETCH USERS ================= */
  const fetchUsers = async () => {
    try {
      setLoading(true);

      const res = await api.get("/users/all");

      setUsers(res.data?.data || []);
    } catch (error) {
      console.error("Fetch Error:", error.response?.data || error.message);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  /* ================= TOGGLE STATUS ================= */
  const handleToggleStatus = async (user) => {
    if (!user?._id) return;

    try {
      setActionLoading(user._id);

      await api.patch(`/users/${user._id}/status`);

      // Update UI manually
      setUsers((prev) =>
        prev.map((u) =>
          u._id === user._id
            ? { ...u, isActive: !u.isActive }
            : u
        )
      );
    } catch (error) {
      console.error("Toggle Error:", error.response?.data || error.message);
    } finally {
      setActionLoading(null);
    }
  };

  /* ================= DELETE ================= */
  const confirmDelete = async () => {
    if (!deleteUserData?._id) return;

    try {
      setActionLoading(deleteUserData._id);

      await api.delete(`/users/${deleteUserData._id}`);

      // Remove from UI immediately
      setUsers((prev) =>
        prev.filter((u) => u._id !== deleteUserData._id)
      );

      setDeleteUserData(null);
    } catch (error) {
      console.error("Delete Error:", error.response?.data || error.message);
    } finally {
      setActionLoading(null);
    }
  };

  /* ================= EDIT ================= */
  const handleEdit = (user) => {
    setEditUser(user);
    setFormData({
      name: user.name || "",
      mobile: user.mobile || "",
      role: user.role || "user",
    });
  };

  /* ================= UPDATE ================= */
  const handleUpdate = async () => {
    if (!editUser?._id) return;

    try {
      setActionLoading(editUser._id);

      const payload = {
        name: formData.name.trim(),
        mobile: formData.mobile.trim(),
        role: formData.role,
      };

      await api.patch(`/users/${editUser._id}`, payload);

      // Update UI immediately
      setUsers((prev) =>
        prev.map((u) =>
          u._id === editUser._id
            ? { ...u, ...payload }
            : u
        )
      );

      setEditUser(null);
    } catch (error) {
      console.error("Update Error:", error.response?.data || error.message);
    } finally {
      setActionLoading(null);
    }
  };

  /* ================= FILTER + SEARCH ================= */
  const filteredUsers = users.filter((user) => {
    const matchesRole =
      filter === "All"
        ? true
        : user.role?.toLowerCase() === filter.toLowerCase();

    const matchesSearch =
      user.mobile?.includes(search) ||
      user.name?.toLowerCase().includes(search.toLowerCase()) ||
      user.email?.toLowerCase().includes(search.toLowerCase());

    return matchesRole && matchesSearch;
  });

  if (loading) return <p className="p-6">Loading...</p>;

  return (
    <div className="relative">
      <div
        className={`min-h-screen p-6 bg-gray-100 ${
          editUser || deleteUserData
            ? "blur-sm pointer-events-none"
            : ""
        }`}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">All Users</h2>

          <div className="flex items-center gap-3">
            {["All", "Admin", "Driver", "Restaurant"].map(
              (role) => (
                <button
                  key={role}
                  onClick={() => setFilter(role)}
                  className={`px-4 py-1 rounded-lg text-sm border ${
                    filter === role
                      ? "bg-red-500 text-white border-red-500"
                      : "bg-white text-gray-600"
                  }`}
                >
                  {role}
                </button>
              )
            )}

            <div className="flex items-center border rounded-lg overflow-hidden bg-white">
              <input
                type="text"
                placeholder="Search..."
                className="px-3 py-1 outline-none text-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <div className="bg-red-500 px-3 py-2">
                <Search className="w-4 h-4 text-white" />
              </div>
            </div>

            <button
              onClick={() => {
                setSearch("");
                setFilter("All");
              }}
              className="px-3 py-1 border rounded-lg text-sm bg-white"
            >
              Clear
            </button>
          </div>
        </div>

        {/* TABLE */}
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <div className="grid grid-cols-6 text-sm font-semibold text-gray-600 border-b p-4 bg-gray-50">
            <div>USERS</div>
            <div>MOBILE</div>
            <div>STATUS</div>
            <div>ROLE</div>
            <div>CREATED</div>
            <div className="text-center">ACTION</div>
          </div>

          {filteredUsers.map((user) => (
            <div
              key={user._id}
              className="grid grid-cols-6 items-center p-4 border-b hover:bg-gray-50"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-500 text-white flex items-center justify-center rounded-full font-semibold uppercase">
                  {user.name?.[0] || user.mobile?.[0]}
                </div>
                <div>
                  <p className="font-medium capitalize">{user.name}</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>
              </div>

              <div>{user.mobile}</div>

              <div>
                <span
                  onClick={() => handleToggleStatus(user)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium cursor-pointer ${
                    user.isActive
                      ? "bg-green-100 text-green-600"
                      : "bg-red-100 text-red-600"
                  }`}
                >
                  {actionLoading === user._id
                    ? "Updating..."
                    : user.isActive
                    ? "Active"
                    : "Inactive"}
                </span>
              </div>

              <div>
                <span className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-xs capitalize">
                  {user.role}
                </span>
              </div>

              <div className="text-sm text-gray-600">
                {user.createdAt
                  ? new Date(user.createdAt).toLocaleDateString()
                  : "-"}
              </div>

              <div className="flex items-center justify-center gap-4">
                <Pencil
                  onClick={() => handleEdit(user)}
                  className="w-4 h-4 text-yellow-500 cursor-pointer"
                />
                <Trash2
                  onClick={() => setDeleteUserData(user)}
                  className="w-4 h-4 text-red-500 cursor-pointer"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

     
      {/* EDIT MODAL */}
      {editUser && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-xl w-96 shadow-xl">
            <h3 className="text-lg font-semibold mb-4">
              Edit User
            </h3>

            <div className="mb-3">
              <label className="block text-sm font-medium mb-1">
                Name
              </label>
              <input
                type="text"
                className="w-full border p-2 rounded"
                value={formData.name}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    name: e.target.value,
                  })
                }
              />
            </div>

            <div className="mb-3">
              <label className="block text-sm font-medium mb-1">
                Mobile
              </label>
              <input
                type="text"
                className="w-full border p-2 rounded"
                value={formData.mobile}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    mobile: e.target.value,
                  })
                }
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">
                Role
              </label>
              <select
                className="w-full border p-2 rounded"
                value={formData.role}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    role: e.target.value,
                  })
                }
              >
                <option value="admin">Admin</option>
                <option value="driver">Driver</option>
                <option value="restaurant">
                  Restaurant
                </option>
                <option value="user">User</option>
              </select>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setEditUser(null)}
                className="px-4 py-1 border rounded"
              >
                Cancel
              </button>

              <button
                onClick={handleUpdate}
                className="px-4 py-1 bg-red-500 text-white rounded"
              >
                {actionLoading === editUser._id
                  ? "Updating..."
                  : "Update"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      {deleteUserData && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-xl w-96 shadow-xl">
            <h3 className="text-lg font-semibold text-red-600 mb-4">
              Delete User
            </h3>

            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to delete{" "}
              <span className="font-semibold">
                {deleteUserData.name}
              </span>
              ?
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteUserData(null)}
                className="px-4 py-1 border rounded"
              >
                Cancel
              </button>

              <button
                onClick={confirmDelete}
                className="px-4 py-1 bg-red-500 text-white rounded"
              >
                {actionLoading === deleteUserData._id
                  ? "Deleting..."
                  : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}