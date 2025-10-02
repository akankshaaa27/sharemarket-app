import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../lib/api.js";

export default function ClientProfileDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    api.getProfile(id)
      .then(setItem)
      .catch((e)=> setError(e.message));
    return () => { mounted = false; };
  }, [id]);

  async function onDelete() {
    if (!confirm("Delete this profile?")) return;
    await api.deleteProfile(id);
    navigate("/profiles");
  }

  if (error) return <p className="text-red-600">{error}</p>;
  if (!item) return <p>Loading...</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">{item.shareholderName?.name1}</h2>
        <div className="space-x-2">
          <button onClick={onDelete} className="text-red-600">Delete</button>
        </div>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded border p-4 bg-card">
          <h3 className="font-medium mb-2">KYC</h3>
          <div className="text-sm">PAN: {item.panNumber}</div>
          <div className="text-sm">Aadhaar: {item.aadhaarNumber || "-"}</div>
          <div className="text-sm">Status: {item.status}</div>
        </div>
        <div className="rounded border p-4 bg-card">
          <h3 className="font-medium mb-2">Demat</h3>
          <div className="text-sm">Number: {item.dematAccountNumber || "-"}</div>
          <div className="text-sm">Created With: {item.dematCreatedWith || "-"}</div>
          <div className="text-sm">Created By: {item.dematCreatedWithPerson || "-"}</div>
        </div>
      </div>

      <div className="rounded border p-4 bg-card">
        <h3 className="font-medium mb-2">Companies</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="p-2 text-left">Company</th>
                <th className="p-2 text-left">ISIN</th>
                <th className="p-2 text-left">Qty</th>
                <th className="p-2 text-left">Review Status</th>
              </tr>
            </thead>
            <tbody>
              {item.companies?.map((c)=> (
                <tr key={c._id} className="border-t">
                  <td className="p-2">{c.companyName}</td>
                  <td className="p-2">{c.isinNumber}</td>
                  <td className="p-2">{c.quantity}</td>
                  <td className="p-2">{c.review?.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
